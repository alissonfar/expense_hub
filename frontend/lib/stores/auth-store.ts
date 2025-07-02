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
  
  // Recovery actions
  initializeAuth: () => Promise<void>
  checkAuthStatus: () => Promise<boolean>
  
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
      
      // =============================================
      // 📝 BASIC SETTERS
      // =============================================
      
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
        
        // Sincronizar com localStorage e cookies
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken)
          }
          
          // Cookie para SSR/middleware
          const maxAge = 60 * 60 * 24 * 7; // 7 dias
          document.cookie = `accessToken=${accessToken}; path=/; Max-Age=${maxAge}; SameSite=Lax`;
        }
      },
      
      // =============================================
      // 🔄 RECOVERY & INITIALIZATION
      // =============================================
      
      initializeAuth: async () => {
        try {
          console.log('[AuthStore] Inicializando autenticação...')
          const state = get()
          
          console.log('[AuthStore] Estado atual:', {
            isAuthenticated: state.isAuthenticated,
            hasHub: !!state.currentHub,
            hasAccessToken: !!state.accessToken,
            hasRefreshToken: !!state.refreshToken
          })
          
          // Se já está completamente autenticado, não precisa inicializar
          if (state.isAuthenticated && state.currentHub && state.accessToken && state.authContext) {
            console.log('[AuthStore] Já completamente autenticado:', state.currentHub.nome)
            return
          }
          
          // Recuperar tokens do localStorage
          const storedAccessToken = localStorage.getItem('accessToken')
          const storedRefreshToken = localStorage.getItem('refreshToken')
          
          console.log('[AuthStore] Tokens no localStorage:', {
            hasAccessToken: !!storedAccessToken,
            hasRefreshToken: !!storedRefreshToken
          })
          
          if (!storedRefreshToken) {
            console.log('[AuthStore] Refresh token não encontrado - limpando estado')
            get().clearAuth()
            return
          }
          
          // Se tem refresh token mas falta dados críticos
          if (!storedAccessToken || !state.currentHub || !state.authContext) {
            console.log('[AuthStore] Dados incompletos - tentando recuperar sessão...')
            const recovered = await get().checkAuthStatus()
            if (!recovered) {
              console.log('[AuthStore] Falha na recuperação - limpando estado')
              get().clearAuth()
            }
          } else {
            // Sincronizar access token do localStorage com store
            set({ accessToken: storedAccessToken, isAuthenticated: true })
            console.log('[AuthStore] Access token sincronizado do localStorage')
          }
        } catch (error) {
          console.error('[AuthStore] Erro na inicialização:', error)
          get().clearAuth()
        }
      },
      
      checkAuthStatus: async () => {
        try {
          const state = get()
          const refreshToken = state.refreshToken || localStorage.getItem('refreshToken')
          
          if (!refreshToken) {
            console.log('[AuthStore] Nenhum refresh token encontrado')
            return false
          }
          
          // Se não tem hub atual, não pode fazer check
          if (!state.currentHub?.id) {
            console.log('[AuthStore] Nenhum hub atual para validar')
            return false
          }
          
          // Tentar renovar access token
          const response = await api.post('/auth/select-hub', 
            { hubId: state.currentHub.id },
            {
              headers: {
                'Authorization': `Bearer ${refreshToken}`
              }
            }
          )
          
          if (response.success) {
            const { accessToken, hubContext } = response.data
            
            // Atualizar store
            set({
              accessToken,
              authContext: {
                pessoaId: hubContext.pessoaId || state.user?.id || 0,
                hubId: hubContext.id,
                role: hubContext.role,
                dataAccessPolicy: hubContext.dataAccessPolicy,
                ehAdministrador: hubContext.ehAdministrador
              },
              isAuthenticated: true
            })
            
            // Sincronizar com localStorage
            localStorage.setItem('accessToken', accessToken)
            const maxAge = 60 * 60 * 24 * 7
            document.cookie = `accessToken=${accessToken}; path=/; Max-Age=${maxAge}; SameSite=Lax`
            
            console.log('[AuthStore] Sessão recuperada com sucesso')
            return true
          }
          
          return false
        } catch (error) {
          console.error('[AuthStore] Erro ao verificar status de auth:', error)
          return false
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
            
            // Salvar refresh token no localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('refreshToken', refreshToken)
            }
            
            console.log('[AuthStore] Login bem-sucedido')
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.message || 'Erro no login' }
          }
        } catch (error: any) {
          set({ isLoading: false })
          console.error('[AuthStore] Erro no login:', error)
          
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
            console.log('[AuthStore] Registro bem-sucedido')
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.message || 'Erro no registro' }
          }
        } catch (error: any) {
          set({ isLoading: false })
          console.error('[AuthStore] Erro no registro:', error)
          
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
          console.log('[AuthStore] Iniciando selectHub para hubId:', hubId)
          set({ isLoading: true })
          
          const state = get()
          const refreshToken = state.refreshToken || localStorage.getItem('refreshToken')
          
          console.log('[AuthStore] Estado atual:', {
            storeRefreshToken: !!state.refreshToken,
            localStorageRefreshToken: !!localStorage.getItem('refreshToken'),
            finalRefreshToken: !!refreshToken,
            refreshTokenPreview: refreshToken ? refreshToken.substring(0, 50) + '...' : 'nenhum'
          })
          
          if (!refreshToken) {
            console.error('[AuthStore] Refresh token não encontrado!')
            set({ isLoading: false })
            return { success: false, error: 'Refresh token não encontrado' }
          }
          
          // Configurar header com refresh token
          const config = {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          }
          
          console.log('[AuthStore] Enviando requisição select-hub com config:', {
            hubId,
            hasAuthHeader: !!config.headers.Authorization,
            authHeaderPreview: config.headers.Authorization.substring(0, 50) + '...'
          })
          
          const response = await api.post('/auth/select-hub', { hubId }, config)
          
          console.log('[AuthStore] Resposta do select-hub:', {
            success: response.success,
            hasAccessToken: !!response.data?.accessToken,
            hasHubContext: !!response.data?.hubContext
          })
          
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
            
            console.log('[AuthStore] Hub selecionado com sucesso:', hubContext.nome)
            return { success: true }
          } else {
            set({ isLoading: false })
            console.error('[AuthStore] Falha na resposta do select-hub:', response)
            return { success: false, error: response.message || 'Erro ao selecionar hub' }
          }
        } catch (error: any) {
          set({ isLoading: false })
          console.error('[AuthStore] Erro ao selecionar hub:', {
            error: error,
            message: error.message,
            errorType: error.error,
            stack: error.stack
          })
          
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
      
      clearAuth: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          // Remover cookie do accessToken
          document.cookie = 'accessToken=; Max-Age=0; path=/;';
        }
        
        // Reset store
        set(initialState)
        console.log('[AuthStore] Auth limpo')
      },
      
      logout: () => {
        get().clearAuth()
        
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
        accessToken: state.accessToken, // INCLUÍDO na persistência
        user: state.user,
        availableHubs: state.availableHubs,
        currentHub: state.currentHub,
        authContext: state.authContext,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrate: (state) => {
        console.log('[AuthStore] Estado recarregado do localStorage')
        if (state) {
          // Inicializar autenticação quando store for recarregado
          setTimeout(() => {
            console.log('[AuthStore] Executando initializeAuth após hidratação')
            state.initializeAuth()
          }, 50) // Delay reduzido para sincronizar com useHubGuard
        }
      },
    }
  )
)

// =============================================
// 🎯 SELETORES E HOOKS UTILITÁRIOS
// =============================================

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
    
    // Recovery Actions
    initializeAuth: store.initializeAuth,
    checkAuthStatus: store.checkAuthStatus,
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