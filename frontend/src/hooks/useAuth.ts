import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Hook básico (re-exporta o context)
export { useAuth } from '@/contexts/AuthContext';

// Hook para páginas que requerem autenticação
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}

// Hook para páginas que requerem seleção de hub
export function useRequireHub() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        router.push('/login');
      } else if (!auth.hubAtual) {
        router.push('/select-hub');
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.hubAtual, router]);

  return auth;
}

// Hook para páginas de autenticação (redireciona se já autenticado)
export function useGuestOnly() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      if (auth.hubAtual) {
        router.push('/dashboard');
      } else {
        router.push('/select-hub');
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.hubAtual, router]);

  return auth;
}

// Hook para verificar permissões
export function usePermissions() {
  const auth = useAuth();

  const hasRole = (requiredRole: string) => {
    if (!auth.roleAtual) return false;
    
    const roleHierarchy = {
      'PROPRIETARIO': 4,
      'ADMINISTRADOR': 3,
      'COLABORADOR': 2,
      'VISUALIZADOR': 1
    };
    
    const userRoleLevel = roleHierarchy[auth.roleAtual as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userRoleLevel >= requiredRoleLevel;
  };

  const canCreate = () => hasRole('COLABORADOR');
  const canEdit = () => hasRole('COLABORADOR');
  const canDelete = () => hasRole('ADMINISTRADOR');
  const canManageUsers = () => hasRole('ADMINISTRADOR');
  const canManageHub = () => hasRole('PROPRIETARIO');
  const canCreateReceita = () => hasRole('PROPRIETARIO');

  return {
    hasRole,
    canCreate,
    canEdit,
    canDelete,
    canManageUsers,
    canManageHub,
    canCreateReceita,
    isProprietario: hasRole('PROPRIETARIO'),
    isAdministrador: hasRole('ADMINISTRADOR'),
    isColaborador: hasRole('COLABORADOR'),
    isVisualizador: auth.roleAtual === 'VISUALIZADOR'
  };
}

// Hook para estado de carregamento global
export function useAuthLoading() {
  const { isLoading } = useAuth();
  return isLoading;
}

// Hook para informações do usuário atual
export function useCurrentUser() {
  const { usuario, hubAtual } = useAuth();
  
  return {
    usuario,
    hubAtual,
    isLoggedIn: Boolean(usuario),
    hasSelectedHub: Boolean(hubAtual)
  };
}

// Hook para verificar se as ações estão bloqueadas durante troca de hub
export function useBlockedActions() {
  const { isSwitchingHub, isLoading } = useAuth();
  
  return {
    isBlocked: isSwitchingHub || isLoading,
    isSwitchingHub,
    isLoading,
    // Função helper para desabilitar elementos
    disabledProps: {
      disabled: isSwitchingHub || isLoading,
      className: isSwitchingHub || isLoading ? 'opacity-50 cursor-not-allowed' : ''
    }
  };
}

// Hook para páginas que requerem autenticação parcial (login feito, mas hub não selecionado)
export function useRequirePartialAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só redireciona se isLoading for false E refreshToken/usuario realmente não existirem
    if (!auth.isLoading) {
      // Se refreshToken ou usuario ainda são undefined/null, redireciona
      if (!auth.refreshToken || !auth.usuario) {
        // Pequeno delay para garantir que contexto foi populado (evita race condition)
        const timeout = setTimeout(() => {
          if (!auth.refreshToken || !auth.usuario) {
            router.push('/login');
          }
        }, 50); // 50ms é suficiente para a maioria dos casos
        return () => clearTimeout(timeout);
      }
    }
  }, [auth.isLoading, auth.refreshToken, auth.usuario, router]);

  return auth;
} 