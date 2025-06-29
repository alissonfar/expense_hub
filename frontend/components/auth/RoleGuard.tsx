'use client'

import { useAuth } from '@/hooks/use-auth'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  roles?: string[]
  requireOwner?: boolean
  requireAdmin?: boolean
  fallback?: ReactNode
}

export function RoleGuard({
  children,
  roles = [],
  requireOwner = false,
  requireAdmin = false,
  fallback = null
}: RoleGuardProps) {
  const { isOwner, isAdmin, hasRole, isAuthenticated } = useAuth()

  // Se não está autenticado, não mostra nada
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Verificar se tem permissão
  let hasPermission = true

  if (requireOwner) {
    hasPermission = isOwner
  } else if (requireAdmin) {
    hasPermission = isAdmin
  } else if (roles.length > 0) {
    hasPermission = hasRole(roles)
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

export default RoleGuard 