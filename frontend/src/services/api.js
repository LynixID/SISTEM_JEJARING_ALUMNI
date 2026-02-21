import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Otomatis tambahkan token ke header setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Jika token expired (401), logout dan redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Posts API
export const getPosts = (params = {}) => {
  return api.get('/posts', { params })
}

export const getPostById = (id) => {
  return api.get(`/posts/${id}`)
}

export const createPost = (data, image) => {
  const formData = new FormData()
  formData.append('content', data.content)
  if (data.visibility) {
    formData.append('visibility', data.visibility)
  }
  if (data.mentions && Array.isArray(data.mentions) && data.mentions.length > 0) {
    formData.append('mentions', JSON.stringify(data.mentions))
  }
  if (image) {
    formData.append('image', image)
  }
  return api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const updatePost = (id, data, image) => {
  const formData = new FormData()
  if (data.content) formData.append('content', data.content)
  if (data.visibility !== undefined) {
    formData.append('visibility', data.visibility)
  }
  if (data.mentions !== undefined) {
    if (Array.isArray(data.mentions) && data.mentions.length > 0) {
      formData.append('mentions', JSON.stringify(data.mentions))
    } else {
      formData.append('mentions', JSON.stringify([]))
    }
  }
  if (image === null) {
    // Jika image null, berarti request untuk remove image
    formData.append('removeImage', 'true')
  } else if (image) {
    formData.append('image', image)
  }
  return api.put(`/posts/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const deletePost = (id) => {
  return api.delete(`/posts/${id}`)
}

// Comments API
export const getComments = (postId, params = {}) => {
  return api.get(`/posts/${postId}/comments`, { params })
}

export const createComment = (postId, content, parentId = null) => {
  // Pastikan content sudah di-trim dan tidak kosong
  const trimmedContent = content?.trim() || ''
  if (!trimmedContent) {
    return Promise.reject(new Error('Konten komentar harus diisi'))
  }
  
  // Hanya kirim parentId jika ada, jangan kirim null
  const payload = { content: trimmedContent }
  if (parentId) {
    payload.parentId = parentId
  }
  
  return api.post(`/posts/${postId}/comments`, payload)
}

export const updateComment = (id, content) => {
  return api.put(`/comments/${id}`, { content })
}

export const deleteComment = (id) => {
  return api.delete(`/comments/${id}`)
}

// Likes API
export const toggleLike = (postId) => {
  return api.post(`/posts/${postId}/like`)
}

export const getLikes = (postId, params = {}) => {
  return api.get(`/posts/${postId}/likes`, { params })
}

// Users API
export const getUsers = (params = {}) => {
  return api.get('/users', { params })
}

export const getUserById = (id) => {
  return api.get(`/users/${id}`)
}

export const getUserProfile = (id) => {
  return api.get(`/users/${id}/profile`)
}

export const updateUserProfile = (id, data, fotoProfil = null, coverPhoto = null) => {
  const formData = new FormData()
  
  // Append text fields
  if (data.profesi !== undefined) formData.append('profesi', data.profesi || '')
  if (data.perusahaan !== undefined) formData.append('perusahaan', data.perusahaan || '')
  if (data.jabatan !== undefined) formData.append('jabatan', data.jabatan || '')
  if (data.skill !== undefined) formData.append('skill', data.skill || '')
  
  // Append JSON fields
  if (data.sosialMedia !== undefined) {
    formData.append('sosialMedia', typeof data.sosialMedia === 'string' ? data.sosialMedia : JSON.stringify(data.sosialMedia))
  }
  if (data.portfolio !== undefined) {
    formData.append('portfolio', typeof data.portfolio === 'string' ? data.portfolio : JSON.stringify(data.portfolio))
  }
  if (data.experience !== undefined) {
    formData.append('experience', typeof data.experience === 'string' ? data.experience : JSON.stringify(data.experience))
  }
  if (data.education !== undefined) {
    formData.append('education', typeof data.education === 'string' ? data.education : JSON.stringify(data.education))
  }
  if (data.certifications !== undefined) {
    formData.append('certifications', typeof data.certifications === 'string' ? data.certifications : JSON.stringify(data.certifications))
  }
  if (data.languages !== undefined) {
    formData.append('languages', typeof data.languages === 'string' ? data.languages : JSON.stringify(data.languages))
  }
  
  // Append files
  if (fotoProfil) {
    formData.append('fotoProfil', fotoProfil)
  }
  if (coverPhoto) {
    formData.append('coverPhoto', coverPhoto)
  }
  
  return api.put(`/users/${id}/profile`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const updateUserBasicInfo = (id, data) => {
  return api.put(`/users/${id}`, data)
}

// Notifications API
export const getNotifications = (params = {}) => {
  return api.get('/notifications', { params })
}

export const getUnreadCount = () => {
  return api.get('/notifications/unread-count')
}

export const markNotificationAsRead = (id) => {
  return api.patch(`/notifications/${id}/read`)
}

export const markAllNotificationsAsRead = () => {
  return api.patch('/notifications/read-all')
}

export const deleteNotification = (id) => {
  return api.delete(`/notifications/${id}`)
}

// Connections API
export const sendConnectionRequest = (data) => {
  return api.post('/connections', data)
}

export const getConnectionRequests = (status = 'PENDING') => {
  return api.get('/connections/requests', { params: { status } })
}

export const getConnectionStatus = (userId) => {
  return api.get(`/connections/status/${userId}`)
}

export const getConnections = () => {
  return api.get('/connections')
}

export const acceptConnection = (id) => {
  return api.put(`/connections/${id}/accept`)
}

export const rejectConnection = (id) => {
  return api.put(`/connections/${id}/reject`)
}

// Reads API (untuk tracking announcement dan event yang sudah dibaca)
export const getUnreadNewsCount = () => {
  return api.get('/reads/unread-count')
}

export const getReadStatus = (announcementIds = [], eventIds = []) => {
  return api.post('/reads/read-status', { announcementIds, eventIds })
}

export const markAnnouncementAsRead = (id) => {
  return api.post(`/reads/announcements/${id}/read`)
}

export const markEventAsRead = (id) => {
  return api.post(`/reads/events/${id}/read`)
}

// Messages API
export const getConversations = () => {
  return api.get('/messages/conversations')
}

export const getMessages = (userId, params = {}) => {
  return api.get(`/messages/${userId}`, { params })
}

export const sendMessage = (data, image) => {
  const formData = new FormData()
  formData.append('receiverId', data.receiverId)
  if (data.content) {
    formData.append('content', data.content)
  }
  if (data.parentId) {
    formData.append('parentId', data.parentId)
  }
  if (image) {
    formData.append('media', image)
  }
  return api.post('/messages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const deleteMessage = (id) => {
  return api.delete(`/messages/${id}`)
}

export const markMessagesAsRead = (userId) => {
  return api.put(`/messages/${userId}/read`)
}

export default api

