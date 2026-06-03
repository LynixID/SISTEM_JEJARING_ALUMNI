import { useState, useEffect, useCallback, useRef } from 'react'
import { getTourStatus, completeTourApi } from '../services/api'

/**
 * useTourStatus — Hook untuk melacak status tur panduan per halaman per user.
 *
 * Cara kerja:
 * 1. Cek localStorage terlebih dulu sebagai cache cepat (mencegah flash tur).
 * 2. Jika cache tidak ada, panggil GET /api/tour/status ke backend.
 * 3. Simpan hasil ke localStorage sebagai cache untuk kunjungan berikutnya.
 * 4. `markTourComplete()` → POST /api/tour/complete + update cache localStorage.
 *
 * @param {string} tourKey - Identifier unik halaman, e.g. "dashboard", "berita"
 * @param {boolean} enabled - Set ke false untuk menonaktifkan hook (misal: pada profil orang lain)
 * @returns {{ shouldShowTour: boolean, markTourComplete: function, isChecking: boolean }}
 */
const useTourStatus = (tourKey, enabled = true) => {
  // Kunci localStorage per user (supaya multi-akun tidak bentrok)
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user?.id || 'guest'
    } catch {
      return 'guest'
    }
  }

  const getCacheKey = () => `tour_completed_${getUserId()}_${tourKey}`

  const [shouldShowTour, setShouldShowTour] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const hasChecked = useRef(false)

  const checkStatus = useCallback(async () => {
    if (!enabled || !tourKey || hasChecked.current) return

    hasChecked.current = true

    // 1. Cek cache localStorage dulu (fast path)
    const cacheKey = getCacheKey()
    if (localStorage.getItem(cacheKey) === 'true') {
      // Sudah selesai tur sebelumnya — tidak perlu hit API
      setShouldShowTour(false)
      setIsChecking(false)
      return
    }

    // 2. Tidak ada di cache → tanya backend
    try {
      const { data } = await getTourStatus([tourKey])
      const isCompleted = data?.completed?.[tourKey] ?? false

      if (isCompleted) {
        // Simpan ke cache agar request berikutnya tidak perlu hit API
        localStorage.setItem(cacheKey, 'true')
        setShouldShowTour(false)
      } else {
        // Belum pernah lihat tur → tampilkan
        setShouldShowTour(true)
      }
    } catch (err) {
      // Jika API error (misal: offline), fallback ke tidak tampilkan tur
      // agar tidak mengganggu UX
      console.warn('[useTourStatus] Gagal cek status tur:', err?.message)
      setShouldShowTour(false)
    } finally {
      setIsChecking(false)
    }
  }, [tourKey, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  /**
   * Tandai tur sebagai selesai.
   * Dipanggil saat user menyelesaikan atau melewati (skip) tur.
   */
  const markTourComplete = useCallback(async () => {
    if (!tourKey) return

    // Update cache localStorage secepatnya (optimistic update)
    const cacheKey = getCacheKey()
    localStorage.setItem(cacheKey, 'true')
    setShouldShowTour(false)

    // Kirim ke backend (fire-and-forget — tidak perlu await agar tidak blocking UI)
    try {
      await completeTourApi(tourKey)
    } catch (err) {
      console.warn('[useTourStatus] Gagal simpan status tur ke server:', err?.message)
      // Cache tetap tersimpan di localStorage, jadi tur tidak akan muncul lagi di sesi ini
      // Backend akan sync ketika koneksi tersedia (tapi ini cukup untuk UX)
    }
  }, [tourKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { shouldShowTour, markTourComplete, isChecking }
}

export default useTourStatus
