'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { api } from '@/lib/api';

interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    email: string;
    emailVerificado: boolean;
  };
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('Token de verificação não encontrado.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.post<VerificationResponse>('/auth/verify-email', {
        token
      });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
      } else {
        setStatus('error');
        setError(response.data.message || 'Erro ao verificar email.');
      }
    } catch (error: unknown) {
      setStatus('error');
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError?.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleResendVerification = () => {
    // TODO: Implementar reenvio de verificação
    setError('Funcionalidade de reenvio será implementada em breve.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verificação de Email
          </CardTitle>
          <CardDescription className="text-gray-600">
            {status === 'loading' && 'Verificando seu email...'}
            {status === 'success' && 'Email verificado com sucesso!'}
            {status === 'error' && 'Erro na verificação'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Verificando...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              
              <div className="text-center text-sm text-gray-600">
                <p>Sua conta foi ativada com sucesso!</p>
                <p className="mt-1">Agora você pode fazer login e começar a usar o Expense Hub.</p>
              </div>

              <Button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ir para o Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-gray-600">
                <p>Não foi possível verificar seu email.</p>
                <p className="mt-1">Verifique se o link está correto ou solicite um novo email de verificação.</p>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full"
                >
                  Reenviar Email de Verificação
                </Button>
                
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Ir para o Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
} 