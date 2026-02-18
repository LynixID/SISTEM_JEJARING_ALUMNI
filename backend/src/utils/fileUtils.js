/**
 * Utility functions untuk handle file paths
 * Menyimpan hanya filename di database, generate full path di backend
 */

/**
 * Generate image path berdasarkan filename dan category
 * @param {string} filename - Nama file (dari database)
 * @param {string} category - Kategori folder (posts, events, announcements, profiles, dll)
 * @returns {string|null} Full path atau null jika filename kosong
 */
export const getImagePath = (filename, category) => {
  if (!filename) return null
  
  // Jika sudah full path (untuk backward compatibility), return as is
  if (filename.startsWith('/uploads/')) {
    return filename
  }
  
  // Generate path dari filename dan category
  return `/uploads/images/${category}/${filename}`
}

/**
 * Generate full image URL dengan base URL
 * @param {string} filename - Nama file (dari database)
 * @param {string} category - Kategori folder
 * @param {string} baseUrl - Base URL backend (optional)
 * @returns {string|null} Full URL atau null jika filename kosong
 */
export const getImageUrl = (filename, category, baseUrl = '') => {
  if (!filename) return null
  
  const path = getImagePath(filename, category)
  
  if (baseUrl) {
    return `${baseUrl}${path}`
  }
  
  return path
}

/**
 * Extract filename dari full path (untuk migrasi data lama)
 * @param {string} path - Full path atau filename
 * @returns {string} Filename saja
 */
export const extractFilename = (path) => {
  if (!path) return null
  
  // Jika sudah filename saja, return as is
  if (!path.includes('/')) {
    return path
  }
  
  // Extract filename dari path
  const parts = path.split('/')
  return parts[parts.length - 1]
}

