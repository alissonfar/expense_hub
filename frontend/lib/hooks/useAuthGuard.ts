import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth-store'

// =============================================
// 🔐 HOOK DE PROTEÇÃO DE ROTAS
// =============================================

interface UseAuthGuardOptions {
  redirectTo?: string
  requireAuth?: boolean
  requireHub?: boolean
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const {
    redirectTo = '/auth/login',
    requireAuth = true,
    requireHub = false
  } = options
  
  const router = useRouter()
  const { isAuthenticated, currentHub, isLoading } = useAuth()
  
  useEffect(() => {
    // Aguardar carregamento inicial
    if (isLoading) return
    
    // Se não requer autenticação, permitir acesso
    if (!requireAuth) return
    
    // Se requer autenticação mas usuário não está autenticado
    if (!isAuthenticated) {
      router.push(redirectTo)
      return
    }
    
    // Se requer hub mas usuário não tem hub selecionado
    if (requireHub && !currentHub) {
      router.push('/select-hub')
      return
    }
  }, [isAuthenticated, currentHub, isLoading, requireAuth, requireHub, redirectTo, router])
  
  return {
    isAuthenticated,
    currentHub,
    isLoading,
    isReady: !isLoading && (!requireAuth || isAuthenticated) && (!requireHub || !!currentHub)
  }
}

// =============================================
// 🏢 HOOK PARA VERIFICAR ACESSO AO HUB
// =============================================

export function useHubGuard(hubId?: string | number) {
  const router = useRouter()
  const { currentHub, isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (isLoading) return
    
    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    
    // Se não tem hub selecionado, redirecionar para seleção
    if (!currentHub) {
      router.push('/select-hub')
      return
    }
    
    // Se foi especificado um hubId e não corresponde ao hub atual
    if (hubId && currentHub.id !== Number(hubId)) {
      router.push(`/${currentHub.id}/dashboard`)
      return
    }
  }, [isAuthenticated, currentHub, hubId, isLoading, router])
  
  return {
    currentHub,
    isAuthenticated,
    isLoading,
    hasAccess: !isLoading && isAuthenticated && !!currentHub && 
              (!hubId || currentHub.id === Number(hubId))
  }
} 