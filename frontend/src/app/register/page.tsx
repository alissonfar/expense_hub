'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { HubPreview } from '@/components/ui/hub-preview';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFormErrors } from '@/hooks/use-form-errors';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  // const [currentStep, setCurrentStep] = useState(1); // Removido temporariamente
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const { handleApiError, clearFieldErrors, fieldErrors } = useFormErrors();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const watchedValues = watch();
  
  // Definir etapas do progresso
  const steps = [
    {
      id: 'personal',
      title: 'Dados Pessoais',
      description: 'Nome e email',
      completed: !!(watchedValues.nome && watchedValues.email),
      current: true
    },
    {
      id: 'hub',
      title: 'Criar Hub',
      description: 'Nome do grupo',
      completed: !!watchedValues.nomeHub,
      current: false
    },
    {
      id: 'security',
      title: 'Segurança',
      description: 'Senha segura',
      completed: !!(watchedValues.senha && watchedValues.confirmarSenha),
      current: false
    }
  ];

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      clearFieldErrors();
      clearErrors();
      
      // Preparar dados para a API (sem confirmarSenha)
      const registerData = {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        telefone: data.telefone || undefined,
        nomeHub: data.nomeHub
      };
      
      await registerUser(registerData);
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para ativar sua conta.",
      });
      
      // Redirecionar para página de verificação pendente
      router.push(`/verification-pending?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      handleApiError(error);
      
      // Aplicar erros de campo específicos
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof RegisterFormData, {
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
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl font-bold text-white">💰</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Personal Expense Hub
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Crie sua conta para começar a gerenciar suas despesas
            </CardDescription>
            
            {/* Progress Steps */}
            <ProgressSteps steps={steps} />
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <InfoTooltip 
                    title="Seu nome"
                    description="Digite seu nome completo como aparecerá no sistema"
                  />
                </div>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: João Silva Santos"
                  {...register('nome')}
                  className={`transition-all duration-200 ${errors.nome ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.nome.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email">Email</Label>
                  <InfoTooltip 
                    title="Seu email"
                    description="Será usado para login e notificações importantes"
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
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="telefone">Telefone (opcional)</Label>
                  <InfoTooltip 
                    title="Telefone"
                    description="Opcional. Será usado para notificações importantes"
                    icon="help"
                  />
                </div>
                <PhoneInput
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  {...register('telefone')}
                  error={!!errors.telefone}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.telefone.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="nomeHub">Nome do Hub</Label>
                  <InfoTooltip 
                    title="O que é um Hub?"
                    description="Um Hub é um grupo para gerenciar despesas compartilhadas. Pode ser sua família, amigos, ou qualquer grupo que você queira controlar gastos juntos."
                    icon="help"
                  />
                </div>
                <Input
                  id="nomeHub"
                  type="text"
                  placeholder="Ex: Minha Família, Viagem com Amigos, Casa"
                  {...register('nomeHub')}
                  className={`transition-all duration-200 ${errors.nomeHub ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                />
                {errors.nomeHub && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.nomeHub.message}
                  </p>
                )}
                
                {/* Hub Preview */}
                <HubPreview 
                  nomeHub={watchedValues.nomeHub || ''}
                  nomeUsuario={watchedValues.nome || ''}
                  isVisible={!!watchedValues.nomeHub}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="senha">Senha</Label>
                  <InfoTooltip 
                    title="Senha segura"
                    description="Sua senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais"
                  />
                </div>
                <PasswordInput
                  id="senha"
                  placeholder="Digite sua senha"
                  {...register('senha')}
                  error={!!errors.senha}
                />
                {errors.senha && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.senha.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <PasswordInput
                  id="confirmarSenha"
                  placeholder="Digite a senha novamente"
                  {...register('confirmarSenha')}
                  error={!!errors.confirmarSenha}
                  showStrengthIndicator={false}
                />
                {errors.confirmarSenha && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.confirmarSenha.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span>Criando sua conta...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>🚀 Criar minha conta</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 