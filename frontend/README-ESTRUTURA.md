# 🏗️ Estrutura de Pastas - Frontend Multi-Tenant

Esta documentação descreve a estrutura de pastas modular criada para o Personal Expense Hub Frontend.

## 📁 Estrutura Completa

```
frontend/
├── app/                                    # Next.js 15 App Router
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
│   │   ├── button.tsx                      # ✅ CRIADO
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
│   ├── api.ts                              # ✅ CRIADO - Cliente Axios
│   ├── utils.ts                            # ✅ CRIADO - Utility functions
│   ├── constants.ts                        # Constantes da aplicação
│   ├── validations.ts                      # Schemas Zod compartilhados
│   │
│   └── stores/                             # Zustand stores
│       ├── auth-store.ts                   # ✅ CRIADO - Store de autenticação
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
│   ├── auth.ts                             # ✅ CRIADO - Tipos de autenticação
│   ├── api.ts                              # Tipos de API responses
│   ├── hub.ts                              # Tipos de Hub/tenant
│   └── ui.ts                               # Tipos de UI
│
├── utils/                                  # Funções utilitárias
│   ├── format.ts                           # Formatação (datas, moeda)
│   ├── validation.ts                       # Validações customizadas
│   └── helpers.ts                          # Helpers gerais
│
├── styles/                                 # Estilos customizados
│   └── globals.css                         # ✅ CRIADO - CSS global + Tailwind
│
├── config/                                 # Arquivos de configuração
│   ├── site.ts                             # Configurações do site
│   └── api.ts                              # Configurações de API
│
├── package.json                            # ✅ CRIADO - Dependências
├── tsconfig.json                           # ✅ CRIADO - Config TypeScript
├── tailwind.config.ts                      # ✅ CRIADO - Config Tailwind
├── next.config.mjs                         # ✅ CRIADO - Config Next.js
├── postcss.config.mjs                      # ✅ CRIADO - Config PostCSS
└── .env.example                            # Variáveis de ambiente
```

## 🔧 Arquivos de Configuração Criados

### ✅ **Configurações Principais**
- `package.json` - Dependências compatíveis (Next.js 15, React 18, TypeScript 5+)
- `tsconfig.json` - TypeScript configurado com paths absolutos
- `tailwind.config.ts` - Tailwind com tema personalizado e cores financeiras
- `next.config.mjs` - Next.js 15 com otimizações e segurança
- `postcss.config.mjs` - PostCSS para Tailwind e Autoprefixer

### ✅ **Estrutura Base**
- `app/globals.css` - Estilos globais com variáveis CSS customizadas
- `lib/utils.ts` - Utilitários para formatação e helpers
- `lib/api.ts` - Cliente Axios configurado com interceptors
- `components/ui/button.tsx` - Componente base Shadcn/ui
- `types/auth.ts` - Tipos de autenticação espelhando o backend
- `lib/stores/auth-store.ts` - Store Zustand para autenticação multi-tenant

## 📦 Stack Tecnológica Definida

| Categoria | Tecnologia | Versão | Uso |
|-----------|------------|---------|-----|
| **Framework** | Next.js | 15.3+ | App Router, SSR, Performance |
| **UI Library** | Shadcn/ui | Latest | Componentes acessíveis e customizáveis |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS framework |
| **State (Global)** | Zustand | 4.5+ | State management simples |
| **State (Server)** | TanStack Query | 5+ | Cache inteligente da API |
| **Forms** | React Hook Form | 7+ | Performance e validação |
| **Validation** | Zod | 3.25+ | Schema validation (compartilhado com backend) |
| **HTTP Client** | Axios | 1.7+ | Interceptors para JWT |
| **Charts** | Recharts + Tremor | Latest | Dashboards financeiros |
| **Icons** | Lucide React | Latest | Ícones consistentes |
| **Date Handling** | date-fns | 4+ | Manipulação de datas |

## 🎯 Princípios Arquiteturais

### **1. Modularidade**
- Cada componente tem responsabilidade única
- Hooks customizados encapsulam lógica específica
- Stores Zustand organizados por domínio

### **2. Reaproveitamento**
- Componentes UI base (Shadcn/ui) reutilizáveis
- Hooks de API compartilhados
- Tipos TypeScript espelhando o backend

### **3. Multi-Tenancy**
- Roteamento dinâmico por `[hubId]`
- Context de Hub em toda aplicação
- RBAC visual baseado em papéis

### **4. Type Safety**
- TypeScript rigoroso
- Schemas Zod compartilhados com backend
- Tipagem end-to-end da API

### **5. Performance**
- TanStack Query para cache inteligente
- Next.js 15 com App Router
- Bundle splitting automático

## 🚀 Próximos Passos

1. **Instalar dependências**: `npm install`
2. **Configurar variáveis**: Copiar `.env.example` para `.env.local`
3. **Iniciar desenvolvimento**: `npm run dev`
4. **Implementar componentes** seguindo a estrutura modular definida

---

**Esta estrutura está pronta para suportar todas as funcionalidades complexas do backend multi-tenant descobertas na investigação!** 🎉 