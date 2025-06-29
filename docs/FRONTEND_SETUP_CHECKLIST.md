# Frontend Setup Checklist - Personal Expense Hub

Este documento fornece um checklist completo para setup e configuração inicial do frontend. Use-o para garantir que todos os passos essenciais sejam executados corretamente.

---

## ✅ PRÉ-REQUISITOS

### **Ambiente de Desenvolvimento**
- [ ] Node.js 18.17+ instalado
- [ ] npm 9+ ou yarn 1.22+ 
- [ ] Git configurado
- [ ] Editor com TypeScript/React support (VS Code recomendado)

### **Backend Requirements**
- [ ] Backend rodando em `http://localhost:3001`
- [ ] API endpoints funcionando (testar com `/api/auth/info`)
- [ ] Banco de dados configurado e migrado
- [ ] Documentação da API disponível

---

## 🚀 SETUP INICIAL (Passo a Passo)

### **1. Criação do Projeto**

```bash
# ✅ Executar na pasta raiz do projeto
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

cd frontend
```

### **2. Instalação de Dependências**

```bash
# ✅ Dependências UI/UX
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-form

# ✅ State Management
npm install zustand @tanstack/react-query

# ✅ HTTP Client
npm install axios

# ✅ Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# ✅ Utilities
npm install date-fns lucide-react class-variance-authority clsx tailwind-merge

# ✅ Charts & Tables
npm install recharts @tanstack/react-table

# ✅ Theme System
npm install next-themes

# ✅ Development Dependencies
npm install -D @types/node
```

### **3. Configuração Shadcn/ui**

```bash
# ✅ Inicializar Shadcn/ui
npx shadcn-ui@latest init

# ✅ Instalar componentes base
npx shadcn-ui@latest add button input card dialog table form toast tabs select textarea label checkbox alert-dialog skeleton dropdown-menu

# ✅ Verificar se foi criado: components/ui/
```

### **4. Estrutura de Pastas**

```bash
# ✅ Criar estrutura de pastas
mkdir -p components/{auth,layout,forms,charts,tables,common}
mkdir -p lib/{stores}
mkdir -p hooks/{api,ui}
mkdir -p types
mkdir -p utils
mkdir -p config
```

### **5. Arquivos de Configuração**

#### **✅ tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### **✅ next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
}

module.exports = nextConfig
```

#### **✅ .env.local**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### **✅ tsconfig.json** (verificar se paths estão corretos)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 📁 ESTRUTURA DE ARQUIVOS OBRIGATÓRIA

### **✅ Criar Arquivos Base**

#### **lib/utils.ts**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}
```

#### **lib/constants.ts**
```typescript
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

export type Role = typeof ROLES[keyof typeof ROLES]
```

#### **types/index.ts**
```typescript
export interface User {
  id: number
  nome: string
  email: string
  ehAdministrador: boolean
}

export interface Hub {
  id: number
  nome: string
  role: string
  dataAccessPolicy?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  error: string
  message: string
  timestamp: string
}
```

---

## 🔐 SETUP DO SISTEMA DE AUTENTICAÇÃO

### **✅ 1. Auth Store**

Criar `lib/stores/auth-store.ts` com o código do FRONTEND_IMPLEMENTATION_GUIDE.md

### **✅ 2. API Client**

Criar `lib/api.ts` com o código do FRONTEND_IMPLEMENTATION_GUIDE.md

### **✅ 3. Auth Hooks**

Criar `hooks/use-auth.ts` com o código do FRONTEND_IMPLEMENTATION_GUIDE.md

---

## 🎨 SETUP DO LAYOUT

### **✅ 1. Root Layout**

#### **app/layout.tsx**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal Expense Hub',
  description: 'Sistema de gestão financeira multi-tenant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

#### **components/providers.tsx**
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            retry: 3,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

### **✅ 2. Homepage (Redirect)**

#### **app/page.tsx**
```typescript
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function HomePage() {
  const { isAuthenticated, currentHub, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (currentHub) {
        router.push(`/${currentHub.id}/dashboard`)
      } else {
        router.push('/select-hub')
      }
    }
  }, [isAuthenticated, currentHub, isLoading, router])

  return <LoadingSpinner />
}
```

### **✅ 3. Auth Layout**

#### **app/(auth)/layout.tsx**
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="max-w-md w-full space-y-8 p-8">
        {children}
      </div>
    </div>
  )
}
```

### **✅ 4. Hub Layout**

#### **app/[hubId]/layout.tsx**
Usar o código do FRONTEND_IMPLEMENTATION_GUIDE.md

---

## 🚦 COMPONENTES ESSENCIAIS

### **✅ 1. Loading Spinner**

#### **components/common/LoadingSpinner.tsx**
```typescript
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default',
  className 
}) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }[size]
  
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className={`animate-spin ${sizeClass}`} />
    </div>
  )
}
```

### **✅ 2. Protected Route**

Criar `components/auth/ProtectedRoute.tsx` com o código do FRONTEND_IMPLEMENTATION_GUIDE.md

### **✅ 3. App Header**

Criar `components/layout/AppHeader.tsx` com o código do FRONTEND_IMPLEMENTATION_GUIDE.md

### **✅ 4. App Sidebar**

Criar `components/layout/AppSidebar.tsx` com o código do FRONTEND_IMPLEMENTATION_GUIDE.md

---

## ✅ PÁGINAS INICIAIS

### **✅ 1. Login Page**

#### **app/(auth)/login/page.tsx**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(email, senha)
      
      if (result.success) {
        if (result.hubs && result.hubs.length > 1) {
          router.push('/select-hub')
        } else {
          // Se só tem um hub, será redirecionado automaticamente
          router.push('/')
        }
      } else {
        toast({
          title: 'Erro',
          description: 'Email ou senha incorretos',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer login',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### **✅ 2. Hub Selection Page**

#### **app/(auth)/select-hub/page.tsx**
```typescript
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building } from 'lucide-react'

export default function SelectHubPage() {
  const { availableHubs, selectHub } = useAuth()
  const router = useRouter()

  const handleSelectHub = async (hubId: number) => {
    const success = await selectHub(hubId)
    if (success) {
      router.push(`/${hubId}/dashboard`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecionar Hub</CardTitle>
        <CardDescription>
          Escolha o Hub que deseja acessar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availableHubs.map((hub) => (
            <Button
              key={hub.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelectHub(hub.id)}
            >
              <Building className="mr-2 h-4 w-4" />
              {hub.nome}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### **✅ 3. Dashboard Page**

#### **app/[hubId]/dashboard/page.tsx**
```typescript
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Em construção...</p>
    </div>
  )
}
```

---

## 🧪 TESTES DE FUNCIONAMENTO

### **✅ Checklist de Validação**

Após o setup completo, verificar:

1. **Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```
   - [ ] Servidor inicia sem erros
   - [ ] Página carrega em http://localhost:3000
   - [ ] Não há erros no console

2. **Build de Produção**
   ```bash
   npm run build
   ```
   - [ ] Build completa sem erros
   - [ ] Não há warnings críticos de TypeScript

3. **Navegação Básica**
   - [ ] Redirect automático para /login funciona
   - [ ] Formulário de login é exibido corretamente
   - [ ] Componentes Shadcn/ui funcionam

4. **Integração com Backend**
   - [ ] Login consegue se conectar com API
   - [ ] Interceptors de token funcionam
   - [ ] Error handling funciona

---

## 📝 PRÓXIMOS PASSOS

Após completar este checklist:

1. **Implementar páginas principais**
   - Transações (lista, criar, editar)
   - Pagamentos (lista, registrar)
   - Pessoas (membros, convites)

2. **Adicionar funcionalidades avançadas**
   - Gráficos e relatórios
   - Sistema de tags
   - Configurações

3. **Otimizações**
   - Performance
   - Acessibilidade
   - Tests

---

**✅ CHECKPOINT: Todos os itens marcados garantem que o frontend está pronto para desenvolvimento ativo.** 