// Tipos baseados no Prisma Schema e API do backend

export interface User {
  id: number
  nome: string
  email: string
  telefone?: string
  ehAdministrador: boolean
  ativo: boolean
  data_cadastro: string
  atualizado_em: string
}

export interface Hub {
  id: number
  nome: string
  ativo: boolean
  createdAt: string
  updatedAt: string
  codigoAcesso?: string
  role?: string // Role do usuário neste Hub
  dataAccessPolicy?: string
}

export interface MembrosHub {
  hubId: number
  pessoaId: number
  role: Role
  dataAccessPolicy?: DataAccessPolicy
  ativo: boolean
  joinedAt: string
}

export interface Transacao {
  id: number
  ativo: boolean
  tipo: 'GASTO' | 'RECEITA'
  proprietario_id: number
  descricao: string
  local?: string
  valor_total: number
  data_transacao: string
  data_criacao: string
  eh_parcelado: boolean
  parcela_atual: number
  total_parcelas: number
  valor_parcela: number
  grupo_parcela?: string
  observacoes?: string
  confirmado: boolean
  status_pagamento: 'PENDENTE' | 'PAGO' | 'PARCIAL'
  criado_por: number
  atualizado_em: string
  hubId: number
}

export interface Pagamento {
  id: number
  ativo: boolean
  pessoa_id: number
  valor_total: number
  valor_excedente?: number
  data_pagamento: string
  forma_pagamento?: string
  observacoes?: string
  processar_excedente?: boolean
  receita_excedente_id?: number
  registrado_por: number
  criado_em: string
  atualizado_em: string
  hubId: number
}

export interface Tag {
  id: number
  nome: string
  cor?: string
  icone?: string
  ativo: boolean
  criado_por: number
  criado_em: string
  hubId: number
}

// Tipos de API Response
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  error: string
  message: string
  timestamp: string
}

// Tipos de Auth
export interface LoginCredentials {
  email: string
  senha: string
}

export interface RegisterData {
  nome: string
  email: string
  senha: string
}

export interface AuthResponse {
  refreshToken: string
  user: User
  hubs: Hub[]
}

export interface HubSelectResponse {
  accessToken: string
  hubContext: Hub
}

// Tipos de Formulários
export interface TransacaoFormData {
  tipo: 'GASTO' | 'RECEITA'
  descricao: string
  valor_total: number
  data_transacao: string
  local?: string
  observacoes?: string
  eh_parcelado: boolean
  total_parcelas?: number
  participantes?: number[]
  tags?: number[]
}

export interface PagamentoFormData {
  pessoa_id: number
  valor_total: number
  data_pagamento: string
  forma_pagamento?: string
  observacoes?: string
  transacoes: { id: number; valor: number }[]
}

// Enums
export type Role = 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR'
export type DataAccessPolicy = 'GLOBAL' | 'INDIVIDUAL' 