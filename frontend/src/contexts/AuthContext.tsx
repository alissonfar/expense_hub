'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { hubsApi } from '@/lib/api';
import { UserIdentifier, Hub, HubInfo, LoginResponse, SelectHubResponse } from '@/lib/types';
import type { Role } from '../lib/types';

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
  
  // Estado de troca de hub
  isSwitchingHub: boolean; // NOVO: indica se está trocando de hub
  
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

  // Estado de troca de hub
  const [isSwitchingHub, setIsSwitchingHub] = useState(false);

  // QueryClient para limpeza de cache
  const queryClient = useQueryClient();

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
      if (key === STORAGE_KEYS.ACCESS_TOKEN || key === STORAGE_KEYS.REFRESH_TOKEN) {
        localStorage.setItem(key, typeof data === 'string' ? data : '');
      } else {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error('[AuthContext][saveToStorage] Erro ao salvar no localStorage:', key, error);
    }
  }, [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);

  // Ler dados do localStorage
  const loadFromStorage = useCallback((key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (key === STORAGE_KEYS.ACCESS_TOKEN || key === STORAGE_KEYS.REFRESH_TOKEN) {
        return item || null;
      }
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('[AuthContext][loadFromStorage] Erro ao ler do localStorage:', key, error);
      return null;
    }
  }, [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);

  // Limpar dados do localStorage
  const clearStorage = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    // Remover também roleAtual explicitamente
    localStorage.removeItem('@PersonalExpenseHub:roleAtual');
    // Limpar todos os caches locais
    if (typeof window !== 'undefined' && window?.localStorage) {
      if (typeof import('@/lib/api').then === 'function') {
        import('@/lib/api').then(mod => {
          if (mod.cacheUtils?.clear) mod.cacheUtils.clear();
        });
      }
    }
  }, [STORAGE_KEYS]);

  // Atualizar tokens
  const updateTokens = useCallback((newAccessToken: string, newRefreshToken?: string) => {
    setAccessToken(newAccessToken);
    if (newRefreshToken !== undefined && newRefreshToken !== null) {
      setRefreshToken(newRefreshToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    } else {
      // Mantém o refreshToken atual do localStorage/contexto
      const currentRefreshToken = refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (currentRefreshToken) {
        setRefreshToken(currentRefreshToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, currentRefreshToken);
      }
    }
    // Salvar accessToken normalmente
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    // Configurar header Authorization global
    api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
  }, [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, refreshToken]);

  // Função de login (1ª etapa)
  const login = async (email: string, senha: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const data = response.data.data as LoginResponse;
      setUsuario(data.user);
      setHubsDisponiveis(data.hubs);
      // Salvar usuário e hubs disponíveis no localStorage
      saveToStorage(STORAGE_KEYS.USUARIO, data.user);
      saveToStorage(STORAGE_KEYS.HUBS_DISPONIVEIS, data.hubs);
      updateTokens('', data.refreshToken); // accessToken só será obtido após selectHub
      // Salvar refreshToken no localStorage padronizado
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
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
      // Ativar bloqueio durante troca
      setIsSwitchingHub(true);
      
      // SEMPRE buscar o refreshToken diretamente do localStorage
      const refreshTokenLS = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const tokenToUse = refreshTokenLS;
      const tokenSource = 'refreshToken (localStorage)';
      console.log('%c[AuthContext][selectHub][TOKEN SELECIONADO - CORRIGIDO]', 'color: #ff9800; font-weight: bold;', {
        tokenToUse,
        tokenSource,
        hubId
      });
      if (!tokenToUse) {
        throw new Error('RefreshToken não encontrado no localStorage. Faça login novamente.');
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
      console.log('%c[AuthContext][selectHub] RESPOSTA do backend', 'color: #388e3c; font-weight: bold;', data);
      updateTokens(data.accessToken); // Não sobrescreve refreshToken
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
      // Salvar usuário e hubs disponíveis novamente para garantir persistência
      if (usuario) saveToStorage(STORAGE_KEYS.USUARIO, usuario);
      if (hubsDisponiveis) saveToStorage(STORAGE_KEYS.HUBS_DISPONIVEIS, hubsDisponiveis);
      document.cookie = `@PersonalExpenseHub:accessToken=${data.accessToken}; path=/; max-age=3600; SameSite=Strict`;
      document.cookie = `@PersonalExpenseHub:hubAtual=${JSON.stringify(hubCompleto)}; path=/; max-age=2592000; SameSite=Strict`;
      setIsAuthenticated(true);
      
      // LIMPAR CACHE DO REACT QUERY APÓS TROCA DE HUB
      console.log('%c[AuthContext][selectHub] LIMPANDO CACHE DO REACT QUERY', 'color: #ff5722; font-weight: bold;');
      queryClient.clear(); // Limpar todo o cache
      
      console.log('%c[AuthContext][selectHub] ESTADO FINAL após seleção', 'color: #1976d2; font-weight: bold;', {
        hubAtual: hubCompleto,
        roleAtual: data.hubContext.role,
        accessToken: data.accessToken,
        usuario,
        hubsDisponiveis
      });
      return data;
    } catch (error) {
      console.error('[AuthContext][selectHub] Erro:', error, {
        refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        cookie: document.cookie
      });
      throw error;
    } finally {
      // Desativar bloqueio após conclusão (sucesso ou erro)
      setIsSwitchingHub(false);
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
      
      // LIMPAR CACHE DO REACT QUERY NO LOGOUT
      console.log('%c[AuthContext][logout] LIMPANDO CACHE DO REACT QUERY', 'color: #ff5722; font-weight: bold;');
      queryClient.clear();
      
      // Remover interceptor definitivamente
      if (responseInterceptorId.current !== null) {
        api.interceptors.response.eject(responseInterceptorId.current);
        responseInterceptorId.current = null;
      }
    }
  }, [accessToken, clearStorage, queryClient]);

  // Função de refresh token (mantida para compatibilidade, mas não usada)
  const refreshAccessToken = useCallback(async (): Promise<string> => {
    // Sistema usa refresh automático via middleware, não manual
    throw new Error('Refresh manual não é suportado. Use selectHub para renovar tokens.');
  }, []);

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
    // SEMPRE buscar o refreshToken diretamente do localStorage
    const refreshTokenLS = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const tokenToUse = refreshTokenLS;
    const tokenSource = 'refreshToken (localStorage)';
    console.log('%c[AuthContext][createHub][TOKEN SELECIONADO - CORRIGIDO]', 'color: #ff9800; font-weight: bold;', {
      tokenToUse,
      tokenSource,
      nome
    });
    if (!tokenToUse) throw new Error('RefreshToken não encontrado no localStorage. Faça login novamente.');
    const novoHub = await hubsApi.create({ nome }, tokenToUse);
    setHubsDisponiveis((prev) => {
      const novaLista = [...(prev || []), { id: novoHub.id, nome: novoHub.nome, role: 'PROPRIETARIO' as Role }];
      return novaLista;
    });
    
    // Salvar hubs disponíveis atualizados no localStorage
    saveToStorage(STORAGE_KEYS.HUBS_DISPONIVEIS, [...(hubsDisponiveis || []), { id: novoHub.id, nome: novoHub.nome, role: 'PROPRIETARIO' as Role }]);
    
    console.log('%c[AuthContext][createHub] Hub criado com sucesso', 'color: #388e3c; font-weight: bold;', novoHub);
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
      (response) => {
        // Verificar se o backend enviou um novo token
        const newToken = response.headers['x-new-access-token'];
        const tokenRefreshed = response.headers['x-token-refreshed'];
        
        if (newToken && tokenRefreshed === 'true') {
          console.log('%c[AuthContext][Interceptor] Novo token recebido automaticamente', 'color: #388e3c; font-weight: bold;');
          updateTokens(newToken);
        }
        
        return response;
      },
      async (error) => {
        // Removido refresh manual - o sistema usa refresh automático via middleware
        // Se receber 401, apenas rejeita o erro para que o usuário seja redirecionado
        if (error.response?.status === 401) {
          console.log('[AuthContext][Interceptor] Erro 401 - Token expirado, redirecionando para login');
          await logout();
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
  }, [logout, refreshAccessToken, updateTokens]);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const loadStoredData = () => {
      const storedAccessToken = loadFromStorage(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefreshToken = loadFromStorage(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUsuario = loadFromStorage(STORAGE_KEYS.USUARIO);
      const storedHubAtual = loadFromStorage(STORAGE_KEYS.HUB_ATUAL);
      const storedHubsDisponiveis = loadFromStorage(STORAGE_KEYS.HUBS_DISPONIVEIS);

      console.log('%c[AuthContext][Init] Tokens e estado lidos do localStorage/cookies', 'color: #1976d2; font-weight: bold;', {
        storedAccessToken,
        storedRefreshToken,
        storedUsuario,
        storedHubAtual,
        storedHubsDisponiveis,
        cookies: document.cookie
      });
      // Determinar estado inicial
      if (storedAccessToken && storedRefreshToken && storedUsuario && storedHubAtual) {
        console.log('%c[AuthContext][Init] Estado: autenticado', 'color: #388e3c; font-weight: bold;');
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUsuario(storedUsuario);
        setHubAtual(storedHubAtual);
        setIsAuthenticated(true);
        api.defaults.headers.Authorization = `Bearer ${storedAccessToken}`;
        console.log('%c[AuthContext][Init] Header Authorization configurado:', 'color: #1976d2;', api.defaults.headers.Authorization);
        // NOVO: garantir que hubsDisponiveis seja carregado sempre que houver no localStorage
        if (storedHubsDisponiveis) {
          setHubsDisponiveis(storedHubsDisponiveis);
        }
      } else if (storedRefreshToken && storedUsuario && storedHubsDisponiveis) {
        console.log('%c[AuthContext][Init] Estado: login feito, hub não selecionado', 'color: #fbc02d; font-weight: bold;');
        setRefreshToken(storedRefreshToken);
        setUsuario(storedUsuario);
        setHubsDisponiveis(storedHubsDisponiveis);
        setIsAuthenticated(false);
      } else {
        console.log('%c[AuthContext][Init] Estado: não autenticado', 'color: #d32f2f; font-weight: bold;');
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    loadStoredData();
  }, [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USUARIO, STORAGE_KEYS.HUB_ATUAL, STORAGE_KEYS.HUBS_DISPONIVEIS, loadFromStorage]);

  // Sincronização entre abas - ESCUTAR MUDANÇAS NO LOCALSTORAGE
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Só processar eventos de outras abas
      if (event.key === null) {
        // localStorage foi limpo (logout)
        console.log('%c[AuthContext][Storage] Logout detectado em outra aba', 'color: #d32f2f; font-weight: bold;');
        setIsAuthenticated(false);
        setUsuario(null);
        setHubAtual(null);
        setHubsDisponiveis([]);
        setRoleAtual(null);
        setAccessToken(null);
        setRefreshToken(null);
        delete api.defaults.headers.Authorization;
        return;
      }

      // Processar mudanças específicas
      if (event.key === STORAGE_KEYS.ACCESS_TOKEN) {
        console.log('%c[AuthContext][Storage] AccessToken atualizado em outra aba', 'color: #1976d2; font-weight: bold;');
        const newAccessToken = event.newValue;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        } else {
          setAccessToken(null);
          delete api.defaults.headers.Authorization;
        }
      }

      if (event.key === STORAGE_KEYS.REFRESH_TOKEN) {
        console.log('%c[AuthContext][Storage] RefreshToken atualizado em outra aba', 'color: #1976d2; font-weight: bold;');
        setRefreshToken(event.newValue);
      }

      if (event.key === STORAGE_KEYS.USUARIO) {
        console.log('%c[AuthContext][Storage] Usuario atualizado em outra aba', 'color: #1976d2; font-weight: bold;');
        const newUsuario = event.newValue ? JSON.parse(event.newValue) : null;
        setUsuario(newUsuario);
      }

      if (event.key === STORAGE_KEYS.HUB_ATUAL) {
        console.log('%c[AuthContext][Storage] HubAtual atualizado em outra aba', 'color: #1976d2; font-weight: bold;');
        const newHubAtual = event.newValue ? JSON.parse(event.newValue) : null;
        setHubAtual(newHubAtual);
        setIsAuthenticated(Boolean(newHubAtual));
      }

      if (event.key === STORAGE_KEYS.HUBS_DISPONIVEIS) {
        console.log('%c[AuthContext][Storage] HubsDisponiveis atualizado em outra aba', 'color: #1976d2; font-weight: bold;');
        const newHubsDisponiveis = event.newValue ? JSON.parse(event.newValue) : [];
        setHubsDisponiveis(newHubsDisponiveis);
      }

      if (event.key === '@PersonalExpenseHub:roleAtual') {
        console.log('%c[AuthContext][Storage] RoleAtual atualizado em outra aba', 'color: #1976d2; font-weight: bold;');
        setRoleAtual(event.newValue);
      }
    };

    // Adicionar listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
    isSwitchingHub, // adicionar ao contexto
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