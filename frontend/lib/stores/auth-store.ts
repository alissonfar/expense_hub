import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiPublic } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import type { 
  User, 
  Hub, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  HubSelectResponse 
} from '@/types'

interface AuthState {
  // Estado
  refreshToken: string | null
  accessToken: string | null
  user: User | null
  currentHub: Hub | null
  availableHubs: Hub[]
  isAuthenticated: boolean
  isLoading: boolean
  
  // Ações
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; hubs?: Hub[] }>
  register: (data: RegisterData) => Promise<void>
  selectHub: (hubId: number) => Promise<boolean>
  logout: (silent?: boolean) => void
  setTokens: (refresh: string, access?: string) => void
  refreshAccessToken: () => Promise<boolean>
  
  // Getters
  isOwner: () => boolean
  isAdmin: () => boolean
  hasRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      refreshToken: null,
      accessToken: null,
      user: null,
      currentHub: null,
      availableHubs: [],
      isAuthenticated: false,
      isLoading: false,
      
      // Login - Primeira etapa
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await apiPublic.post<{ data: AuthResponse }>(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials
          )
          
          const { user, hubs, refreshToken } = response.data.data
          
          // Limpar estado anterior
          get().logout(true)
          
          set({
            user,
            availableHubs: hubs,
            refreshToken,
            isLoading: false
          })
          
          // Se só tem um hub, selecionar automaticamente
          if (hubs.length === 1) {
            const success = await get().selectHub(hubs[0].id)
            return { success }
          }
          
          return { success: true, hubs }
        } catch (error: unknown) {
          set({ isLoading: false })
          const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login'
          throw new Error(errorMessage)
        }
      },
      
      // Registro
      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          await apiPublic.post('/auth/register', data)
          set({ isLoading: false })
        } catch (error: unknown) {
          set({ isLoading: false })
          const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta'
          throw new Error(errorMessage)
        }
      },
      
      // Seleção de Hub - Segunda etapa
      selectHub: async (hubId: number) => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        
        set({ isLoading: true })
        try {
          const response = await apiPublic.post<{ data: HubSelectResponse }>(
            API_ENDPOINTS.AUTH.SELECT_HUB,
            { hubId },
            { 
              headers: { Authorization: `Bearer ${refreshToken}` } 
            }
          )
          
          const { accessToken, hubContext } = response.data.data
          
          // Salvar no localStorage para interceptor da API
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', accessToken)
          }
          
          set({
            accessToken,
            currentHub: hubContext,
            isAuthenticated: true,
            isLoading: false
          })
          
          return true
        } catch (error: unknown) {
          set({ isLoading: false })
          const errorMessage = error instanceof Error ? error.message : 'Erro ao selecionar Hub'
          throw new Error(errorMessage)
        }
      },
      
      // Logout
      logout: (silent = false) => {
        // Limpar localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('selected_hub')
        }
        
        set({
          refreshToken: null,
          accessToken: null,
          user: null,
          currentHub: null,
          availableHubs: [],
          isAuthenticated: false,
          isLoading: false
        })
        
        // Redirecionar para login se não for logout silencioso
        if (!silent && typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },
      
      // Definir tokens
      setTokens: (refresh: string, access?: string) => {
        set({ refreshToken: refresh })
        if (access) {
          set({ accessToken: access })
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access)
          }
        }
      },
      
      // Refresh do access token
      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        
        try {
          const response = await apiPublic.post<{ data: { accessToken: string } }>(
            API_ENDPOINTS.AUTH.REFRESH,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )
          
          const { accessToken } = response.data.data
          get().setTokens(refreshToken, accessToken)
          return true
        } catch {
          get().logout()
          return false
        }
      },
      
      // Getters
      isOwner: () => {
        const { currentHub } = get()
        return currentHub?.role === 'PROPRIETARIO'
      },
      
      isAdmin: () => {
        const { currentHub } = get()
        return ['PROPRIETARIO', 'ADMINISTRADOR'].includes(currentHub?.role || '')
      },
      
      hasRole: (roles: string[]) => {
        const { currentHub } = get()
        return roles.includes(currentHub?.role || '')
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
        availableHubs: state.availableHubs,
        currentHub: state.currentHub
      })
    }
  )
) 