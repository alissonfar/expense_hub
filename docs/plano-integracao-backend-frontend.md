# 🔗 PLANO DE INTEGRAÇÃO BACKEND-FRONTEND

**Criado:** 23/01/2025  
**Última atualização:** 22/06/2025  
**Status:** Fase 5.1 Concluída - Fase 5.2 Em Andamento  
**Objetivo:** Conectar o frontend protótipo (Fase 4.0) com o backend completo (100% finalizado)

---

## 📋 **SITUAÇÃO ATUAL**

### ✅ **Backend Completo (100%)**
- **42 endpoints** funcionando e testados
- **Sistema de autenticação** com JWT
- **CRUD completo:** Pessoas, Tags, Transações, Receitas, Pagamentos
- **Sistema de relatórios** avançados
- **Sistema de configurações** escalável
- **PostgreSQL + Prisma** configurado
- **Validações Zod** em português BR

### ✅ **Frontend Protótipo (Fase 4.0)**
- **Layout completo:** Sidebar + Header + Content
- **Dashboard funcionando** com mock data
- **4 métricas + 2 gráficos** + listas
- **Sistema de temas** (light/dark/auto)
- **8 páginas stub** criadas
- **Componentes base** implementados
- **TypeScript + Tailwind + Shadcn/ui**

---

## 🎯 **ESTRATÉGIA DE INTEGRAÇÃO**

### **Abordagem Escolhida: Integração Módulo por Módulo**
1. **Setup inicial** (API client + autenticação)
2. **Dashboard real** (conectar métricas e gráficos)
3. **CRUD por prioridade** (Pessoas → Tags → Transações → Pagamentos)
4. **Relatórios avançados**
5. **Configurações e refinamentos**

### **Princípios:**
- ✅ **Incremental:** Um módulo por vez
- ✅ **Testável:** Cada integração é validada
- ✅ **Consistente:** Padrões unificados
- ✅ **Robusto:** Error handling e loading states
- ✅ **UX primeiro:** Interface sempre responsiva

---

## 🛠️ **FASE 5: INTEGRAÇÃO DETALHADA**

### **5.1: Setup de API Client e Autenticação** ✅ **CONCLUÍDA**
**Duração real:** 3 horas  
**Status:** ✅ 100% Implementada

#### **Tarefas Concluídas:**
- ✅ Configurar Axios com interceptors automáticos
- ✅ Implementar auth context (React Context + localStorage)
- ✅ Criar hook `useAuth()` para login/logout/register
- ✅ Implementar interceptor JWT automático
- ✅ Criar página de login real (substituir mock)
- ✅ Implementar middleware de auth protection
- ✅ Testar fluxo completo de autenticação
- ✅ Criar página /inicial segura (sem hooks problemáticos)
- ✅ Limpeza completa de código "lixo"
- ✅ Alinhamento de contratos frontend-backend
- ✅ Validação Zod em português no frontend
- ✅ Toast notifications funcionais
- ✅ Build passando sem erros

#### **Arquivos Criados/Modificados:**
```
frontend/lib/
├── api.ts          ✅ # Axios + interceptors
├── auth.tsx        ✅ # Auth context provider
└── constants.ts    ✅ # API endpoints

frontend/app/
├── login/page.tsx  ✅ # Login real funcionando
├── (auth)/inicial/ ✅ # Página inicial segura
└── (auth)/layout   ✅ # Protected routes

frontend/components/auth/
└── ProtectedRoute.tsx ✅ # Middleware de proteção

Arquivos Removidos:
❌ frontend/hooks/useAuth.ts (React Query)
❌ frontend/hooks/useDashboard.ts (React Query)
```

#### **Funcionalidades Validadas:**
- ✅ Login com email: alissonfariascamargo@gmail.com
- ✅ Redirecionamento automático para /inicial
- ✅ Logout funcional no Header e Sidebar
- ✅ Token JWT persistindo corretamente
- ✅ Interceptor tratando 401 automaticamente
- ✅ Proteção de rotas funcionando
- ✅ Error handling robusto

---

### **5.2: Dashboard com Dados Reais** 🔄 **EM ANDAMENTO**
**Duração estimada:** 2-3 horas  
**Status:** 🔄 80% Implementada

#### **Endpoints a integrar:**
```typescript
GET /api/relatorios/dashboard    ✅ # Métricas principais
GET /api/relatorios/pendencias   ⏳ # Dívidas pendentes  
GET /api/pagamentos?limit=5      ⏳ # Pagamentos recentes
```

#### **Tarefas:**
- ✅ Criar `useDashboardSimple()` hook (sem React Query)
- ✅ Integração com /api/relatorios/dashboard
- ✅ Implementar error states nos componentes
- ✅ Adicionar loading skeletons
- ✅ Fallback para mock data em caso de erro
- ✅ Validação de autenticação antes da chamada
- [ ] Testar com dados reais do backend
- [ ] Integrar pendências e pagamentos recentes
- [ ] Validar formatação de valores brasileiros
- [ ] Otimização de performance

#### **Componentes Modificados:**
- ✅ `app/(auth)/dashboard/page.tsx` → hook real integrado
- ✅ Loading states com skeleton
- ✅ Error handling com fallback para mock
- ⏳ `Chart.tsx` → aguardando dados reais
- ⏳ Listas de pendências e pagamentos

#### **Solução Implementada:**
- ✅ Página /inicial criada (sem hooks problemáticos)
- ✅ Dashboard acessível via navegação
- ✅ Hook simples sem race conditions
- ✅ Sistema estável sem logout automático

---

### **5.3: CRUD de Pessoas**
**Duração estimada:** 3-4 horas  
**Prioridade:** 🟡 Alta

#### **Endpoints a integrar:**
```typescript
GET    /api/pessoas              # Listar pessoas
POST   /api/pessoas              # Criar pessoa
GET    /api/pessoas/:id          # Detalhes
PUT    /api/pessoas/:id          # Editar
DELETE /api/pessoas/:id          # Desativar
```

#### **Tarefas:**
- [ ] Criar `usePessoas()` hook com React Query
- [ ] Implementar formulário de criação/edição
- [ ] Adicionar validação Zod no frontend
- [ ] Implementar tabela com ações (editar/excluir)
- [ ] Adicionar confirmação de exclusão
- [ ] Implementar paginação se necessário
- [ ] Estados de loading e erro

#### **Arquivos a criar:**
```
frontend/app/(auth)/pessoas/
├── page.tsx                # Lista de pessoas
├── novo/page.tsx          # Criar pessoa
└── [id]/editar/page.tsx   # Editar pessoa

frontend/components/pessoas/
├── PessoaForm.tsx         # Formulário
├── PessoaTable.tsx        # Tabela
└── PessoaCard.tsx         # Card individual

frontend/hooks/
└── usePessoas.ts          # Hook personalizado
```

---

### **5.4: CRUD de Tags**
**Duração estimada:** 2-3 horas  
**Prioridade:** 🟡 Alta

#### **Endpoints a integrar:**
```typescript
GET    /api/tags                 # Listar tags
POST   /api/tags                 # Criar tag
PUT    /api/tags/:id             # Editar
DELETE /api/tags/:id             # Desativar
```

#### **Tarefas:**
- [ ] Criar `useTags()` hook
- [ ] Implementar formulário com color picker
- [ ] Criar componente TagBadge reutilizável
- [ ] Implementar grid/lista de tags
- [ ] Validação de cores hexadecimais
- [ ] Preview da cor em tempo real

#### **Arquivos a criar:**
```
frontend/app/(auth)/tags/
├── page.tsx               # Lista de tags
└── components/
    ├── TagForm.tsx        # Formulário
    ├── TagGrid.tsx        # Grid de tags
    └── ColorPicker.tsx    # Seletor de cor

frontend/components/ui/
└── tag-badge.tsx          # Badge reutilizável
```

---

### **5.5: CRUD de Transações**
**Duração estimada:** 5-6 horas  
**Prioridade:** 🔴 Crítica

#### **Endpoints a integrar:**
```typescript
GET    /api/transacoes           # Listar transações
POST   /api/transacoes           # Criar gasto
POST   /api/transacoes/receita   # Criar receita
PUT    /api/transacoes/:id       # Editar
DELETE /api/transacoes/:id       # Excluir
```

#### **Tarefas:**
- [ ] Criar `useTransacoes()` hook complexo
- [ ] Implementar formulário de gasto com parcelamento
- [ ] Implementar formulário de receita
- [ ] Sistema de seleção múltipla de pessoas
- [ ] Calculadora de divisão automática
- [ ] Preview de parcelas antes de salvar
- [ ] Filtros avançados (data, tipo, pessoa, tag)
- [ ] Tabela responsiva com muitas colunas

#### **Arquivos a criar:**
```
frontend/app/(auth)/transacoes/
├── page.tsx                    # Lista de transações
├── nova/page.tsx              # Criar gasto
├── receita/nova/page.tsx      # Criar receita
└── [id]/
    ├── page.tsx               # Detalhes
    └── editar/page.tsx        # Editar

frontend/components/transacoes/
├── TransacaoForm.tsx          # Formulário principal
├── ReceitaForm.tsx            # Formulário de receita
├── ParcelamentoConfig.tsx     # Configuração de parcelas
├── DivisaoPessoas.tsx         # Seleção e divisão
├── TransacaoTable.tsx         # Tabela complexa
├── TransacaoFilters.tsx       # Filtros avançados
└── TransacaoCard.tsx          # Card mobile
```

---

### **5.6: Sistema de Pagamentos**
**Duração estimada:** 4-5 horas  
**Prioridade:** 🟡 Alta

#### **Endpoints a integrar:**
```typescript
GET    /api/pagamentos                      # Listar pagamentos
POST   /api/pagamentos                      # Criar pagamento
GET    /api/pagamentos/configuracoes/excedente  # Configurações
PUT    /api/pagamentos/configuracoes/excedente  # Atualizar config
```

#### **Tarefas:**
- [ ] Criar `usePagamentos()` hook
- [ ] Implementar formulário de pagamento individual
- [ ] Implementar formulário de pagamento composto
- [ ] Sistema de seleção de múltiplas transações
- [ ] Calculadora de valores e excedentes
- [ ] Configuração de processamento de excedentes
- [ ] Histórico de pagamentos

#### **Arquivos a criar:**
```
frontend/app/(auth)/pagamentos/
├── page.tsx                    # Lista de pagamentos
├── novo/page.tsx              # Criar pagamento
└── configuracoes/page.tsx     # Configurações

frontend/components/pagamentos/
├── PagamentoForm.tsx          # Formulário
├── PagamentoComposto.tsx      # Pagamento múltiplo
├── SelecionarTransacoes.tsx   # Seleção múltipla
├── CalculadoraExcedente.tsx   # Calculadora
└── ConfiguracaoExcedente.tsx  # Configurações
```

---

### **5.7: Sistema de Relatórios**
**Duração estimada:** 4-5 horas  
**Prioridade:** 🟡 Alta

#### **Endpoints a integrar:**
```typescript
GET /api/relatorios/saldos       # Saldos por pessoa
GET /api/relatorios/transacoes   # Relatório completo
GET /api/relatorios/pendencias   # Pendências detalhadas
GET /api/relatorios/categorias   # Análise por categorias
```

#### **Tarefas:**
- [ ] Criar `useRelatorios()` hook
- [ ] Implementar filtros avançados de data
- [ ] Gráficos dinâmicos com dados reais
- [ ] Tabelas de relatórios exportáveis
- [ ] Dashboard de pendências
- [ ] Análise por categorias/tags
- [ ] Comparativos mensais/anuais

#### **Arquivos a criar:**
```
frontend/app/(auth)/relatorios/
├── page.tsx                   # Dashboard de relatórios
├── saldos/page.tsx           # Saldos por pessoa
├── pendencias/page.tsx       # Pendências
├── transacoes/page.tsx       # Relatório completo
└── categorias/page.tsx       # Por categorias

frontend/components/relatorios/
├── RelatorioFilters.tsx      # Filtros avançados
├── SaldosTable.tsx           # Tabela de saldos
├── PendenciasCard.tsx        # Cards de pendências
├── GraficoEvolution.tsx      # Evolução temporal
└── CategoriasChart.tsx       # Gráfico de categorias
```

---

### **5.8: Sistema de Configurações**
**Duração estimada:** 2-3 horas  
**Prioridade:** 🟢 Média

#### **Endpoints a integrar:**
```typescript
GET /api/configuracoes/tema      # Buscar tema
PUT /api/configuracoes/tema      # Atualizar tema
```

#### **Tarefas:**
- [ ] Conectar sistema de temas com backend
- [ ] Sincronizar tema local com servidor
- [ ] Implementar outras configurações futuras
- [ ] Configurações de usuário/perfil
- [ ] Backup/export de dados

---

## 🧪 **TESTES DE INTEGRAÇÃO**

### **Cenários de Teste:**
1. **Fluxo completo:** Login → Dashboard → Criar transação → Fazer pagamento
2. **Error handling:** Rede offline, servidor com erro, dados inválidos
3. **Loading states:** Todas as telas com skeleton/spinner
4. **Responsive:** Mobile + desktop funcionando
5. **Performance:** Loads rápidos, cache funcionando

### **Ferramentas:**
- **React Query DevTools** para debug
- **Network tab** para monitorar requests
- **Postman collections** para validar backend
- **Lighthouse** para performance

---

## 📊 **CRONOGRAMA ESTIMADO**

| Fase | Duração | Acumulado | Status |
|------|---------|-----------|--------|
| 5.1 - API Client + Auth | 1-2h | 2h | 🔄 Próxima |
| 5.2 - Dashboard Real | 2-3h | 5h | ⏳ Aguardando |
| 5.3 - CRUD Pessoas | 3-4h | 9h | ⏳ Aguardando |
| 5.4 - CRUD Tags | 2-3h | 12h | ⏳ Aguardando |
| 5.5 - CRUD Transações | 5-6h | 18h | ⏳ Aguardando |
| 5.6 - Sistema Pagamentos | 4-5h | 23h | ⏳ Aguardando |
| 5.7 - Sistema Relatórios | 4-5h | 28h | ⏳ Aguardando |
| 5.8 - Configurações | 2-3h | 31h | ⏳ Aguardando |
| **TOTAL ESTIMADO** | **23-31h** | | |

---

## 🚀 **RESULTADO ESPERADO**

### **Aplicação Completa Funcionando:**
- ✅ **Login/registro** real com JWT
- ✅ **Dashboard** com métricas reais
- ✅ **CRUD completo** de todas as entidades
- ✅ **Sistema de pagamentos** compostos funcionando
- ✅ **Relatórios avançados** com gráficos dinâmicos
- ✅ **Configurações** sincronizadas
- ✅ **UX consistente** em todas as telas
- ✅ **Performance otimizada** com cache
- ✅ **Error handling** robusto
- ✅ **Design responsivo** mobile + desktop

### **Stack Técnica Final:**
- **Frontend:** Next.js 14 + React + TypeScript + Tailwind + Shadcn/ui
- **Estado:** React Query + Context API
- **Formulários:** React Hook Form + Zod
- **Charts:** Recharts
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT + bcrypt
- **Validação:** Zod (português BR)

---

**🎯 OBJETIVO:** Ter uma aplicação completa e profissional de controle de gastos pessoais funcionando 100% com backend e frontend integrados! 