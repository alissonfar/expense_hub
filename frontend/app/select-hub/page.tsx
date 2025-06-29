'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LogIn, Users, Crown, Shield, Eye } from 'lucide-react'

const RoleIcons = {
  PROPRIETARIO: Crown,
  ADMINISTRADOR: Shield,
  COLABORADOR: Users,
  VISUALIZADOR: Eye
}

const RoleLabels = {
  PROPRIETARIO: 'Proprietário',
  ADMINISTRADOR: 'Administrador',
  COLABORADOR: 'Colaborador',
  VISUALIZADOR: 'Visualizador'
}

export default function SelectHubPage() {
  const { availableHubs, selectHub, isLoading, user, logout, refreshToken } = useAuth()
  const router = useRouter()
  const [selecting, setSelecting] = useState<number | null>(null)

  useEffect(() => {
    // Se por algum motivo o usuário chegar aqui sem um refresh token,
    // ele não está logado. Redirecionar para o login.
    if (!isLoading && !refreshToken) {
      router.push('/login')
    }
  }, [isLoading, refreshToken, router])

  const handleSelectHub = async (hubId: number) => {
    setSelecting(hubId)
    try {
      const success = await selectHub(hubId)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error: unknown) {
      console.error('Erro ao selecionar Hub:', error)
    } finally {
      setSelecting(null)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full mx-auto" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || availableHubs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>
              Nenhum Hub disponível ou dados inválidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Fazer Login Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Selecionar Hub
          </CardTitle>
          <CardDescription>
            Olá, {user.nome}! Escolha o Hub que deseja acessar.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {availableHubs.map((hub) => {
            const IconComponent = RoleIcons[hub.role as keyof typeof RoleIcons] || Users
            const roleLabel = RoleLabels[hub.role as keyof typeof RoleLabels] || hub.role
            const isSelecting = selecting === hub.id

            return (
              <Card
                key={hub.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600"
                onClick={() => !isSelecting && handleSelectHub(hub.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {hub.nome}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {roleLabel}
                        </p>
                      </div>
                    </div>
                    
                    {isSelecting ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    ) : (
                      <LogIn className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          
          <div className="pt-4 border-t">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
              disabled={selecting !== null}
            >
              Fazer Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 