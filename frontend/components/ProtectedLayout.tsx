'use client'

import React from 'react'
import { useAuthGuard } from '@/lib/hooks/useAuthGuard'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ProtectedLayoutProps {
  children: React.ReactNode
  requireHub?: boolean
  allowedRoles?: string[]
  fallback?: React.ReactNode
  onUnauthorized?: () => void
}

/**
 * Layout que protege páginas com autenticação automática
 */
export function ProtectedLayout({ 
  children, 
  requireHub = true,
  allowedRoles = [],
  fallback,
  onUnauthorized 
}: ProtectedLayoutProps) {
  const { isLoading, isAuthenticated, isAuthorized, error } = useAuthGuard({
    requireHub,
    allowedRoles,
    onUnauthorized
  })

  // Estado de carregamento
  if (isLoading) {
    return fallback || <ProtectedLayoutLoading />
  }

  // Estado de erro ou não autorizado
  if (error || !isAuthenticated || !isAuthorized) {
    return <ProtectedLayoutError error={error} />
  }

  // Renderizar conteúdo protegido
  return <>{children}</>
}

/**
 * Componente de loading padrão
 */
function ProtectedLayoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md glass-effect">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-lg animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Verificando autenticação</h3>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto validamos suas credenciais...
              </p>
            </div>
            
            {/* Skeleton do carregamento */}
            <div className="w-full space-y-3 pt-4">
              <div className="h-2 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Componente de erro padrão
 */
function ProtectedLayoutError({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-background to-red-50/50">
      <Card className="w-full max-w-md glass-effect border-red-200">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-lg">
              <svg 
                className="h-8 w-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-red-900">
                Erro de Autenticação
              </h3>
              <p className="text-sm text-red-600">
                {error || 'Não foi possível verificar suas credenciais'}
              </p>
            </div>
            
            <div className="w-full pt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Hook para usar em componentes que precisam de proteção simples
 */
export function useProtectedPage(options?: { 
  requireHub?: boolean
  allowedRoles?: string[] 
}) {
  const { isLoading, isAuthenticated, isAuthorized, error } = useAuthGuard(options)
  
  const isReady = !isLoading && isAuthenticated && isAuthorized && !error
  
  return {
    isLoading,
    isAuthenticated,
    isAuthorized,
    isReady,
    error
  }
}

/**
 * HOC para proteger componentes
 */
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireHub?: boolean
    allowedRoles?: string[]
    fallback?: React.ReactNode
  }
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedLayout {...options}>
        <Component {...props} />
      </ProtectedLayout>
    )
  }
  
  ProtectedComponent.displayName = `withProtection(${Component.displayName || Component.name})`
  
  return ProtectedComponent
} 