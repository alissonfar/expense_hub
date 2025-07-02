import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'

// =============================================
// 🔐 HOOK DE PROTEÇÃO DE ROTAS
// =============================================

interface UseAuthGuardOptions {
  redirectTo?: string
  requireHub?: boolean
  allowedRoles?: string[]
  onUnauthorized?: () => void
}

interface AuthGuardState {
  isLoading: boolean
  isAuthenticated: boolean
  isAuthorized: boolean
  error: string | null
}

/**
 * Hook para proteger páginas e verificar autenticação/autorização
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}): AuthGuardState => {
  const {
    redirectTo = '/auth/login',
    requireHub = true,
    allowedRoles = [],
    onUnauthorized
  } = options

  const router = useRouter()
  const { 
    isAuthenticated, 
    isLoading, 
    currentHub, 
    authContext,
    initializeAuth,
    checkAuthStatus 
  } = useAuthStore()

  const [state, setState] = useState<AuthGuardState>({
    isLoading: true,
    isAuthenticated: false,
    isAuthorized: false,
    error: null
  })

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      console.log('[AuthGuard] Iniciando verificação de autenticação')
      
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Primeiro, tentar inicializar/recuperar estado de auth
        await initializeAuth()

        // Aguardar um pouco para o store atualizar
        await new Promise(resolve => setTimeout(resolve, 100))

        const currentState = useAuthStore.getState()
        console.log('[AuthGuard] Estado atual:', {
          isAuthenticated: currentState.isAuthenticated,
          hasHub: !!currentState.currentHub,
          hasAccessToken: !!currentState.accessToken,
          role: currentState.authContext?.role
        })

        // Verificar se está autenticado
        if (!currentState.isAuthenticated || !currentState.accessToken) {
          console.log('[AuthGuard] Não autenticado - tentando verificar status')
          
          // Tentar verificar status se tiver dados parciais
          if (currentState.currentHub && currentState.refreshToken) {
            const recovered = await checkAuthStatus()
            if (!recovered) {
              throw new Error('Sessão expirada')
            }
          } else {
            throw new Error('Não autenticado')
          }
        }

        // Verificar se precisa de hub selecionado
        if (requireHub && !currentState.currentHub) {
          console.log('[AuthGuard] Hub requerido mas não selecionado')
          if (mounted) {
            router.push('/auth/select-hub')
            return
          }
        }

        // Verificar autorização por role
        if (allowedRoles.length > 0 && currentState.authContext?.role) {
          const hasPermission = allowedRoles.includes(currentState.authContext.role)
          if (!hasPermission) {
            console.log('[AuthGuard] Sem permissão de role:', {
              required: allowedRoles,
              current: currentState.authContext.role
            })
            throw new Error('Sem permissão para acessar esta página')
          }
        }

        // Tudo ok
        if (mounted) {
          setState({
            isLoading: false,
            isAuthenticated: true,
            isAuthorized: true,
            error: null
          })
        }

        console.log('[AuthGuard] Verificação bem-sucedida')

      } catch (error: any) {
        console.error('[AuthGuard] Erro na verificação:', error)
        
        if (mounted) {
          setState({
            isLoading: false,
            isAuthenticated: false,
            isAuthorized: false,
            error: error.message || 'Erro na autenticação'
          })

          // Callback customizado
          if (onUnauthorized) {
            onUnauthorized()
          } else {
            // Redirecionar para login
            const currentPath = window.location.pathname
            const searchParams = new URLSearchParams()
            if (currentPath !== '/auth/login') {
              searchParams.set('redirect', currentPath)
            }
            
            const loginUrl = `${redirectTo}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
            router.push(loginUrl)
          }
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, []) // Executa apenas uma vez na montagem

  return state
}

/**
 * Hook simplificado para verificar se está autenticado
 */
export const useRequireAuth = () => {
  const guard = useAuthGuard({ requireHub: true })
  
  return {
    isLoading: guard.isLoading,
    isAuthenticated: guard.isAuthenticated && guard.isAuthorized,
    error: guard.error
  }
}

/**
 * Hook para verificar permissões específicas
 */
export const useRequireRole = (allowedRoles: string[]) => {
  const guard = useAuthGuard({ 
    requireHub: true, 
    allowedRoles,
    redirectTo: '/unauthorized' 
  })
  
  return {
    isLoading: guard.isLoading,
    isAuthorized: guard.isAuthorized,
    error: guard.error
  }
}

/**
 * Hook para páginas de admin
 */
export const useRequireAdmin = () => {
  return useRequireRole(['PROPRIETARIO', 'ADMINISTRADOR'])
}

/**
 * Hook para páginas que requerem pelo menos colaborador
 */
export const useRequireCollaborator = () => {
  return useRequireRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'])
}

// =============================================
// 🏢 HOOK PARA VERIFICAR ACESSO AO HUB
// =============================================

export function useHubGuard(hubId?: string | number) {
  const router = useRouter()
  const { currentHub, isAuthenticated, isLoading, initializeAuth } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Aguardar hidratação do Zustand antes de fazer qualquer verificação
  useEffect(() => {
    const checkHydration = async () => {
      // Aguardar um pouco para garantir que a hidratação terminou
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Tentar inicializar se necessário
      if (!isAuthenticated || !currentHub) {
        console.log('[HubGuard] Tentando inicializar auth...')
        await initializeAuth()
        // Aguardar mais um pouco após inicialização
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setIsHydrated(true)
      console.log('[HubGuard] Hidratação concluída, estado:', {
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        hasHub: !!useAuthStore.getState().currentHub
      })
    }
    
    checkHydration()
  }, [])
  
  useEffect(() => {
    // Só fazer verificações APÓS hidratação
    if (!isHydrated) return
    if (isLoading) return
    
    console.log('[HubGuard] Verificando acesso:', {
      isAuthenticated,
      currentHub: currentHub?.nome,
      requestedHubId: hubId
    })
    
    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      console.log('[HubGuard] Não autenticado - redirecionando para login')
      router.push('/auth/login')
      return
    }
    
    // Se não tem hub selecionado, redirecionar para seleção
    if (!currentHub) {
      console.log('[HubGuard] Hub não selecionado - redirecionando para select-hub')
      router.push('/auth/select-hub')
      return
    }
    
    // Se foi especificado um hubId e não corresponde ao hub atual
    if (hubId && currentHub.id !== Number(hubId)) {
      console.log('[HubGuard] Hub ID incompatível - redirecionando para hub atual')
      router.push(`/${currentHub.id}/dashboard`)
      return
    }
  }, [isHydrated, isAuthenticated, currentHub, hubId, isLoading, router])
  
  return {
    currentHub,
    isAuthenticated,
    isLoading: isLoading || !isHydrated,
    hasAccess: isHydrated && !isLoading && isAuthenticated && !!currentHub && 
              (!hubId || currentHub.id === Number(hubId))
  }
} 