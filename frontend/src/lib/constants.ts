export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const ROLES = {
  PROPRIETARIO: 'PROPRIETARIO',
  ADMINISTRADOR: 'ADMINISTRADOR',
  COLABORADOR: 'COLABORADOR',
  VISUALIZADOR: 'VISUALIZADOR'
} as const;

export const DATA_ACCESS_POLICIES = {
  GLOBAL: 'GLOBAL',
  INDIVIDUAL: 'INDIVIDUAL'
} as const;

export const TRANSACTION_TYPES = {
  GASTO: 'GASTO',
  RECEITA: 'RECEITA'
} as const;

export const PAYMENT_STATUS = {
  PENDENTE: 'PENDENTE',
  PAGO_PARCIAL: 'PAGO_PARCIAL',
  PAGO_TOTAL: 'PAGO_TOTAL'
} as const;

export const PAYMENT_METHODS = {
  PIX: 'PIX',
  DINHEIRO: 'DINHEIRO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO',
  OUTROS: 'OUTROS'
} as const;

export const INVITE_STATES = {
  CONVITE_INVALIDO: 'ConviteInvalido',
  CONVITE_INATIVO: 'ConviteInativo',
  CONVITE_EXPIRADO: 'ConviteExpirado',
  MEMBRO_JA_ATIVADO: 'MembroJaAtivado',
  CONVITE_ATIVO: 'ConviteAtivo'
} as const;

export const ERROR_CODES = {
  // Autenticação
  TOKEN_INVALIDO: 'TokenInvalido',
  TOKEN_NAO_FORNECIDO: 'TokenNaoFornecido',
  CREDENCIAIS_INVALIDAS: 'CredenciaisInvalidas',
  NAO_AUTENTICADO: 'NaoAutenticado',
  
  // Convites
  CONVITE_INVALIDO: 'ConviteInvalido',
  CONVITE_INATIVO: 'ConviteInativo',
  CONVITE_EXPIRADO: 'ConviteExpirado',
  MEMBRO_JA_ATIVADO: 'MembroJaAtivado',
  
  // Membros
  MEMBRO_JA_EXISTE: 'MembroJaExiste',
  MEMBRO_NAO_ENCONTRADO: 'MembroNaoEncontrado',
  ACAO_PROIBIDA: 'AcaoProibida',
  
  // Senhas
  SENHA_FRACA: 'SenhaFraca',
  SENHA_INVALIDA: 'SenhaInvalida',
  SENHA_NAO_DEFINIDA: 'SenhaNaoDefinida',
  
  // Conflitos
  EMAIL_EM_USO: 'EmailEmUso',
  TAG_JA_EXISTE: 'TagJaExiste',
  NOME_HUB_JA_EXISTE: 'NomeHubJaExiste',
  
  // Permissões
  ACESSO_NEGADO: 'AcessoNegado',
  ROLE_INSUFICIENTE: 'RoleInsuficiente',
  HUB_INATIVO: 'HubInativo'
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  EMAIL_INVALID: 'Email inválido',
  PHONE_INVALID: 'Telefone deve estar no formato (XX) XXXX-XXXX',
  PASSWORD_MIN_LENGTH: 'Senha deve ter pelo menos 8 caracteres',
  PASSWORD_REQUIREMENTS: 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
  CONFIRM_PASSWORD: 'Confirmação de senha não confere',
  MIN_VALUE: 'Valor deve ser maior que zero',
  MAX_LENGTH: 'Máximo de {max} caracteres',
  MIN_LENGTH: 'Mínimo de {min} caracteres'
} as const;

// Tipos exportados do arquivo types.ts para evitar duplicação 