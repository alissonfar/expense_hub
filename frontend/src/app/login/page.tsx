'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/info-tooltip';
// import { StatusBadge } from '@/components/ui/status-badge'; // Removido temporariamente
import { ValidationIndicator } from '@/components/ui/validation-indicator';
import { SuccessFeedback } from '@/components/ui/success-feedback';
import { FadeIn, Bounce } from '@/components/ui/micro-interactions';
// import { useToast } from '@/hooks/use-toast'; // Removido temporariamente
import { useGuestOnly } from '@/hooks/useAuth';
import { useFormErrors } from '@/hooks/use-form-errors';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // const [validationState, setValidationState] = useState<{
  //   email: boolean | null;
  //   password: boolean | null;
  // }>({ email: null, password: null }); // Removido temporariamente
  
  const { login } = useGuestOnly();
  // const { toast } = useToast(); // Removido temporariamente
  const { handleApiError, clearFieldErrors, fieldErrors } = useFormErrors();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      clearFieldErrors();
      clearErrors();
      setShowSuccess(false);
      
      await login(data.email, data.senha);
      
      setShowSuccess(true);
      
      // Redirecionar após mostrar feedback de sucesso
      setTimeout(() => {
        router.push('/select-hub');
      }, 1500);
      
    } catch (error: unknown) {
      handleApiError(error);
      
      // Aplicar erros de campo específicos
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof LoginFormData, {
          type: 'manual',
          message
        });
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-lg">
        <FadeIn>
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
                      <CardHeader className="space-y-4 text-center">
              <Bounce delay={200}>
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl font-bold text-white">💰</span>
                </div>
              </Bounce>
              <FadeIn delay={400}>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Personal Expense Hub
                </CardTitle>
              </FadeIn>
              <FadeIn delay={600}>
                <CardDescription className="text-gray-600 text-lg">
                  Entre na sua conta para gerenciar suas despesas
                </CardDescription>
              </FadeIn>
            </CardHeader>
          
          <CardContent>
            {/* Success Feedback */}
            {showSuccess && (
              <SuccessFeedback 
                message="Login realizado com sucesso!"
                description="Redirecionando para o dashboard..."
                className="mb-6"
              />
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email">Email</Label>
                  <InfoTooltip 
                    title="Seu email"
                    description="Digite o email usado no cadastro"
                  />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: joao.silva@email.com"
                  {...register('email')}
                  className={`transition-all duration-200 ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.email && (
                  <ValidationIndicator 
                    isValid={false}
                    message={errors.email.message}
                    className="mt-2"
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="senha">Senha</Label>
                  <InfoTooltip 
                    title="Sua senha"
                    description="Digite a senha da sua conta"
                  />
                </div>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Digite sua senha"
                  {...register('senha')}
                  className={`transition-all duration-200 ${errors.senha ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.senha && (
                  <ValidationIndicator 
                    isValid={false}
                    message={errors.senha.message}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                >
                  🔑 Esqueci minha senha
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>🚀 Entrar na minha conta</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  href="/register" 
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Registre-se aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </FadeIn>
      </div>
    </div>
  );
} 