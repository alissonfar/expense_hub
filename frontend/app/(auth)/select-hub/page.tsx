"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Plus, Users, ArrowRight, Settings, LogOut, Crown, Shield, UserCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast, ToastContainer } from "@/lib/hooks/useToast";
import type { HubInfo } from "@/types/auth";

// =============================================
// 🏢 HUB SELECTION PAGE COMPONENT
// =============================================

export default function SelectHubPage() {
  const router = useRouter();
  const { user, availableHubs, logout, selectHub } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHubId, setLoadingHubId] = useState<string | null>(null);
  const toast = useToast();

  // =============================================
  // 🔄 HUB SELECTION HANDLER
  // =============================================

  const handleHubSelect = async (hub: HubInfo) => {
    console.log('[SelectHub] Iniciando seleção do hub:', hub);
    try {
      setIsLoading(true);
      setLoadingHubId(String(hub.id));
      
      // Selecionar hub no store
      console.log('[SelectHub] Chamando selectHub com hubId:', hub.id);
      const result = await selectHub(hub.id);
      console.log('[SelectHub] Resultado de selectHub:', result);
      
      // Logar estado do store após selectHub
      const storeState = useAuthStore.getState();
      console.log('[SelectHub] Estado do store após selectHub:', {
        currentHub: storeState.currentHub,
        accessToken: storeState.accessToken,
        isAuthenticated: storeState.isAuthenticated
      });
      
      if (result.success) {
        toast.success(`Hub "${hub.nome}" selecionado!`);
        console.log('[SelectHub] Preparando para redirecionar para dashboard:', `/${hub.id}/dashboard`);
        await new Promise(r => setTimeout(r, 100));
        router.push(`/${hub.id}/dashboard`);
        console.log('[SelectHub] router.push chamado para:', `/${hub.id}/dashboard`);
      } else {
        toast.error(result.error || "Erro ao acessar hub");
        setLoadingHubId(null);
        console.error('[SelectHub] Falha ao selecionar hub:', result.error);
      }
    } catch (error: any) {
      console.error('[SelectHub] Erro inesperado ao selecionar hub:', error);
      toast.error("Erro inesperado ao acessar hub");
      setLoadingHubId(null);
    } finally {
      setIsLoading(false);
      console.log('[SelectHub] Finalizou seleção do hub. isLoading:', false, 'loadingHubId:', null);
    }
  };

  // =============================================
  // 🔄 LOGOUT HANDLER
  // =============================================

  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso");
    router.push("/auth/login");
  };

  // =============================================
  // 🎨 ROLE ICON HELPER
  // =============================================

  const getRoleIcon = (papel: string) => {
    switch (papel) {
      case "PROPRIETARIO":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "ADMINISTRADOR":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "COLABORADOR":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "VISUALIZADOR":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (papel: string) => {
    switch (papel) {
      case "PROPRIETARIO":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "ADMINISTRADOR":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "COLABORADOR":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "VISUALIZADOR":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // =============================================
  // 🎨 RENDER
  // =============================================

  if (!user) {
    return null; // Evita flash antes do redirect
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* =============================================
          📱 HEADER
          ============================================= */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Personal Expense Hub</h1>
                <p className="text-sm text-muted-foreground">Selecione um hub</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium">{user.nome}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* =============================================
          📱 MAIN CONTENT
          ============================================= */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* =============================================
              🎨 WELCOME SECTION
              ============================================= */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Bem-vindo, {user.nome.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-lg">
              Escolha um hub para gerenciar suas finanças
            </p>
          </div>

          {/* =============================================
              🏢 HUBS GRID
              ============================================= */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableHubs && availableHubs.length > 0 ? (
              availableHubs.map((hub) => (
                <Card
                  key={hub.id}
                  className="group glass-effect hover-lift cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => !isLoading && handleHubSelect(hub)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white group-hover:scale-110 transition-transform">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {hub.nome}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {hub.role.charAt(0) + hub.role.slice(1).toLowerCase()}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Role Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(hub.role)}`}>
                        {getRoleIcon(hub.role)}
                        {hub.role}
                      </div>
                      
                      {String(loadingHubId) === String(hub.id) ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Acessando...
                        </div>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      )}
                    </div>

                    {/* Hub Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-sm font-medium">Ativo</p>
                        <p className="text-xs text-muted-foreground">Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum hub encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  Você ainda não faz parte de nenhum hub financeiro.
                </p>
                <Button asChild>
                  <Link href="/auth/register">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeiro hub
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* =============================================
              ➕ CREATE NEW HUB CARD
              ============================================= */}
          {availableHubs && availableHubs.length > 0 && (
            <Card className="glass-effect hover-lift cursor-pointer group">
              <CardContent className="p-8">
                <Link href="/auth/register" className="block">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-dashed border-2 border-dashed border-primary/30 text-primary group-hover:border-primary group-hover:bg-primary/5 transition-all">
                        <Plus className="h-8 w-8" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Criar novo hub</h3>
                      <p className="text-muted-foreground">
                        Comece um novo espaço de gestão financeira
                      </p>
                    </div>
                    
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar hub
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* =============================================
              🔗 ADDITIONAL ACTIONS
              ============================================= */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-border/50">
            <Button variant="outline" asChild>
              <Link href="/profile">
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar perfil
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/help">
                Precisa de ajuda?
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* =============================================
          📄 FOOTER
          ============================================= */}
      <footer className="border-t border-border/40 bg-background/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Personal Expense Hub. Todos os direitos reservados.
            </p>
            
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                Termos
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacidade
              </Link>
              <Link href="/support" className="text-muted-foreground hover:text-foreground">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
  </>
  );
} 