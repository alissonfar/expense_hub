import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/**
 * Cliente Axios configurado para comunicação com o backend
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Interceptor para adicionar token de autenticação
 */
api.interceptors.request.use(
  (config) => {
    // Se estamos no cliente, tentar pegar o token do store
    if (typeof window !== 'undefined') {
      // Importar dinamicamente para evitar problemas de SSR
      import('@/lib/stores/auth-store').then(({ useAuthStore }) => {
        const state = useAuthStore.getState()
        if (state.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`
        }
      }).catch(() => {
        // Fallback para localStorage se o store não estiver disponível
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      })
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Interceptor para tratamento de respostas e erros
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Retornar apenas os dados da resposta
    return response.data
  },
  (error: AxiosError) => {
    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Limpar tokens do localStorage
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        
        // Limpar store de autenticação
        import('@/lib/stores/auth-store').then(({ useAuthStore }) => {
          useAuthStore.getState().clearAuth()
        }).catch(() => {
          // Fallback se o store não estiver disponível
          window.location.href = '/auth/login'
        })
      }
    }
    
    // Padronizar formato de erro
    const errorMessage = error.response?.data || {
      error: 'ErroConexao',
      message: 'Erro de conexão com o servidor'
    }
    
    return Promise.reject(errorMessage)
  }
)

/**
 * Tipos para respostas da API
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[]
  paginacao: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Utilitários para chamadas específicas
 */
export const apiUtils = {
  /**
   * GET request with automatic error handling
   */
  get: <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    return api.get(url, { params })
  },
  
  /**
   * POST request with automatic error handling
   */
  post: <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    return api.post(url, data, config)
  },
  
  /**
   * PUT request with automatic error handling
   */
  put: <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return api.put(url, data)
  },
  
  /**
   * DELETE request with automatic error handling
   */
  delete: <T>(url: string): Promise<ApiResponse<T>> => {
    return api.delete(url)
  },
}

export default api 