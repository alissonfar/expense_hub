// Espelhando tipos do backend para autenticação multi-tenant

export type Role = 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR'
export type DataAccessPolicy = 'GLOBAL' | 'INDIVIDUAL'

/**
 * Contexto de autenticação do usuário
 */
export interface AuthContext {
  pessoaId: number
  hubId: number
  role: Role
  dataAccessPolicy: DataAccessPolicy | null
  ehAdministrador: boolean
}

/**
 * Informações básicas do usuário
 */
export interface User {
  id: number
  nome: string
  email: string
  ehAdministrador: boolean
}

/**
 * Informações do Hub
 */
export interface HubInfo {
  id: number
  nome: string
  role: Role
}

/**
 * Resposta de login
 */
export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: User
    hubs: HubInfo[]
    refreshToken: string
  }
  timestamp: string
}

/**
 * Resposta de seleção de Hub
 */
export interface SelectHubResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    hubContext: AuthContext & {
      hubNome: string
    }
  }
  timestamp: string
}

/**
 * Dados para login
 */
export interface LoginCredentials {
  email: string
  senha: string
}

/**
 * Dados para registro
 */
export interface RegisterData {
  nome: string
  email: string
  senha: string
  telefone?: string
  nomeHub: string
}

/**
 * Dados para seleção de Hub
 */
export interface SelectHubData {
  hubId: number
}

/**
 * Estado de autenticação
 */
export interface AuthState {
  // Tokens
  refreshToken: string | null
  accessToken: string | null
  
  // User context
  user: User | null
  currentHub: (HubInfo & { hubNome?: string }) | null
  availableHubs: HubInfo[]
  
  // Auth status
  isAuthenticated: boolean
  isLoading: boolean
  
  // Context específico do hub atual
  authContext: AuthContext | null
} 