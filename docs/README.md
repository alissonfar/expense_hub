# 💰 Personal Expense Hub - Documentação

**Sistema de controle de gastos pessoais compartilhados**  
**Versão:** 2.1.1 (Sistema Completo Funcional)  
**Status:** 🟢 Produção Ready ✅

## 🎯 **VISÃO GERAL**

O Personal Expense Hub é um sistema web completo para controle de gastos pessoais compartilhados, onde um **proprietário** centraliza o controle de todas as transações e divide custos com **participantes** usando valores fixos específicos.

### **🚀 Características Principais**
- **Proprietário centralizado** - Controle total do sistema
- **Participantes** - Podem ter dívidas e fazer pagamentos
- **Gastos compartilhados** - Divisão por valores fixos
- **Parcelamento avançado** - Valores diferentes por parcela
- **Receitas exclusivas** - Apenas proprietário
- **Pagamentos compostos** - Múltiplas transações em um pagamento
- **Sistema de tags** - Categorização flexível
- **Relatórios em tempo real** - Dashboard e análises

## 🛠️ **STACK TECNOLÓGICA**

### **Backend (API REST)**
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.21.1
- **Linguagem:** TypeScript 5.7.2
- **ORM:** Prisma 6.10.1
- **Banco:** PostgreSQL 14+
- **Autenticação:** JWT + bcrypt
- **Validação:** Zod (mensagens em português BR)
- **Segurança:** Helmet, CORS, Rate limiting

### **Frontend (Interface Web)**
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Componentes:** Shadcn/ui
- **Estado:** React Context + Hooks
- **HTTP Client:** Fetch API

### **Banco de Dados**
- **Sistema:** PostgreSQL 14+
- **Tabelas:** 9 tabelas principais
- **Relacionamentos:** Complexos com integridade referencial
- **Índices:** Otimizados para performance
- **Triggers:** Automáticos para consistência

## 📁 **ESTRUTURA DO PROJETO**

```
hub/
├── backend/                    # API REST
│   ├── controllers/           # Lógica de negócio (7 módulos)
│   │   ├── authController.ts     # Autenticação e usuários
│   │   ├── pessoaController.ts   # Gestão de pessoas
│   │   ├── transacaoController.ts # Gastos e receitas
│   │   ├── pagamentoController.ts # Pagamentos
│   │   ├── tagController.ts      # Sistema de tags
│   │   ├── relatorioController.ts # Relatórios e dashboard
│   │   └── configuracaoController.ts # Configurações
│   ├── routes/               # Definição de rotas (42 endpoints)
│   │   ├── auth.ts              # 6 endpoints autenticação
│   │   ├── pessoa.ts            # 6 endpoints pessoas
│   │   ├── transacao.ts         # 8 endpoints transações
│   │   ├── pagamento.ts         # 8 endpoints pagamentos
│   │   ├── tag.ts               # 6 endpoints tags
│   │   ├── relatorio.ts         # 6 endpoints relatórios
│   │   └── configuracao.ts      # 4 endpoints configurações
│   ├── schemas/              # Validações Zod
│   ├── middleware/           # Auth, validação, segurança
│   ├── types/                # Interfaces TypeScript
│   ├── utils/                # Utilitários (JWT, password)
│   ├── prisma/               # Schema do banco
│   └── migrations/           # Scripts SQL
├── frontend/                  # Interface Web
│   ├── app/                  # Páginas Next.js (15 páginas)
│   │   ├── (auth)/             # Páginas autenticadas
│   │   │   ├── dashboard/        # Dashboard principal
│   │   │   ├── pessoas/          # Gestão de pessoas
│   │   │   ├── transacoes/       # Gastos e receitas
│   │   │   ├── pagamentos/       # Pagamentos
│   │   │   ├── tags/             # Tags
│   │   │   ├── relatorios/       # Relatórios
│   │   │   └── configuracoes/    # Configurações
│   │   ├── login/              # Página de login
│   │   └── page.tsx            # Página inicial
│   ├── components/           # Componentes React
│   │   ├── auth/               # Componentes de autenticação
│   │   ├── common/             # Componentes comuns
│   │   ├── forms/              # Formulários
│   │   ├── layout/             # Layout da aplicação
│   │   └── ui/                 # Componentes UI (Shadcn/ui)
│   ├── hooks/                # Hooks customizados (12 hooks)
│   ├── lib/                  # Utilitários e providers
│   └── types/                # Tipos TypeScript
├── docs/                     # Documentação técnica
│   ├── README.md            # Este arquivo
│   ├── ARCHITECTURE.md      # Arquitetura e padrões
│   ├── API.md               # Documentação de endpoints
│   ├── DEVELOPMENT.md       # Guias de desenvolvimento
│   ├── TROUBLESHOOTING.md   # Problemas e soluções
│   ├── DECISIONS.md         # Decisões arquiteturais
│   └── CURSOR_RULES.md      # Rules para Cursor AI
├── start-dev.bat            # 🚀 Iniciar aplicação
├── stop-dev.bat             # 🛑 Parar aplicação
└── reset-dev.bat            # 🔄 Reset completo
```

## 🚀 **INÍCIO RÁPIDO**

### **1. Instalação**
```bash
# Clonar repositório
git clone <repository-url>
cd hub

# Iniciar aplicação (Windows)
start-dev.bat

# Ou manualmente
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

### **2. Configuração**
```bash
# Backend - Criar .env
cd backend
copy env.example .env
# Editar DATABASE_URL e JWT_SECRET

# Frontend - Criar .env.local
cd frontend
copy env.example .env.local
# Configurar URL da API
```

### **3. Banco de Dados**
```bash
cd backend
npm run setup-db    # Criar banco e executar migrations
npm run seed        # Dados de teste (opcional)
```

### **4. Acesso**
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Banco:** localhost:5432

## 📊 **FUNCIONALIDADES COMPLETAS**

### **✅ Sistema de Autenticação**
- Login/Registro com JWT
- Perfil de usuário
- Alterar senha
- Proprietário vs Participantes
- Middleware de proteção

### **✅ Gestão de Pessoas**
- CRUD completo de pessoas
- Perfis de proprietário/participante
- Sistema de ativação/desativação
- Estatísticas por pessoa

### **✅ Transações Avançadas**
- Gastos compartilhados
- Receitas (só proprietário)
- Sistema de parcelamento
- Valores fixos por participante
- Divisão personalizada

### **✅ Sistema de Pagamentos**
- Pagamentos individuais
- Pagamentos compostos
- Múltiplas formas de pagamento
- Controle de excedentes
- Receitas automáticas de excedente

### **✅ Tags e Categorização**
- CRUD de tags
- Sistema de cores
- Ícones personalizados
- Filtros por categoria

### **✅ Relatórios Completos**
- Dashboard em tempo real
- Saldos por pessoa
- Análise de pendências
- Relatórios de transações
- Análise por categorias

### **✅ Configurações**
- Configurações de interface
- Temas (light/dark/auto)
- Configurações de excedente
- Preferências do sistema

## 🔧 **SCRIPTS DISPONÍVEIS**

### **Windows (Recomendado)**
- `start-dev.bat` - 🚀 Inicia backend + frontend
- `stop-dev.bat` - 🛑 Para todos os processos
- `reset-dev.bat` - 🔄 Reset completo com limpeza

### **Manual**
```bash
# Backend
cd backend
npm run dev         # Modo desenvolvimento
npm run build      # Build para produção
npm run start      # Produção
npm run setup-db   # Configurar banco

# Frontend  
cd frontend
npm run dev        # Modo desenvolvimento
npm run build     # Build para produção
npm run start     # Produção
```

## 📈 **ESTATÍSTICAS DO PROJETO**

### **Backend**
- **42 endpoints** funcionais
- **7 controllers** com lógica de negócio
- **9 tabelas** no banco de dados
- **269 tipos** TypeScript definidos
- **Zero bugs** conhecidos

### **Frontend**
- **15 páginas** implementadas
- **12 hooks** customizados
- **40+ componentes** React
- **Interface responsiva** mobile-first
- **Integração completa** com API

## 📚 **DOCUMENTAÇÃO TÉCNICA**

Esta documentação está organizada em módulos especializados:

### **Para Desenvolvedores**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura e padrões técnicos
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guias de desenvolvimento
- [API.md](./API.md) - Documentação completa da API

### **Para Manutenção**
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problemas conhecidos e soluções
- [DECISIONS.md](./DECISIONS.md) - Decisões arquiteturais e histórico

### **Para Cursor AI**
- [CURSOR_RULES.md](./CURSOR_RULES.md) - Rules específicas do Cursor AI

### **Arquivos Importantes**
- [Schema do Banco](../backend/prisma/schema.prisma)
- [Configuração Backend](../backend/env.example)
- [Configuração Frontend](../frontend/env.example)
- [Scripts de Migração](../backend/migrations/)

## 🎯 **PRÓXIMOS PASSOS**

O projeto está **100% funcional** e pronto para:

1. **Deploy em produção**
2. **Testes automatizados**
3. **Monitoramento e logs**
4. **Backup automático**
5. **Funcionalidades avançadas**

## 📞 **SUPORTE**

Para dúvidas sobre desenvolvimento, consulte:
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Guias de desenvolvimento
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problemas conhecidos
- [CURSOR_RULES.md](./CURSOR_RULES.md) - Rules para Cursor AI

---

**Personal Expense Hub** - Sistema completo de controle de gastos pessoais  
**Desenvolvido com:** Node.js, React, TypeScript, PostgreSQL  
**Status:** Produção Ready ✅ 