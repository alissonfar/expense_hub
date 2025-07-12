'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { hubsApi } from '@/lib/api';
import { UserIdentifier, Hub, HubInfo, LoginResponse, SelectHubResponse } from '@/lib/types';

interface AuthContextData {
  // Estado de autenticação
  isAuthenticated: boolean;
  isLoading: boolean;
  usuario: UserIdentifier | null;
  hubAtual: Hub | null;
  hubsDisponiveis: HubInfo[];
  roleAtual: string | null; // Role do usuário no hub atual
  
  // Tokens
  accessToken: string | null;
  refreshToken: string | null;
  
  // Métodos de autenticação
  login: (email: string, senha: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  selectHub: (hubId: number) => Promise<SelectHubResponse>;
  refreshAccessToken: () => Promise<string>;
  
  // Métodos de registro
  register: (data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
  }) => Promise<void>;
  
  // Métodos de convite
  ativarConvite: (token: string, senha: string) => Promise<void>;
  
  // Métodos de perfil
  atualizarPerfil: (data: Partial<UserIdentifier>) => Promise<UserIdentifier>;
  alterarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>;
  createHub: (nome: string) => Promise<Hub>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Estados principais
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState<UserIdentifier | null>(null);
  const [hubAtual, setHubAtual] = useState<Hub | null>(null);
  const [hubsDisponiveis, setHubsDisponiveis] = useState<HubInfo[]>([]);
  const [roleAtual, setRoleAtual] = useState<string | null>(null);
  
  // Tokens
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Chaves para localStorage
  const STORAGE_KEYS = useMemo(() => ({
    ACCESS_TOKEN: '@PersonalExpenseHub:accessToken',
    REFRESH_TOKEN: '@PersonalExpenseHub:refreshToken',
    USUARIO: '@PersonalExpenseHub:usuario',
    HUB_ATUAL: '@PersonalExpenseHub:hubAtual',
    HUBS_DISPONIVEIS: '@PersonalExpenseHub:hubsDisponiveis'
  }), []);

  // Salvar dados no localStorage
  const saveToStorage = useCallback((key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[AuthContext][saveToStorage] Erro ao salvar no localStorage:', key, error);
    }
  }, []);

  // Ler dados do localStorage
  const loadFromStorage = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('[AuthContext][loadFromStorage] Erro ao ler do localStorage:', key, error);
      return null;
    }
  };

  // Limpar dados do localStorage
  const clearStorage = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, [STORAGE_KEYS]);

  // Atualizar tokens
  const updateTokens = useCallback((newAccessToken: string, newRefreshToken?: string) => {
    setAccessToken(newAccessToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }
    // Salvar no localStorage
    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    // Configurar header Authorization global
    api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
  }, []);

  // Função de login (1ª etapa)
  const login = async (email: string, senha: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const data = response.data.data as LoginResponse;
      setUsuario(data.user);
      setHubsDisponiveis(data.hubs);
      updateTokens('', data.refreshToken); // accessToken só será obtido após selectHub
      localStorage.setItem('refreshToken', data.refreshToken); // compatibilidade
      // Sincronizar com cookies imediatamente
      document.cookie = `@PersonalExpenseHub:refreshToken=${data.refreshToken}; path=/; max-age=2592000; SameSite=Strict`;
      document.cookie = `@PersonalExpenseHub:usuario=${JSON.stringify(data.user)}; path=/; max-age=2592000; SameSite=Strict`;
      return data;
    } catch (error) {
      console.error('[AuthContext][login] Erro:', error);
      throw error;
    }
  };

  // Função de seleção de hub (2ª etapa)
  const selectHub = async (hubId: number): Promise<SelectHubResponse> => {
    try {
      // Priorizar accessToken para seleção de hub
      const tokenToUse = accessToken || refreshToken || localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
      if (!tokenToUse) {
        throw new Error('Token de autenticação não encontrado');
      }
      const response = await api.post('/auth/select-hub', 
        { hubId },
        {
          headers: {
            Authorization: `Bearer ${tokenToUse}`
          }
        }
      );
      const data = response.data.data as SelectHubResponse;
      updateTokens(data.accessToken);
      const hubCompleto: Hub = {
        id: data.hubContext.id,
        nome: data.hubContext.nome,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setHubAtual(hubCompleto);
      setRoleAtual(data.hubContext.role);
      saveToStorage(STORAGE_KEYS.HUB_ATUAL, hubCompleto);
      saveToStorage('@PersonalExpenseHub:roleAtual', data.hubContext.role);
      document.cookie = `@PersonalExpenseHub:accessToken=${data.accessToken}; path=/; max-age=3600; SameSite=Strict`;
      document.cookie = `@PersonalExpenseHub:hubAtual=${JSON.stringify(hubCompleto)}; path=/; max-age=2592000; SameSite=Strict`;
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('[AuthContext][selectHub] Erro:', error, {
        accessToken: accessToken || localStorage.getItem('accessToken'),
        refreshToken: refreshToken || localStorage.getItem('refreshToken'),
        localStorage: localStorage.getItem('refreshToken'),
        cookie: document.cookie
      });
      throw error;
    }
  };

  // Função de logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (accessToken) {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('[AuthContext][logout] Erro ao fazer logout:', error);
    } finally {
      setIsAuthenticated(false);
      setUsuario(null);
      setHubAtual(null);
      setHubsDisponiveis([]);
      setRoleAtual(null);
      setAccessToken(null);
      setRefreshToken(null);
      clearStorage();
      document.cookie = '@PersonalExpenseHub:accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '@PersonalExpenseHub:refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '@PersonalExpenseHub:usuario=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '@PersonalExpenseHub:hubAtual=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      delete api.defaults.headers.Authorization;
      // Remover interceptor definitivamente
      if (responseInterceptorId.current !== null) {
        api.interceptors.response.eject(responseInterceptorId.current);
        responseInterceptorId.current = null;
      }
    }
  }, [accessToken, clearStorage, refreshToken]);

  // Função de refresh token
  const refreshAccessToken = useCallback(async (): Promise<string> => {
    try {
      if (!refreshToken) {
        throw new Error('Token de refresh não encontrado');
      }
      const response = await api.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
      updateTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch (error) {
      console.error('[AuthContext][refreshAccessToken] Erro:', error, {
        refreshToken,
        localStorage: localStorage.getItem('refreshToken'),
        cookie: document.cookie
      });
      await logout();
      throw error;
    }
  }, [refreshToken, logout, updateTokens]);

  // Função de registro
  const register = async (data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
  }): Promise<void> => {
    try {
      await api.post('/auth/register', data);
    } catch (error) {
      throw error;
    }
  };

  // Função de ativação de convite
  const ativarConvite = async (token: string, senha: string): Promise<void> => {
    try {
      await api.post('/auth/ativar-convite', { token, senha });
    } catch (error) {
      throw error;
    }
  };

  // Função de atualização de perfil
  const atualizarPerfil = async (data: Partial<UserIdentifier>): Promise<UserIdentifier> => {
    try {
      const response = await api.put('/auth/perfil', data);
      const usuarioAtualizado = response.data.data as UserIdentifier;
      
      setUsuario(usuarioAtualizado);
      saveToStorage(STORAGE_KEYS.USUARIO, usuarioAtualizado);
      
      return usuarioAtualizado;
    } catch (error) {
      throw error;
    }
  };

  // Função de alteração de senha
  const alterarSenha = async (senhaAtual: string, novaSenha: string): Promise<void> => {
    try {
      await api.put('/auth/alterar-senha', { senhaAtual, novaSenha });
    } catch (error) {
      throw error;
    }
  };

  // Função para criar novo hub
  const createHub = async (nome: string) => {
    // Priorizar accessToken, mas usar refreshToken se necessário
    const token = accessToken || refreshToken || localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
    if (!token) throw new Error('Token de autenticação não encontrado para criar hub');
    const novoHub = await hubsApi.create({ nome }, token);
    setHubsDisponiveis((prev) => {
      const novaLista = [...(prev || []), { id: novoHub.id, nome: novoHub.nome, role: 'PROPRIETARIO' }];
      return novaLista;
    });
    return novoHub;
  };

  // Sincronizar dados com cookies
  const syncWithCookies = useCallback(() => {
    if (refreshToken) {
      document.cookie = `@PersonalExpenseHub:refreshToken=${refreshToken}; path=/; max-age=2592000; SameSite=Strict`;
    }
    if (usuario) {
      document.cookie = `@PersonalExpenseHub:usuario=${JSON.stringify(usuario)}; path=/; max-age=2592000; SameSite=Strict`;
    }
    if (accessToken) {
      document.cookie = `@PersonalExpenseHub:accessToken=${accessToken}; path=/; max-age=3600; SameSite=Strict`;
    }
    if (hubAtual) {
      document.cookie = `@PersonalExpenseHub:hubAtual=${JSON.stringify(hubAtual)}; path=/; max-age=2592000; SameSite=Strict`;
    }
  }, [refreshToken, accessToken, usuario, hubAtual]);

  // Adicione uma ref para armazenar o id do interceptor
  const responseInterceptorId = useRef<number | null>(null);

  // Configurar interceptor para refresh automático apenas uma vez
  useEffect(() => {
    if (responseInterceptorId.current !== null) {
      api.interceptors.response.eject(responseInterceptorId.current);
    }
    responseInterceptorId.current = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Remover interceptor ao falhar
            if (responseInterceptorId.current !== null) {
              api.interceptors.response.eject(responseInterceptorId.current);
              responseInterceptorId.current = null;
            }
            await logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      if (responseInterceptorId.current !== null) {
        api.interceptors.response.eject(responseInterceptorId.current);
        responseInterceptorId.current = null;
      }
    };
  }, []);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadStoredData = () => {
      const storedAccessToken = loadFromStorage(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefreshToken = loadFromStorage(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUsuario = loadFromStorage(STORAGE_KEYS.USUARIO);
      const storedHubAtual = loadFromStorage(STORAGE_KEYS.HUB_ATUAL);
      const storedHubsDisponiveis = loadFromStorage(STORAGE_KEYS.HUBS_DISPONIVEIS);
      
      // Determinar estado inicial
      if (storedAccessToken && storedRefreshToken && storedUsuario && storedHubAtual) {
        // Estado 3: Completamente autenticado
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUsuario(storedUsuario);
        setHubAtual(storedHubAtual);
        setIsAuthenticated(true);
        api.defaults.headers.Authorization = `Bearer ${storedAccessToken}`;
      } else if (storedRefreshToken && storedUsuario && storedHubsDisponiveis) {
        // Estado 2: Login feito, hub não selecionado
        setRefreshToken(storedRefreshToken);
        setUsuario(storedUsuario);
        setHubsDisponiveis(storedHubsDisponiveis);
        setIsAuthenticated(false);
      } else {
        // Estado 1: Não autenticado
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    loadStoredData();
  }, [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USUARIO, STORAGE_KEYS.HUB_ATUAL, STORAGE_KEYS.HUBS_DISPONIVEIS]);

  // Sincronizar com cookies após carregar dados
  useEffect(() => {
    if (!isLoading) {
      syncWithCookies();
    }
  }, [isLoading, syncWithCookies]);

  const value: AuthContextData = {
    isAuthenticated,
    isLoading,
    usuario,
    hubAtual,
    hubsDisponiveis,
    roleAtual,
    accessToken,
    refreshToken,
    login,
    logout,
    selectHub,
    refreshAccessToken,
    register,
    ativarConvite,
    atualizarPerfil,
    alterarSenha,
    createHub, // adicionar ao contexto
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 