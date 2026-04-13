import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  // No lanzamos excepción aquí para no romper el build.
  // Se validará en tiempo de ejecución cuando se intente usar la API.
  console.warn('[API] VITE_API_BASE_URL no está configurado')
}

let authToken = null

export function setAuthToken(token) {
  authToken = token ?? null
}

export function getAuthToken() {
  return authToken
}

export function clearAuthToken() {
  authToken = null
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      clearAuthToken()
      // Redirección simple a pantalla de login (SPA)
      if (window.location.pathname !== '/' || window.location.search !== '' || window.location.hash !== '') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  },
)

