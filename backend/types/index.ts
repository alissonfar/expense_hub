import { Prisma, PrismaClient, Role, DataAccessPolicy } from '@prisma/client';

// =============================================
// EXPORTAR TIPOS DO PRISMA
// =============================================
export { Role, DataAccessPolicy };

// =============================================
// EXTENSÕES DO EXPRESS
// =============================================

// Contexto de autenticação que será injetado em cada request
export interface AuthContext {
  pessoaId: number;
  hubId: number;
  role: Role;
  dataAccessPolicy: DataAccessPolicy | null; // Nulo se não for COLABORADOR
  ehAdministrador: boolean; // Superusuário do sistema
}

// Informações do hub atual para uso em controllers
export interface HubContext {
  id: number;
  nome: string;
  ativo: boolean;
}

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
      auth?: AuthContext; // Contexto de autenticação e autorização
      hub?: HubContext; // Informações do hub atual (adicionado pelo validateHubContext)
    }
  }
}

// =============================================
// TIPOS PARA AUTENTICAÇÃO E JWT
// =============================================

// Dados básicos de um usuário para geração de token (sem contexto de Hub)
export interface UserIdentifier {
  pessoaId: number;
  nome: string;
  email: string;
  ehAdministrador: boolean;
}

// Payload que será embarcado no JWT, representando o acesso a UM hub específico
export interface JWTPayload extends AuthContext {
  iat: number;
  exp: number;
}

// Resposta da API de login/registro
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    nome: string;
    email: string;
    ehAdministrador: boolean;
  };
  hubs: HubInfo[]; // Lista de hubs que o usuário pode acessar
}

export interface HubInfo {
  id: number;
  nome: string;
  role: Role;
}


// =============================================
// TIPOS DE DADOS DA APLICAÇÃO (MIGRADOS)
// =============================================

// Tipos para Pessoas
export interface PessoaCreate {
  nome: string;
  email?: string;
  telefone?: string;
  // eh_proprietario foi removido, agora é via MembroHub
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
  proprietario_id: number; // Mantido para rastreabilidade
  participantes: ParticipanteCreate[];
  tags?: number[];
  // hubId será injetado pelo sistema, não enviado pelo client
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
  // hubId será injetado pelo sistema
}

// Tipos para Tags
export interface TagCreate {
  nome: string;
  cor?: string;
  descricao?: string;
  // hubId será injetado pelo sistema
}

// =============================================
// TIPOS GENÉRICOS DE API E UTILITÁRIOS
// =============================================

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

export interface ValidationError {
  field: string;
  message: string;
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