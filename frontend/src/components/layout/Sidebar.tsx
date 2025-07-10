'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Tag,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral das finanças'
  },
  {
    title: 'Transações',
    href: '/transacoes',
    icon: Receipt,
    description: 'Gastos e receitas'
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: FileText,
    description: 'Análises detalhadas'
  },
  {
    title: 'Membros',
    href: '/membros',
    icon: Users,
    description: 'Gerenciar participantes'
  },
  {
    title: 'Categorias',
    href: '/categorias',
    icon: Tag,
    description: 'Tags e categorias'
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    description: 'Preferências do Hub'
  }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-sm shadow-md"
        onClick={toggleMobile}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "bg-white border-r border-blue-100 h-full flex flex-col shadow-lg",
          "lg:relative fixed inset-y-0 left-0 z-50",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300 ease-in-out"
        )}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-blue-100">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl shadow-md"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Expense Hub
                </h2>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block"
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-blue-50 group relative",
                    isActive && "bg-gradient-primary text-white shadow-md hover:bg-gradient-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive ? "text-white" : "text-blue-600 group-hover:text-blue-700"
                    )}
                  />
                  {!isCollapsed && (
                    <div className="ml-3">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-white" : "text-gray-900"
                      )}>
                        {item.title}
                      </p>
                      {!isActive && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Toggle button */}
        <div className="p-4 border-t border-blue-100 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center hover:bg-blue-50"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick stats (visible when not collapsed) */}
        {!isCollapsed && (
          <div className="p-4 border-t border-blue-100">
            <div className="bg-gradient-primary/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Saldo do mês</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                R$ 2.450,00
              </p>
              <p className="text-xs text-gray-500 mt-1">
                +12% em relação ao mês anterior
              </p>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
} 