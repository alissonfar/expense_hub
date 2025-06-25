// ============================================================================
// 🎯 TIPOS BÁSICOS DA APLICAÇÃO
// ============================================================================

// Tipos básicos
export type Status = 'ATIVO' | 'INATIVO' | 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO'
export type TipoTransacao = 'GASTO' | 'RECEITA'
export type StatusPagamento = 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'CANCELADO'
export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'TRANSFERENCIA' | 'BOLETO' | 'OUTROS'
export type Trend = 'up' | 'down' | 'neutral'
export type ColorVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'default'

// Pessoa
export interface Pessoa {
  id: number
  nome: string
  email: string
  telefone?: string | null
  cpf?: string | null
  eh_proprietario: boolean
  ativo: boolean
  data_cadastro: string
  atualizado_em: string
  divida?: number
  avatar?: string
  status?: Status
  estatisticas?: {
    total_transacoes: number
    total_devendo: number
    total_recebendo: number
    total_pago: number
    saldo_liquido: number
  }
}

// Tag
export interface Tag {
  id: number
  nome: string
  cor?: string
  icone?: string
  ativo: boolean
  criado_por: number
  criado_em: string
  atualizado_em: string
  uso_count?: number
}

// Transação
export interface Transacao {
  id: number
  tipo: TipoTransacao
  descricao: string
  local?: string
  valor_total?: number
  valor_recebido?: number
  data_transacao: string
  observacoes?: string
  eh_parcelado: boolean
  total_parcelas?: number
  numero_parcela?: number
  grupo_parcela?: string
  status_pagamento: StatusPagamento
  criado_por: number
  criado_em: string
  atualizado_em: string
  
  // Relacionamentos
  participantes?: TransacaoParticipante[]
  tags?: TransacaoTag[]
  pagamentos?: PagamentoTransacao[]
  pessoas?: Pessoa // Para joins específicos
}

// Pagamento
export interface Pagamento {
  id: string
  pessoa_id: number
  valor_pago: number
  data_pagamento: string
  forma_pagamento: FormaPagamento
  observacoes?: string
  tem_excedente: boolean
  valor_excedente?: number
  receita_excedente_id?: number
  criado_em: string
  atualizado_em: string
  
  // Relacionamentos
  pessoa: Pessoa
  transacoes_pagas: PagamentoTransacao[]
  receita_excedente?: Transacao
}

// Relacionamento pagamento-transação
export interface PagamentoTransacao {
  pagamento_id: string
  transacao_id: number
  valor_aplicado: number
  criado_em: string
  
  // Relacionamentos
  transacao: Transacao
}

// Métricas Dashboard
export interface Metrica {
  title: string
  value: string | number
  description?: string
  trend?: Trend
  trendValue?: string
  icon: string
  color: ColorVariant
}

// Dados para Gráficos
export interface ChartData {
  [key: string]: any
}

export interface GastosReceitasData {
  mes: string
  gastos: number
  receitas: number
}

export interface CategoriaData {
  categoria: string
  valor: number
  cor: string
}

// Dívida Pendente
export interface DividaPendente {
  pessoa: string
  pessoaId?: number
  valor: number
  transacoes: number
  ultimoPagamento: string
}

// Pagamento Recente
export interface PagamentoRecente {
  pessoa: string
  pessoaId?: number
  valor: number
  data: string
  metodo: string
}

// Navegação Sidebar
export interface SidebarItem {
  label: string
  icon: string
  href: string
  description?: string
  badge?: number
  active?: boolean
}

export interface SidebarGroup {
  grupo: string
  items: SidebarItem[]
}

// Filtros
export interface FilterOption {
  label: string
  value: string
}

export interface PeriodFilter {
  label: string
  value: string
  startDate?: Date
  endDate?: Date
}

// Formulários
export interface PessoaForm {
  nome: string
  email: string
  telefone?: string
  cpf?: string
  eh_proprietario: boolean
}

export interface TagForm {
  nome: string
  cor?: string
  icone?: string
}

export interface TransacaoForm {
  tipo: TipoTransacao
  descricao: string
  local?: string
  valor_total?: number
  valor_recebido?: number
  data_transacao: string
  observacoes?: string
  eh_parcelado: boolean
  total_parcelas?: number
  participantes: {
    pessoa_id: number
    valor_devido?: number
    valor_recebido?: number
  }[]
  tags?: number[]
}

export interface ParticipanteTransacao {
  pessoaId: number
  nome: string
  valor: number
}

export interface ParcelaTransacao {
  numero: number
  valor: number
  data: string
}

export interface PagamentoForm {
  pessoa_id?: number
  valor_pago: number
  data_pagamento: string
  forma_pagamento: FormaPagamento
  observacoes?: string
  transacoes?: {
    transacao_id: number
    valor_aplicado: number
  }[]
  processar_excedente?: boolean
  criar_receita_excedente?: boolean
}

// Componentes
export interface DataTableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  pagination?: boolean
  pageSize?: number
  filters?: FilterOption[]
  onFilterChange?: (filters: Record<string, any>) => void
  actions?: ActionButton<T>[]
  selection?: boolean
  onSelectionChange?: (selectedItems: T[]) => void
}

export interface ActionButton<T> {
  label: string
  icon?: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  onClick: (item: T) => void
  show?: (item: T) => boolean
}

// Modal/Dialog
export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface FormModalProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: (data: T) => void | Promise<void>
  defaultValues?: Partial<T>
  loading?: boolean
  children: React.ReactNode
}

// Charts
export interface ChartProps {
  data: ChartData[]
  type: 'line' | 'bar' | 'pie' | 'area'
  xKey: string
  yKey: string | string[]
  title?: string
  height?: number
  colors?: string[]
  responsive?: boolean
  simplified?: boolean
  showTooltip?: boolean
  showLegend?: boolean
}

// Stats Card
export interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  trend?: Trend
  trendValue?: string
  icon?: string
  color?: ColorVariant
  loading?: boolean
  onClick?: () => void
}

// Breadcrumbs
export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

// Theme
export type Theme = 'light' | 'dark' | 'system' | 'blue' | 'green' | 'purple' | 'orange'

export interface ThemeConfig {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Configurações de tema disponíveis
export interface TemaDisponivel {
  nome: string
  descricao: string
  icone: string
}

export interface ConfiguracaoInterface {
  theme_interface: Theme
  temas_disponíveis?: Record<Theme, TemaDisponivel>
}

// API Response
export interface ApiResponseSingle<T> {
  data: T
  message?: string
  success: boolean
  timestamp?: string
}

export interface ApiError {
  message: string
  code?: string
  field?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth - Interfaces movidas para lib/auth.tsx para evitar duplicação

// Hooks
export interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
  retry?: number
  retryDelay?: number
}

export interface UseFilterState<T> {
  filters: Record<string, any>
  filteredData: T[]
  setFilter: (key: string, value: any) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

// Loading States
export interface LoadingStateComplex {
  isLoading: boolean
  error: string | null
  data: any
}

// Form States
export interface FormStateComplex<T> {
  values: T
  errors: Record<keyof T, string>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

// Toast/Notification
export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Empty State
export interface EmptyStateProps {
  title: string
  description?: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: React.ReactNode
}

// Search
export interface SearchState {
  query: string
  results: any[]
  isSearching: boolean
  hasSearched: boolean
}

// Export/Import
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf'
  filename?: string
  fields?: string[]
  filters?: Record<string, any>
}

// Settings/Configuration
export interface AppConfig {
  theme: Theme
  language: string
  currency: string
  dateFormat: string
  notifications: boolean
  autoBackup: boolean
}

// Responsive
export interface Breakpoint {
  mobile: boolean
  tablet: boolean
  desktop: boolean
}

// Drag and Drop
export interface DragItem {
  id: string | number
  type: string
  data: any
}

export interface DropResult {
  draggedId: string | number
  targetId?: string | number
  position: 'before' | 'after' | 'inside'
}

// ============================================================================
// 💰 TRANSAÇÕES - TIPOS ATUALIZADOS PARA BACKEND
// ============================================================================

// Participante de transação (backend response)
export interface TransacaoParticipante {
  id: number
  transacao_id: number
  pessoa_id: number
  valor_devido?: number
  valor_recebido?: number
  valor_pago: number
  criado_em: string
  atualizado_em: string
  
  // Relacionamentos
  transacoes?: Transacao
  pessoas: Pessoa
}

// Tag de transação (backend response)
export interface TransacaoTag {
  transacao_id: number
  tag_id: number
  criado_em: string
  
  // Relacionamentos
  tag: Tag
}

// Parcela relacionada
export interface ParcelaRelacionada {
  id: number
  descricao: string
  valor_total: number
  data_transacao: string
  parcela_atual: number | null
  status_pagamento: string | null
}

// Estatísticas de transação
export interface EstatisticasTransacao {
  total_devido: number
  total_pago: number
  total_pendente: number
  percentual_pago: number
}

// Paginação
export interface Paginacao {
  page: number
  limit: number
  total: number
  pages: number
}

// Estatísticas da lista
export interface EstatisticasLista {
  total_transacoes: number
  valor_total: number
  valor_medio: number
}

// Response da API para lista
export interface TransacoesResponse {
  transacoes: Transacao[]
  paginacao: Paginacao
  estatisticas: EstatisticasLista
}

// ============================================================================
// 📝 FORMULÁRIOS - OTIMIZADOS PARA PRODUTIVIDADE
// ============================================================================

// Participante no formulário
export interface ParticipanteForm {
  pessoa_id: number
  nome: string // Para exibição
  valor_devido: number
  eh_proprietario?: boolean
}

// Formulário de gasto
export interface CreateGastoForm {
  descricao: string
  local?: string
  valor_total: number
  data_transacao: string
  observacoes?: string
  eh_parcelado: boolean
  total_parcelas: number
  participantes: ParticipanteForm[]
  tags: number[]
}

// Formulário de receita
export interface CreateReceitaForm {
  descricao: string
  local?: string // fonte da receita
  valor_recebido: number
  data_transacao: string
  observacoes?: string
  tags: number[]
}

// Formulário de edição
export interface UpdateTransacaoForm {
  descricao?: string
  local?: string
  observacoes?: string
  tags?: number[]
}

// ============================================================================
// 🔍 FILTROS E BUSCA
// ============================================================================

export interface TransacaoFiltros {
  tipo?: TipoTransacao
  status_pagamento?: StatusPagamento
  data_inicio?: string
  data_fim?: string
  pessoa_id?: number
  tag_id?: number
  eh_parcelado?: boolean
  grupo_parcela?: string
  page?: number
  limit?: number
}

// ============================================================================
// ⚡ PRODUTIVIDADE - TEMPLATES E PREFERÊNCIAS
// ============================================================================

// Template de transação para reutilização
export interface TransacaoTemplate {
  id: string
  nome: string
  descricao: string
  local?: string
  participantes_padrao: ParticipanteForm[]
  tags_padrao: number[]
  eh_parcelado: boolean
  total_parcelas: number
  criado_em: string
}

// Preferências do usuário para formulários
export interface PreferenciasFormulario {
  participantes_frequentes: ParticipanteForm[]
  tags_frequentes: number[]
  locais_frequentes: string[]
  descricoes_frequentes: string[]
  valor_padrao?: number
  parcelas_padrao: number
  auto_save: boolean
  atalhos_habilitados: boolean
}

// Ação rápida no formulário
export interface QuickAction {
  id: string
  label: string
  icon: string
  shortcut?: string
  action: () => void
}

// ============================================================================
// 📊 DASHBOARD E ESTATÍSTICAS
// ============================================================================

// Resumo para dashboard (já existente, mantendo compatibilidade)
export interface DashboardData {
  resumo: {
    total_gastos: number
    total_receitas: number
    saldo_periodo: number
    transacoes_pendentes: number
    pessoas_devedoras: number
  }
  comparativo: {
    gastos_variacao: number
    receitas_variacao: number
    transacoes_variacao: number
  }
  metricas: {
    gastos_por_categoria: Array<{
      categoria: string
      valor: number
      percentual: number
    }>
    evolucao_mensal: Array<{
      mes: string
      gastos: number
      receitas: number
    }>
  }
}

// ============================================================================
// 🔄 ESTADOS E LOADING
// ============================================================================

export interface LoadingState {
  loading: boolean
  error: string | null
  success?: boolean
}

export interface AsyncState<T> extends LoadingState {
  data: T | null
}

// ============================================================================
// INTERFACES DE API
// ============================================================================

// Resposta padrão da API
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
}

// Filtros para listagem
export interface PessoaFilters {
  ativo?: boolean
  proprietario?: boolean
  page?: number
  limit?: number
}

export interface TransacaoFilters {
  tipo?: TipoTransacao
  status_pagamento?: StatusPagamento
  data_inicio?: string
  data_fim?: string
  pessoa_id?: number
  tag_id?: number
  eh_parcelado?: boolean
  grupo_parcela?: string
  page?: number
  limit?: number
}

export interface PagamentoFilters {
  pessoa_id?: number
  transacao_id?: number
  data_inicio?: string
  data_fim?: string
  forma_pagamento?: FormaPagamento
  tem_excedente?: boolean
  valor_min?: number
  valor_max?: number
  page?: number
  limit?: number
}

// ============================================================================
// INTERFACES DE RELATÓRIOS
// ============================================================================

export interface RelatorioSaldos {
  pessoa: Pessoa
  total_devido: number
  total_pago: number
  saldo_pendente: number
  ultima_atividade: string
}

export interface RelatorioPendencias {
  transacao: Transacao
  pessoa: Pessoa
  valor_pendente: number
  dias_vencido: number
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA'
}

// ============================================================================
// INTERFACES DE CONTEXTO E ESTADO
// ============================================================================

// Auth
export interface User {
  id: number
  nome: string
  email: string
  telefone?: string
  eh_proprietario: boolean
  ativo: boolean
  avatar?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Configurações do sistema
export interface ConfiguracaoSistema {
  id: number
  chave: string
  valor: string
  criado_em: string
  atualizado_em: string
}

// ============================================================================
// INTERFACES DE UTILITÁRIOS
// ============================================================================

// Paginação
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
} 