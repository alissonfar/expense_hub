'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

// Schema de validação para login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form para login
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: ''
    }
  })

  // Função de login
  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      const result = await login(data)
      
      if (result.success) {
        if (result.hubs && result.hubs.length > 1) {
          router.push('/select-hub')
        } else {
          // Se só tem um hub, será redirecionado automaticamente para dashboard
          router.push('/dashboard')
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Personal Expense Hub
          </CardTitle>
          <CardDescription>
            Gerencie seus gastos pessoais de forma inteligente
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...form.register('email')}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  {...form.register('senha')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.senha && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 