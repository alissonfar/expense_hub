'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRequirePartialAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export default function SelectHubPage() {
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { hubsDisponiveis, selectHub, usuario } = useRequirePartialAuth();
  const { toast } = useToast();

  const handleSelectHub = async (hubId: number) => {
    try {
      setIsLoading(true);
      setSelectedHubId(hubId);
      
      await selectHub(hubId);
      
      toast({
        title: "Hub selecionado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      
      // O redirecionamento será feito pelo AuthContext + middleware
    } catch (error) {
      toast({
        title: "Erro ao selecionar hub",
                  description: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Erro ao acessar o hub. Tente novamente.",
        variant: "destructive",
      });
      setSelectedHubId(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hubsDisponiveis || hubsDisponiveis.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">💰</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Nenhum Hub Disponível
            </CardTitle>
            <CardDescription className="text-gray-600">
              Você não tem acesso a nenhum hub no momento. Entre em contato com um administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">💰</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Selecione seu Hub
            </CardTitle>
            <CardDescription className="text-gray-600">
              Olá, {usuario?.nome}! Escolha o hub que deseja acessar.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {hubsDisponiveis.map((hub) => (
                <div
                  key={hub.id}
                  className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${selectedHubId === hub.id 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/25'
                    }`}
                  onClick={() => !isLoading && handleSelectHub(hub.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {hub.nome}
                      </h3>
                      <Badge 
                        variant={hub.role === 'PROPRIETARIO' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          hub.role === 'PROPRIETARIO' 
                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {hub.role === 'PROPRIETARIO' && 'Proprietário'}
                        {hub.role === 'ADMINISTRADOR' && 'Administrador'}
                        {hub.role === 'COLABORADOR' && 'Colaborador'}
                        {hub.role === 'VISUALIZADOR' && 'Visualizador'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {hub.role === 'PROPRIETARIO' && 'Você é o dono deste hub e tem controle total.'}
                      {hub.role === 'ADMINISTRADOR' && 'Você pode gerenciar usuários e configurações.'}
                      {hub.role === 'COLABORADOR' && 'Você pode criar e editar transações.'}
                      {hub.role === 'VISUALIZADOR' && 'Você pode apenas visualizar dados.'}
                    </p>

                    <Button
                      className={`w-full transition-all duration-200 ${
                        selectedHubId === hub.id && isLoading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                      }`}
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectHub(hub.id);
                      }}
                    >
                      {selectedHubId === hub.id && isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Acessando...
                        </div>
                      ) : (
                        'Acessar Hub'
                      )}
                    </Button>
                  </div>

                  {/* Indicador visual de hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                    selectedHubId === hub.id ? 'opacity-100' : ''
                  }`} />
                </div>
              ))}
            </div>

            {hubsDisponiveis.length === 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  💡 Você tem acesso a apenas um hub. Clique acima para continuar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 