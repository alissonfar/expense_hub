export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const ROLES = {
  PROPRIETARIO: 'PROPRIETARIO',
  ADMINISTRADOR: 'ADMINISTRADOR',
  COLABORADOR: 'COLABORADOR',
  VISUALIZADOR: 'VISUALIZADOR'
} as const

export const DATA_ACCESS_POLICIES = {
  GLOBAL: 'GLOBAL',
  INDIVIDUAL: 'INDIVIDUAL'
} as const

export const ROUTES = {
  LOGIN: '/login',
  SELECT_HUB: '/select-hub',
  DASHBOARD: '/dashboard',
  TRANSACOES: '/transacoes',
  PAGAMENTOS: '/pagamentos',
  PESSOAS: '/pessoas',
  RELATORIOS: '/relatorios',
  TAGS: '/tags',
  CONFIGURACOES: '/configuracoes'
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SELECT_HUB: '/auth/select-hub',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  TRANSACOES: {
    LIST: '/transacoes',
    CREATE: '/transacoes',
    GET: (id: number) => `/transacoes/${id}`,
    UPDATE: (id: number) => `/transacoes/${id}`,
    DELETE: (id: number) => `/transacoes/${id}`
  },
  PAGAMENTOS: {
    LIST: '/pagamentos',
    CREATE: '/pagamentos',
    GET: (id: number) => `/pagamentos/${id}`,
    UPDATE: (id: number) => `/pagamentos/${id}`,
    DELETE: (id: number) => `/pagamentos/${id}`
  },
  PESSOAS: {
    LIST: '/pessoas',
    CREATE: '/pessoas',
    GET: (id: number) => `/pessoas/${id}`,
    UPDATE: (id: number) => `/pessoas/${id}`,
    DELETE: (id: number) => `/pessoas/${id}`
  },
  RELATORIOS: {
    DASHBOARD: '/relatorios/dashboard',
    SALDOS: '/relatorios/saldos',
    PENDENCIAS: '/relatorios/pendencias'
  }
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
export type DataAccessPolicy = typeof DATA_ACCESS_POLICIES[keyof typeof DATA_ACCESS_POLICIES] 