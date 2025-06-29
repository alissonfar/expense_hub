# 📋 Frontend Documentation Index - Personal Expense Hub

Este é o ponto de entrada para toda documentação frontend do Personal Expense Hub. Use este índice para navegar rapidamente pelos documentos de acordo com sua necessidade.

---

## 🎯 DOCUMENTOS PRINCIPAIS

### **📊 [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)**
**Fonte da verdade para arquitetura e padrões**

**Quando usar:** 
- ✅ Definindo stack tecnológica
- ✅ Estabelecendo padrões de código
- ✅ Entendendo estrutura do projeto
- ✅ Consultando convenções de nomenclatura

**Conteúdo:**
- Stack tecnológica completa (Next.js 14, Shadcn/ui, Zustand, etc.)
- Estrutura de projeto detalhada
- Padrões de desenvolvimento e convenções
- Sistema RBAC e multi-tenancy
- Padrões de performance e segurança

---

### **🛠️ [FRONTEND_IMPLEMENTATION_GUIDE.md](./FRONTEND_IMPLEMENTATION_GUIDE.md)**
**Receitas práticas e exemplos de código**

**Quando usar:**
- ✅ Implementando funcionalidades específicas
- ✅ Precisando de templates de código
- ✅ Criando componentes padronizados
- ✅ Configurando hooks e stores

**Conteúdo:**
- Setup inicial detalhado
- Sistema de autenticação completo
- Componentes de layout e proteção
- API hooks com TanStack Query
- Forms com React Hook Form + Zod
- Exemplos de dashboard e componentes

---

### **✅ [FRONTEND_SETUP_CHECKLIST.md](./FRONTEND_SETUP_CHECKLIST.md)**
**Checklist passo-a-passo para setup inicial**

**Quando usar:**
- ✅ Iniciando projeto do zero
- ✅ Configurando ambiente de desenvolvimento
- ✅ Validando instalação e configurações
- ✅ Preparando projeto para desenvolvimento

**Conteúdo:**
- Pré-requisitos e dependências
- Comandos de instalação completos
- Configuração de arquivos essenciais
- Estrutura de pastas obrigatória
- Checklist de validação

---

## 🚀 QUICK START

### **Para Agentes de IA - Fluxo Recomendado:**

#### **1. Primeiro Contato** 
```
Ler: FRONTEND_ARCHITECTURE.md (seções 1-3)
Objetivo: Entender contexto e stack escolhida
```

#### **2. Setup do Projeto**
```
Seguir: FRONTEND_SETUP_CHECKLIST.md (completo)
Objetivo: Configurar ambiente e estrutura base
```

#### **3. Implementação**
```
Consultar: FRONTEND_IMPLEMENTATION_GUIDE.md (conforme necessidade)
Objetivo: Implementar funcionalidades usando receitas prontas
```

#### **4. Padrões e Convenções**
```
Referenciar: FRONTEND_ARCHITECTURE.md (seções 4-8)
Objetivo: Manter consistência e qualidade
```

---

## 📁 ESTRUTURA DE ARQUIVOS (Quick Reference)

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas públicas (login, select-hub)
│   └── [hubId]/           # Páginas privadas por Hub
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Shadcn/ui components
│   ├── auth/             # Autenticação e proteção
│   ├── layout/           # Layout (header, sidebar)
│   ├── forms/            # Formulários específicos
│   └── common/           # Componentes comuns
├── lib/                  # Configurações e utilities
│   └── stores/           # Zustand stores
├── hooks/                # Custom hooks
│   └── api/             # API hooks (TanStack Query)
└── types/               # Tipos TypeScript
```

---

## 🔧 STACK TECNOLÓGICA (Quick Reference)

| Categoria | Tecnologia | Versão | Uso |
|-----------|------------|---------|-----|
| **Framework** | Next.js | 15+ | App Router, SSR, Performance |
| **UI Library** | Shadcn/ui | Latest | Componentes acessíveis e customizáveis |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **State (Global)** | Zustand | 4+ | State management simples |
| **State (Server)** | TanStack Query | 5+ | Cache e sincronização de API |
| **HTTP Client** | Axios | 1.6+ | Requisições com interceptors |
| **Forms** | React Hook Form | 7+ | Performance e validação |
| **Validation** | Zod | 3+ | Type-safe validation |
| **Charts** | Recharts | 2+ | Gráficos React performantes |
| **React** | 18.3+ | Base para todo o frontend |

> **Atenção:** Sempre use React 18 (`^18.3.0`) e Next.js 15+ para máxima compatibilidade com todas as bibliotecas do ecossistema.

---

## 🔐 FLUXO DE AUTENTICAÇÃO (Quick Reference)

```typescript
// 1. Login inicial
POST /auth/login → { refreshToken, hubs[] }

// 2. Seleção de Hub
POST /auth/select-hub → { accessToken, hubContext }

// 3. Requests autenticadas
Authorization: Bearer <accessToken>

// 4. Refresh automático
401 → refresh token → retry request
```

---

## 🛡️ RBAC SYSTEM (Quick Reference)

```typescript
// Papéis disponíveis
PROPRIETARIO   // Acesso total
ADMINISTRADOR  // Gerenciamento do Hub
COLABORADOR    // Operações limitadas (GLOBAL/INDIVIDUAL)
VISUALIZADOR   // Apenas leitura

// Uso em componentes
<RoleGuard roles={['PROPRIETARIO', 'ADMINISTRADOR']}>
  <DeleteButton />
</RoleGuard>

// Uso em hooks
const { isOwner, hasRole } = useAuth()
```

---

## 📊 PADRÕES DE COMPONENTES (Quick Reference)

### **Nomenclatura**
```typescript
// Componentes: PascalCase
export const TransacaoForm = () => {}

// Hooks: camelCase com 'use'
export const useTransacoes = () => {}

// Stores: camelCase com '-store'
export const authStore = create<AuthState>()
```

### **Estrutura de Arquivo**
```typescript
'use client' // Se necessário

import { FC } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export const Component: FC<ComponentProps> = ({ 
  className,
  children 
}) => {
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  )
}
```

---

## 🚦 COMANDOS ESSENCIAIS (Quick Reference)

```bash
# Desenvolvimento
npm run dev              # Iniciar dev server
npm run build           # Build de produção
npm run type-check      # Verificar TypeScript

# Shadcn/ui
npx shadcn-ui@latest add [component]  # Adicionar componente

# Dependências comuns
npm install zustand @tanstack/react-query axios
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react date-fns
```

---

## 🎯 DECISÕES ARQUITETURAIS

### **Por que Next.js 14?**
- App Router para roteamento multi-tenant natural
- Server Components para performance
- TypeScript nativo e otimizações automáticas

### **Por que Shadcn/ui?**
- Componentes acessíveis por padrão (Radix Primitives)
- Customização total via Tailwind
- Copy-paste approach (sem dependência extra)

### **Por que Zustand + TanStack Query?**
- Zustand: Simples, TypeScript-first, ideal para estado local
- TanStack Query: Cache inteligente, sincronização automática de server state

### **Por que React Hook Form + Zod?**
- Performance otimizada (menos re-renders)
- Reutilização de schemas do backend
- Type safety end-to-end

---

## 📝 TEMPLATES RÁPIDOS

### **Nova Página**
```typescript
export default function PageName() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Título</h1>
      {/* Conteúdo */}
    </div>
  )
}
```

### **Novo Hook de API**
```typescript
export const useEntity = () => {
  const { currentHub } = useAuth()
  
  return useQuery({
    queryKey: ['entity', currentHub?.id],
    queryFn: () => api.get('/entity'),
    enabled: !!currentHub
  })
}
```

### **Novo Componente**
```typescript
interface ComponentProps {
  title: string
  children?: React.ReactNode
}

export const Component: FC<ComponentProps> = ({ title, children }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
```

---

## 🚧 STATUS DO PROJETO

### **✅ Documentação Completa**
- [x] Arquitetura definida
- [x] Stack tecnológica escolhida
- [x] Padrões estabelecidos
- [x] Guias de implementação
- [x] Checklist de setup

### **🚀 Próximos Passos**
- [ ] Setup inicial do projeto
- [ ] Implementação do sistema de auth
- [ ] Páginas principais (dashboard, transações)
- [ ] Funcionalidades avançadas

---

**🎯 Este índice garante que qualquer agente de IA possa começar a trabalhar no frontend imediatamente, seguindo os padrões estabelecidos e consultando a documentação adequada para cada situação.** 