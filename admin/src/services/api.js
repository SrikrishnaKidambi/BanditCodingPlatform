import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cc_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_admin_token')
      localStorage.removeItem('cc_admin')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const adminAuthAPI = {
  login:    (email, password) => api.post('/admin/auth/login',    { email, password }),
  register: (email, password) => api.post('/admin/auth/register', { email, password }),
}

export const questionsAPI = {
  list:   ()              => api.get('/admin/questions'),
  add:    (q)             => api.post('/admin/questions', q),
  bulk:   (questions)     => api.post('/admin/questions/bulk', { questions }),
  remove: (id)            => api.delete(`/admin/questions/${id}`),
}

export const topicsAPI = {
  list:   () => api.get('/admin/topics'),
  add:    (topic) => api.post('/admin/topics', { topic }),
}

export default api
