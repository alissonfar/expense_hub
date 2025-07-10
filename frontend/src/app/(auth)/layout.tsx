'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hubAtual } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !hubAtual) {
        router.push('/login');
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

  if (!isAuthenticated || !hubAtual) {
    return null;
  }

  return (
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
  );
} 