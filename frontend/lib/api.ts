import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/**
 * Função para obter token de forma síncrona
 */
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  try {
    // Primeiro tenta do localStorage
    const token = localStorage.getItem('accessToken')
    if (token) return token
    
    // Fallback para cookie
    const cookies = document.cookie.split(';')
    const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='))
    if (tokenCookie) {
      return tokenCookie.split('=')[1]
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Função para obter refresh token
 */
const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem('refreshToken')
  } catch {
    return null
  }
}

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
 * Interceptor para adicionar token de autenticação de forma síncrona
 * IMPORTANTE: Não sobrescreve headers Authorization já definidos
 */
api.interceptors.request.use(
  (config) => {
    // Se já existe Authorization header, não sobrescrever
    // Isso permite que refresh tokens sejam enviados manualmente
    if (config.headers.Authorization) {
      console.log('[API] Header Authorization já definido, mantendo:', config.headers.Authorization.substring(0, 50) + '...')
      return config
    }
    
    // Apenas adicionar access token se não há header Authorization
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[API] Access token adicionado automaticamente:', token.substring(0, 50) + '...')
    } else {
      console.log('[API] Nenhum access token disponível')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

/**
 * Processa fila de requisições aguardando refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

/**
 * Tenta renovar o access token usando refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('Refresh token não encontrado')
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/select-hub`,
      { hubId: getCurrentHubId() },
      {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.success) {
      const { accessToken } = response.data.data
      
      // Salvar novo token
      localStorage.setItem('accessToken', accessToken)
      const maxAge = 60 * 60 * 24 * 7; // 7 dias  
      document.cookie = `accessToken=${accessToken}; path=/; Max-Age=${maxAge}; SameSite=Lax`
      
      // Atualizar store se disponível
      try {
        const { useAuthStore } = await import('@/lib/stores/auth-store')
        useAuthStore.getState().setTokens(accessToken)
      } catch {
        // Store não disponível, mas token está salvo
      }
      
      return accessToken
    }
    
    throw new Error('Falha ao renovar token')
  } catch (error) {
    throw new Error('Refresh token inválido ou expirado')
  }
}

/**
 * Obtém hub ID atual do localStorage ou URL
 */
const getCurrentHubId = (): number => {
  if (typeof window === 'undefined') return 0
  
  try {
    // Tenta do localStorage primeiro
    const storedHub = localStorage.getItem('auth-storage')
    if (storedHub) {
      const parsed = JSON.parse(storedHub)
      if (parsed.state?.currentHub?.id) {
        return parsed.state.currentHub.id
      }
    }
    
    // Fallback para URL
    const pathParts = window.location.pathname.split('/')
    const hubId = parseInt(pathParts[1])
    return isNaN(hubId) ? 0 : hubId
  } catch {
    return 0
  }
}

/**
 * Interceptor para tratamento de respostas e refresh automático
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any
    
    // Se é erro 401 e não é uma requisição de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Adicionar à fila se já está fazendo refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshAccessToken()
        processQueue(null, newToken)
        isRefreshing = false
        
        // Tentar novamente a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        
        // Refresh falhou, redirecionar para login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          document.cookie = 'accessToken=; Max-Age=0; path=/;'
          
          // Limpar store se disponível
          try {
            const { useAuthStore } = await import('@/lib/stores/auth-store')
            useAuthStore.getState().clearAuth()
          } catch {
            // Fallback direto
            window.location.href = '/auth/login'
          }
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    // Tratamento de outros erros
    if (error.response?.status === 403) {
      console.error('Acesso negado:', error.response.data)
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