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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth'
import { toast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff } from 'lucide-react'

// Schema de validação para login (compatível com backend)
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
})

// Schema de validação para registro (compatível com backend)
const registerSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/\d/, 'Senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial')
    .refine(senha => !/\s/.test(senha), 'Senha não pode conter espaços'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.senha === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, register, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form para login
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: ''
    }
  })

  // Form para registro
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmPassword: ''
    }
  })

  // Função de login
  const onLogin = async (data: LoginForm) => {
    try {
      await login(data)
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso!",
      })
      router.push('/inicial')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao fazer login',
        variant: "destructive",
      })
    }
  }

  // Função de registro
  const onRegister = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...registerData } = data
      await register(registerData)
      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso!",
      })
      router.push('/inicial')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao criar conta',
        variant: "destructive",
      })
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>
            
            {/* Tab de Login */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register('email')}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      {...loginForm.register('senha')}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.senha && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.senha.message}
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
            </TabsContent>

            {/* Tab de Registro */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nome">Nome Completo</Label>
                  <Input
                    id="register-nome"
                    type="text"
                    placeholder="Seu nome completo"
                    {...registerForm.register('nome')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.nome && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...registerForm.register('email')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      {...registerForm.register('senha')}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {registerForm.formState.errors.senha && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.senha.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="register-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      {...registerForm.register('confirmPassword')}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
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
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              🏠 Sistema completo de controle de gastos pessoais
            </p>
            <p className="mt-1">
              📊 Dashboard • 💰 Transações • 📈 Relatórios
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 