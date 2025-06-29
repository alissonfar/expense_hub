# Guia de Implementação Frontend - Personal Expense Hub

Este documento complementa o `FRONTEND_ARCHITECTURE.md` fornecendo receitas práticas, exemplos de código e guias step-by-step para implementação rápida e consistente.

---

## 🚀 QUICK START - Setup Inicial

### **1. Criação do Projeto**

```bash
# Criar projeto Next.js
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd frontend

# Instalar dependências principais
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install zustand @tanstack/react-query axios react-hook-form @hookform/resolvers
npm install zod date-fns lucide-react class-variance-authority clsx tailwind-merge
npm install next-themes @radix-ui/react-toast recharts

# Instalar Shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog table form toast tabs select
```

> **Atenção:** Sempre use React 18 (`^18.3.0`) e Next.js 15+ para máxima compatibilidade com todas as bibliotecas do ecossistema.

### **2. Configuração Inicial**

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar moeda brasileira
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para formatar datas
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}
```

```typescript
// lib/constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const ROLES = {
  PROPRIETARIO: 'PROPRIETARIO',
  ADMINISTRADOR: 'ADMINISTRADOR',
  COLABORADOR: 'COLABORADOR',
  VISUALIZADOR: 'VISUALIZADOR'
} as const

export const ROUTES = {
  LOGIN: '/login',
  SELECT_HUB: '/select-hub',
  DASHBOARD: '/dashboard',
  TRANSACOES: '/transacoes',
  PAGAMENTOS: '/pagamentos',
  PESSOAS: '/pessoas',
  RELATORIOS: '/relatorios',
  CONFIGURACOES: '/configuracoes'
} as const
```

---

## 🔐 IMPLEMENTAÇÃO DO SISTEMA DE AUTH

### **1. Auth Store (Zustand)**

```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'

interface User {
  id: number
  nome: string
  email: string
  ehAdministrador: boolean
}

interface Hub {
  id: number
  nome: string
  role: string
  dataAccessPolicy?: string
}

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
  login: (email: string, senha: string) => Promise<{ success: boolean; hubs?: Hub[] }>
  selectHub: (hubId: number) => Promise<boolean>
  logout: () => void
  setTokens: (refresh: string, access?: string) => void
  refreshAccessToken: () => Promise<boolean>
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
      login: async (email: string, senha: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            senha
          })
          
          const { user, hubs, refreshToken } = response.data.data
          
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
        } catch (error) {
          set({ isLoading: false })
          return { success: false }
        }
      },
      
      // Seleção de Hub - Segunda etapa
      selectHub: async (hubId: number) => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        
        set({ isLoading: true })
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/select-hub`,
            { hubId },
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )
          
          const { accessToken, hubContext } = response.data.data
          
          set({
            accessToken,
            currentHub: hubContext,
            isAuthenticated: true,
            isLoading: false
          })
          
          return true
        } catch (error) {
          set({ isLoading: false })
          return false
        }
      },
      
      // Logout
      logout: () => {
        set({
          refreshToken: null,
          accessToken: null,
          user: null,
          currentHub: null,
          availableHubs: [],
          isAuthenticated: false
        })
      },
      
      // Definir tokens
      setTokens: (refresh: string, access?: string) => {
        set({
          refreshToken: refresh,
          accessToken: access,
          isAuthenticated: !!access
        })
      },
      
      // Refresh token
      refreshAccessToken: async () => {
        const { refreshToken, currentHub } = get()
        if (!refreshToken || !currentHub) return false
        
        try {
          const success = await get().selectHub(currentHub.id)
          return success
        } catch (error) {
          get().logout()
          return false
        }
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
```

### **2. API Client com Interceptors**

```typescript
// lib/api.ts
import axios from 'axios'
import { useAuthStore } from '@/lib/stores/auth-store'
import { API_BASE_URL } from '@/lib/constants'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor - Adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Refresh token automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const { refreshAccessToken } = useAuthStore.getState()
      const success = await refreshAccessToken()
      
      if (success) {
        const { accessToken } = useAuthStore.getState()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } else {
        // Redirect para login
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
```

### **3. Auth Hooks**

```typescript
// hooks/use-auth.ts
import { useAuthStore } from '@/lib/stores/auth-store'
import { ROLES } from '@/lib/constants'

export const useAuth = () => {
  const store = useAuthStore()
  
  return {
    ...store,
    // Computed properties
    isOwner: store.currentHub?.role === ROLES.PROPRIETARIO,
    isAdmin: store.currentHub?.role === ROLES.ADMINISTRADOR,
    isCollaborator: store.currentHub?.role === ROLES.COLABORADOR,
    isViewer: store.currentHub?.role === ROLES.VISUALIZADOR,
    
    // Helper methods
    hasRole: (roles: string[]) => {
      return store.currentHub ? roles.includes(store.currentHub.role) : false
    },
    
    canManageMembers: () => {
      const role = store.currentHub?.role
      return role === ROLES.PROPRIETARIO || role === ROLES.ADMINISTRADOR
    },
    
    canCreateTransactions: () => {
      const role = store.currentHub?.role
      return role !== ROLES.VISUALIZADOR
    }
  }
}
```

---

## 🔒 COMPONENTES DE PROTEÇÃO

### **1. Route Guards**

```typescript
// components/auth/ProtectedRoute.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  roles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  roles = []
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login')
        return
      }
      
      if (roles.length > 0 && !hasRole(roles)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, isLoading, hasRole, roles, requireAuth, router])
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (requireAuth && !isAuthenticated) {
    return null
  }
  
  if (roles.length > 0 && !hasRole(roles)) {
    return null
  }
  
  return <>{children}</>
}
```

### **2. Component Guards**

```typescript
// components/auth/RoleGuard.tsx
import { useAuth } from '@/hooks/use-auth'

interface RoleGuardProps {
  roles: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  fallback = null,
  children
}) => {
  const { hasRole } = useAuth()
  
  if (!hasRole(roles)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Uso
<RoleGuard roles={['PROPRIETARIO', 'ADMINISTRADOR']}>
  <DeleteButton />
</RoleGuard>
```

---

## 📊 SISTEMA DE API HOOKS

### **1. Base Query Hook**

```typescript
// hooks/api/use-api-query.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

export const useApiQuery = <T>(
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  const { currentHub } = useAuth()
  
  return useQuery<T>({
    queryKey: [endpoint, currentHub?.id],
    queryFn: async () => {
      const response = await api.get(endpoint)
      return response.data.data
    },
    enabled: !!currentHub,
    ...options
  })
}
```

### **2. Hooks Específicos**

```typescript
// hooks/api/use-transacoes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

export const useTransacoes = (filters?: Record<string, any>) => {
  const { currentHub } = useAuth()
  
  return useQuery({
    queryKey: ['transacoes', currentHub?.id, filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString()
      const response = await api.get(`/transacoes?${params}`)
      return response.data.data
    },
    enabled: !!currentHub
  })
}

export const useCreateTransacao = () => {
  const queryClient = useQueryClient()
  const { currentHub } = useAuth()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/transacoes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', currentHub?.id] })
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar transação",
        variant: "destructive"
      })
    }
  })
}

export const useDeleteTransacao = () => {
  const queryClient = useQueryClient()
  const { currentHub } = useAuth()
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/transacoes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', currentHub?.id] })
      toast({
        title: "Sucesso",
        description: "Transação removida com sucesso!"
      })
    }
  })
}
```

---

## 🎨 COMPONENTES DE LAYOUT

### **1. Layout Principal**

```typescript
// app/[hubId]/layout.tsx
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { HubContextProvider } from '@/components/layout/HubContextProvider'

export default function HubLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { hubId: string }
}) {
  return (
    <ProtectedRoute>
      <HubContextProvider hubId={params.hubId}>
        <div className="min-h-screen bg-background">
          <AppHeader />
          <div className="flex">
            <AppSidebar />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </HubContextProvider>
    </ProtectedRoute>
  )
}
```

### **2. Header com Contexto**

```typescript
// components/layout/AppHeader.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Building, ChevronDown, User, LogOut } from 'lucide-react'

export const AppHeader = () => {
  const { currentHub, availableHubs, selectHub, logout, user } = useAuth()
  
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-4">
          <Building className="h-6 w-6" />
          <span className="font-semibold">{currentHub?.nome}</span>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          {/* Seletor de Hub */}
          {availableHubs.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Trocar Hub <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {availableHubs.map((hub) => (
                  <DropdownMenuItem
                    key={hub.id}
                    onClick={() => selectHub(hub.id)}
                    className={hub.id === currentHub?.id ? 'bg-accent' : ''}
                  >
                    {hub.nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user?.nome}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
```

### **3. Sidebar com RBAC**

```typescript
// components/layout/AppSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Receipt, 
  CreditCard, 
  Users, 
  BarChart, 
  Tags, 
  Settings 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: [] },
  { name: 'Transações', href: '/transacoes', icon: Receipt, roles: [] },
  { name: 'Pagamentos', href: '/pagamentos', icon: CreditCard, roles: [] },
  { name: 'Pessoas', href: '/pessoas', icon: Users, roles: [] },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart, roles: [] },
  { name: 'Tags', href: '/tags', icon: Tags, roles: ['PROPRIETARIO', 'ADMINISTRADOR'] },
  { name: 'Configurações', href: '/configuracoes', icon: Settings, roles: ['PROPRIETARIO', 'ADMINISTRADOR'] },
]

export const AppSidebar = () => {
  const pathname = usePathname()
  const { hasRole, currentHub } = useAuth()
  
  const filteredNavigation = navigation.filter(item => 
    item.roles.length === 0 || hasRole(item.roles)
  )
  
  return (
    <aside className="w-64 border-r bg-muted/40">
      <nav className="space-y-2 p-4">
        {filteredNavigation.map((item) => {
          const href = `/${currentHub?.id}${item.href}`
          const isActive = pathname === href
          
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

---

## 📝 FORMS COM REACT HOOK FORM + ZOD

### **1. Schema Compartilhado**

```typescript
// lib/validations.ts
import { z } from 'zod'

export const transacaoSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor_total: z.number().positive('Valor deve ser positivo'),
  data_transacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  participantes: z.array(z.object({
    pessoa_id: z.number(),
    valor_devido: z.number().positive()
  })).min(1, 'Deve ter pelo menos um participante'),
  tags: z.array(z.number()).optional()
})

export type TransacaoFormData = z.infer<typeof transacaoSchema>
```

### **2. Componente de Form**

```typescript
// components/forms/TransacaoForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transacaoSchema, TransacaoFormData } from '@/lib/validations'
import { useCreateTransacao } from '@/hooks/api/use-transacoes'
import { Button } from '@/components/ui/button'
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface TransacaoFormProps {
  onSuccess?: () => void
}

export const TransacaoForm: React.FC<TransacaoFormProps> = ({ onSuccess }) => {
  const { mutate: createTransacao, isPending } = useCreateTransacao()
  
  const form = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      descricao: '',
      valor_total: 0,
      data_transacao: new Date().toISOString().split('T')[0],
      participantes: [],
      tags: []
    }
  })
  
  const handleSubmit = (data: TransacaoFormData) => {
    createTransacao(data, {
      onSuccess: () => {
        form.reset()
        onSuccess?.()
      }
    })
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Digite a descrição..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="valor_total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="data_transacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar Transação'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 📊 COMPONENTES DE DASHBOARD

### **1. Metric Cards**

```typescript
// components/charts/MetricCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'currency' | 'number'
  trend?: 'up' | 'down' | 'neutral'
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  format = 'currency',
  trend
}) => {
  const formattedValue = format === 'currency' 
    ? formatCurrency(value)
    : value.toLocaleString('pt-BR')
  
  const percentChange = previousValue 
    ? ((value - previousValue) / previousValue) * 100
    : 0
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend && (
          trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {previousValue && (
          <p className="text-xs text-muted-foreground">
            {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% desde o período anterior
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### **2. Dashboard Layout**

```typescript
// app/[hubId]/dashboard/page.tsx
'use client'

import { useApiQuery } from '@/hooks/api/use-api-query'
import { MetricCard } from '@/components/charts/MetricCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardData {
  gastos_mes: number
  receitas_mes: number
  saldo_atual: number
  transacoes_pendentes: number
}

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useApiQuery<DashboardData>('/relatorios/dashboard')
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!dashboardData) {
    return <div>Erro ao carregar dados</div>
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gastos do Mês"
          value={dashboardData.gastos_mes}
          trend="down"
        />
        <MetricCard
          title="Receitas do Mês"
          value={dashboardData.receitas_mes}
          trend="up"
        />
        <MetricCard
          title="Saldo Atual"
          value={dashboardData.saldo_atual}
        />
        <MetricCard
          title="Transações Pendentes"
          value={dashboardData.transacoes_pendentes}
          format="number"
        />
      </div>
      
      {/* Gráficos e tabelas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Gráfico aqui */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabela aqui */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 🔧 PROVIDERS E CONFIGURAÇÃO

### **1. Root Layout Provider**

```typescript
// app/layout.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        retry: 3,
      },
    },
  }))
  
  return (
    <html lang="pt-BR">
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

---

## 🧪 RECEITAS DE CÓDIGO COMUNS

### **1. Loading States**

```typescript
// components/common/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react'

export const LoadingSpinner = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[size]
  
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`animate-spin ${sizeClass}`} />
    </div>
  )
}
```

### **2. Empty States**

```typescript
// components/common/EmptyState.tsx
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

### **3. Confirm Dialog**

```typescript
// components/common/ConfirmDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

**Este guia fornece todas as receitas e padrões necessários para implementar o frontend de forma rápida e consistente. Use-o como referência durante o desenvolvimento.** 