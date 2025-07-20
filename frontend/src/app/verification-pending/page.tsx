'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function VerificationPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [email, setEmail] = useState(searchParams.get('email') || '');

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResending(true);
      
      await api.post('/auth/resend-verification', { email });
      
      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
      
      setShowResendForm(false);
    } catch (error: any) {
      toast({
        title: "Erro ao reenviar",
        description: error.response?.data?.message || "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckEmail = () => {
    // Abrir cliente de email padrão ou redirecionar para Gmail/Outlook
    const emailProviders = [
      'https://mail.google.com',
      'https://outlook.live.com',
      'https://mail.yahoo.com'
    ];
    
    // Tentar abrir Gmail primeiro
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Conta Criada com Sucesso!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Agora você precisa verificar seu email para ativar sua conta
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Info */}
          {email && (
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Email enviado para: <strong>{email}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Próximos passos:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  Abra seu email e procure pela mensagem do <strong>Expense Hub</strong>
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  Clique no botão <strong>"Ativar Minha Conta"</strong> no email
                </p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  Volte aqui e faça login para começar a usar o sistema
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleCheckEmail}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Abrir Email
            </Button>

            <Button 
              onClick={handleGoToLogin}
              variant="outline"
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir para o Login
            </Button>
          </div>

          {/* Resend Section */}
          <div className="border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Não recebeu o email?
              </p>
              
              {!showResendForm ? (
                <Button 
                  onClick={() => setShowResendForm(true)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar Email de Verificação
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="resend-email">Email</Label>
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleResendVerification}
                      disabled={isResending}
                      size="sm"
                      className="flex-1"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reenviar
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => setShowResendForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Dica:</strong> Verifique também sua pasta de spam/lixo eletrônico
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 