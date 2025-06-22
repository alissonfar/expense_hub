'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiPost, apiGet } from './api'
import { API_ENDPOINTS } from './constants'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Tipos do usuário e auth (compatível com backend)
export interface User {
  id: string
  nome: string
  email: string
  eh_proprietario: boolean
  created_at?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
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
  refreshUser: () => Promise<void>
}

// Contexto
const AuthContext = createContext<AuthContextType | null>(null)

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useLocalStorage<string | null>('auth_token', null)
  const [userData, setUserData] = useLocalStorage<User | null>('user_data', null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!token && !!userData

  // Função de login
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      
      const response = await apiPost(API_ENDPOINTS.AUTH.LOGIN, credentials)
      
      // Backend retorna: { success: true, data: { token, user }, ... }
      const { data } = response.data
      const { token: newToken, user } = data

      if (!newToken || !user) {
        throw new Error('Resposta inválida do servidor')
      }

      // Salvar no localStorage
      setToken(newToken)
      setUserData(user)
      
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  // Função de registro
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      
      const response = await apiPost(API_ENDPOINTS.AUTH.REGISTER, data)
      
      // Backend retorna: { success: true, data: { token, user }, ... }
      const { data: responseData } = response.data
      const { token: newToken, user } = responseData

      if (!newToken || !user) {
        throw new Error('Resposta inválida do servidor')
      }

      // Salvar no localStorage
      setToken(newToken)
      setUserData(user)
      
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  // Função de logout
  const logout = () => {
    try {
      // Chamar endpoint de logout (optional, backend pode não precisar)
      apiPost(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {
        // Ignorar erros do logout no backend
      })
    } catch (error) {
      // Ignorar erros
    } finally {
      // Limpar dados locais sempre
      setToken(null)
      setUserData(null)
    }
  }

  // Função para atualizar dados do usuário
  const refreshUser = async () => {
    if (!token) {
      throw new Error('Token não encontrado')
    }

    try {
      const response = await apiGet(API_ENDPOINTS.AUTH.ME)
      
      // Backend pode retornar user direto ou dentro de data
      const user = response.data.data || response.data
      
      if (!user) {
        throw new Error('Dados do usuário não encontrados na resposta')
      }
      
      setUserData(user)
    } catch (error: any) {
      // Re-throw o erro para o caller decidir o que fazer
      throw error
    }
  }

  // Verificar token na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      // Se não tem token, não precisa fazer nada
      if (!token) {
        setIsLoading(false)
        return
      }

      // Se tem token e dados do usuário, está ok
      if (token && userData) {
        setIsLoading(false)
        return
      }

      // Se tem token mas não tem userData, tentar buscar
      if (token && !userData) {
        try {
          await refreshUser()
        } catch (error: any) {
          // Só fazer logout se for erro 401 (token inválido)
          if (error.response?.status === 401) {
            logout()
          }
          // Para outros erros, manter sessão
        }
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [token, userData]) // Depender de ambos

  // Monitorar mudanças no localStorage (para logout automático em caso de 401)
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem('auth_token')
      const currentUser = localStorage.getItem('user_data')
      
      // Se token foi removido externamente (pelo interceptor), fazer logout local
      if (!currentToken && token) {
        logout()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [token])

  const contextValue: AuthContextType = {
    user: userData,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser
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