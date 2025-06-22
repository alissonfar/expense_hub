# 🎨 GUIA DEFINITIVO FRONTEND - PERSONAL EXPENSE HUB

**Criado em:** 22/01/2025  
**Status:** Documentação base para implementação  
**Backend:** 100% finalizado - 42 endpoints funcionando  

## 🎯 **OVERVIEW DO PROJETO FRONTEND**

Este documento serve como **guia completo** para desenvolvimento do frontend da aplicação Personal Expense Hub. Qualquer IA ou desenvolvedor deve consultar este documento antes de trabalhar no frontend.

### **📋 Contexto**
- ✅ **Backend 100% finalizado:** 42 endpoints funcionando
- ✅ **Autenticação JWT:** Sistema completo implementado
- ✅ **8 módulos backend:** Auth, Pessoas, Tags, Transações, Pagamentos, Relatórios, Configurações
- 🚀 **Próximo passo:** Frontend completo (51 tarefas)

### **🎨 Design Reference**
**Layout base:** Interface moderna similar ao dashboard da imagem de referência (azul, clean, sidebar + área principal)
**Estilo:** Moderno, corporativo, usável, focado em produtividade

---

## 🎨 **DECISÕES DE DESIGN APROVADAS**

### **🎨 Cores e Tema**
```typescript
// Tema Principal
TEMA_PADRAO: "light"
COR_PRIMARIA: "blue" // Similar à imagem de referência
ACCENT_COLORS: {
  sucesso: "green",    // Status PAGO
  aviso: "yellow",     // Status PENDENTE  
  erro: "red",         // Status VENCIDO
  info: "blue"         // Informações gerais
}

// Sistema de Tema
- Suporte: light/dark/auto
- Integração: Backend configurações tema (já implementado)
- Toggle: Header da aplicação
- Persistência: localStorage + backend sync
```

### **📱 Responsividade**
```typescript
BREAKPOINTS: {
  mobile: "até 768px",
  tablet: "768px - 1024px", 
  desktop: "1024px+"
}

PRIORIDADES: {
  principal: "desktop",
  secundario: "mobile",
  terciario: "tablet"
}

ADAPTACOES_MOBILE: {
  sidebar: "collapse com hamburger menu",
  cards: "manter horizontal (não stack vertical)",
  graficos: "simplificar interatividade",
  tabelas: "scroll horizontal"
}
```

### **🗂️ Layout e Estrutura**
```typescript
LAYOUT_PRINCIPAL: {
  sidebar: "fixa à esquerda, collapsible",
  header: "topo fixo com breadcrumbs",
  main: "área principal, largura total",
  footer: "opcional, minimalista"
}

AREA_PRINCIPAL: {
  largura: "100% (sem sidebar lateral direita)",
  padding: "24px",
  max_width: "none"
}
```

---

## 📐 **ARQUITETURA FRONTEND**

### **🏗️ Estrutura de Pastas**
```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Rotas autenticadas - Layout group
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── pessoas/       # CRUD pessoas + subpáginas
│   │   ├── tags/          # CRUD tags
│   │   ├── transacoes/    # Sistema transações (gastos/receitas)
│   │   ├── pagamentos/    # Sistema pagamentos
│   │   ├── relatorios/    # 8 tipos de relatórios + filtros
│   │   ├── configuracoes/ # Sistema configurações escalável
│   │   └── layout.tsx     # Layout autenticado (sidebar + header)
│   ├── login/             # Página de login (pública)
│   ├── layout.tsx         # Layout global (providers, fonts)
│   ├── page.tsx           # Landing/redirect inicial
│   └── globals.css        # Estilos globais Tailwind
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Shadcn/ui base components
│   ├── layout/           # Header, Sidebar, Navigation
│   ├── forms/            # Form wrappers reutilizáveis
│   ├── tables/           # DataTable + filtros avançados
│   ├── charts/           # Gráficos + visualizações
│   ├── modals/           # Modais reutilizáveis
│   └── common/           # Componentes genéricos
├── lib/                  # Configurações e utilitários
│   ├── api.ts           # Cliente HTTP + interceptors
│   ├── auth.ts          # Gerenciamento autenticação
│   ├── utils.ts         # Funções utilitárias (cn, formatters)
│   ├── validations.ts   # Schemas Zod frontend
│   └── constants.ts     # Constantes da aplicação
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Hook autenticação + JWT
│   ├── useApi.ts        # Hook chamadas API + loading
│   ├── useLocalStorage.ts # Hook persistência local
│   └── useFilters.ts    # Hook filtros avançados
├── types/               # TypeScript definitions
│   ├── api.ts          # Tipos das respostas da API
│   ├── components.ts   # Tipos dos componentes
│   └── index.ts        # Exports principais
└── styles/             # Estilos adicionais
    └── globals.css     # Customizações Tailwind
```

### **🔌 Dependências Principais**
```json
{
  "@tanstack/react-query": "Gerenciamento estado server + cache",
  "recharts": "Gráficos interativos + responsivos",
  "react-hook-form": "Formulários performáticos",
  "@hookform/resolvers": "Integração Zod + RHF",
  "zod": "Validação schemas frontend",
  "date-fns": "Manipulação datas + formatação",
  "lucide-react": "Ícones modernos + consistentes",
  "next-themes": "Sistema tema light/dark",
  "sonner": "Toast notifications",
  "vaul": "Bottom sheets mobile"
}
```

---

## 🧩 **SISTEMA DE COMPONENTES**

### **🎨 Design System**
```typescript
// Base: Shadcn/ui + customizações
COMPONENTES_BASE: [
  "Button", "Input", "Card", "Table", "Dialog", "Select",
  "Checkbox", "RadioGroup", "Tabs", "Badge", "Avatar"
]

COMPONENTES_CUSTOMIZADOS: [
  "DataTable", "FormModal", "StatsCard", "Chart",
  "Sidebar", "Header", "PageHeader", "FilterBar"
]

PADROES_REUTILIZACAO: {
  composicao: "Componentes pequenos + focados",
  props_configuracao: "Máxima flexibilidade",
  children_slots: "Composição flexível",
  variants: "Tailwind variants para estados"
}
```

### **📊 Componentes Principais**

#### **DataTable (Genérica)**
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  filters?: FilterConfig[]
  pagination?: boolean
  selection?: boolean
  actions?: ActionConfig[]
  loading?: boolean
  error?: string
}

// Uso: Todas as listagens (pessoas, tags, transações, etc.)
```

#### **FormModal (Genérico)**
```typescript
interface FormModalProps {
  title: string
  description?: string
  schema: ZodSchema
  defaultValues?: any
  onSubmit: (data: any) => Promise<void>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Uso: Todos os formulários de CRUD
```

#### **StatsCard (Métricas)**
```typescript
interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon?: LucideIcon
  color?: "default" | "success" | "warning" | "error"
}

// Uso: Cards de métricas do dashboard
```

#### **Chart (Gráficos)**
```typescript
interface ChartProps {
  type: "line" | "bar" | "pie" | "area"
  data: any[]
  xKey: string
  yKey: string | string[]
  title?: string
  height?: number
  responsive?: boolean
  simplified?: boolean // Para mobile
}

// Uso: Todos os gráficos (dashboard + relatórios)
```

---

## 🎯 **FLUXO DE NAVEGAÇÃO PRINCIPAL**

### **🛣️ Caminho Feliz Identificado**
```
Dashboard → Ver relatórios → Filtrar por período
```

### **🗂️ Estrutura da Sidebar**
```typescript
NAVEGACAO_PRINCIPAL: [
  {
    grupo: "Principal",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", href: "/dashboard" },
    ]
  },
  {
    grupo: "Gestão",
    items: [
      { label: "Pessoas", icon: "Users", href: "/pessoas" },
      { label: "Tags", icon: "Tag", href: "/tags" },
    ]
  },
  {
    grupo: "Financeiro", 
    items: [
      { label: "Transações", icon: "Receipt", href: "/transacoes" },
      { label: "Pagamentos", icon: "CreditCard", href: "/pagamentos" },
    ]
  },
  {
    grupo: "Análise",
    items: [
      { label: "Relatórios", icon: "BarChart3", href: "/relatorios" },
    ]
  },
  {
    grupo: "Sistema",
    items: [
      { label: "Configurações", icon: "Settings", href: "/configuracoes" },
    ]
  }
]
```

### **📊 Dashboard Principal**
```typescript
METRICAS_DASHBOARD: [
  {
    titulo: "Total Gastos",
    valor: "R$ X.XXX,XX",
    descricao: "Últimos 30 dias",
    tendencia: "up|down|neutral",
    cor: "blue"
  },
  {
    titulo: "Total Receitas", 
    valor: "R$ X.XXX,XX",
    descricao: "Últimos 30 dias",
    tendencia: "up|down|neutral", 
    cor: "green"
  },
  {
    titulo: "Dívidas Pendentes",
    valor: "R$ X.XXX,XX",
    descricao: "X pessoas devendo",
    tendencia: "neutral",
    cor: "yellow"
  },
  {
    titulo: "Pagamentos Mês",
    valor: "XX",
    descricao: "Pagamentos recebidos",
    tendencia: "up|down|neutral",
    cor: "blue"
  }
]

GRAFICOS_DASHBOARD: [
  {
    tipo: "line",
    titulo: "Gastos vs Receitas",
    posicao: "principal_esquerda",
    dados: "gastos_receitas_tempo"
  },
  {
    tipo: "bar", 
    titulo: "Gastos por Categoria",
    posicao: "principal_direita",
    dados: "gastos_por_tag"
  }
]

SECOES_ADICIONAIS: [
  {
    titulo: "Dívidas Pendentes",
    tipo: "lista",
    limite: 5,
    acao: "Ver todas"
  },
  {
    titulo: "Pagamentos Recentes", 
    tipo: "lista",
    limite: 5,
    acao: "Ver todos"
  }
]
```

---

## 📅 **ETAPAS DE IMPLEMENTAÇÃO**

### **🎨 FASE 4.0: Protótipo com Dados Fictícios (4-5 dias) ← NOVA!**

**Objetivo:** Criar interface completa navegável com dados mockados para definir padrões visuais e componentes reutilizáveis antes da integração com backend.

#### **Dia 1: Setup + Layout Base**
```bash
# Instalar dependências essenciais
npm install @tanstack/react-query recharts react-hook-form @hookform/resolvers zod date-fns lucide-react next-themes sonner

# Configurar providers + layout global
- app/layout.tsx: QueryClient + ThemeProvider + Toaster
- app/globals.css: Customizações Tailwind + variáveis CSS
- lib/utils.ts: Utilitários cn + formatters
- components/layout/Sidebar.tsx: Navegação principal
- components/layout/Header.tsx: Header + breadcrumbs + theme toggle
```

#### **Dia 2: Dashboard Mockado**
```typescript
// app/(auth)/dashboard/page.tsx: Dashboard principal
// components/dashboard/StatsGrid.tsx: 4 cards métricas mockadas
// components/charts/: Gráficos com dados fictícios
// Listas: Dívidas pendentes + pagamentos recentes mockados
// Responsividade: Testes mobile completos
```

#### **Dia 3: Componentes Base Genéricos**
```typescript
// components/common/DataTable.tsx: Tabela genérica com dados fictícios
// components/common/FormModal.tsx: Modal formulários genérico
// components/common/FilterBar.tsx: Filtros avançados mockados
// Estados: Loading skeletons + error + empty states
```

#### **Dia 4: Páginas Exemplo**
```typescript
// app/(auth)/pessoas/page.tsx: Lista pessoas mockada
// app/(auth)/transacoes/page.tsx: Lista transações mockada
// app/(auth)/relatorios/page.tsx: Relatórios mockados
// Navegação: Links funcionais entre páginas
```

#### **Dia 5: Refinamento + Testes**
```typescript
// Ajustes design baseado em feedback
// Tooltips implementados em componentes principais
// Micro-interações e loading states
// Testes responsividade completos
// Validação padrões visuais
```

**Resultado:** Interface completa navegável com todos padrões visuais definidos e componentes base prontos para integração.

### **🚀 FASE 4.1: Integração Backend + Autenticação (2-3 dias)**

#### **Dia 1: Dependências + Configuração**
```bash
# Instalar dependências essenciais
npm install @tanstack/react-query recharts react-hook-form @hookform/resolvers zod date-fns lucide-react next-themes sonner

# Configurar providers + layout global
- app/layout.tsx: QueryClient + ThemeProvider + Toaster
- app/globals.css: Customizações Tailwind + variáveis CSS
- lib/utils.ts: Utilitários cn + formatters
```

#### **Dia 2: Sistema de Autenticação**
```typescript
// lib/auth.ts: Gerenciamento JWT + redirects
// hooks/useAuth.ts: Hook autenticação + estado user
// app/login/page.tsx: Página login funcional
// middleware.ts: Proteção rotas Next.js
```

#### **Dia 3: Layout Principal**
```typescript
// components/layout/Header.tsx: Header + breadcrumbs + user menu
// components/layout/Sidebar.tsx: Sidebar collapsible + navegação
// app/(auth)/layout.tsx: Layout autenticado
// Responsividade mobile: hamburger menu
```

#### **Dia 4: Componentes Base**
```typescript
// components/ui/*: Shadcn/ui base instalados
// components/common/DataTable.tsx: Tabela genérica
// components/common/StatsCard.tsx: Cards métricas
// components/common/FormModal.tsx: Modal formulários
// components/charts/Chart.tsx: Wrapper recharts
```

### **🏠 FASE 4.2: Dashboard Principal (3-4 dias)**

#### **Métricas Dashboard**
```typescript
// app/(auth)/dashboard/page.tsx: Layout dashboard
// components/dashboard/StatsGrid.tsx: 4 cards métricas
// Integração: GET /api/relatorios/dashboard
// Loading states + error handling
```

#### **Gráficos Dashboard**
```typescript
// components/charts/GastosReceitasChart.tsx: Gráfico linha
// components/charts/GastosCategoriaChart.tsx: Gráfico barras  
// Filtros período: 7d, 15d, mês, ano, custom
// Responsividade: simplificar mobile
```

#### **Listas Dashboard**
```typescript
// components/dashboard/DividasPendentes.tsx: Lista dívidas
// components/dashboard/PagamentosRecentes.tsx: Lista pagamentos
// Links: Navegação para páginas completas
// Tooltips: Informações adicionais hover
```

### **👥 FASE 4.3: CRUD Pessoas (4-5 dias)**

#### **Lista Pessoas**
```typescript
// app/(auth)/pessoas/page.tsx: Lista + filtros
// Filtros: nome, email, tipo, status
// Ações: criar, editar, deletar, ver dívidas
// Paginação: 25 itens por página
```

#### **Formulários Pessoas**
```typescript
// components/pessoas/PessoaForm.tsx: Form create/edit
// Validação: Zod schemas frontend
// Estados: loading, success, error
// Modal: FormModal reutilizável
```

#### **Detalhes Pessoa**
```typescript
// app/(auth)/pessoas/[id]/page.tsx: Página detalhes
// Abas: Dados, Dívidas, Pagamentos, Histórico
// Gráficos: Evolução dívidas pessoa
```

### **🏷️ FASE 4.4: CRUD Tags (2-3 dias)**

#### **Lista Tags**
```typescript
// app/(auth)/tags/page.tsx: Lista + grid view
// Cores: Preview + picker
// Contadores: Quantidade uso cada tag
// Ações: CRUD completo
```

### **💰 FASE 4.5: Sistema Transações (5-6 dias)**

#### **Lista Transações**
```typescript
// app/(auth)/transacoes/page.tsx: Lista com filtros avançados
// Filtros: tipo, período, pessoa, tag, status, valor
// Abas: Todas, Gastos, Receitas
// Ações: criar, editar, deletar, ver detalhes
```

#### **Criar Gasto**
```typescript
// components/transacoes/GastoForm.tsx: Form complexo
// Divisão pessoas: Select + valores individuais
// Parcelamento: Array parcelas + valores diferentes
// Validações: Soma participantes = valor total
```

#### **Criar Receita**
```typescript
// components/transacoes/ReceitaForm.tsx: Form simplificado
// Apenas proprietário: Auto-preenchimento
// Campos: descrição, valor, data, tag
```

### **💳 FASE 4.6: Sistema Pagamentos (3-4 dias)**

#### **Lista Pagamentos**
```typescript
// app/(auth)/pagamentos/page.tsx: Lista + status colors
// Filtros: pessoa, período, valor, método
// Status: visual badges + tooltips
// Ações: registrar, editar, deletar
```

#### **Registrar Pagamento**
```typescript
// components/pagamentos/PagamentoForm.tsx: Form complexo
// Multi-select: Múltiplas transações
// Cálculo automático: Excesso + conversão receita
// Preview: Resumo antes confirmar
```

### **📈 FASE 4.7: Relatórios Avançados (5-6 dias)**

#### **Dashboard Relatórios**
```typescript
// app/(auth)/relatorios/page.tsx: Hub relatórios
// Cards: 8 tipos de relatórios disponíveis
// Filtros globais: Período padrão aplicado
// Navegação: Links para relatórios específicos
```

#### **Relatórios Específicos**
```typescript
// app/(auth)/relatorios/[tipo]/page.tsx: Páginas individuais
// Tipos: dashboard, saldos, pendencias, transacoes, categorias
// Filtros: 15+ opções por relatório
// Export: PDF + Excel (futuro)
// Gráficos: Interativos + drill-down
```

### **⚙️ FASE 4.8: Configurações (2-3 dias)**

#### **Interface Configurações**
```typescript
// app/(auth)/configuracoes/page.tsx: Página principal
// Abas: Interface, Comportamento (futuro), Alertas (futuro)
// Theme toggle: Light/Dark/Auto
// Integração: Backend configurações tema
```

#### **Sistema Tema**
```typescript
// Integração: next-themes + backend sync
// Persistência: localStorage + server sync
// CSS variables: Cores dinâmicas
// Componentes: Adaptação automática cores
```

---

## 🎯 **PADRÕES E BOAS PRÁTICAS**

### **📝 Nomenclatura**
```typescript
// Componentes: PascalCase + descritivo
// Hooks: camelCase + prefixo 'use'
// Arquivos: kebab-case
// Tipos: PascalCase + sufixo 'Props|Type|Interface'
// Constantes: UPPER_SNAKE_CASE

EXEMPLOS: {
  componente: "PessoaForm.tsx",
  hook: "useAuth.ts", 
  tipo: "PessoaFormProps",
  constante: "API_BASE_URL"
}
```

### **🔄 Gerenciamento Estado**
```typescript
ESTADO_LOCAL: "useState para UI simples"
ESTADO_SERVER: "TanStack Query para dados API"
ESTADO_GLOBAL: "Context para auth + theme"
FORMULARIOS: "React Hook Form + Zod"
```

### **🚨 Error Handling**
```typescript
API_ERRORS: {
  loading: "Loading skeletons + spinners",
  error: "Error boundaries + toast notifications", 
  empty: "Empty states + call-to-action",
  retry: "Retry buttons + auto-retry"
}

FORM_ERRORS: {
  validation: "Inline errors + highlight fields",
  submit: "Toast notifications + loading states",
  server: "Error messages from backend"
}
```

### **♿ Acessibilidade**
```typescript
A11Y_REQUIREMENTS: {
  keyboard: "Navegação completa por teclado",
  screen_reader: "Labels + descriptions adequadas",
  contrast: "Cores com contraste adequado",
  focus: "Focus visible + logical order"
}
```

### **📱 Mobile First (Secundário)**
```typescript
MOBILE_ADAPTATIONS: {
  navigation: "Hamburger menu + bottom navigation",
  tables: "Horizontal scroll + responsive cards",
  forms: "Stack vertical + touch-friendly",
  charts: "Simplified interactions + gestures"
}
```

---

## 🔧 **CONFIGURAÇÕES TÉCNICAS**

### **⚙️ Next.js Config**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    domains: []
  }
}
```

### **🎨 Tailwind Config**
```javascript
// tailwind.config.js - Integração shadcn/ui + custom colors
const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores do sistema (light/dark)
        // Accent colors definidas
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}
```

### **📦 TanStack Query Config**
```typescript
// lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
})
```

---

## 📚 **RECURSOS E REFERÊNCIAS**

### **🎨 Design System**
- **Shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Lucide Icons**: https://lucide.dev/

### **📊 Dados e Estado**
- **TanStack Query**: https://tanstack.com/query/
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

### **📈 Gráficos**
- **Recharts**: https://recharts.org/
- **Chart patterns**: Dashboard + drill-down

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **🎯 Métricas de Qualidade**
```typescript
PERFORMANCE: {
  first_load: "< 2s",
  navigation: "< 500ms",
  api_calls: "< 1s response"
}

UX_METRICS: {
  clicks_to_action: "< 3 cliques para ações principais",
  form_completion: "> 90% taxa conclusão",
  error_recovery: "< 30s para recuperar de erros"
}

TECHNICAL: {
  typescript: "100% typed, 0 any",
  tests: "> 80% coverage crítico",
  accessibility: "WCAG 2.1 AA compliance"
}
```

### **🚀 Definition of Done**
```typescript
FEATURE_COMPLETE: {
  functionality: "Todas funcionalidades backend integradas",
  responsive: "Desktop + mobile funcionando",
  error_handling: "Loading + error + empty states",
  validation: "Frontend + backend validation",
  navigation: "Breadcrumbs + back buttons",
  tooltips: "Help text onde necessário"
}
```

---

## 🔄 **PRÓXIMOS PASSOS IMEDIATOS**

### **🚀 Para Começar HOJE (FASE 4.0):**
1. ✅ **Instalar dependências** para protótipo
2. ✅ **Configurar layout global** (providers + themes mockados)
3. ✅ **Criar sidebar + header** (navegação completa)
4. ✅ **Dashboard mockado** (4 cards + 2 gráficos fictícios)
5. ✅ **Componentes base** (DataTable, FormModal, FilterBar)

### **📋 Checklist Primeira Semana (Protótipo):**
- [ ] Layout principal responsivo com dados fictícios
- [ ] Dashboard completo com métricas mockadas
- [ ] Navegação sidebar completa funcionando
- [ ] Sistema tema light/dark básico
- [ ] 3-4 páginas exemplo navegáveis
- [ ] Componentes reutilizáveis definidos e testados

### **🎯 Meta 2-3 Semanas:**
**Frontend 100% funcional** integrando todos os 42 endpoints do backend, com interface moderna, responsiva e produtiva.

---

**💡 Este documento deve ser consultado antes de qualquer trabalho no frontend!**  
**🔄 Manter atualizado conforme implementação e feedback do usuário.** 