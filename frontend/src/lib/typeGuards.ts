// Type Guards para validação de tipos de API
import type { Transacao, Pessoa, Tag, Hub } from '@/lib/types';

// Type Guards
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTransacao(obj: any): obj is Transacao {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.descricao === 'string' &&
    (obj.local === undefined || obj.local === null || typeof obj.local === 'string') &&
    (typeof obj.valor_total === 'number' || typeof obj.valor_total === 'string') &&
    (obj.valor_recebido === undefined || typeof obj.valor_recebido === 'number' || typeof obj.valor_recebido === 'string') &&
    typeof obj.data_transacao === 'string' &&
    typeof obj.eh_parcelado === 'boolean' &&
    typeof obj.ativo === 'boolean' &&
    (obj.total_parcelas === undefined || typeof obj.total_parcelas === 'number') &&
    (obj.observacoes === undefined || obj.observacoes === null || typeof obj.observacoes === 'string') &&
    (obj.tipo === 'GASTO' || obj.tipo === 'RECEITA') &&
    (obj.hub_id === undefined || typeof obj.hub_id === 'number' || typeof obj.hub_id === 'string') &&
    typeof obj.proprietario_id === 'number' &&
    typeof obj.data_criacao === 'string' &&
    (obj.data_atualizacao === undefined || typeof obj.data_atualizacao === 'string')
  );
}

// Type guard para resposta de transações parceladas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTransacaoParcelada(obj: any): obj is {
  transacoes: Transacao[];
  grupo_parcela: string | null;
  total_parcelas: number;
} {
  return (
    obj &&
    Array.isArray(obj.transacoes) &&
    obj.transacoes.length > 0 &&
    obj.transacoes.every(isTransacao) &&
    (obj.grupo_parcela === null || typeof obj.grupo_parcela === 'string') &&
    typeof obj.total_parcelas === 'number'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTransacaoArray(obj: any): obj is Transacao[] {
  return Array.isArray(obj) && obj.every(isTransacao);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPessoa(obj: any): obj is Pessoa {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.nome === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.hub_id === 'string' &&
    typeof obj.criado_em === 'string' &&
    typeof obj.atualizado_em === 'string'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPessoaArray(obj: any): obj is Pessoa[] {
  return Array.isArray(obj) && obj.every(isPessoa);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTag(obj: any): obj is Tag {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.nome === 'string' &&
    typeof obj.cor === 'string' &&
    typeof obj.hub_id === 'string' &&
    typeof obj.criado_em === 'string' &&
    typeof obj.atualizado_em === 'string'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTagArray(obj: any): obj is Tag[] {
  return Array.isArray(obj) && obj.every(isTag);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHub(obj: any): obj is Hub {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.nome === 'string' &&
    (obj.descricao === undefined || typeof obj.descricao === 'string') &&
    typeof obj.criado_por === 'string' &&
    typeof obj.criado_em === 'string' &&
    typeof obj.atualizado_em === 'string'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHubArray(obj: any): obj is Hub[] {
  return Array.isArray(obj) && obj.every(isHub);
}

// API Response Type Guards
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isApiResponse<T>(obj: any, dataValidator?: (data: any) => data is T): obj is ApiResponse<T> {
  const isValidResponse = obj && typeof obj.success === 'boolean';
  
  if (!isValidResponse) return false;
  
  if (obj.success && obj.data !== undefined) {
    return dataValidator ? dataValidator(obj.data) : true;
  }
  
  if (!obj.success && obj.error !== undefined) {
    return typeof obj.error === 'string';
  }
  
  return true;
}

// Error Type Guards
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isApiError(obj: any): obj is { error: string; message?: string } {
  return obj && typeof obj.error === 'string';
}

// Validation Helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateRequired(value: any, fieldName: string): boolean {
  if (value === null || value === undefined || value === '') {
    console.error(`Campo obrigatório não preenchido: ${fieldName}`);
    return false;
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateNumber(value: any, fieldName: string, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    console.error(`Campo ${fieldName} deve ser um número válido`);
    return false;
  }
  
  if (min !== undefined && value < min) {
    console.error(`Campo ${fieldName} deve ser maior ou igual a ${min}`);
    return false;
  }
  
  if (max !== undefined && value > max) {
    console.error(`Campo ${fieldName} deve ser menor ou igual a ${max}`);
    return false;
  }
  
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateString(value: any, fieldName: string, minLength?: number, maxLength?: number): boolean {
  if (typeof value !== 'string') {
    console.error(`Campo ${fieldName} deve ser uma string`);
    return false;
  }
  
  if (minLength !== undefined && value.length < minLength) {
    console.error(`Campo ${fieldName} deve ter pelo menos ${minLength} caracteres`);
    return false;
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    console.error(`Campo ${fieldName} deve ter no máximo ${maxLength} caracteres`);
    return false;
  }
  
  return true;
}