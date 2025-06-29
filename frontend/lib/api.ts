import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_BASE_URL } from './constants'
import type { ApiResponse } from '@/types'

// Função para obter token do localStorage (compatibilidade)
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

// Função para limpar tokens em caso de erro de auth
const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_data')
  localStorage.removeItem('selected_hub')
}

// Criação da instância Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor - Adiciona token automaticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor - Trata erros e respostas
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    // Se a resposta tem success: false, transformar em erro
    if (response.data && !response.data.success) {
      const error = new Error(response.data.message || 'Erro na requisição')
      ;(error as Error & { response: AxiosResponse }).response = response
      return Promise.reject(error)
    }
    return response
  },
  (error) => {
    // Se é erro 401, limpar tokens e redirecionar para login
    if (error.response?.status === 401) {
      clearTokens()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    // Extrair mensagem de erro da resposta
    const errorMessage = 
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro desconhecido'
    
    return Promise.reject(new Error(errorMessage))
  }
)

// Wrapper functions para facilitar uso
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then(res => res.data),
    
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then(res => res.data),
    
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then(res => res.data),
    
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then(res => res.data),
    
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then(res => res.data),
}

// Export da instância para casos específicos
export default apiClient

// Helper para requests sem autenticação (login, etc)
export const apiPublic = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}) 