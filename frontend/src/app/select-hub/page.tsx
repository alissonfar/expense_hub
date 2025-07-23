'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEnhancedToast } from '@/components/ui/enhanced-toast';
import { useRequirePartialAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function SelectHubPage() {
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hubName, setHubName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isHubSelecionado, setIsHubSelecionado] = useState(false);
  const auth = useRequirePartialAuth();
  const { showSuccess, showError, showInfo } = useEnhancedToast();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.usuario) {
        router.push('/login');
      }
    };
    checkAuth();
    // LOG EXPRESSIVO DE ESTADO AO MONTAR A PÁGINA
    console.log('%c[SelectHubPage][MOUNT] Estado inicial do contexto', 'color: #1976d2; font-weight: bold;', {
      usuario: auth.usuario,
      hubsDisponiveis: auth.hubsDisponiveis,
      localStorage: {
        accessToken: localStorage.getItem('@PersonalExpenseHub:accessToken'),
        refreshToken: localStorage.getItem('@PersonalExpenseHub:refreshToken'),
        hubAtual: localStorage.getItem('@PersonalExpenseHub:hubAtual'),
        hubsDisponiveis: localStorage.getItem('@PersonalExpenseHub:hubsDisponiveis'),
      },
      cookies: document.cookie
    });
  }, [auth.usuario, router, auth.hubsDisponiveis]);

  const handleSelectHub = async (hubId: number) => {
    try {
      // Buscar refreshToken do localStorage explicitamente
      const refreshToken = localStorage.getItem('@PersonalExpenseHub:refreshToken');
      if (!refreshToken) {
        showError(
          'Erro de autenticação',
          'Token de autenticação não encontrado. Faça login novamente.'
        );
        return;
      }
      // Opcional: passar refreshToken explicitamente para selectHub se necessário
      await auth.selectHub(hubId);
      showSuccess(
        "Hub selecionado com sucesso!",
        "Redirecionando para o dashboard..."
      );
      setIsHubSelecionado(true);
    } catch {
      showError(
        "Erro ao selecionar hub",
        "Erro ao acessar o hub. Tente novamente."
      );
      setSelectedHubId(null);
    }
  };

  // useEffect para reload robusto
  useEffect(() => {
    if (isHubSelecionado && auth.accessToken && auth.hubAtual) {
      window.location.href = '/dashboard';
    }
  }, [isHubSelecionado, auth.accessToken, auth.hubAtual]);

  const handleCreateHub = async () => {
    if (!hubName.trim()) return;
    setIsCreating(true);
    try {
      const novoHub = await auth.createHub(hubName.trim());
      showSuccess(
        'Hub criado com sucesso!', 
        `Você pode agora acessar o hub "${novoHub.nome}".`
      );
      setShowCreateModal(false);
      setHubName('');
      // Selecionar o novo hub automaticamente
      await handleSelectHub(novoHub.id);
    } catch {
      showError('Erro ao criar hub', 'Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      showInfo('Logout realizado', 'Você saiu da sua conta.');
      router.push('/login');
    } catch {
      showError('Erro ao sair', 'Tente novamente.');
    }
  };

  if (!auth.hubsDisponiveis || auth.hubsDisponiveis.length === 0) {
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
              Você não tem acesso a nenhum hub no momento. Crie um novo hub para começar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button onClick={() => setShowCreateModal(true)} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">Criar novo Hub</Button>
          </CardContent>
        </Card>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo Hub</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Nome do Hub"
              value={hubName}
              onChange={e => setHubName(e.target.value)}
              disabled={isCreating}
              maxLength={50}
              className="mb-4"
            />
            <DialogFooter>
              <Button onClick={handleCreateHub} disabled={isCreating || !hubName.trim()} className="bg-blue-600 text-white w-full">
                {isCreating ? 'Criando...' : 'Criar Hub'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full flex justify-end max-w-2xl mx-auto mb-2">
        <Button variant="ghost" onClick={handleLogout} className="text-gray-500 hover:text-blue-700">
          Sair
        </Button>
      </div>
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
              Olá, {auth.usuario?.nome}! Escolha o hub que deseja acessar ou crie um novo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {auth.hubsDisponiveis.map((hub) => (
                <div
                  key={hub.id}
                  className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${selectedHubId === hub.id 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/25'
                    }`}
                  onClick={() => !auth.isLoading && handleSelectHub(hub.id)}
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
                    <p className="text-gray-600 text-sm mb-4">
                      {hub.role === 'PROPRIETARIO' && 'Você é o dono deste hub e tem controle total.'}
                      {hub.role === 'ADMINISTRADOR' && 'Você pode gerenciar usuários e configurações.'}
                      {hub.role === 'COLABORADOR' && 'Você pode criar e editar transações.'}
                      {hub.role === 'VISUALIZADOR' && 'Você pode apenas visualizar dados.'}
                    </p>
                    <Button
                      className={`w-full transition-all duration-200 ${
                        selectedHubId === hub.id && auth.isLoading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                      }`}
                      disabled={auth.isLoading}
                      onClick={e => {
                        e.stopPropagation();
                        handleSelectHub(hub.id);
                      }}
                    >
                      {selectedHubId === hub.id && auth.isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Acessando...
                        </div>
                      ) : (
                        'Acessar Hub'
                      )}
                    </Button>
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                    selectedHubId === hub.id ? 'opacity-100' : ''
                  }`} />
                </div>
              ))}
            </div>
            {/* Botão para criar novo hub sempre visível */}
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShowCreateModal(true)} className="border-blue-500 text-blue-700 hover:bg-blue-50">
                + Criar novo Hub
              </Button>
            </div>
          </CardContent>
        </Card>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo Hub</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Nome do Hub"
              value={hubName}
              onChange={e => setHubName(e.target.value)}
              disabled={isCreating}
              maxLength={50}
              className="mb-4"
            />
            <DialogFooter>
              <Button onClick={handleCreateHub} disabled={isCreating || !hubName.trim()} className="bg-blue-600 text-white w-full">
                {isCreating ? 'Criando...' : 'Criar Hub'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 