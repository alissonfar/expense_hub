"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { 
  Building2, 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Receipt,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Moon,
  Sun,
  Beaker
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useHubContext } from "@/lib/stores/auth-store";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// =============================================
// 📋 TYPES
// =============================================

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
  requiredRoles?: string[];
}

// =============================================
// 📋 SIDEBAR COMPONENT
// =============================================

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hubMenuOpen, setHubMenuOpen] = useState(false);
  
  const { 
    user, 
    currentHub, 
    availableHubs, 
    logout, 
    selectHub 
  } = useAuth();
  
  const { role } = useHubContext();
  const hubId = params.hubId as string;

  // =============================================
  // 📋 NAVIGATION ITEMS
  // =============================================
  
  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: `/${hubId}/dashboard`,
      icon: LayoutDashboard,
      description: "Visão geral das finanças"
    },
    {
      name: "Transações",
      href: `/${hubId}/transactions`,
      icon: Receipt,
      description: "Receitas e despesas",
      requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR", "COLABORADOR", "VISUALIZADOR"]
    },
    {
      name: "Pagamentos",
      href: `/${hubId}/payments`,
      icon: CreditCard,
      description: "Parcelamentos e quitações",
      requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR", "COLABORADOR", "VISUALIZADOR"]
    },
    {
      name: "Tags",
      href: `/${hubId}/tags`,
      icon: Tag,
      description: "Categorias e etiquetas",
      requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR", "COLABORADOR"]
    },
    {
      name: "Relatórios",
      href: `/${hubId}/reports`,
      icon: BarChart3,
      description: "Análises e insights",
      requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR", "COLABORADOR", "VISUALIZADOR"]
    },
    {
      name: "Membros",
      href: `/${hubId}/members`,
      icon: Users,
      description: "Gerenciar equipe",
      requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR"]
    },
    {
      name: "Configurações",
      href: `/${hubId}/settings`,
      icon: Settings,
      description: "Preferências do hub",
      requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR"]
    }
  ];

  // Adicionar rota de teste apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    navigationItems.push({
      name: 'Test Elements',
      href: `/${hubId}/test-elements`,
      icon: Beaker,
      description: 'Componentes de teste (dev only)'
    });
  }

  // Filtrar itens baseado em papéis
  const visibleNavItems = navigationItems.filter(item => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(role || "");
  });

  // =============================================
  // 🔄 HANDLERS
  // =============================================
  
  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso");
  };

  const handleHubChange = async (newHubId: number) => {
    if (newHubId === Number(hubId)) return;
    
    const result = await selectHub(newHubId);
    if (result.success) {
      setHubMenuOpen(false);
    } else {
      toast.error(result.error || "Erro ao trocar hub");
    }
  };

  // =============================================
  // 🎨 ROLE HELPERS
  // =============================================

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "PROPRIETARIO":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "ADMINISTRADOR":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "COLABORADOR":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "VISUALIZADOR":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // =============================================
  // 🎨 RENDER
  // =============================================
  
  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Hub Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <button
                onClick={() => setHubMenuOpen(!hubMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold truncate text-gray-900 dark:text-white">
                    {currentHub?.nome || "Hub"}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    {getRoleIcon(role || "")}
                    <span className="truncate capitalize">
                      {role?.toLowerCase() || "usuário"}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${hubMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Hub Selector Dropdown */}
              {hubMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">SEUS HUBS</p>
                    {availableHubs?.map((hub) => (
                      <button
                        key={hub.id}
                        onClick={() => handleHubChange(hub.id)}
                        className={`
                          w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors
                          ${hub.id === Number(hubId) ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                        `}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                            {hub.nome}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {hub.role.toLowerCase()}
                          </p>
                        </div>
                      </button>
                    ))}
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <Link
                        href="/select-hub"
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400"
                        onClick={() => setHubMenuOpen(false)}
                      >
                        <Building2 className="h-4 w-4" />
                        Ver todos os hubs
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate text-gray-900 dark:text-white">
                    {user?.nome || "Usuário"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || "email@exemplo.com"}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10">
                  <div className="p-2">
                    <Link
                      href="/profile"
                      className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400"
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="h-4 w-4" />
                          Modo claro
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4" />
                          Modo escuro
                        </>
                      )}
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-red-600 dark:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Close dropdown when clicking outside */}
      {(userMenuOpen || hubMenuOpen) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setUserMenuOpen(false);
            setHubMenuOpen(false);
          }}
        />
      )}
    </>
  );
} 