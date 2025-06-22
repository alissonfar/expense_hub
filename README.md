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
- ✅ **Relatórios em tempo real**

## 🛠️ **Stack Tecnológica**

| Componente | Tecnologia |
|------------|------------|
| **Backend** | Node.js + Express + TypeScript |
| **Frontend** | Next.js + React + TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **UI** | Tailwind CSS + Shadcn/ui |
| **Auth** | JWT + bcrypt |

## 📋 **Status do Projeto**

🟡 **EM DESENVOLVIMENTO** - Veja o status atual em [`docs/STATUS-ATUAL.md`](docs/STATUS-ATUAL.md)

```
FASE 1 - Setup e Fundação:       🟢 CONCLUÍDO     (14/14 tarefas) ✅
FASE 2 - Database e ORM:         🟢 CONCLUÍDO     (13/13 tarefas) ✅
FASE 3.1 - Backend Base:         🟢 CONCLUÍDO     (5/5 tarefas)   ✅
FASE 3.2 - Autenticação:         🟢 CONCLUÍDO     (7/7 tarefas)   ✅
FASE 3.3 - CRUD Pessoas:         🟡 EM ANDAMENTO  (0/5 tarefas)   ⏳
FASE 3.4 - Backend APIs:         🔴 NÃO INICIADO  (0/21 tarefas)
FASE 4 - Frontend UI/UX:         🔴 NÃO INICIADO  (0/33 tarefas)
FASE 5 - Integração e Testes:    🔴 NÃO INICIADO  (0/19 tarefas)
FASE 6 - Deploy:                 🔴 NÃO INICIADO  (0/13 tarefas)

TOTAL DE PROGRESSO: 32/125 tarefas (25.6%)
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

# Gerar Prisma Client (quando banco estiver configurado)
npm run db:generate

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

### **🗄️ Banco de Dados (Próxima Fase)**
```bash
cd backend

# Aplicar schema PostgreSQL
npm run db:migrate

# Popular com dados iniciais
npm run db:seed
```

### **📝 Scripts Disponíveis**

#### **Backend**
```bash
npm run dev        # Desenvolvimento com hot reload
npm run build      # Build para produção
npm run start      # Executar build de produção
npm run lint       # Verificar código com ESLint
npm run format     # Formatar código com Prettier
npm run type-check # Verificar tipos TypeScript
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
├── backend/                 # API REST (Node.js + Express)
│   ├── controllers/         # Lógica de negócios ✅
│   ├── models/             # Tipos e validações ✅
│   ├── routes/             # Rotas da API ✅
│   ├── migrations/         # Scripts de migração ✅
│   ├── seeds/              # Dados iniciais ✅
│   ├── middlewares/        # Middlewares Express
│   ├── utils/              # Utilitários
│   ├── prisma/             # Configuração Prisma
│   ├── app.js              # Configuração principal ✅
│   ├── tsconfig.json       # Config TypeScript ✅
│   ├── package.json        # Dependências ✅
│   └── env.example         # Template de env vars ✅
├── frontend/               # Interface (Next.js + React)
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
├── docs/                   # Documentação ✅
│   ├── plano-implementacao.md  # Roadmap detalhado ✅
│   └── architecture.md     # Arquitetura técnica ✅
└── README.md               # Este arquivo ✅
```

## 📖 **Documentação**

- **🔄 [STATUS ATUAL](docs/STATUS-ATUAL.md)** - Estado exato do projeto e próximos passos ⭐
- **📋 [Plano de Implementação](docs/plano-implementacao.md)** - Roadmap completo com 125 tarefas organizadas em 6 fases
- **🏗️ [Arquitetura](docs/architecture.md)** - Detalhes técnicos da stack e estrutura do sistema

## 🎯 **Funcionalidades Principais**

### **👑 Para o Proprietário**
- Criar gastos e receitas
- Adicionar participantes com valores específicos
- Gerenciar pessoas e tags
- Visualizar relatórios completos
- Controlar todas as configurações

### **👥 Para os Participantes**
- Visualizar suas dívidas
- Registrar pagamentos
- Consultar histórico
- Ver resumo de gastos

### **💰 Sistema de Transações**
- **Gastos**: Compartilhados entre pessoas com valores fixos
- **Receitas**: Exclusivas do proprietário
- **Parcelamento**: Suporte a parcelas com valores diferentes
- **Status automático**: PENDENTE → PAGO_PARCIAL → PAGO_TOTAL

## 🚦 **URLs de Desenvolvimento**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Documentação API**: http://localhost:3001/api/docs (em breve)

## 🤝 **Contribuição**

Este é um projeto em desenvolvimento ativo. Consulte o [plano de implementação](docs/plano-implementacao.md) para entender o progresso atual e próximos passos.

### **✅ Fases Completas:**
- [x] **FASE 1:** Configuração completa do Backend e Frontend
- [x] **FASE 2:** PostgreSQL + Prisma + Schema completo funcionando
- [x] **FASE 3.1:** Express base + middlewares + error handling
- [x] **FASE 3.2:** Sistema completo de autenticação em português BR

### **🔄 Próximo Passo:**
- [ ] **FASE 3.3:** Implementar CRUD de Pessoas (apenas proprietário)
- [ ] **Fase 2**: Setup PostgreSQL + Prisma
- [ ] **Fase 3**: APIs REST do backend
- [ ] **Fase 4**: Interface completa do frontend

## 📄 **Licença**

Este projeto está em desenvolvimento. Licença será definida posteriormente.

---

**💡 Projeto:** Personal Expense Hub  
**📅 Criado em:** Dezembro 2024  
**🔄 Status:** Fase 1 completa - Setup e Fundação ✅  
**👨‍💻 Desenvolvimento:** Em andamento 