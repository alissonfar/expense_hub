// Tipos base definidos localmente para evitar importação circular
export type Role = 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR';
export type TransactionType = 'GASTO' | 'RECEITA';
export const TipoTransacao = {
  GASTO: 'GASTO',
  RECEITA: 'RECEITA',
} as const;
export type PaymentStatus = 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL';
export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
export type InviteState = 'ConviteInvalido' | 'ConviteInativo' | 'ConviteExpirado' | 'MembroJaAtivado' | 'ConviteAtivo';

// Tipos base da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Modelos principais
export interface Hub {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  codigoAcesso?: string;
}

export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  ehAdministrador: boolean;
  ativo: boolean;
  data_cadastro: string;
  atualizado_em: string;
  conviteToken?: string;
}

export interface PessoaHub {
  hubId: number;
  pessoaId: number;
  role: Role;
  dataAccessPolicy?: 'GLOBAL' | 'INDIVIDUAL';
  ativo: boolean;
  joinedAt: string;
  pessoa?: Pessoa;
  hub?: Hub;
  conviteToken?: string;
}

export interface Transacao {
  id: number;
  tipo: TransactionType;
  descricao: string;
  local?: string;
  valor_total: number;
  data_transacao: string;
  data_vencimento?: string; // ✅ NOVO: Data de vencimento (opcional)
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Forma de pagamento (opcional)
  eh_parcelado: boolean;
  parcela_atual?: number;
  total_parcelas?: number;
  valor_parcela?: number;
  grupo_parcela?: string;
  observacoes?: string;
  status_pagamento?: PaymentStatus;
  proprietario_id?: number;
  criado_por?: number;
  hubId?: number;
  criado_em: string;
  atualizado_em: string;
  proprietario?: Pessoa;
  criador?: Pessoa;
  tags?: Tag[];
  participantes?: TransacaoParticipante[];
  pagamentos?: Pagamento[];
}

export interface TransacaoParticipante {
  id: number;
  transacao_id: number;
  pessoa_id: number;
  valor_devido: number;
  valor_pago: number;
  quitado: boolean;
  pessoa?: Pessoa;
  transacao?: Transacao;
}

export interface Tag {
  id: number;
  nome: string;
  cor: string;
  icone?: string;
  ativo: boolean;
  criado_por: number;
  criado_em: string;
  hubId: number;
  criador?: Pessoa;
}

export interface Pagamento {
  id: number;
  pessoa_id: number;
  valor_total: number;
  valor_excedente?: number;
  data_pagamento: string;
  forma_pagamento: PaymentMethod;
  observacoes?: string;
  processar_excedente: boolean;
  registrado_por: number;
  hubId: number;
  criado_em: string;
  pessoa?: Pessoa;
  registrador?: Pessoa;
  transacoes?: Transacao[];
  receita_excedente?: { id: number; descricao: string; valor_total: number };
}

export interface Convite {
  id: number;
  email: string;
  role: Role;
  dataAccessPolicy?: 'GLOBAL' | 'INDIVIDUAL';
  token: string;
  expiresAt: string;
  ativo: boolean;
  convidado_por: number;
  hubId: number;
  criado_em: string;
  convidador?: Pessoa;
  hub?: Hub;
}

// Tipos para autenticação (espelhando o backend)
export interface UserIdentifier {
  pessoaId: number;
  nome: string;
  email: string;
  ehAdministrador: boolean;
  telefone?: string;
  data_cadastro?: string;
}

export interface HubInfo {
  id: number;
  nome: string;
  role: Role;
}

export interface LoginResponse {
  user: UserIdentifier;
  hubs: HubInfo[];
  refreshToken: string;
}

export interface SelectHubResponse {
  accessToken: string;
  hubContext: {
    id: number;
    nome: string;
    role: Role;
    dataAccessPolicy: string | null;
    ehAdministrador: boolean;
  };
}

// Tipos para formulários
export interface RegisterFormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone?: string;
  nomeHub: string;
}

export interface LoginFormData {
  email: string;
  senha: string;
}

export interface SelectHubFormData {
  hubId: number;
}

export interface ActivateInviteFormData {
  token: string;
  nome: string;
  senha: string;
  confirmarSenha: string;
  telefone?: string;
}

export interface CreateTransacaoFormData {
  tipo: TransactionType;
  descricao: string;
  local?: string;
  valor_total: number;
  data_transacao: string;
  data_vencimento?: string; // ✅ NOVO: Apenas para gastos
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Para gastos e receitas
  eh_parcelado: boolean;
  total_parcelas: number;
  observacoes?: string;
  proprietario_id: number;
  tags?: number[];
  participantes?: {
    pessoa_id: number;
    valor_devido: number; // ✅ Correto: backend espera valor_devido
  }[];
}

export interface CreateTagFormData {
  nome: string;
  cor: string;
  icone?: string;
}

// Tipo auxiliar para transações em pagamento composto
export interface CreatePagamentoTransacao {
  transacao_id: number;
  valor_aplicado: number;
}

// Ajuste: CreatePagamentoFormData aceita array de transações (pagamento composto)
export interface CreatePagamentoFormData {
  pessoa_id: number;
  valor_total: number;
  data_pagamento: string;
  forma_pagamento: PaymentMethod;
  observacoes?: string;
  processar_excedente: boolean;
  transacoes: CreatePagamentoTransacao[];
}

export interface InviteMemberFormData {
  email: string;
  role: Role;
  dataAccessPolicy?: 'GLOBAL' | 'INDIVIDUAL';
}

// Tipos para relatórios
export interface DashboardData {
  resumo: {
    total_gastos: number;
    total_receitas: number;
    saldo_periodo: number;
    transacoes_pendentes: number;
    pessoas_devedoras: number;
    transacoes_vencidas: number; // ✅ NOVO: Contador de vencidas
    valor_vencido: number; // ✅ NOVO: Valor total vencido
    proximos_vencimentos: number; // ✅ NOVO: Contador próximos
  };
  comparativo?: {
    gastos_variacao: number;
    receitas_variacao: number;
    transacoes_variacao: number;
    transacoes_vencidas_variacao?: number; // ✅ NOVO: Variação vencidas
    valor_vencido_variacao?: number; // ✅ NOVO: Variação valor vencido
  };
  graficos?: {
    gastos_por_dia: Array<{
      data: string;
      valor: number;
    }>;
    gastos_por_categoria: Array<{
      categoria: string;
      valor: number;
      cor: string;
    }>;
    gastos_por_forma_pagamento?: Array<{ // ✅ NOVO
      forma: PaymentMethod;
      valor: number;
      cor: string;
    }>;
    vencimentos_por_periodo?: Array<{ // ✅ NOVO
      periodo: string;
      vencidas: number;
      vencendo: number;
    }>;
    status_pagamentos: {
      pendente: number;
      pago_parcial: number;
      pago_total: number;
    };
  };
  periodo: {
    tipo: string;
    data_inicio: string;
    data_fim: string;
  };
}

export interface DashboardQueryParams {
  periodo?: '7_dias' | '30_dias' | '90_dias' | '1_ano' | 'personalizado';
  data_inicio?: string;
  data_fim?: string;
  incluir_graficos?: boolean;
  incluir_comparativo?: boolean;
  incluir_vencimentos?: boolean; // ✅ NOVO
  incluir_forma_pagamento?: boolean; // ✅ NOVO
  apenas_confirmadas?: boolean;
}

export interface SaldoReport {
  pessoa_id: number;
  pessoa_nome: string;
  total_gastos: number;
  total_receitas: number;
  total_pagamentos: number;
  saldo_final: number;
  valor_pendente: number;
  valor_excedente: number;
}

export interface PendenciaReport {
  pessoa_id: number;
  pessoa_nome: string;
  total_pendente: number;
  transacoes_vencidas: number;
  transacoes_vencendo: number;
  proximos_vencimentos: {
    transacao_id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
  }[];
}

export interface HistoricoSaldo {
  data: string;
  valor: number;
  tipo: 'GASTO' | 'RECEITA' | 'PAGAMENTO';
  descricao: string;
}

// Tipos para configurações
export interface ConfiguracaoInterface {
  tema: 'light' | 'dark' | 'system';
  idioma: string;
  moeda: string;
  formato_data: string;
  formato_hora: string;
  notificacoes_email: boolean;
  notificacoes_push: boolean;
}

export interface ConfiguracaoExcedente {
  processar_automaticamente: boolean;
  valor_minimo: number;
  distribuir_igualmente: boolean;
  priorizar_mais_antigo: boolean;
}

// Tipos para filtros
export interface TransacaoFilters {
  tipo?: TransactionType;
  pessoa_id?: number;
  tag_id?: number;
  data_inicio?: string;
  data_fim?: string;
  data_vencimento_inicio?: string; // ✅ NOVO: Filtro por vencimento
  data_vencimento_fim?: string; // ✅ NOVO: Filtro por vencimento
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Filtro por forma
  vencimento_status?: 'VENCIDA' | 'VENCE_HOJE' | 'VENCE_SEMANA' | 'VENCE_MES' | 'NAO_VENCE'; // ✅ NOVO
  status_pagamento?: PaymentStatus;
  valor_min?: number;
  valor_max?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PagamentoFilters {
  pessoa_id?: number;
  forma_pagamento?: PaymentMethod;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  tem_excedente?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Tipos para validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Tipos para estados da aplicação
export interface AuthState {
  user: UserIdentifier | null;
  currentHub: Hub | null;
  hubs: HubInfo[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}

export interface AppState {
  auth: AuthState;
  isLoading: boolean;
  error: string | null;
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  };
} 