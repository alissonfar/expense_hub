'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Tags, 
  DollarSign, 
  BarChart3,
  Settings
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral e métricas'
  },
  {
    name: 'Transações',
    href: '/transacoes',
    icon: CreditCard,
    description: 'Gerenciar gastos e receitas'
  },
  {
    name: 'Pessoas',
    href: '/pessoas',
    icon: Users,
    description: 'Membros do hub'
  },
  {
    name: 'Tags',
    href: '/tags',
    icon: Tags,
    description: 'Categorias e etiquetas'
  },
  {
    name: 'Pagamentos',
    href: '/pagamentos',
    icon: DollarSign,
    description: 'Sistema de quitação'
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
    description: 'Análises e gráficos'
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    description: 'Configurações do hub'
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Informações do Hub */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p className="font-medium">Personal Expense Hub</p>
          <p>Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
} 