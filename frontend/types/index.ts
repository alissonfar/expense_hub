// Tipos básicos da aplicação (serão expandidos na Fase 2 e 3)

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  eh_proprietario: boolean;
  ativo: boolean;
  data_cadastro: string;
}

export interface Tag {
  id: number;
  nome: string;
  cor: string;
  icone?: string;
  ativo: boolean;
}

export interface Transacao {
  id: number;
  tipo: 'GASTO' | 'RECEITA';
  descricao: string;
  valor_total: number;
  data_transacao: string;
  status_pagamento: 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL';
  eh_parcelado: boolean;
  proprietario: User;
}

export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

// Tipos utilitários
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} 