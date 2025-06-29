import { useAuthStore } from '@/lib/stores/auth-store'

/**
 * Hook personalizado para autenticação
 * Interface conveniente para o store Zustand
 */
export const useAuth = () => {
  const store = useAuthStore()
  
  return {
    // Estado
    user: store.user,
    currentHub: store.currentHub,
    availableHubs: store.availableHubs,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    refreshToken: store.refreshToken,
    accessToken: store.accessToken,
    
    // Ações
    login: store.login,
    register: store.register,
    selectHub: store.selectHub,
    logout: store.logout,
    refreshAccessToken: store.refreshAccessToken,
    
    // Getters de conveniência
    isOwner: store.isOwner(),
    isAdmin: store.isAdmin(),
    hasRole: store.hasRole,
    
    // Informações do Hub atual
    hubId: store.currentHub?.id,
    hubName: store.currentHub?.nome,
    userRole: store.currentHub?.role,
    
    // Validações úteis
    canManageUsers: store.hasRole(['PROPRIETARIO', 'ADMINISTRADOR']),
    canCreateTransactions: store.hasRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR']),
    canViewReports: store.isAuthenticated,
    
    // Estados úteis
    needsHubSelection: !store.isLoading && store.user && !store.currentHub && store.availableHubs.length > 1,
    hasMultipleHubs: store.availableHubs.length > 1,
  }
}

export default useAuth 