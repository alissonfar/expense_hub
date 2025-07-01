"use client";

import React from "react";
import { useHubGuard } from "@/lib/hooks/useAuthGuard";
import { useHubContext } from "@/lib/stores/auth-store";
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
  const { hubNome, role } = useHubContext();

  // =============================================
  // ⏳ LOADING STATE
  // =============================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Carregando seu hub...
          </p>
        </div>
      </div>
    );
  }

  // =============================================
  // 🚫 ACESSO NEGADO
  // =============================================
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-600 dark:text-red-400">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar este hub.
          </p>
        </div>
      </div>
    );
  }

  // =============================================
  // ✅ LAYOUT PRINCIPAL
  // =============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* =============================================
          📱 MOBILE SIDEBAR OVERLAY
          ============================================= */}
      <div className="lg:hidden">
        <Sidebar />
      </div>

      {/* =============================================
          🖥️ DESKTOP LAYOUT
          ============================================= */}
      <div className="lg:flex">
        {/* =============================================
            📋 SIDEBAR (DESKTOP)
            ============================================= */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Sidebar />
        </div>

        {/* =============================================
            📄 MAIN CONTENT
            ============================================= */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* =============================================
              🎯 HEADER
              ============================================= */}
          <Header 
            hubNome={hubNome || "Hub"}
            role={role || "USUARIO"}
          />

          {/* =============================================
              📄 PAGE CONTENT
              ============================================= */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 