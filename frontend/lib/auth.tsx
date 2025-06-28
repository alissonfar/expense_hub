'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost } from './api'
import { API_ENDPOINTS } from './constants'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// --- NOVOS TIPOS MULTI-TENANT ---

export interface Hub {
  id: string;
  nome: string;
  role: 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR';
}

export interface User {
  id: string
  nome: string
  email: string
  // eh_proprietario foi removido
}

export interface AuthState {
  user: User | null
  hubs: Hub[]
  selectedHub: Hub | null
  refreshToken: string | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean // Agora significa que temos um accessToken válido
}

export interface LoginCredentials {
  email: string
  senha: string
}

export interface RegisterData {
  nome: string
  email: string
  senha: string
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  selectHub: (hubId: string) => Promise<void>
  // refreshUser foi removido, a lógica será outra
}

// Contexto
const AuthContext = createContext<AuthContextType | null>(null)

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  
  // --- GERENCIAMENTO DE ESTADO COM LOCALSTORAGE ---
  const [userData, setUserData] = useLocalStorage<User | null>('user_data', null)
  const [hubs, setHubs] = useLocalStorage<Hub[]>('user_hubs', [])
  const [selectedHub, setSelectedHub] = useLocalStorage<Hub | null>('selected_hub', null)
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('refresh_token', null)
  const [accessToken, setAccessToken] = useLocalStorage<string | null>('access_token', null)
  
  const [isLoading, setIsLoading] = useState(true)

  // A sessão é considerada autenticada se tivermos um accessToken
  const isAuthenticated = !!accessToken && !!userData && !!selectedHub

  // --- FUNÇÕES DE AUTENTICAÇÃO ATUALIZADAS ---

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await apiPost(API_ENDPOINTS.AUTH.LOGIN, credentials)
      
      // Backend retorna: { success, data: { refreshToken, user, hubs } }
      const { refreshToken: newRefreshToken, user, hubs: userHubs } = response.data.data

      if (!newRefreshToken || !user || !userHubs) {
        throw new Error('Resposta de login inválida do servidor')
      }

      // 1. Limpa o estado antigo
      logout(true) // silent logout

      // 2. Salva os dados essenciais
      setRefreshToken(newRefreshToken)
      setUserData(user)
      setHubs(userHubs)

      // 3. Redireciona para seleção de Hub
      router.push('/select-hub')

    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }
  
  const selectHub = async (hubId: string) => {
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado para selecionar um hub.')
    }
    try {
      setIsLoading(true)
      const response = await apiPost(API_ENDPOINTS.AUTH.SELECT_HUB, { hubId, refreshToken })

      // Backend retorna: { success, data: { accessToken } }
      const { accessToken: newAccessToken } = response.data.data
      const hubToSelect = hubs.find(h => h.id === hubId)

      if (!newAccessToken || !hubToSelect) {
        throw new Error('Não foi possível obter o token de acesso ou encontrar o hub.')
      }

      setAccessToken(newAccessToken)
      setSelectedHub(hubToSelect)

      router.push('/dashboard') // Ou para a última página visitada

    } catch (error: any) {
      // Se falhar, deslogar para segurança
      logout()
      throw new Error(error.message || 'Erro ao selecionar o Hub.')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    // A lógica de registro agora é a mesma do login, pois o backend
    // cria o usuário, o primeiro hub e já loga.
    try {
      setIsLoading(true)
      const response = await apiPost(API_ENDPOINTS.AUTH.REGISTER, data)

      // Backend retorna: { success, data: { refreshToken, user, hubs } }
      const { refreshToken: newRefreshToken, user, hubs: userHubs } = response.data.data

      if (!newRefreshToken || !user || !userHubs) {
        throw new Error('Resposta de registro inválida do servidor')
      }
      
      logout(true); // silent logout
      setRefreshToken(newRefreshToken)
      setUserData(user)
      setHubs(userHubs)

      router.push('/select-hub')

    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (silent = false) => {
    // Limpeza completa do estado de autenticação
    setAccessToken(null)
    setRefreshToken(null)
    setUserData(null)
    setHubs([])
    setSelectedHub(null)
    
    // Limpa o localStorage diretamente para garantir
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_hubs')
      localStorage.removeItem('selected_hub')
    }

    if (!silent) {
      router.push('/login')
    }
  }

  // --- EFEITOS PARA GERENCIAR O ESTADO DA SESSÃO ---

  // Efeito inicial para verificar o estado da sessão ao carregar a aplicação
  useEffect(() => {
    // Se não há refresh token, o usuário não está logado.
    if (!refreshToken) {
      setIsLoading(false)
      return;
    }

    // Se temos um access token, consideramos o usuário logado e pronto.
    if (accessToken && userData && selectedHub) {
      setIsLoading(false)
      return;
    }

    // Se temos um refresh token mas não um access token (ex: aba fechada e reaberta),
    // o usuário precisa selecionar um hub novamente.
    if (refreshToken && !accessToken) {
       router.push('/select-hub');
    }
    
    setIsLoading(false)
  }, []) // Executa apenas uma vez

  // Monitorar mudanças no localStorage para sincronizar abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'access_token' && !event.newValue) {
        logout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [logout])


  const contextValue: AuthContextType = {
    user: userData,
    hubs,
    selectedHub,
    refreshToken,
    accessToken,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    selectHub
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
} 