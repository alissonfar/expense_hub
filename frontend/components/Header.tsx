"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  Crown,
  Shield,
  UserCheck,
  Eye
} from "lucide-react";
import { useAuth } from "@/lib/stores/auth-store";

// =============================================
// 🎯 HEADER COMPONENT
// =============================================

interface HeaderProps {
  hubNome: string;
  role: string;
}

export function Header({ hubNome, role }: HeaderProps) {
  const { user } = useAuth();

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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Hub Info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <span className="text-sm font-semibold">
                {hubNome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {hubNome}
              </h1>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {getRoleIcon(role)}
                <span className="capitalize">
                  {role.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transações, tags..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* User Avatar */}
          <Button variant="ghost" size="sm" className="lg:hidden">
            <User className="h-5 w-5" />
          </Button>

          {/* Desktop User Info */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.nome || "Usuário"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email || "email@exemplo.com"}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 