"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// =============================================
// 🔧 CONFIGURAÇÃO DO REACT QUERY
// =============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos (anteriormente cacheTime)
      retry: (failureCount, error: any) => {
        // Não retry para erros de autenticação
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry até 3 vezes para outros erros
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Não retry para erros de cliente (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry até 2 vezes para erros de servidor
        return failureCount < 2;
      },
    },
  },
});

// =============================================
// 🎨 THEME PROVIDER CONFIGURATION
// =============================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

function AppThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      themes={["light", "dark", "system"]}
      storageKey="peh-theme" // Personal Expense Hub theme
    >
      {children}
    </ThemeProvider>
  );
}

// =============================================
// 🌐 MAIN PROVIDERS COMPONENT
// =============================================

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        {children}
        
        {/* =============================================
            🛠️ REACT QUERY DEVTOOLS (DEV ONLY)
            ============================================= */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom-left"
            buttonPosition="bottom-left"
          />
        )}
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

// =============================================
// 🎯 QUERY CLIENT EXPORT (para hooks)
// =============================================

export { queryClient }; 