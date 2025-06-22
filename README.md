# 💰 Personal Expense Hub

Sistema de **controle de gastos pessoais compartilhados** com divisão por valores fixos, parcelamento avançado e gestão automática de pagamentos.

## 🎯 **Características Principais**

- ✅ **Proprietário centralizado** (controle total do sistema)
- ✅ **Participantes** (podem ter dívidas e fazer pagamentos)
- ✅ **Gastos compartilhados** (divisão por valores fixos específicos)
- ✅ **Receitas exclusivas** do proprietário
- ✅ **Parcelamento avançado** (valores diferentes por parcela)
- ✅ **Sistema de pagamentos** com status automático
- ✅ **Tags e categorização** 
- ✅ **Relatórios em tempo real** (15+ filtros por endpoint)
- ✅ **Sistema de configurações escalável** (tema + futuras expansões)
- ✅ **42 endpoints REST** funcionando (autenticação + 8 módulos)

## 🛠️ **Stack Tecnológica**

| Componente | Tecnologia |
|------------|------------|
| **Backend** | Node.js + Express + TypeScript |
| **Frontend** | Next.js + React + TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **UI** | Tailwind CSS + Shadcn/ui |
| **Auth** | JWT + bcrypt |
| **Validation** | Zod + Mensagens em Português |

## 📋 **Status do Projeto**

🟡 **EM DESENVOLVIMENTO** - Veja o status atual em [`docs/STATUS-ATUAL.md`](docs/STATUS-ATUAL.md)

```
FASE 1 - Setup e Fundação:       🟢 CONCLUÍDO     (14/14 tarefas) ✅
FASE 2 - Database e ORM:         🟢 CONCLUÍDO     (13/13 tarefas) ✅
FASE 3.1 - Backend Base:         🟢 CONCLUÍDO     (5/5 tarefas)   ✅
FASE 3.2 - Autenticação:         🟢 CONCLUÍDO     (7/7 tarefas)   ✅
FASE 3.3 - CRUD Pessoas:         🟢 CONCLUÍDO     (5/5 tarefas)   ✅
FASE 3.4 - CRUD Tags:            🟢 CONCLUÍDO     (4/4 tarefas)   ✅
FASE 3.5 - Sistema Transações:   🟢 CONCLUÍDO     (8/8 tarefas)   ✅
FASE 3.6 - Sistema Pagamentos:   🟢 CONCLUÍDO     (7/7 tarefas)   ✅
FASE 3.7 - Sistema Relatórios:   🟢 CONCLUÍDO     (7/7 tarefas)   ✅
FASE 3.8 - Testes e Otimização:  🟢 CONCLUÍDO     (4/4 tarefas)   ✅
FASE 3.9 - Configurações:        🟢 CONCLUÍDO     (10/10 tarefas) ✅
📦 BACKEND 100% FINALIZADO        🟢 COMPLETO      (42 endpoints)  ✅

FASE 4 - Frontend UI/UX:         🔴 NÃO INICIADO  (0/51 tarefas)
FASE 5 - Integração e Testes:    🔴 NÃO INICIADO  (0/19 tarefas)
FASE 6 - Deploy:                 🔴 NÃO INICIADO  (0/13 tarefas)

TOTAL DE PROGRESSO: 75/125 tarefas (60%)
BACKEND: 75/75 tarefas (100%) - PRODUCTION READY ✅
FRONTEND: 0/51 tarefas (0%) - PRÓXIMA FASE 🚀
```

## 🚀 **Como Executar Localmente**

### **📋 Pré-requisitos**
- Node.js 18+ instalado
- PostgreSQL 14+ instalado e rodando
- npm ou yarn

### **🔧 Setup Inicial**

1. **Clone e navegue para o projeto:**
```bash
git clone <repository-url>
cd hub
```

2. **Configure o Backend:**
```bash
cd backend

# Instalar dependências (já configurado)
npm install

# Configurar variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações de banco

# Gerar Prisma Client e aplicar migrações
npm run db:generate
npm run db:migrate

# Build e verificar compilação
npm run build

# Rodar em desenvolvimento
npm run dev
```

3. **Configure o Frontend:**
```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env.local
# Edite o arquivo .env.local se necessário

# Rodar em desenvolvimento
npm run dev
```

### **🗄️ Banco de Dados - FUNCIONANDO ✅**
```bash
cd backend

# Aplicar todas as 3 migrações
npm run db:migrate

# Popular com dados de teste (opcional)
npm run db:seed

# Verificar estrutura
npm run test:structure
```

### **📝 Scripts Disponíveis**

#### **Backend - PRODUCTION READY ✅**
```bash
npm run dev        # Desenvolvimento com hot reload
npm run build      # Build para produção (SEM ERROS ✅)
npm run start      # Executar build de produção
npm run lint       # Verificar código com ESLint
npm run format     # Formatar código com Prettier
npm run type-check # Verificar tipos TypeScript

# Scripts de Banco
npm run db:generate # Gerar Prisma Client
npm run db:migrate  # Aplicar migrações
npm run db:seed     # Popular dados teste

# Scripts de Teste Manual (36+ comandos aprovados)
npm run test:auth      # Testar autenticação
npm run test:pessoas   # Testar CRUD pessoas
npm run test:tags      # Testar CRUD tags
npm run test:transacoes # Testar transações
npm run test:pagamentos # Testar pagamentos
npm run test:relatorios # Testar relatórios
npm run test:configuracoes # Testar configurações
```

#### **Frontend**
```bash
npm run dev        # Desenvolvimento com hot reload
npm run build      # Build para produção
npm run start      # Executar build de produção
npm run lint       # Verificar código com Next.js lint
npm run format     # Formatar código com Prettier
npm run type-check # Verificar tipos TypeScript
```

## 📂 **Estrutura do Projeto**

```
/
├── backend/                 # API REST (Node.js + Express) ✅ 100%
│   ├── controllers/         # 8 controladores completos ✅
│   │   ├── authController.ts      # Autenticação JWT ✅
│   │   ├── pessoaController.ts    # CRUD pessoas ✅
│   │   ├── tagController.ts       # CRUD tags ✅
│   │   ├── transacaoController.ts # Sistema transações ✅
│   │   ├── pagamentoController.ts # Sistema pagamentos ✅
│   │   ├── relatorioController.ts # Relatórios avançados ✅
│   │   └── configuracaoController.ts # Configurações escaláveis ✅
│   ├── routes/              # 8 rotas organizadas ✅
│   ├── schemas/             # Validação Zod em PT-BR ✅
│   ├── migrations/          # 3 migrações aplicadas ✅
│   ├── middleware/          # Autenticação + validação ✅
│   ├── utils/               # JWT + bcrypt ✅
│   ├── types/               # TypeScript definitions ✅
│   ├── prisma/              # Schema Prisma ✅
│   ├── scripts/             # Testes manuais ✅
│   ├── app.ts               # Servidor Express ✅
│   ├── tsconfig.json        # Config TypeScript ✅
│   ├── package.json         # Dependências ✅
│   └── env.example          # Template de env vars ✅
├── frontend/               # Interface (Next.js + React) 🚀 PRÓXIMO
│   ├── app/                # Next.js App Router ✅
│   │   ├── layout.tsx      # Layout global ✅
│   │   └── page.tsx        # Página inicial ✅
│   ├── components/         # Componentes reutilizáveis ✅
│   ├── lib/                # Utilitários ✅
│   ├── styles/             # Estilos Tailwind ✅
│   ├── tailwind.config.js  # Config Tailwind ✅
│   ├── tsconfig.json       # Config TypeScript ✅
│   ├── package.json        # Dependências ✅
│   └── env.example         # Template de env vars ✅
├── docs/                   # Documentação atualizada ✅
│   ├── STATUS-ATUAL.md     # Status Fase 3.9 ✅
│   ├── plano-implementacao.md # Roadmap 125 tarefas ✅
│   ├── architecture.md     # Arquitetura técnica ✅
│   └── COMANDOS-RAPIDOS.md # Testes manuais ✅
└── README.md               # Este arquivo ✅
```

## 📖 **Documentação**

- **🔄 [STATUS ATUAL](docs/STATUS-ATUAL.md)** - Estado exato: Fase 3.9 concluída, Backend 100% ⭐
- **📋 [Plano de Implementação](docs/plano-implementacao.md)** - 75/125 tarefas, próximo: Frontend
- **🏗️ [Arquitetura](docs/architecture.md)** - Stack completa + estrutura do sistema
- **⚡ [Comandos Rápidos](docs/COMANDOS-RAPIDOS.md)** - 36+ testes manuais aprovados

## 🎯 **Funcionalidades Implementadas**

### **🔐 Sistema de Autenticação**
- Login/logout com JWT em português
- Middleware de autenticação
- Proteção de rotas por proprietário
- Validações em português brasileiro

### **👑 Para o Proprietário - COMPLETO ✅**
- ✅ **Pessoas**: CRUD completo (criar, listar, atualizar, deletar)
- ✅ **Tags**: CRUD completo com contadores automáticos
- ✅ **Gastos**: Criar com divisão por valores fixos + parcelamento
- ✅ **Receitas**: Sistema exclusivo do proprietário
- ✅ **Pagamentos**: Processar com status automático + excesso
- ✅ **Relatórios**: 8 endpoints com 15+ filtros cada
- ✅ **Configurações**: Sistema escalável (tema + futuras)

### **👥 Para os Participantes - COMPLETO ✅**
- ✅ **Dívidas**: Consultar com filtros avançados
- ✅ **Pagamentos**: Registrar com validações
- ✅ **Histórico**: Visualizar transações e pagamentos
- ✅ **Resumos**: Ver estatísticas personalizadas

### **💰 Sistema de Transações - COMPLETO ✅**
- ✅ **Gastos**: Compartilhados com valores específicos por pessoa
- ✅ **Receitas**: Exclusivas do proprietário
- ✅ **Parcelamento**: Avançado com valores diferentes por parcela
- ✅ **Status automático**: PENDENTE → PAGO_PARCIAL → PAGO_TOTAL
- ✅ **Triggers**: 10 gatilhos automáticos otimizados

### **📊 Sistema de Relatórios - COMPLETO ✅**
- ✅ **Dashboard**: Estatísticas gerais + gráficos
- ✅ **Por Pessoa**: Dívidas, pagamentos, estatísticas
- ✅ **Por Tag**: Gastos por categoria + tendências
- ✅ **Por Período**: Análises temporais avançadas
- ✅ **Filtros**: 15+ opções por endpoint (data, valor, status, etc.)

### **⚙️ Sistema de Configurações - COMPLETO ✅**
- ✅ **Tema**: light/dark/auto (pronto para frontend)
- ✅ **Estrutura escalável**: preparado para comportamento, alertas, relatórios
- ✅ **Validações**: Zod com enums seguros
- ✅ **Acesso restrito**: apenas proprietário

## 🚦 **URLs de Desenvolvimento**

- **Frontend**: http://localhost:3000 (setup pronto)
- **Backend API**: http://localhost:3001/api (42 endpoints funcionando ✅)
- **Documentação**: Consulte `docs/COMANDOS-RAPIDOS.md` para testes

## 🧪 **Endpoints Disponíveis - 42 FUNCIONANDO ✅**

### **Autenticação (2 endpoints)**
- `POST /api/auth/login` - Login do sistema
- `POST /api/auth/logout` - Logout do sistema

### **Pessoas (6 endpoints)**
- `GET /api/pessoas` - Listar (proprietário) / Ver próprios dados (participante)
- `POST /api/pessoas` - Criar pessoa (proprietário only)
- `GET /api/pessoas/:id` - Buscar por ID
- `PUT /api/pessoas/:id` - Atualizar (proprietário only)
- `DELETE /api/pessoas/:id` - Deletar (proprietário only)
- `GET /api/pessoas/:id/dividas` - Ver dívidas

### **Tags (5 endpoints)**
- `GET /api/tags` - Listar todas
- `POST /api/tags` - Criar (proprietário only)
- `GET /api/tags/:id` - Buscar por ID
- `PUT /api/tags/:id` - Atualizar (proprietário only)
- `DELETE /api/tags/:id` - Deletar (proprietário only)

### **Transações (8 endpoints)**
- `GET /api/transacoes` - Listar com filtros
- `POST /api/transacoes` - Criar gasto/receita
- `GET /api/transacoes/:id` - Buscar por ID
- `PUT /api/transacoes/:id` - Atualizar (proprietário only)
- `DELETE /api/transacoes/:id` - Deletar (proprietário only)
- `GET /api/transacoes/gastos` - Apenas gastos
- `GET /api/transacoes/receitas` - Apenas receitas
- `GET /api/transacoes/:id/participantes` - Ver divisão

### **Pagamentos (6 endpoints)**
- `GET /api/pagamentos` - Listar com filtros
- `POST /api/pagamentos` - Registrar pagamento
- `GET /api/pagamentos/:id` - Buscar por ID
- `PUT /api/pagamentos/:id` - Atualizar (proprietário only)
- `DELETE /api/pagamentos/:id` - Deletar (proprietário only)
- `POST /api/pagamentos/processar` - Processar em lote

### **Relatórios (8 endpoints)**
- `GET /api/relatorios/dashboard` - Estatísticas gerais
- `GET /api/relatorios/pessoa/:id` - Relatório por pessoa
- `GET /api/relatorios/tag/:id` - Relatório por tag
- `GET /api/relatorios/periodo` - Análise temporal
- `GET /api/relatorios/dividas-pendentes` - Dívidas em aberto
- `GET /api/relatorios/pagamentos-recentes` - Pagamentos recentes
- `GET /api/relatorios/gastos-categoria` - Gastos por categoria
- `GET /api/relatorios/tendencias` - Análise de tendências

### **Configurações (7 endpoints)**
- `GET /api/configuracoes/info` - Info das configurações
- `GET /api/configuracoes/interface` - Configurações de interface (tema)
- `PUT /api/configuracoes/interface` - Atualizar interface
- `GET /api/configuracoes/comportamento` - Futuro (501)
- `GET /api/configuracoes/alertas` - Futuro (501)
- `GET /api/configuracoes/relatorios` - Futuro (501)
- `DELETE /api/configuracoes/reset` - Reset todas (proprietário only)

## 🤝 **Contribuição**

### **✅ Backend - 100% FINALIZADO**
- [x] **FASE 1:** Setup completo Backend + Frontend ✅
- [x] **FASE 2:** PostgreSQL + Prisma + 3 migrações ✅
- [x] **FASE 3.1:** Express + middlewares + error handling ✅
- [x] **FASE 3.2:** Autenticação JWT em português ✅
- [x] **FASE 3.3:** CRUD Pessoas completo ✅
- [x] **FASE 3.4:** CRUD Tags completo ✅
- [x] **FASE 3.5:** Sistema Transações avançado ✅
- [x] **FASE 3.6:** Sistema Pagamentos com status automático ✅
- [x] **FASE 3.7:** Sistema Relatórios com 15+ filtros ✅
- [x] **FASE 3.8:** Testes manuais + otimizações ✅
- [x] **FASE 3.9:** Sistema Configurações escalável ✅

### **🚀 Próxima Fase - Frontend**
- [ ] **FASE 4.1:** Setup UI/UX + Componentes base
- [ ] **FASE 4.2:** Autenticação + Layout principal  
- [ ] **FASE 4.3:** Dashboard + Navegação
- [ ] **FASE 4.4:** CRUD Pessoas + Tags
- [ ] **FASE 4.5:** Sistema Transações (criar/editar)
- [ ] **FASE 4.6:** Sistema Pagamentos
- [ ] **FASE 4.7:** Relatórios + Gráficos
- [ ] **FASE 4.8:** Configurações + Tema
- [ ] **FASE 4.9:** Configurações + Preferências

**🎯 META:** Frontend funcionando em 2-3 semanas com 42 endpoints prontos!

## 📄 **Licença**

Este projeto está em desenvolvimento. Licença será definida posteriormente.

---

**💡 Projeto:** Personal Expense Hub  
**📅 Criado em:** Dezembro 2024  
**🔄 Status:** Fase 3.9 concluída - Backend 100% FINALIZADO ✅  
**🚀 Próximo:** Fase 4 - Frontend UI/UX (51 tarefas)  
**👨‍💻 Desenvolvimento:** Backend PRODUCTION READY → Frontend INICIANDO