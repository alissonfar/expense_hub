# Arquitetura Frontend - Personal Expense Hub v2.0 (Multi-Tenant)

Este documento define a arquitetura completa, stack tecnológica, padrões e convenções para o frontend do Personal Expense Hub. Serve como fonte da verdade para todos os agentes de IA que trabalharão no desenvolvimento frontend.

---

## 📊 CONTEXTO DO SISTEMA

### Backend Multi-Tenant Existente
- **Arquitetura**: API RESTful com isolamento de dados por Hub (tenant)
- **Autenticação**: JWT em duas etapas (Refresh Token → Access Token específico por Hub)
- **RBAC**: 4 papéis (`PROPRIETARIO`, `ADMINISTRADOR`, `COLABORADOR`, `VISUALIZADOR`) com políticas de acesso
- **Endpoints**: 42+ endpoints organizados por domínio (auth, pessoas, transações, pagamentos, etc.)
- **Domínio**: Sistema financeiro complexo com transações parceladas, múltiplos participantes, relatórios e dashboards

### Requisitos Funcionais Específicos
- **Multi-Tenancy**: Interface deve refletir o contexto do Hub selecionado
- **RBAC Visual**: Componentes condicionais baseados em papéis e políticas
- **Forms Complexos**: Transações com múltiplos participantes, parcelamento, tags
- **Dashboards**: Relatórios financeiros com gráficos e métricas
- **Real-time**: Atualizações de status de pagamentos e transações

---

## 🏗️ STACK TECNOLÓGICA DEFINIDA

### **Core Framework: Next.js 15 + React 18**
```json
{
  "framework": "Next.js 15.3+",
  "react": "18.3+",
  "typescript": "5+",
  "reason": "App Router para multi-tenancy, Server Components para performance, TypeScript nativo"
}
```

### **UI/UX Stack**
```json
{
  "ui_library": "Shadcn/ui + Radix Primitives",
  "styling": "Tailwind CSS 3.4+",
  "icons": "Lucide React",
  "theme": "next-themes para dark/light mode",
  "reason": "Componentes acessíveis, customizáveis, design system consistente"
}
```

### **State Management**
```json
{
  "global_state": "Zustand 4+",
  "server_state": "TanStack Query v5",
  "forms": "React Hook Form + Zod",
  "reason": "Simples, TypeScript-first, cache inteligente, validação compartilhada"
}
```

### **HTTP & API**
```json
{
  "http_client": "Axios 1.6+",
  "api_layer": "TanStack Query para cache e sincronização",
  "type_safety": "Schemas Zod compartilhados com backend",
  "reason": "Interceptors para JWT, retry automático, type safety end-to-end"
}
```

### **Charts & Visualização**
```json
{
  "charts": "Recharts + Tremor",
  "tables": "TanStack Table v8",
  "date_handling": "date-fns",
  "reason": "Performance otimizada, enterprise-grade, TypeScript completo"
}
```

---

## 📁 ESTRUTURA DE PROJETO PADRONIZADA

```
frontend/
├── app/                                    # Next.js App Router
│   ├── globals.css                         # Estilos globais + Tailwind
│   ├── layout.tsx                          # Root layout com providers
│   ├── page.tsx                            # Página inicial (redirect)
│   ├── loading.tsx                         # Loading UI global
│   ├── error.tsx                           # Error boundary global
│   │
│   ├── (auth)/                             # Route Group - Páginas públicas
│   │   ├── layout.tsx                      # Layout para auth (centered)
│   │   ├── login/
│   │   │   └── page.tsx                    # Login form
│   │   ├── register/
│   │   │   └── page.tsx                    # Registro form
│   │   ├── select-hub/
│   │   │   └── page.tsx                    # Seleção de Hub
│   │   └── ativar-convite/
│   │       └── page.tsx                    # Ativação de convite
│   │
│   └── [hubId]/                            # Dynamic route - Contexto de Hub
│       ├── layout.tsx                      # Layout privado (sidebar + header)
│       ├── loading.tsx                     # Loading específico do Hub
│       ├── error.tsx                       # Error handling do Hub
│       │
│       ├── dashboard/
│       │   └── page.tsx                    # Dashboard principal
│       │
│       ├── transacoes/
│       │   ├── page.tsx                    # Lista de transações
│       │   ├── nova/
│       │   │   └── page.tsx                # Criar transação
│       │   └── [id]/
│       │       ├── page.tsx                # Detalhes da transação
│       │       └── editar/
│       │           └── page.tsx            # Editar transação
│       │
│       ├── pagamentos/
│       │   ├── page.tsx                    # Lista de pagamentos
│       │   ├── novo/
│       │   │   └── page.tsx                # Registrar pagamento
│       │   └── [id]/
│       │       └── page.tsx                # Detalhes do pagamento
│       │
│       ├── pessoas/
│       │   ├── page.tsx                    # Membros do Hub
│       │   ├── convites/
│       │   │   └── page.tsx                # Gerenciar convites
│       │   └── [id]/
│       │       └── page.tsx                # Perfil do membro
│       │
│       ├── relatorios/
│       │   ├── page.tsx                    # Relatórios principais
│       │   ├── pendencias/
│       │   │   └── page.tsx                # Pendências
│       │   └── historico/
│       │       └── page.tsx                # Histórico financeiro
│       │
│       ├── tags/
│       │   └── page.tsx                    # Gerenciar tags
│       │
│       └── configuracoes/
│           ├── page.tsx                    # Configurações gerais
│           ├── hub/
│           │   └── page.tsx                # Configurações do Hub
│           └── perfil/
│               └── page.tsx                # Perfil pessoal
│
├── components/                             # Componentes reutilizáveis
│   ├── ui/                                 # Shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...                             # Outros componentes Shadcn
│   │
│   ├── auth/                               # Componentes de autenticação
│   │   ├── ProtectedRoute.tsx              # Route guard
│   │   ├── RoleGuard.tsx                   # Component guard por papel
│   │   ├── LoginForm.tsx                   # Form de login
│   │   └── HubSelector.tsx                 # Seletor de Hub
│   │
│   ├── layout/                             # Componentes de layout
│   │   ├── AppHeader.tsx                   # Header com contexto do Hub
│   │   ├── AppSidebar.tsx                  # Sidebar com navegação
│   │   ├── Breadcrumb.tsx                  # Breadcrumb contextual
│   │   └── HubContextBar.tsx               # Barra de contexto do Hub
│   │
│   ├── forms/                              # Forms específicos do domínio
│   │   ├── TransacaoForm.tsx               # Form de transação
│   │   ├── PagamentoForm.tsx               # Form de pagamento
│   │   ├── PessoaForm.tsx                  # Form de membro
│   │   └── TagForm.tsx                     # Form de tag
│   │
│   ├── charts/                             # Componentes de gráficos
│   │   ├── ExpenseChart.tsx                # Gráfico de gastos
│   │   ├── PaymentStatusChart.tsx          # Status de pagamentos
│   │   ├── TrendChart.tsx                  # Gráfico de tendências
│   │   └── MetricCard.tsx                  # Cards de métricas
│   │
│   ├── tables/                             # Tabelas específicas
│   │   ├── TransacoesTable.tsx             # Tabela de transações
│   │   ├── PagamentosTable.tsx             # Tabela de pagamentos
│   │   └── MembrosTable.tsx                # Tabela de membros
│   │
│   └── common/                             # Componentes comuns
│       ├── LoadingSpinner.tsx              # Loading states
│       ├── EmptyState.tsx                  # Estados vazios
│       ├── ErrorBoundary.tsx               # Error boundaries
│       └── ConfirmDialog.tsx               # Diálogos de confirmação
│
├── lib/                                    # Configurações e utilities
│   ├── api.ts                              # Cliente Axios configurado
│   ├── auth.ts                             # Utils de autenticação
│   ├── utils.ts                            # Utility functions (cn, etc.)
│   ├── constants.ts                        # Constantes da aplicação
│   ├── validations.ts                      # Schemas Zod compartilhados
│   │
│   └── stores/                             # Zustand stores
│       ├── auth-store.ts                   # Store de autenticação
│       ├── hub-store.ts                    # Store de contexto do Hub
│       └── ui-store.ts                     # Store de estado da UI
│
├── hooks/                                  # Custom hooks
│   ├── use-auth.ts                         # Hook de autenticação
│   ├── use-hub-context.ts                  # Hook de contexto do Hub
│   ├── use-rbac.ts                         # Hook para RBAC
│   ├── use-api.ts                          # Hooks para API calls
│   │
│   ├── api/                                # API hooks específicos
│   │   ├── use-transacoes.ts               # Hooks para transações
│   │   ├── use-pagamentos.ts               # Hooks para pagamentos
│   │   ├── use-pessoas.ts                  # Hooks para pessoas
│   │   └── use-relatorios.ts               # Hooks para relatórios
│   │
│   └── ui/                                 # UI hooks
│       ├── use-toast.ts                    # Hook para notificações
│       └── use-mobile.ts                   # Hook para responsividade
│
├── types/                                  # Tipos TypeScript
│   ├── api.ts                              # Tipos de API responses
│   ├── auth.ts                             # Tipos de autenticação
│   ├── hub.ts                              # Tipos de Hub/tenant
│   └── ui.ts                               # Tipos de UI
│
├── utils/                                  # Funções utilitárias
│   ├── format.ts                           # Formatação (datas, moeda)
│   ├── validation.ts                       # Validações customizadas
│   └── helpers.ts                          # Helpers gerais
│
├── styles/                                 # Estilos customizados
│   └── globals.css                         # CSS global + Tailwind
│
└── config/                                 # Arquivos de configuração
    ├── site.ts                             # Configurações do site
    └── api.ts                              # Configurações de API
```

---

## 🔧 PADRÕES DE DESENVOLVIMENTO

### **1. Convenções de Nomenclatura**

```typescript
// COMPONENTES: PascalCase
export const TransacaoForm = () => {}
export const HubSelector = () => {}

// HOOKS: camelCase com 'use' prefix
export const useAuth = () => {}
export const useTransacoes = () => {}

// STORES: kebab-case com '-store' suffix
export const authStore = create<AuthState>()
export const hubStore = create<HubState>()

// TYPES: PascalCase com sufixo descritivo
export interface TransacaoFormData {}
export type ApiResponse<T> = {}

// CONSTANTS: SCREAMING_SNAKE_CASE
export const API_BASE_URL = ''
export const ROLES = {}
```

### **2. Estrutura de Componentes**

```typescript
// TEMPLATE PADRÃO PARA COMPONENTES
import { FC } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  // Props tipadas
  className?: string
  children?: React.ReactNode
}

export const Component: FC<ComponentProps> = ({ 
  className,
  children,
  ...props 
}) => {
  return (
    <div className={cn("base-classes", className)} {...props}>
      {children}
    </div>
  )
}

// Export default apenas para pages
export default Component
```

### **3. Padrão de API Hooks**

```typescript
// TEMPLATE PARA HOOKS DE API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

export const useTransacoes = () => {
  const { hubId } = useAuth()
  
  return useQuery({
    queryKey: ['transacoes', hubId],
    queryFn: () => api.get(`/transacoes`),
    enabled: !!hubId
  })
}

export const useCreateTransacao = () => {
  const queryClient = useQueryClient()
  const { hubId } = useAuth()
  
  return useMutation({
    mutationFn: (data: TransacaoFormData) => api.post('/transacoes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes', hubId] })
    }
  })
}
```

### **4. Padrão de Stores (Zustand)**

```typescript
// TEMPLATE PARA STORES
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StoreState {
  // State
  data: DataType | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setData: (data: DataType) => void
  clearData: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: null,
      isLoading: false,
      error: null,
      
      // Actions
      setData: (data) => set({ data, error: null }),
      clearData: () => set({ data: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'store-name',
      partialize: (state) => ({ data: state.data }) // Apenas persistir o necessário
    }
  )
)
```

---

## 🛡️ PADRÕES DE SEGURANÇA E RBAC

### **1. Autenticação - Fluxo Completo**

```typescript
// AUTH STORE - Gerenciamento de estado de autenticação
interface AuthState {
  // Tokens
  refreshToken: string | null
  accessToken: string | null
  
  // User context
  user: User | null
  currentHub: Hub | null
  availableHubs: Hub[]
  
  // Auth status
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  selectHub: (hubId: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

// FLUXO DE AUTENTICAÇÃO
const authFlow = {
  1: 'POST /auth/login → { refreshToken, hubs[] }',
  2: 'POST /auth/select-hub → { accessToken, hubContext }',
  3: 'Todas as requests → Authorization: Bearer <accessToken>'
}
```

### **2. RBAC - Role-Based Access Control**

```typescript
// TIPOS DE PAPEL E POLÍTICAS
export const ROLES = {
  PROPRIETARIO: 'PROPRIETARIO',
  ADMINISTRADOR: 'ADMINISTRADOR', 
  COLABORADOR: 'COLABORADOR',
  VISUALIZADOR: 'VISUALIZADOR'
} as const

export const DATA_ACCESS_POLICIES = {
  GLOBAL: 'GLOBAL',      // Vê todos os dados do Hub
  INDIVIDUAL: 'INDIVIDUAL' // Vê apenas seus próprios dados
} as const

// HOOK PARA RBAC
export const useRBAC = () => {
  const { user, currentHub } = useAuth()
  
  const hasRole = (roles: Role[]) => {
    return roles.includes(user?.role)
  }
  
  const canAccess = (resource: string, action: string) => {
    // Lógica de permissão baseada em papel e recurso
    return checkPermission(user?.role, resource, action)
  }
  
  const isOwner = user?.role === ROLES.PROPRIETARIO
  const isAdmin = user?.role === ROLES.ADMINISTRADOR
  const isCollaborator = user?.role === ROLES.COLABORADOR
  const isViewer = user?.role === ROLES.VISUALIZADOR
  
  return { hasRole, canAccess, isOwner, isAdmin, isCollaborator, isViewer }
}

// COMPONENTE GUARD
export const RoleGuard: FC<{
  roles: Role[]
  fallback?: React.ReactNode
  children: React.ReactNode
}> = ({ roles, fallback, children }) => {
  const { hasRole } = useRBAC()
  
  if (!hasRole(roles)) {
    return fallback || null
  }
  
  return <>{children}</>
}
```

### **3. Context de Hub - Multi-Tenancy**

```typescript
// HUB CONTEXT PROVIDER
export const HubContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentHub } = useAuth()
  
  if (!currentHub) {
    return <HubSelector />
  }
  
  return (
    <div data-hub-id={currentHub.id} data-hub-name={currentHub.nome}>
      <HubContextBar hub={currentHub} />
      {children}
    </div>
  )
}

// HOOK PARA CONTEXTO DO HUB
export const useHubContext = () => {
  const { currentHub, availableHubs } = useAuth()
  
  const switchHub = async (hubId: string) => {
    await selectHub(hubId)
  }
  
  return {
    currentHub,
    availableHubs,
    switchHub,
    hubId: currentHub?.id,
    hubName: currentHub?.nome
  }
}
```

---

## 📊 PADRÕES DE UI/UX

### **1. Design System - Configuração Tailwind**

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Hub branding colors
        hub: {
          primary: "hsl(var(--hub-primary))",
          secondary: "hsl(var(--hub-secondary))",
        },
        // Semantic colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### **2. Componentes de Layout**

```typescript
// APP HEADER - Contexto do Hub sempre visível
export const AppHeader = () => {
  const { currentHub } = useHubContext()
  const { user } = useAuth()
  
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center px-4">
        <HubBranding hub={currentHub} />
        <nav className="ml-auto flex items-center space-x-4">
          <HubSwitcher />
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  )
}

// SIDEBAR - Navegação contextual
export const AppSidebar = () => {
  const { isOwner, isAdmin } = useRBAC()
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Transações', href: '/transacoes', icon: Receipt },
    { name: 'Pagamentos', href: '/pagamentos', icon: CreditCard },
    { name: 'Pessoas', href: '/pessoas', icon: Users },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart },
    // Configurações apenas para Admin/Owner
    ...(isOwner || isAdmin ? [
      { name: 'Configurações', href: '/configuracoes', icon: Settings }
    ] : [])
  ]
  
  return (
    <aside className="w-64 border-r bg-muted/40">
      <nav className="space-y-2 p-4">
        {navigation.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  )
}
```

### **3. Forms Padronizados**

```typescript
// FORM WRAPPER COM ZODB
export const FormWrapper: FC<{
  schema: z.ZodSchema
  onSubmit: (data: any) => Promise<void>
  children: (form: UseFormReturn) => React.ReactNode
}> = ({ schema, onSubmit, children }) => {
  const form = useForm({
    resolver: zodResolver(schema),
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {children(form)}
      </form>
    </Form>
  )
}

// USAGE EXAMPLE
export const TransacaoForm = () => {
  const { mutate: createTransacao } = useCreateTransacao()
  
  return (
    <FormWrapper
      schema={createGastoSchema} // Schema do backend
      onSubmit={createTransacao}
    >
      {(form) => (
        <>
          <FormField name="descricao" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormInput {...field} />
              <FormMessage />
            </FormItem>
          )} />
          {/* Outros campos */}
          <Button type="submit">Criar Transação</Button>
        </>
      )}
    </FormWrapper>
  )
}
```

---

## 📈 PADRÕES DE PERFORMANCE

### **1. Loading States e Suspense**

```typescript
// LOADING PATTERNS
export const LoadingPattern = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
)

// PAGE LEVEL LOADING
export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-[300px]" />
      <LoadingPattern />
    </div>
  )
}
```

### **2. Error Boundaries**

```typescript
// ERROR BOUNDARY COMPONENT
export const ErrorBoundary: FC<{
  fallback?: React.ComponentType<{ error: Error }>
  children: React.ReactNode
}> = ({ fallback: Fallback = DefaultErrorFallback, children }) => {
  return (
    <ErrorBoundaryProvider fallback={Fallback}>
      {children}
    </ErrorBoundaryProvider>
  )
}

// PAGE LEVEL ERROR
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-xl font-semibold">Algo deu errado!</h2>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
```

### **3. Otimizações TanStack Query**

```typescript
// QUERY CONFIGURATION
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
}

// PREFETCHING PATTERNS
export const usePrefetchDashboard = () => {
  const queryClient = useQueryClient()
  const { hubId } = useHubContext()
  
  const prefetchDashboard = () => {
    // Prefetch dados críticos do dashboard
    queryClient.prefetchQuery({
      queryKey: ['dashboard', hubId],
      queryFn: () => api.get('/relatorios/dashboard'),
    })
  }
  
  return { prefetchDashboard }
}
```

---

## 🧪 PADRÕES DE TESTING (Para Implementação Futura)

### **1. Test Structure**
```
__tests__/
├── components/           # Testes de componentes
├── hooks/               # Testes de hooks
├── pages/               # Testes de páginas
└── utils/               # Testes de utilities
```

### **2. Testing Libraries**
- **Vitest**: Test runner
- **Testing Library**: Component testing
- **MSW**: API mocking
- **Playwright**: E2E testing

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Foundation (Semana 1-2)**
1. ✅ Setup Next.js 15 + TypeScript + Tailwind
2. ✅ Configurar Shadcn/ui
3. ✅ Implementar layout base
4. ✅ Criar sistema de autenticação

### **Fase 2: Core Features (Semana 3-4)**
1. ✅ Dashboard principal
2. ✅ CRUD de transações
3. ✅ CRUD de pagamentos
4. ✅ Gerenciamento de membros

### **Fase 3: Advanced Features (Semana 5-6)**
1. ✅ Relatórios e gráficos
2. ✅ Sistema de tags
3. ✅ Configurações avançadas
4. ✅ Multi-tenant UX completo

### **Fase 4: Polish & Optimization (Semana 7-8)**
1. ✅ Performance optimization
2. ✅ Accessibility improvements
3. ✅ Error handling robusto
4. ✅ Testing implementation

---

## 📝 COMANDOS E SCRIPTS PADRÃO

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## 🔗 REFERÊNCIAS E DEPENDÊNCIAS

### **Dependências Principais** 
```json
{
  "dependencies": {
    "next": "^15.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.0",
    "recharts": "^2.12.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.376.0"
  }
}
```

### **Links Importantes**
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Este documento serve como fonte da verdade para toda implementação frontend. Consulte-o sempre antes de fazer modificações na arquitetura ou padrões estabelecidos.** 