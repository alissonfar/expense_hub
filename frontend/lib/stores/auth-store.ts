import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, User, HubInfo, AuthContext, LoginCredentials, RegisterData, SelectHubData } from '@/types/auth'
import { api } from '@/lib/api'

interface AuthActions {
  // Auth actions
  setUser: (user: User) => void
  setHubs: (hubs: HubInfo[]) => void
  setCurrentHub: (hub: HubInfo & { hubNome?: string }) => void
  setAuthContext: (context: AuthContext) => void
  setTokens: (accessToken: string, refreshToken?: string) => void
  
  // API actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  selectHub: (hubId: number) => Promise<{ success: boolean; error?: string }>
  
  // Loading states
  setLoading: (loading: boolean) => void
  
  // Clear/logout
  clearAuth: () => void
  logout: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  refreshToken: null,
  accessToken: null,
  user: null,
  currentHub: null,
  availableHubs: [],
  isAuthenticated: false,
  isLoading: false,
  authContext: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Actions
      setUser: (user) => set({ user }),
      
      setHubs: (hubs) => set({ availableHubs: hubs }),
      
      setCurrentHub: (hub) => set({ 
        currentHub: hub,
        isAuthenticated: !!hub 
      }),
      
      setAuthContext: (context) => set({ 
        authContext: context,
        isAuthenticated: true 
      }),
      
      setTokens: (accessToken, refreshToken) => {
        const updates: Partial<AuthState> = { accessToken }
        if (refreshToken !== undefined) {
          updates.refreshToken = refreshToken
        }
        set(updates)
        // Sincronizar accessToken no cookie para SSR/middleware
        if (typeof window !== 'undefined') {
          const maxAge = 60 * 60 * 24 * 7; // 7 dias
          document.cookie = `accessToken=${accessToken}; path=/; Max-Age=${maxAge}; SameSite=Lax`;
        }
      },
      
      // =============================================
      // 🔐 API ACTIONS - AUTENTICAÇÃO REAL
      // =============================================
      
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/login', credentials)
          
          if (response.success) {
            const { user, hubs, refreshToken } = response.data
            
            // Salvar no store
            set({
              user,
              availableHubs: hubs,
              refreshToken,
              isLoading: false
            })
            
            // Salvar refresh token no localStorage para persistência
            if (typeof window !== 'undefined') {
              localStorage.setItem('refreshToken', refreshToken)
            }
            
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.message || 'Erro no login' }
          }
        } catch (error: any) {
          set({ isLoading: false })
          console.error('Erro no login:', error)
          
          // Tratar erros específicos do backend
          if (error.error === 'CredenciaisInvalidas') {
            return { success: false, error: 'Email ou senha incorretos' }
          } else if (error.error === 'ConvitePendente') {
            return { success: false, error: 'Você possui um convite pendente. Verifique seu email.' }
          } else {
            return { success: false, error: error.message || 'Erro interno do servidor' }
          }
        }
      },
      
      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true })
          
          const response = await api.post('/auth/register', data)
          
          if (response.success) {
            set({ isLoading: false })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.message || 'Erro no registro' }
          }
        } catch (error: any) {
          set({ isLoading: false })
          console.error('Erro no registro:', error)
          
          // Tratar erros específicos do backend
          if (error.error === 'EmailEmUso') {
            return { success: false, error: 'Este email já está cadastrado' }
          } else if (error.error === 'SenhaFraca') {
            return { success: false, error: 'Escolha uma senha mais segura' }
          } else if (error.error === 'SenhaInvalida') {
            return { success: false, error: error.message || 'Senha inválida' }
          } else {
            return { success: false, error: error.message || 'Erro interno do servidor' }
          }
        }
      },
      
      selectHub: async (hubId: number) => {
        try {
          set({ isLoading: true })
          
          const state = get()
          if (!state.refreshToken) {
            set({ isLoading: false })
            return { success: false, error: 'Refresh token não encontrado' }
          }
          
          // Configurar header com refresh token
          const config = {
            headers: {
              'Authorization': `Bearer ${state.refreshToken}`
            }
          }
          
          const response = await api.post('/auth/select-hub', { hubId }, config)
          
          if (response.success) {
            const { accessToken, hubContext } = response.data
            
            // Salvar no store
            set({
              accessToken,
              currentHub: {
                id: hubContext.id,
                nome: hubContext.nome,
                role: hubContext.role,
                hubNome: hubContext.nome
              },
              authContext: {
                pessoaId: hubContext.pessoaId || state.user?.id || 0,
                hubId: hubContext.id,
                role: hubContext.role,
                dataAccessPolicy: hubContext.dataAccessPolicy,
                ehAdministrador: hubContext.ehAdministrador
              },
              isAuthenticated: true,
              isLoading: false
            })
            
            // Salvar access token no localStorage e cookie
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken)
              const maxAge = 60 * 60 * 24 * 7; // 7 dias
              document.cookie = `accessToken=${accessToken}; path=/; Max-Age=${maxAge}; SameSite=Lax`;
            }
            
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.message || 'Erro ao selecionar hub' }
          }
        } catch (error: any) {
          set({ isLoading: false })
          console.error('Erro ao selecionar hub:', error)
          
          // Tratar erros específicos
          if (error.error === 'TokenInvalido') {
            return { success: false, error: 'Token inválido ou expirado' }
          } else if (error.error === 'AcessoNegado') {
            return { success: false, error: 'Você não tem acesso a este hub' }
          } else {
            return { success: false, error: error.message || 'Erro interno do servidor' }
          }
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      clearAuth: () => set(initialState),
      
      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          // Remover cookie do accessToken
          document.cookie = 'accessToken=; Max-Age=0; path=/;';
        }
        
        // Reset store
        set(initialState)
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
        availableHubs: state.availableHubs,
        currentHub: state.currentHub,
        authContext: state.authContext,
      }),
    }
  )
)

// Seletores úteis
export const useAuth = () => {
  const store = useAuthStore()
  return {
    user: store.user,
    currentHub: store.currentHub,
    availableHubs: store.availableHubs,
    authContext: store.authContext,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    
    // Actions
    setUser: store.setUser,
    setHubs: store.setHubs,
    setCurrentHub: store.setCurrentHub,
    setAuthContext: store.setAuthContext,
    setTokens: store.setTokens,
    setLoading: store.setLoading,
    logout: store.logout,
    
    // API Actions
    login: store.login,
    register: store.register,
    selectHub: store.selectHub,
  }
}

// Seletor para contexto do Hub
export const useHubContext = () => {
  const { currentHub, authContext } = useAuthStore()
  
  return {
    hubId: currentHub?.id,
    hubNome: currentHub?.nome,
    role: authContext?.role,
    dataAccessPolicy: authContext?.dataAccessPolicy,
    ehAdministrador: authContext?.ehAdministrador,
    isOwner: authContext?.role === 'PROPRIETARIO',
    isAdmin: authContext?.role === 'ADMINISTRADOR',
    isCollaborator: authContext?.role === 'COLABORADOR',
    isViewer: authContext?.role === 'VISUALIZADOR',
  }
}

// Seletor para RBAC
export const useRBAC = () => {
  const { role, ehAdministrador } = useAuthStore().authContext || {}
  
  const hasRole = (roles: string[]) => {
    return role ? roles.includes(role) : false
  }
  
  const canCreate = hasRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'])
  const canEdit = hasRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'])
  const canDelete = hasRole(['PROPRIETARIO', 'ADMINISTRADOR'])
  const canManageMembers = hasRole(['PROPRIETARIO', 'ADMINISTRADOR'])
  const canViewReports = hasRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR'])
  
  return {
    role,
    ehAdministrador,
    hasRole,
    canCreate,
    canEdit,
    canDelete,
    canManageMembers,
    canViewReports,
  }
} 