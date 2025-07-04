'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { isLoading, isAuthenticated, usuario, hubAtual, hubsDisponiveis } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Personal Expense Hub
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status de Autenticação */}
            <Card>
              <CardHeader>
                <CardTitle>Status de Autenticação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium">Autenticado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isAuthenticated ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium">Hub Selecionado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      hubAtual ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {hubAtual ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  
                  {usuario && (
                    <div>
                      <span className="font-medium">Usuário:</span>
                      <span className="ml-2 text-gray-700">{usuario.nome}</span>
                    </div>
                  )}
                  
                  {hubAtual && (
                    <div>
                      <span className="font-medium">Hub Atual:</span>
                      <span className="ml-2 text-gray-700">{hubAtual.nome}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hubs Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Hubs Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                {hubsDisponiveis.length > 0 ? (
                  <div className="space-y-2">
                    {hubsDisponiveis.map((hub) => (
                      <div key={hub.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{hub.nome}</div>
                          <div className="text-sm text-gray-600">Hub ID: {hub.id}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {hub.id === hubAtual?.id ? 'Atual' : 'Disponível'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum hub disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="mt-8 text-center">
            <div className="space-x-4">
              {!isAuthenticated ? (
                <>
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Fazer Login
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/register'}
                    variant="outline"
                  >
                    Criar Conta
                  </Button>
                </>
              ) : !hubAtual ? (
                <Button 
                  onClick={() => window.location.href = '/select-hub'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Selecionar Hub
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Ir para Dashboard
                </Button>
              )}
            </div>
          </div>

          {/* Informações do Sistema */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Sistema de Autenticação Multi-Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Contexto de Autenticação:</strong> ✅ Implementado
                </p>
                <p>
                  <strong>Hooks Personalizados:</strong> ✅ Implementado
                </p>
                <p>
                  <strong>Middleware de Rotas:</strong> ✅ Implementado
                </p>
                <p>
                  <strong>Refresh Token Automático:</strong> ✅ Implementado
                </p>
                <p>
                  <strong>Persistência Local:</strong> ✅ Implementado
                </p>
                <p>
                  <strong>Multi-tenancy:</strong> ✅ Implementado
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
