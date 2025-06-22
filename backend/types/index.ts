import { PrismaClient } from '@prisma/client';

// =============================================
// EXTENSÕES DO EXPRESS
// =============================================

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}

// =============================================
// TIPOS DE DADOS DA APLICAÇÃO
// =============================================

// Tipos para Pessoas
export interface PessoaCreate {
  nome: string;
  email?: string;
  telefone?: string;
  eh_proprietario?: boolean;
}

export interface PessoaUpdate {
  nome?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}

// Tipos para Transações
export interface TransacaoCreate {
  descricao: string;
  valor_total: number;
  tipo: 'GASTO' | 'RECEITA';
  data_transacao?: Date;
  observacoes?: string;
  repetir_mensalmente?: boolean;
  numero_parcelas?: number;
  valor_parcela?: number;
  proprietario_id: number;
  participantes: ParticipanteCreate[];
  tags?: number[];
}

export interface ParticipanteCreate {
  pessoa_id: number;
  valor_responsavel: number;
  eh_pagador?: boolean;
}

// Tipos para Pagamentos
export interface PagamentoCreate {
  transacao_id: number;
  pessoa_id: number;
  valor_pago: number;
  data_pagamento?: Date;
  metodo_pagamento?: string;
  observacoes?: string;
}

// Tipos para Tags
export interface TagCreate {
  nome: string;
  cor?: string;
  descricao?: string;
}

// Tipos para Respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para Filtros e Queries
export interface TransacaoFilters {
  tipo?: 'GASTO' | 'RECEITA';
  data_inicio?: string;
  data_fim?: string;
  pessoa_id?: number;
  tag_ids?: number[];
  status?: 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL';
  valor_min?: number;
  valor_max?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Tipos para relatórios
export interface SaldoPessoa {
  pessoa_id: number;
  pessoa_nome: string;
  total_deve: number;
  total_pago: number;
  saldo_final: number;
  status: 'DEVEDOR' | 'CREDOR' | 'QUITADO';
}

export interface ResumoTransacao {
  id: number;
  descricao: string;
  valor_total: number;
  tipo: 'GASTO' | 'RECEITA';
  data_transacao: Date;
  status: 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL';
  proprietario_nome: string;
  participantes_count: number;
  tags: string[];
}

// =============================================
// TIPOS PARA AUTENTICAÇÃO (PRÓXIMA FASE)
// =============================================

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  eh_proprietario: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  telefone?: string;
}

export interface JWTPayload {
  user_id: number;
  email: string;
  eh_proprietario: boolean;
  iat: number;
  exp: number;
}

// =============================================
// TIPOS DE CONFIGURAÇÃO E VALIDAÇÃO
// =============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthPayload {
  userId: number;
  email: string;
  eh_proprietario: boolean;
}

export interface DatabaseConfig {
  url: string;
  shadowUrl?: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  frontendUrl: string;
}

// =============================================
// TIPOS PARA REQUESTS E RESPONSES
// =============================================

export interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    eh_proprietario: boolean;
  };
}

export interface CreatePessoaRequest {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
}

export interface CreateTransacaoRequest {
  tipo: 'GASTO' | 'RECEITA';
  descricao: string;
  local?: string;
  valor_total: number;
  data_transacao: string;
  eh_parcelado?: boolean;
  total_parcelas?: number;
  observacoes?: string;
  participantes?: {
    pessoa_id: number;
    valor_devido?: number;
    valor_recebido?: number;
  }[];
  tags?: number[];
}

export interface CreatePagamentoRequest {
  transacao_id: number;
  pessoa_id: number;
  valor_pago: number;
  data_pagamento: string;
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
  observacoes?: string;
}

// =============================================
// CLASSES DE ERRO PERSONALIZADAS
// =============================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Manter o prototype chain correto
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
} 