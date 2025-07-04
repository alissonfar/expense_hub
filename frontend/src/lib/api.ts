import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, ERROR_CODES } from './constants';
import type { ApiResponse } from './types';

// Configuração base do cliente HTTP
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para adicionar token de autenticação
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor para tratamento de respostas
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: unknown) => {
      // Type guard para originalRequest
      let originalRequest: Record<string, unknown> | undefined = undefined;
      if (
        typeof error === 'object' &&
        error !== null &&
        'config' in error &&
        typeof (error as { config?: unknown }).config === 'object'
      ) {
        originalRequest = (error as { config: Record<string, unknown> }).config;
      }

      // Tratamento de token expirado
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401 &&
        originalRequest && !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            );

            // Type guard para response.data
            let accessToken = '';
            if (
              response &&
              typeof response === 'object' &&
              'data' in response &&
              response.data &&
              typeof response.data === 'object' &&
              'data' in response.data &&
              (response.data as { data?: { accessToken?: string } }).data?.accessToken
            ) {
              accessToken = (response.data as { data: { accessToken: string } }).data.accessToken;
            }
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken);
              if (originalRequest.headers && typeof originalRequest.headers === 'object') {
                (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
              }
              return client(originalRequest as AxiosRequestConfig);
            }
          }
        } catch {
          // Refresh token também expirou, redirecionar para login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('currentHub');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Instância do cliente HTTP
const api = createApiClient();

// Utilitários para requisições
export const apiRequest = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config).then((response) => response.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then((response) => response.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then((response) => response.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.delete(url, config).then((response) => response.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.patch(url, data, config).then((response) => response.data),
};

// Funções específicas da API - Autenticação
export const authApi = {
  register: (data: unknown) => apiRequest.post('/auth/register', data),
  login: (data: unknown) => apiRequest.post('/auth/login', data),
  selectHub: (data: unknown) => apiRequest.post('/auth/select-hub', data),
  activateInvite: (data: unknown) => apiRequest.post('/auth/ativar-convite', data),
  resendInvite: (data: unknown) => apiRequest.post('/auth/reenviar-convite', data),
  getProfile: () => apiRequest.get('/auth/me'),
  updateProfile: (data: unknown) => apiRequest.put('/auth/profile', data),
  changePassword: (data: unknown) => apiRequest.put('/auth/change-password', data),
  logout: () => apiRequest.post('/auth/logout'),
};

// Funções específicas da API - Pessoas
export const pessoasApi = {
  list: (params?: Record<string, unknown>) => apiRequest.get('/pessoas', { params }),
  create: (data: unknown) => apiRequest.post('/pessoas', data),
  get: (id: number) => apiRequest.get(`/pessoas/${id}`),
  update: (id: number, data: unknown) => apiRequest.put(`/pessoas/${id}`, data),
  delete: (id: number) => apiRequest.delete(`/pessoas/${id}`),
};

// Funções específicas da API - Tags
export const tagsApi = {
  list: (params?: Record<string, unknown>) => apiRequest.get('/tags', { params }),
  create: (data: unknown) => apiRequest.post('/tags', data),
  get: (id: number) => apiRequest.get(`/tags/${id}`),
  update: (id: number, data: unknown) => apiRequest.put(`/tags/${id}`, data),
  delete: (id: number) => apiRequest.delete(`/tags/${id}`),
};

// Funções específicas da API - Transações
export const transacoesApi = {
  list: (params?: Record<string, unknown>) => apiRequest.get('/transacoes', { params }),
  create: (data: unknown) => apiRequest.post('/transacoes', data),
  createReceita: (data: unknown) => apiRequest.post('/transacoes/receita', data),
  get: (id: number) => apiRequest.get(`/transacoes/${id}`),
  update: (id: number, data: unknown) => apiRequest.put(`/transacoes/${id}`, data),
  updateReceita: (id: number, data: unknown) => apiRequest.put(`/transacoes/receita/${id}`, data),
  delete: (id: number) => apiRequest.delete(`/transacoes/${id}`),
};

// Funções específicas da API - Pagamentos
export const pagamentosApi = {
  list: (params?: Record<string, unknown>) => apiRequest.get('/pagamentos', { params }),
  create: (data: unknown) => apiRequest.post('/pagamentos', data),
  get: (id: number) => apiRequest.get(`/pagamentos/${id}`),
  update: (id: number, data: unknown) => apiRequest.put(`/pagamentos/${id}`, data),
  delete: (id: number) => apiRequest.delete(`/pagamentos/${id}`),
  getExcedenteConfig: () => apiRequest.get('/pagamentos/configuracoes/excedente'),
  updateExcedenteConfig: (data: unknown) => apiRequest.put('/pagamentos/configuracoes/excedente', data),
};

// Funções específicas da API - Relatórios
export const relatoriosApi = {
  dashboard: (params?: Record<string, unknown>) => apiRequest.get('/relatorios/dashboard', { params }),
  saldos: (params?: Record<string, unknown>) => apiRequest.get('/relatorios/saldos', { params }),
  pendencias: (params?: Record<string, unknown>) => apiRequest.get('/relatorios/pendencias', { params }),
  transacoes: (params?: Record<string, unknown>) => apiRequest.get('/relatorios/transacoes', { params }),
  categorias: (params?: Record<string, unknown>) => apiRequest.get('/relatorios/categorias', { params }),
  saldoHistorico: (pessoaId: number, params?: Record<string, unknown>) => 
    apiRequest.get(`/relatorios/saldo-historico/${pessoaId}`, { params }),
};

// Funções específicas da API - Configurações
export const configuracoesApi = {
  getInterface: () => apiRequest.get('/configuracoes/interface'),
  updateInterface: (data: unknown) => apiRequest.put('/configuracoes/interface', data),
  getComportamento: () => apiRequest.get('/configuracoes/comportamento'),
  getAlertas: () => apiRequest.get('/configuracoes/alertas'),
  getRelatorios: () => apiRequest.get('/configuracoes/relatorios'),
};

// Utilitários para tratamento de erros
export const handleApiError = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error
  ) {
    const { error: errorCode, message } = (error as { response: { data: { error: string; message?: string } } }).response.data;
    
    // Mapear códigos de erro para mensagens amigáveis
    const errorMessages: Record<string, string> = {
      [ERROR_CODES.TOKEN_INVALIDO]: 'Token inválido. Faça login novamente.',
      [ERROR_CODES.TOKEN_NAO_FORNECIDO]: 'Token não fornecido. Faça login novamente.',
      [ERROR_CODES.CREDENCIAIS_INVALIDAS]: 'Email ou senha incorretos.',
      [ERROR_CODES.NAO_AUTENTICADO]: 'Você precisa estar logado para acessar esta funcionalidade.',
      [ERROR_CODES.CONVITE_INVALIDO]: 'Convite inválido ou não encontrado.',
      [ERROR_CODES.CONVITE_INATIVO]: 'Este convite já foi usado ou está inativo.',
      [ERROR_CODES.CONVITE_EXPIRADO]: 'Este convite expirou.',
      [ERROR_CODES.MEMBRO_JA_ATIVADO]: 'Este membro já está ativo.',
      [ERROR_CODES.MEMBRO_JA_EXISTE]: 'Este email já é membro do Hub.',
      [ERROR_CODES.MEMBRO_NAO_ENCONTRADO]: 'Membro não encontrado.',
      [ERROR_CODES.ACAO_PROIBIDA]: 'Você não tem permissão para realizar esta ação.',
      [ERROR_CODES.SENHA_FRACA]: 'Senha não atende aos requisitos de segurança.',
      [ERROR_CODES.SENHA_INVALIDA]: 'Senha atual incorreta.',
      [ERROR_CODES.SENHA_NAO_DEFINIDA]: 'Senha não foi definida.',
      [ERROR_CODES.EMAIL_EM_USO]: 'Este email já está em uso.',
      [ERROR_CODES.TAG_JA_EXISTE]: 'Já existe uma tag com este nome.',
      [ERROR_CODES.NOME_HUB_JA_EXISTE]: 'Já existe um Hub com este nome.',
      [ERROR_CODES.ACESSO_NEGADO]: 'Acesso negado.',
      [ERROR_CODES.ROLE_INSUFICIENTE]: 'Você não tem permissão suficiente.',
      [ERROR_CODES.HUB_INATIVO]: 'Hub inativo.',
    };

    return errorMessages[errorCode] || message || 'Erro interno do servidor.';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'NETWORK_ERROR'
  ) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'TIMEOUT'
  ) {
    return 'Timeout na requisição. Tente novamente.';
  }

  return 'Erro desconhecido. Tente novamente.';
};

// Utilitários para cache local
export const cacheUtils = {
  set: (key: string, data: unknown, expirationMinutes: number = 5) => {
    const item = {
      data,
      timestamp: Date.now(),
      expiration: expirationMinutes * 60 * 1000, // convertir para ms
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },

  get: (key: string): unknown => {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;

    try {
      const parsedItem = JSON.parse(item);
      const now = Date.now();
      
      if (now - parsedItem.timestamp > parsedItem.expiration) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsedItem.data;
    } catch {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
  },

  clear: (key?: string) => {
    if (key) {
      localStorage.removeItem(`cache_${key}`);
    } else {
      // Limpar todos os itens de cache
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  },

  invalidate: (pattern: string) => {
    const keys = Object.keys(localStorage).filter(k => 
      k.startsWith('cache_') && k.includes(pattern)
    );
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// Função para fazer requisições com cache
export const apiWithCache = {
  get: async <T>(url: string, cacheKey: string, expirationMinutes: number = 5): Promise<T> => {
    // Verificar cache primeiro
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return cachedData as T;
    }

    // Fazer requisição se não houver cache
    const response = await apiRequest.get<T>(url);
    
    // Salvar no cache
    if (response.success && response.data) {
      cacheUtils.set(cacheKey, response.data, expirationMinutes);
    }

    return response.data as T;
  },
};

export { api };
export default api; 