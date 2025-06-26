// ============================================================================
// 🔥 CONFIGURAÇÃO DA API
// ============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  PESSOAS: {
    LIST: '/pessoas',
    CREATE: '/pessoas',
    GET: (id: number) => `/pessoas/${id}`,
    UPDATE: (id: number) => `/pessoas/${id}`,
    DELETE: (id: number) => `/pessoas/${id}`
  },
  TAGS: {
    LIST: '/tags',
    CREATE: '/tags',
    GET: (id: number) => `/tags/${id}`,
    UPDATE: (id: number) => `/tags/${id}`,
    DELETE: (id: number) => `/tags/${id}`
  },
  TRANSACOES: {
    LIST: '/transacoes',
    CREATE: '/transacoes',
    CREATE_RECEITA: '/transacoes/receita',
    GET: (id: number) => `/transacoes/${id}`,
    UPDATE: (id: number) => `/transacoes/${id}`,
    UPDATE_RECEITA: (id: number) => `/transacoes/receita/${id}`,
    DELETE: (id: number) => `/transacoes/${id}`
  },
  PAGAMENTOS: {
    LIST: '/pagamentos',
    CREATE: '/pagamentos',
    GET: (id: number) => `/pagamentos/${id}`,
    UPDATE: (id: number) => `/pagamentos/${id}`,
    DELETE: (id: number) => `/pagamentos/${id}`,
    CONFIG_EXCEDENTE: '/pagamentos/configuracoes/excedente'
  },
  RELATORIOS: {
    DASHBOARD: '/relatorios/dashboard',
    SALDOS: '/relatorios/saldos',
    PENDENCIAS: '/relatorios/pendencias',
    TRANSACOES: '/relatorios/transacoes',
    CATEGORIAS: '/relatorios/categorias'
  },
  CONFIGURACOES: {
    INTERFACE: '/configuracoes/interface'
  }
}

// ============================================================================
// 🔥 CORES E STATUS
// ============================================================================

export const STATUS_COLORS = {
  ATIVO: '#10b981',
  INATIVO: '#ef4444',
  PENDENTE: '#f59e0b',
  PAGO: '#10b981',
  PAGO_PARCIAL: '#3b82f6',
  CONFIRMADO: '#10b981',
  CANCELADO: '#ef4444'
}

// ============================================================================
// 🔥 DADOS MOCK PARA DESENVOLVIMENTO
// ============================================================================

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

// Periods for filters
export const PERIOD_OPTIONS = [
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 15 dias", value: "15d" },
  { label: "Mês atual", value: "month" },
  { label: "Mês anterior", value: "prev_month" },
  { label: "Ano atual", value: "year" },
  { label: "Personalizado", value: "custom" }
]

// ============================================================================
// ⚡ CONSTANTES PARA FORMULÁRIO OTIMIZADO
// ============================================================================

// Atalhos de teclado
export const KEYBOARD_SHORTCUTS = {
  SAVE_AND_NEW: 'Ctrl+Enter',
  SAVE_AND_CLOSE: 'Ctrl+S',
  CANCEL: 'Escape',
  DUPLICATE_LAST: 'Ctrl+D',
  FOCUS_DESCRIPTION: 'Ctrl+1',
  FOCUS_VALUE: 'Ctrl+2',
  FOCUS_DATE: 'Ctrl+3',
  ADD_PARTICIPANT: 'Ctrl+P',
  ADD_TAG: 'Ctrl+T'
}

// Valores padrão para produtividade
export const FORM_DEFAULTS = {
  PARCELAS_PADRAO: 1,
  LIMITE_PARTICIPANTES: 10,
  LIMITE_TAGS: 5,
  LIMITE_PARCELAS: 36,
  DATA_PADRAO: () => new Date().toISOString().split('T')[0], // Hoje
  VALOR_MINIMO: 0.01,
  VALOR_MAXIMO: 999999.99
}

// Templates comuns de transação
export const TRANSACAO_TEMPLATES = [
  {
    id: 'supermercado',
    nome: 'Supermercado',
    descricao: 'Compras do supermercado',
    categoria: 'Alimentação',
    icone: '🛒'
  },
  {
    id: 'restaurante',
    nome: 'Restaurante',
    descricao: 'Jantar no restaurante',
    categoria: 'Alimentação',
    icone: '🍽️'
  },
  {
    id: 'combustivel',
    nome: 'Combustível',
    descricao: 'Abastecimento do carro',
    categoria: 'Transporte',
    icone: '⛽'
  },
  {
    id: 'cinema',
    nome: 'Cinema',
    descricao: 'Ingresso de cinema',
    categoria: 'Lazer',
    icone: '🎬'
  }
]

// Sugestões automáticas para campos
export const AUTO_SUGGESTIONS = {
  LOCAIS_COMUNS: [
    'Supermercado Extra',
    'Restaurante',
    'Shopping Center',
    'Posto de Gasolina',
    'Farmácia',
    'Cinema',
    'Uber',
    'iFood',
    'Mercado Livre',
    'Amazon'
  ],
  DESCRICOES_COMUNS: [
    'Supermercado - compras da semana',
    'Jantar no restaurante',
    'Combustível do carro',
    'Cinema - ingresso',
    'Farmácia - medicamentos',
    'Uber - corrida',
    'iFood - delivery',
    'Compras online',
    'Conta de luz',
    'Conta de água'
  ]
}

// Configurações de UX
export const UX_CONFIG = {
  DEBOUNCE_SEARCH: 300, // ms
  AUTO_SAVE_DELAY: 1000, // ms
  TOAST_DURATION: 3000, // ms
  ANIMATION_DURATION: 200, // ms
  MAX_RECENT_ITEMS: 10
} 