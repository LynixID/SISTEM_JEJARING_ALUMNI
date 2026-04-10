import { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../services/api'

const REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Pelecehan / Intimidasi' },
  { value: 'HATE_SPEECH', label: 'Ujaran Kebencian' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Konten Tidak Pantas' },
  { value: 'FALSE_INFORMATION', label: 'Informasi Palsu / Hoaks' },
  { value: 'OTHER', label: 'Lainnya' }
]

/**
 * ReportModal — modal untuk melaporkan post, komentar, atau user
 *
 * Props:
 *   isOpen     {boolean}  — apakah modal terbuka
 *   onClose    {fn}       — callback saat tutup
 *   targetType {string}   — 'POST' | 'COMMENT' | 'USER'
 *   targetId   {string}   — ID konten yang dilaporkan
 *   targetName {string}   — label konten (opsional, untuk teks modal)
 */
export default function ReportModal({ isOpen, onClose, targetType, targetId, targetName }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const TARGET_LABELS = { POST: 'postingan', COMMENT: 'komentar', USER: 'pengguna' }

  const handleSubmit = async () => {
    if (!reason) {
      setError('Pilih alasan laporan terlebih dahulu.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/reports`,
        { targetType, targetId, reason, description },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengirim laporan. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <div className="rm-overlay" onClick={handleClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-header">
          <h3 className="rm-title">🚩 Laporkan {TARGET_LABELS[targetType] || 'konten'}</h3>
          <button className="rm-close" onClick={handleClose}>✕</button>
        </div>

        {success ? (
          <div className="rm-success">
            <div className="rm-success-icon">✅</div>
            <h4>Laporan Terkirim!</h4>
            <p>Laporan Anda telah diterima. Tim kami akan segera meninjaunya. Terima kasih sudah membantu menjaga komunitas.</p>
            <button className="rm-btn-primary" onClick={handleClose}>Tutup</button>
          </div>
        ) : (
          <>
            <div className="rm-body">
              {targetName && (
                <p className="rm-target-info">
                  Melaporkan: <strong>{targetName.length > 60 ? targetName.slice(0, 60) + '...' : targetName}</strong>
                </p>
              )}

              <div className="rm-field">
                <label className="rm-label">Alasan Laporan <span className="rm-required">*</span></label>
                <div className="rm-reasons">
                  {REASONS.map((r) => (
                    <label key={r.value} className={`rm-reason-option ${reason === r.value ? 'rm-reason-selected' : ''}`}>
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={(e) => { setReason(e.target.value); setError('') }}
                        style={{ display: 'none' }}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rm-field">
                <label className="rm-label">Keterangan Tambahan (opsional)</label>
                <textarea
                  className="rm-textarea"
                  rows={3}
                  placeholder="Jelaskan lebih lanjut mengapa konten ini melanggar aturan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <span className="rm-counter">{description.length}/500</span>
              </div>

              {error && <div className="rm-error">⚠️ {error}</div>}
            </div>

            <div className="rm-footer">
              <button className="rm-btn-cancel" onClick={handleClose} disabled={loading}>Batal</button>
              <button className="rm-btn-primary" onClick={handleSubmit} disabled={loading || !reason}>
                {loading ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .rm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .rm-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,.2); overflow: hidden; }
        .rm-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
        .rm-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
        .rm-close { background: none; border: none; font-size: 1rem; cursor: pointer; color: #94a3b8; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background .2s; }
        .rm-close:hover { background: #f1f5f9; }

        .rm-body { padding: 20px; }
        .rm-target-info { font-size: 0.85rem; color: #64748b; background: #f8fafc; border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; line-height: 1.5; }
        .rm-field { margin-bottom: 16px; }
        .rm-label { display: block; font-size: 0.82rem; font-weight: 700; color: #374151; margin-bottom: 8px; }
        .rm-required { color: #ef4444; margin-left: 2px; }
        .rm-reasons { display: flex; flex-direction: column; gap: 6px; }
        .rm-reason-option { padding: 9px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #374151; cursor: pointer; transition: all .2s; user-select: none; }
        .rm-reason-option:hover { border-color: #6366f1; background: #f5f3ff; }
        .rm-reason-selected { border-color: #6366f1 !important; background: #f5f3ff !important; color: #4f46e5 !important; font-weight: 600; }
        .rm-textarea { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 0.875rem; resize: vertical; outline: none; font-family: Inter, sans-serif; color: #374151; box-sizing: border-box; transition: border .2s; }
        .rm-textarea:focus { border-color: #6366f1; }
        .rm-counter { display: block; text-align: right; font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }
        .rm-error { background: #fee2e2; border-radius: 8px; padding: 10px 14px; font-size: 0.85rem; color: #b91c1c; }

        .rm-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid #f1f5f9; }
        .rm-btn-cancel { background: #f1f5f9; border: none; padding: 9px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer; transition: background .2s; }
        .rm-btn-cancel:hover:not(:disabled) { background: #e2e8f0; }
        .rm-btn-primary { background: #6366f1; border: none; padding: 9px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #fff; cursor: pointer; transition: background .2s; }
        .rm-btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .rm-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .rm-btn-cancel:disabled { opacity: .5; cursor: not-allowed; }

        .rm-success { display: flex; flex-direction: column; align-items: center; padding: 40px 24px; gap: 10px; text-align: center; }
        .rm-success-icon { font-size: 2.5rem; }
        .rm-success h4 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
        .rm-success p { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin: 0; }
        .rm-success .rm-btn-primary { margin-top: 8px; }
      `}</style>
    </div>
  )
}
