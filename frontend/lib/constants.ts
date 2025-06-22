// Dados fictícios para o protótipo
export const MOCK_METRICS = [
  {
    title: "Total Gastos",
    value: "R$ 12.450,00",
    description: "Últimos 30 dias",
    trend: "up" as const,
    trendValue: "+12%",
    icon: "TrendingUp",
    color: "blue" as const
  },
  {
    title: "Total Receitas",
    value: "R$ 8.720,00", 
    description: "Últimos 30 dias",
    trend: "down" as const,
    trendValue: "-5%",
    icon: "TrendingDown",
    color: "green" as const
  },
  {
    title: "Dívidas Pendentes",
    value: "R$ 3.280,00",
    description: "4 pessoas devendo",
    trend: "neutral" as const,
    icon: "AlertCircle",
    color: "yellow" as const
  },
  {
    title: "Pagamentos Mês", 
    value: "23",
    description: "Pagamentos recebidos",
    trend: "up" as const,
    trendValue: "+18%",
    icon: "CreditCard",
    color: "blue" as const
  }
]

export const MOCK_CHART_DATA = [
  { mes: "Jan", gastos: 4200, receitas: 2800 },
  { mes: "Fev", gastos: 3500, receitas: 1800 },
  { mes: "Mar", gastos: 3800, receitas: 3200 },
  { mes: "Abr", gastos: 4100, receitas: 2400 },
  { mes: "Mai", gastos: 3200, receitas: 4100 },
  { mes: "Jun", gastos: 2800, receitas: 2200 }
]

export const MOCK_CATEGORIAS_DATA = [
  { categoria: "Alimentação", valor: 2800, cor: "#3b82f6" },
  { categoria: "Transporte", valor: 1200, cor: "#10b981" },
  { categoria: "Lazer", valor: 1800, cor: "#f59e0b" },
  { categoria: "Casa", valor: 2200, cor: "#ef4444" },
  { categoria: "Saúde", valor: 800, cor: "#8b5cf6" }
]

export const MOCK_PESSOAS = [
  { 
    id: 1, 
    nome: "João Silva", 
    email: "joao@email.com", 
    tipo: "PARTICIPANTE", 
    divida: 450.00,
    status: "ATIVO",
    avatar: "JS"
  },
  { 
    id: 2, 
    nome: "Maria Santos", 
    email: "maria@email.com", 
    tipo: "PARTICIPANTE", 
    divida: 1280.50,
    status: "ATIVO",
    avatar: "MS"
  },
  { 
    id: 3, 
    nome: "Pedro Oliveira", 
    email: "pedro@email.com", 
    tipo: "PARTICIPANTE", 
    divida: 0,
    status: "ATIVO",
    avatar: "PO"
  },
  { 
    id: 4, 
    nome: "Ana Costa", 
    email: "ana@email.com", 
    tipo: "PARTICIPANTE", 
    divida: 1549.50,
    status: "ATIVO",
    avatar: "AC"
  }
]

export const MOCK_TRANSACOES = [
  {
    id: 1,
    descricao: "Jantar Restaurante Italiano",
    valor: 240.00,
    data: "2025-01-20",
    tag: "Alimentação",
    status: "PENDENTE",
    tipo: "GASTO",
    participantes: 4
  },
  {
    id: 2,
    descricao: "Freelance Design Logo",
    valor: 1200.00,
    data: "2025-01-18", 
    tag: "Receita",
    status: "PAGO",
    tipo: "RECEITA",
    participantes: 1
  },
  {
    id: 3,
    descricao: "Supermercado Mensal",
    valor: 380.50,
    data: "2025-01-15",
    tag: "Alimentação", 
    status: "PAGO_PARCIAL",
    tipo: "GASTO",
    participantes: 3
  },
  {
    id: 4,
    descricao: "Cinema - Filmes",
    valor: 120.00,
    data: "2025-01-12",
    tag: "Lazer",
    status: "PAGO",
    tipo: "GASTO", 
    participantes: 2
  },
  {
    id: 5,
    descricao: "Uber para Trabalho",
    valor: 45.80,
    data: "2025-01-10",
    tag: "Transporte",
    status: "PENDENTE",
    tipo: "GASTO",
    participantes: 1
  }
]

export const MOCK_TAGS = [
  { id: 1, nome: "Alimentação", cor: "#3b82f6", usos: 12 },
  { id: 2, nome: "Transporte", cor: "#10b981", usos: 8 },
  { id: 3, nome: "Lazer", cor: "#f59e0b", usos: 15 },
  { id: 4, nome: "Casa", cor: "#ef4444", usos: 6 },
  { id: 5, nome: "Saúde", cor: "#8b5cf6", usos: 4 },
  { id: 6, nome: "Trabalho", cor: "#06b6d4", usos: 9 },
  { id: 7, nome: "Receita", cor: "#84cc16", usos: 5 }
]

export const MOCK_PAGAMENTOS = [
  {
    id: 1,
    valor: 450.00,
    data: "2025-01-19",
    pessoa: "João Silva",
    metodo: "PIX",
    status: "CONFIRMADO",
    transacoes: 2
  },
  {
    id: 2,
    valor: 200.00,
    data: "2025-01-17",
    pessoa: "Maria Santos", 
    metodo: "Transferência",
    status: "PENDENTE",
    transacoes: 1
  },
  {
    id: 3,
    valor: 120.00,
    data: "2025-01-15",
    pessoa: "Pedro Oliveira",
    metodo: "Dinheiro",
    status: "CONFIRMADO",
    transacoes: 1
  }
]

export const MOCK_DIVIDAS_PENDENTES = [
  {
    pessoa: "Ana Costa",
    valor: 1549.50,
    transacoes: 3,
    ultimoPagamento: "2025-01-05"
  },
  {
    pessoa: "Maria Santos", 
    valor: 1280.50,
    transacoes: 2,
    ultimoPagamento: "2025-01-10"
  },
  {
    pessoa: "João Silva",
    valor: 450.00,
    transacoes: 1,
    ultimoPagamento: "2025-01-15"
  }
]

export const MOCK_PAGAMENTOS_RECENTES = [
  {
    pessoa: "João Silva",
    valor: 450.00,
    data: "2025-01-19",
    metodo: "PIX"
  },
  {
    pessoa: "Pedro Oliveira", 
    valor: 120.00,
    data: "2025-01-15",
    metodo: "Dinheiro"
  },
  {
    pessoa: "Maria Santos",
    valor: 200.00,
    data: "2025-01-12", 
    metodo: "Transferência"
  }
]

// Navegação da Sidebar
export const SIDEBAR_NAVIGATION = [
  {
    grupo: "Principal",
    items: [
      { 
        label: "Dashboard", 
        icon: "LayoutDashboard", 
        href: "/dashboard",
        description: "Visão geral e métricas"
      },
    ]
  },
  {
    grupo: "Gestão", 
    items: [
      { 
        label: "Pessoas", 
        icon: "Users", 
        href: "/pessoas",
        description: "Gerenciar participantes"
      },
      { 
        label: "Tags", 
        icon: "Tag", 
        href: "/tags",
        description: "Categorias e etiquetas"
      },
    ]
  },
  {
    grupo: "Financeiro",
    items: [
      { 
        label: "Transações", 
        icon: "Receipt", 
        href: "/transacoes",
        description: "Gastos e receitas"
      },
      { 
        label: "Pagamentos", 
        icon: "CreditCard", 
        href: "/pagamentos",
        description: "Registros de pagamentos"
      },
    ]
  },
  {
    grupo: "Análise",
    items: [
      { 
        label: "Relatórios", 
        icon: "BarChart3", 
        href: "/relatorios",
        description: "Análises e gráficos"
      },
    ]
  },
  {
    grupo: "Sistema",
    items: [
      { 
        label: "Configurações", 
        icon: "Settings", 
        href: "/configuracoes",
        description: "Preferências do sistema"
      },
    ]
  }
]

// Status colors
export const STATUS_COLORS = {
  PENDENTE: "text-yellow-600 bg-yellow-50 border-yellow-200",
  PAGO: "text-green-600 bg-green-50 border-green-200", 
  PAGO_TOTAL: "text-green-600 bg-green-50 border-green-200",
  PAGO_PARCIAL: "text-blue-600 bg-blue-50 border-blue-200",
  CONFIRMADO: "text-green-600 bg-green-50 border-green-200",
  CANCELADO: "text-red-600 bg-red-50 border-red-200",
  ATIVO: "text-green-600 bg-green-50 border-green-200",
  INATIVO: "text-gray-600 bg-gray-50 border-gray-200"
}

// Periods for filters
export const PERIOD_OPTIONS = [
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 15 dias", value: "15d" },
  { label: "Mês atual", value: "month" },
  { label: "Mês anterior", value: "prev_month" },
  { label: "Ano atual", value: "year" },
  { label: "Personalizado", value: "custom" }
]

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    LOGOUT: '/auth/logout'
  },
  
  // Pessoas
  PESSOAS: {
    LIST: '/pessoas',
    CREATE: '/pessoas',
    GET: (id: string) => `/pessoas/${id}`,
    UPDATE: (id: string) => `/pessoas/${id}`,
    DELETE: (id: string) => `/pessoas/${id}`
  },
  
  // Tags
  TAGS: {
    LIST: '/tags',
    CREATE: '/tags',
    GET: (id: string) => `/tags/${id}`,
    UPDATE: (id: string) => `/tags/${id}`,
    DELETE: (id: string) => `/tags/${id}`
  },
  
  // Transações
  TRANSACOES: {
    LIST: '/transacoes',
    CREATE: '/transacoes',
    CREATE_RECEITA: '/transacoes/receita',
    GET: (id: string) => `/transacoes/${id}`,
    UPDATE: (id: string) => `/transacoes/${id}`,
    UPDATE_RECEITA: (id: string) => `/transacoes/receita/${id}`,
    DELETE: (id: string) => `/transacoes/${id}`
  },
  
  // Pagamentos
  PAGAMENTOS: {
    LIST: '/pagamentos',
    CREATE: '/pagamentos',
    GET: (id: string) => `/pagamentos/${id}`,
    UPDATE: (id: string) => `/pagamentos/${id}`,
    DELETE: (id: string) => `/pagamentos/${id}`,
    CONFIG_EXCEDENTE: '/pagamentos/configuracoes/excedente'
  },
  
  // Relatórios
  RELATORIOS: {
    DASHBOARD: '/relatorios/dashboard',
    SALDOS: '/relatorios/saldos',
    PENDENCIAS: '/relatorios/pendencias',
    TRANSACOES: '/relatorios/transacoes',
    CATEGORIAS: '/relatorios/categorias'
  },
  
  // Configurações
  CONFIGURACOES: {
    TEMA: '/configuracoes/tema'
  }
} as const 