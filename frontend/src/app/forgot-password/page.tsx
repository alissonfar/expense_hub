'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, informe seu email.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/request-password-reset', { email });
      
      if (response.data.success) {
        setIsSuccess(true);
        toast({
          title: 'Email enviado!',
          description: response.data.message,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Erro ao solicitar reset de senha.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              ✅ Email Enviado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Se o email estiver cadastrado em nossa base, você receberá um link para redefinir sua senha.
            </p>
            <p className="text-center text-sm text-gray-500">
              Verifique sua caixa de entrada e também a pasta de spam.
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Voltar ao Login
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="w-full"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            🔐 Esqueci minha senha
          </CardTitle>
          <p className="text-gray-600">
            Informe seu email para receber um link de redefinição
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Voltar ao Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 