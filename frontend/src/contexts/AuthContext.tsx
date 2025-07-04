'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';
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
  const STORAGE_KEYS = {
    ACCESS_TOKEN: '@PersonalExpenseHub:accessToken',
    REFRESH_TOKEN: '@PersonalExpenseHub:refreshToken',
    USUARIO: '@PersonalExpenseHub:usuario',
    HUB_ATUAL: '@PersonalExpenseHub:hubAtual',
    HUBS_DISPONIVEIS: '@PersonalExpenseHub:hubsDisponiveis'
  };

  // Salvar dados no localStorage
  const saveToStorage = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  // Ler dados do localStorage
  const loadFromStorage = (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return null;
    }
  };

  // Limpar dados do localStorage
  const clearStorage = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Atualizar tokens
  const updateTokens = useCallback((newAccessToken: string, newRefreshToken?: string) => {
    setAccessToken(newAccessToken);
    saveToStorage(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
      saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    }
    
    // Atualizar header Authorization do axios
    api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
  }, []);

  // Função de login (1ª etapa)
  const login = async (email: string, senha: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const data = response.data.data as LoginResponse;
      
      setUsuario(data.user);
      setHubsDisponiveis(data.hubs);
      setRefreshToken(data.refreshToken);
      
      saveToStorage(STORAGE_KEYS.USUARIO, data.user);
      saveToStorage(STORAGE_KEYS.HUBS_DISPONIVEIS, data.hubs);
      saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      // Sincronizar com cookies imediatamente
      document.cookie = `@PersonalExpenseHub:refreshToken=${data.refreshToken}; path=/; max-age=2592000; SameSite=Strict`;
      document.cookie = `@PersonalExpenseHub:usuario=${JSON.stringify(data.user)}; path=/; max-age=2592000; SameSite=Strict`;
      
      return data;
    } catch (error) {
      console.error('[AuthContext] login: erro', error);
      throw error;
    }
  };

  // Função de seleção de hub (2ª etapa)
  const selectHub = async (hubId: number): Promise<SelectHubResponse> => {
    try {
      if (!refreshToken) {
        console.warn('[AuthContext] selectHub: refreshToken ausente');
        throw new Error('Token de refresh não encontrado');
      }

      const response = await api.post('/auth/select-hub', 
        { hubId },
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          }
        }
      );
      
      const data = response.data.data as SelectHubResponse;
      
      // Não precisamos mais converter aqui, pois o backend retorna hubContext
      // que será convertido após a resposta
      
      // Atualizar tokens (selectHub não retorna refreshToken)
      updateTokens(data.accessToken);
      
      // Converter hubContext para Hub
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
      
      // Sincronizar com cookies imediatamente
      document.cookie = `@PersonalExpenseHub:accessToken=${data.accessToken}; path=/; max-age=3600; SameSite=Strict`;
      document.cookie = `@PersonalExpenseHub:hubAtual=${JSON.stringify(hubCompleto)}; path=/; max-age=2592000; SameSite=Strict`;
      
      setIsAuthenticated(true);
      
      return data;
    } catch (error) {
      console.error('[AuthContext] selectHub: erro', error);
      throw error;
    }
  };

  // Função de logout
  const logout = async (): Promise<void> => {
    try {
      if (accessToken) {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Limpar estado
      setIsAuthenticated(false);
      setUsuario(null);
      setHubAtual(null);
      setHubsDisponiveis([]);
      setRoleAtual(null);
      setAccessToken(null);
      setRefreshToken(null);
      
      // Limpar localStorage
      clearStorage();
      
      // Limpar cookies
      document.cookie = '@PersonalExpenseHub:accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '@PersonalExpenseHub:refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '@PersonalExpenseHub:usuario=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '@PersonalExpenseHub:hubAtual=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Remover header Authorization
      delete api.defaults.headers.Authorization;
    }
  };

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
      // Se o refresh falhar, fazer logout
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

  // Sincronizar dados com cookies
  const syncWithCookies = useCallback(() => {
    // Definir cookies baseado no localStorage
    if (refreshToken) {
      document.cookie = `@PersonalExpenseHub:refreshToken=${refreshToken}; path=/; max-age=2592000; SameSite=Strict`;
    }
    
    if (accessToken) {
      document.cookie = `@PersonalExpenseHub:accessToken=${accessToken}; path=/; max-age=3600; SameSite=Strict`;
    }
    
    if (usuario) {
      document.cookie = `@PersonalExpenseHub:usuario=${JSON.stringify(usuario)}; path=/; max-age=2592000; SameSite=Strict`;
    }
    
    if (hubAtual) {
      document.cookie = `@PersonalExpenseHub:hubAtual=${JSON.stringify(hubAtual)}; path=/; max-age=2592000; SameSite=Strict`;
    }
  }, [refreshToken, accessToken, usuario, hubAtual]);

  // Configurar interceptor para refresh automático
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
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
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken, refreshAccessToken]);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedAccessToken = loadFromStorage(STORAGE_KEYS.ACCESS_TOKEN);
        const storedRefreshToken = loadFromStorage(STORAGE_KEYS.REFRESH_TOKEN);
        const storedUsuario = loadFromStorage(STORAGE_KEYS.USUARIO);
        const storedHubAtual = loadFromStorage(STORAGE_KEYS.HUB_ATUAL);
        const storedHubsDisponiveis = loadFromStorage(STORAGE_KEYS.HUBS_DISPONIVEIS);
        
        if (storedAccessToken && storedRefreshToken && storedUsuario && storedHubAtual) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUsuario(storedUsuario);
          setHubAtual(storedHubAtual);
          setHubsDisponiveis(storedHubsDisponiveis || []);
          
          // Carregar role atual
          const storedRoleAtual = loadFromStorage('@PersonalExpenseHub:roleAtual');
          if (storedRoleAtual) {
            setRoleAtual(storedRoleAtual);
          }
          
          // Configurar header Authorization
          api.defaults.headers.Authorization = `Bearer ${storedAccessToken}`;
          
          setIsAuthenticated(true);
        } else if (storedRefreshToken && storedUsuario && storedHubsDisponiveis) {
          // Usuário logado mas não selecionou hub ainda
          setRefreshToken(storedRefreshToken);
          setUsuario(storedUsuario);
          setHubsDisponiveis(storedHubsDisponiveis);
          
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao carregar dados do localStorage:', error);
        clearStorage();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, [clearStorage]);

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
    alterarSenha
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