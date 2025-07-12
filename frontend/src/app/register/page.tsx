'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  telefone: z.string()
    .optional()
    .refine((val) => !val || val.length >= 10, 'Telefone deve ter pelo menos 10 dígitos'),
  nomeHub: z.string()
    .min(1, 'Nome do hub é obrigatório')
    .min(2, 'Nome do hub deve ter pelo menos 2 caracteres'),
  senha: z.string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "Senhas não coincidem",
  path: ["confirmarSenha"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
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
        title: "Registro realizado com sucesso!",
        description: "Faça o login para continuar.",
      });
      
      // Redirecionar para login
      router.push('/login');
    } catch (error) {
      toast({
        title: "Erro no registro",
                  description: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">💰</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Personal Expense Hub
            </CardTitle>
            <CardDescription className="text-gray-600">
              Crie sua conta para começar a gerenciar suas despesas
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  {...register('nome')}
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone (opcional)</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  {...register('telefone')}
                  className={errors.telefone ? 'border-red-500' : ''}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-500">{errors.telefone.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nomeHub">Nome do Hub</Label>
                <Input
                  id="nomeHub"
                  type="text"
                  placeholder="Nome do seu hub (ex: Minha Família, Meu Grupo)"
                  {...register('nomeHub')}
                  className={errors.nomeHub ? 'border-red-500' : ''}
                />
                {errors.nomeHub && (
                  <p className="text-sm text-red-500">{errors.nomeHub.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  {...register('senha')}
                  className={errors.senha ? 'border-red-500' : ''}
                />
                {errors.senha && (
                  <p className="text-sm text-red-500">{errors.senha.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Digite a senha novamente"
                  {...register('confirmarSenha')}
                  className={errors.confirmarSenha ? 'border-red-500' : ''}
                />
                {errors.confirmarSenha && (
                  <p className="text-sm text-red-500">{errors.confirmarSenha.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Criando conta...
                  </div>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
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