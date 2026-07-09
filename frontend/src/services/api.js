import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({ baseURL: BASE })

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login:    (email, password)               => api.post('/auth/login',    { email, password }),
  register: (email, password, display_name) => api.post('/auth/register', { email, password, display_name }),
}

export const recommendAPI = {
  get:    ()                                                            => api.get('/recommend'),
  submit: (problem_id, title, topic, difficulty, mode, solved)         => api.post('/submit', { problem_id, title, topic, difficulty, mode, solved }),
  assess: ratings                                                       => api.post('/assess', { ratings }),
}

export const userAPI = {
  profile:    () => api.get('/profile'),
  history:    () => api.get('/history'),
  mastery:    () => api.get('/mastery'),
  stats:      () => api.get('/stats'),
  trajectory: () => api.get('/trajectory'),
}

export default api
