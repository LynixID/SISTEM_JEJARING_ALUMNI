/**
 * Convert image path ke full URL untuk display di frontend
 * Support: full URL, absolute path, atau filename only
 */
export const getImageUrl = (imagePath, category = 'general') => {
  if (!imagePath) return null
  
  // Return as is jika sudah full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Construct full URL dari absolute path
  if (imagePath.startsWith('/uploads/images/')) {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
    return `${backendUrl}${imagePath}`
  }
  
  // Construct full URL dari filename (backward compatibility)
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
  return `${backendUrl}/uploads/images/${category}/${imagePath}`
}

