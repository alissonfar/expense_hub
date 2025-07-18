'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hubAtual, isSwitchingHub } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Permitir acesso à página /select-hub mesmo autenticado
      const isSelectHubPage = typeof window !== 'undefined' && window.location.pathname === '/select-hub';
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!hubAtual && !isSelectHubPage) {
        // Se não tem hub selecionado e não está em /select-hub, redireciona para /select-hub
        router.push('/select-hub');
      }
    }
  }, [isAuthenticated, isLoading, hubAtual, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Permitir acesso à /select-hub mesmo autenticado
  const isSelectHubPage = typeof window !== 'undefined' && window.location.pathname === '/select-hub';
  if (!isAuthenticated) {
    return null;
  }
  if (!hubAtual && !isSelectHubPage) {
    return null;
  }

  return (
    <>
      {/* Overlay de loading durante troca de hub */}
      <LoadingOverlay 
        isVisible={isSwitchingHub} 
        message="Trocando de Hub..." 
      />
      
      <div className="flex h-screen bg-gradient-subtle">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Page content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-subtle">
            <div className="container mx-auto px-6 py-8 animate-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
} 