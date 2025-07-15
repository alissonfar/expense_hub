'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Building2,
  Check,
  Search,
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,

} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock de notificações - em produção viriam da API
const mockNotifications = [
  {
    id: 1,
    title: 'Nova transação',
    description: 'João adicionou uma despesa de R$ 150,00',
    time: '5 min atrás',
    type: 'transaction',
    read: false,
    icon: TrendingDown,
    iconColor: 'text-red-600'
  },
  {
    id: 2,
    title: 'Convite aceito',
    description: 'Maria aceitou seu convite para o Hub',
    time: '1 hora atrás',
    type: 'invite',
    read: false,
    icon: Check,
    iconColor: 'text-green-600'
  },
  {
    id: 3,
    title: 'Meta atingida!',
    description: 'Você economizou R$ 500 este mês',
    time: '2 horas atrás',
    type: 'achievement',
    read: true,
    icon: TrendingUp,
    iconColor: 'text-blue-600'
  }
];

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const { usuario, hubAtual, hubsDisponiveis, logout } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isDark, setIsDark] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível fazer logout.',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: 'Notificações marcadas como lidas',
    });
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Implementar toggle de tema aqui
    toast({
      title: `Tema ${!isDark ? 'escuro' : 'claro'} ativado`,
      description: 'Funcionalidade em desenvolvimento',
    });
  };

  const userInitials = usuario?.nome
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="bg-white border-b border-blue-100 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Hub selector */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className="flex items-center space-x-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
              onClick={() => { 
                console.log('%c[Header][Botão Voltar SelectHub] Clique detectado', 'color: #1976d2; font-weight: bold;', {
                  usuario,
                  hubAtual,
                  hubsDisponiveis,
                  localStorage: {
                    accessToken: localStorage.getItem('@PersonalExpenseHub:accessToken'),
                    refreshToken: localStorage.getItem('@PersonalExpenseHub:refreshToken'),
                    hubAtual: localStorage.getItem('@PersonalExpenseHub:hubAtual'),
                    hubsDisponiveis: localStorage.getItem('@PersonalExpenseHub:hubsDisponiveis'),
                  },
                  cookies: document.cookie
                });
                router.push('/select-hub'); 
              }}
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{hubAtual?.nome || 'Selecionar Hub'}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Search (desktop only) */}
            <div className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar transações..."
                className="pl-10 pr-4 py-2 w-64 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-blue-50"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-blue-600" />
              ) : (
                <Moon className="h-5 w-5 text-blue-600" />
              )}
            </Button>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-blue-50"
                >
                  <Bell className="h-5 w-5 text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-0">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Notificações</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs hover:bg-blue-50"
                      >
                        Marcar todas como lidas
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100",
                            !notification.read && "bg-blue-50/30"
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "p-2 rounded-lg bg-gray-100",
                              !notification.read && "bg-blue-100"
                            )}>
                              <notification.icon className={cn(
                                "h-4 w-4",
                                notification.iconColor
                              )} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-blue-50 px-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium">
                    {usuario?.nome}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{usuario?.nome}</p>
                    <p className="text-xs text-muted-foreground">{usuario?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push('/perfil')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/configuracoes')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 