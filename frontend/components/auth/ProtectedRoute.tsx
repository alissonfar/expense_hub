'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOwner?: boolean
  requireAdmin?: boolean
  allowedRoles?: string[]
}

export function ProtectedRoute({ 
  children, 
  requireOwner = false,
  requireAdmin = false,
  allowedRoles = []
}: ProtectedRouteProps) {
  const router = useRouter()
  const { 
    isAuthenticated, 
    isLoading, 
    isOwner, 
    isAdmin, 
    hasRole,
    needsHubSelection 
  } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      // Se não está autenticado, redirecionar para login
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Se precisa selecionar hub, redirecionar
      if (needsHubSelection) {
        router.push('/select-hub')
        return
      }

      // Verificar permissões específicas
      if (requireOwner && !isOwner) {
        router.push('/dashboard') // ou página de acesso negado
        return
      }

      if (requireAdmin && !isAdmin) {
        router.push('/dashboard')
        return
      }

      if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        router.push('/dashboard')
        return
      }
    }
  }, [
    isLoading, 
    isAuthenticated, 
    needsHubSelection, 
    requireOwner, 
    requireAdmin, 
    allowedRoles,
    isOwner,
    isAdmin,
    hasRole,
    router
  ])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Verificando autenticação...
          </p>
        </div>
      </div>
    )
  }

  // Se não está autenticado ou precisa selecionar hub, não renderizar
  if (!isAuthenticated || needsHubSelection) {
    return null
  }

  // Verificar permissões antes de renderizar
  if (requireOwner && !isOwner) return null
  if (requireAdmin && !isAdmin) return null
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) return null

  return <>{children}</>
}

export default ProtectedRoute 