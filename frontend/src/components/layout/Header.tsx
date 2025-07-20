'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Settings, User, Building2, ChevronDown, Search, Plus, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function Header() {
  const { usuario, hubAtual, hubsDisponiveis, logout, selectHub, roleAtual } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSwitchingHub, setIsSwitchingHub] = useState(false);
  const [showHubSelector, setShowHubSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtrar hubs baseado na busca
  const filteredHubs = useMemo(() => {
    if (!hubsDisponiveis) return [];
    
    return hubsDisponiveis.filter(hub =>
      hub.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hubsDisponiveis, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredHubs.length / itemsPerPage);
  const paginatedHubs = filteredHubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
      router.push('/login');
    } catch {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleHubSwitch = async (hubId: number) => {
    if (hubId === hubAtual?.id) {
      setShowHubSelector(false);
      return;
    }

    try {
      setIsSwitchingHub(true);
      await selectHub(hubId);
      toast({
        title: "Hub alterado com sucesso!",
        description: "Redirecionando...",
      });
      setShowHubSelector(false);
      // Limpar busca e paginação
      setSearchTerm('');
      setCurrentPage(1);
      // Redirecionar para dashboard após troca
      router.push('/dashboard');
      // Forçar reload para garantir atualização completa
      window.location.reload();
    } catch {
      toast({
        title: "Erro ao trocar hub",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSwitchingHub(false);
    }
  };

  const handleCreateHub = () => {
    setShowHubSelector(false);
    router.push('/configuracoes?tab=hubs');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PROPRIETARIO': return 'Proprietário';
      case 'ADMINISTRADOR': return 'Administrador';
      case 'COLABORADOR': return 'Colaborador';
      case 'VISUALIZADOR': return 'Visualizador';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PROPRIETARIO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ADMINISTRADOR': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COLABORADOR': return 'bg-green-100 text-green-700 border-green-200';
      case 'VISUALIZADOR': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">💰</span>
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Personal Expense Hub
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {/* Botão de Troca Rápida de Hub */}
          <Dialog open={showHubSelector} onOpenChange={setShowHubSelector}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center space-x-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                disabled={isSwitchingHub}
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline max-w-32 truncate">
                  {hubAtual?.nome || 'Selecionar Hub'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Selecionar Hub</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateHub}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              
              {/* Barra de Busca */}
              <div className="flex-shrink-0 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar hubs..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset para primeira página
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de Hubs */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {paginatedHubs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Nenhum hub encontrado.' : 'Nenhum hub disponível.'}
                  </div>
                ) : (
                  paginatedHubs.map((hub) => (
                    <Card
                      key={hub.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        hub.id === hubAtual?.id
                          ? 'ring-2 ring-blue-500 bg-blue-50/50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleHubSwitch(hub.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900 truncate">{hub.nome}</h3>
                              {hub.id === hubAtual?.id && (
                                <Badge variant="default" className="text-xs flex-shrink-0">
                                  Atual
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-xs mt-1 ${getRoleColor(hub.role)}`}
                            >
                              {getRoleLabel(hub.role)}
                            </Badge>
                          </div>
                          {isSwitchingHub && hub.id !== hubAtual?.id && (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {filteredHubs.length} hub{filteredHubs.length !== 1 ? 's' : ''} encontrado{filteredHubs.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt={usuario?.nome} />
                  <AvatarFallback>
                    {usuario?.nome?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{usuario?.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {usuario?.email}
                  </p>
                  {roleAtual && (
                    <Badge
                      variant="secondary"
                      className={`text-xs w-fit ${getRoleColor(roleAtual)}`}
                    >
                      {getRoleLabel(roleAtual)}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              {usuario?.is_god && (
                <DropdownMenuItem onClick={() => router.push('/god')}>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Modo Deus</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 