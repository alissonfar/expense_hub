'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LogIn } from 'lucide-react'

export default function SelectHubPage() {
  const { hubs, selectHub, isLoading, user, logout, refreshToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Se por algum motivo o usuário chegar aqui sem um refresh token,
    // ele não está logado. Redirecionar para o login.
    if (!isLoading && !refreshToken) {
      router.push('/login')
    }
  }, [isLoading, refreshToken, router])

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

  if (!hubs || hubs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Nenhum Hub Encontrado</AlertTitle>
          <AlertDescription>
            Sua conta não parece estar associada a nenhum Hub. Por favor, entre em contato com o suporte ou tente fazer login novamente.
          </AlertDescription>
          <Button onClick={() => logout()} variant="secondary" className="mt-4">
            Voltar para o Login
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Olá, {user?.nome}!</CardTitle>
          <CardDescription className="text-center">
            Selecione o Hub que você deseja acessar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hubs.map((hub) => (
            <Button
              key={hub.id}
              onClick={() => selectHub(hub.id)}
              className="w-full h-20 text-lg justify-start p-4"
              variant="outline"
            >
              <LogIn className="mr-4 h-6 w-6" />
              <div className="text-left">
                <p className="font-bold">{hub.nome}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  Sua permissão: {hub.role.toLowerCase()}
                </p>
              </div>
            </Button>
          ))}
           <Button onClick={() => logout()} variant="ghost" size="sm" className="w-full mt-4">
            Sair e fazer login com outra conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 