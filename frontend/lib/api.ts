import axios, { AxiosError } from 'axios'

// Configuração base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    // Pegar token do localStorage (apenas no client-side)
    if (typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('auth_token')
      // Remover aspas extras se existirem (caso token foi salvo como JSON string)
      const token = rawToken ? rawToken.replace(/^"(.*)"$/, '$1') : null
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratamento de respostas e erros
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Se token expirou ou inválido (401), limpar localStorage
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }

    // Tratamento de outros erros comuns
    const errorMessage = getErrorMessage(error)
    
    return Promise.reject({
      ...error,
      message: errorMessage
    })
  }
)

// Função para extrair mensagem de erro padronizada
function getErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const responseData = error.response.data as any
    
    // Se backend retorna estrutura padrão com 'message'
    if (responseData.message) {
      return responseData.message
    }
    
    // Se backend retorna estrutura com 'error'
    if (responseData.error) {
      return responseData.error
    }
    
    // Se backend retorna array de erros (validação Zod)
    if (responseData.errors && Array.isArray(responseData.errors)) {
      return responseData.errors.map((err: any) => err.message || err).join(', ')
    }
  }

  // Mensagens padrão por status code
  switch (error.response?.status) {
    case 400:
      return 'Dados inválidos. Verifique as informações enviadas.'
    case 401:
      return 'Não autorizado. Faça login novamente.'
    case 403:
      return 'Acesso negado. Você não tem permissão para esta ação.'
    case 404:
      return 'Recurso não encontrado.'
    case 409:
      return 'Conflito. O recurso já existe ou há inconsistências.'
    case 422:
      return 'Dados inválidos. Verifique os campos obrigatórios.'
    case 500:
      return 'Erro interno do servidor. Tente novamente mais tarde.'
    case 503:
      return 'Serviço temporariamente indisponível.'
    default:
      return error.message || 'Erro de comunicação com o servidor'
  }
}

// Funções utilitárias para tipos de request - VERSÃO LIMPA
export const apiGet = <T = any>(url: string, params?: any) => {
  if (!params) {
    return api.get<T>(url)
  }
  
  // Converter todos os parâmetros para strings para compatibilidade com Zod
  const stringParams: Record<string, string> = {}
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      stringParams[key] = String(value)
    }
  })
  
  // Usar paramsSerializer para forçar strings na URL
  return api.get<T>(url, { 
    params: stringParams,
    paramsSerializer: {
      serialize: (params) => {
        return Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      }
    }
  })
}

export const apiPost = <T = any>(url: string, data?: any) => 
  api.post<T>(url, data)

export const apiPut = <T = any>(url: string, data?: any) => 
  api.put<T>(url, data)

export const apiDelete = <T = any>(url: string) => 
  api.delete<T>(url)

export default api 