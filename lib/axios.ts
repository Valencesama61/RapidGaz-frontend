import axios from 'axios'
import Cookies from 'js-cookie'

const TOKEN_KEY = 'rapidgaz_token'

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - inject Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 (sauf sur les pages d'auth)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const authPaths = ['/login', '/register']
      const isAuthPage = authPaths.includes(window.location.pathname)
      if (!isAuthPage) {
        Cookies.remove(TOKEN_KEY)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
export { TOKEN_KEY }
