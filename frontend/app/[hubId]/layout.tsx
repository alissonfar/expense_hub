"use client";

import React, { useState } from "react";
import { useHubGuard } from "@/lib/hooks/useAuthGuard";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";

// =============================================
// 🏢 HUB LAYOUT COMPONENT
// =============================================

export default function HubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { hubId: string };
}) {
  // =============================================
  // 🔐 VERIFICAR AUTENTICAÇÃO E ACESSO AO HUB
  // =============================================
  // Next.js 15+: params é um objeto, não uma Promise
  const { hubId } = params;
  const { hasAccess, isLoading } = useHubGuard(hubId);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // =============================================
  // ⏳ LOADING STATE
  // =============================================
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // =============================================
  // 🚫 ACESSO NEGADO
  // =============================================
  
  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para ver este hub.</p>
        </div>
      </div>
    );
  }

  // =============================================
  // ✅ LAYOUT PRINCIPAL
  // =============================================
  
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        className="hidden lg:flex fixed h-full z-30"
      />

      {/* Mobile Sidebar Logic */}
      {isMobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar
            isCollapsed={false} // Always expanded on mobile
            onToggleCollapse={() => {}}
            className="fixed z-50 lg:hidden"
          />
        </>
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60'
        }`}
      >
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:px-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 