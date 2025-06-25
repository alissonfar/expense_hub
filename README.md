# 💰 Personal Expense Hub

Sistema web de controle de gastos pessoais compartilhados onde um proprietário gerencia todas as transações e participantes podem ter gastos divididos com valores específicos.

## 🚀 Início Rápido

### **Forma MAIS SIMPLES:**

```bash
# 1. Duplo clique no arquivo:
start-dev.bat

# 2. Aguarde a aplicação iniciar
# 3. Acesse: http://localhost:3000
```

### **Scripts Disponíveis:**

| Script | Função | Quando Usar |
|--------|--------|-------------|
| `start-dev.bat` | 🚀 Inicia backend + frontend | Desenvolvimento diário |
| `stop-dev.bat` | 🛑 Para todos os processos | Finalizar trabalho |
| `reset-dev.bat` | 🔄 Reset completo | Problemas/corrupção |

## 🎯 Como Funciona

### **start-dev.bat:**
- ✅ Verifica dependências automaticamente
- ✅ Instala o que estiver faltando
- ✅ Inicia Backend (porta 3001)
- ✅ Inicia Frontend (porta 3000)
- ✅ Abre navegador automaticamente
- ✅ Monitora em janelas separadas

### **Resultado:**
- **Backend:** http://localhost:3001 (API)
- **Frontend:** http://localhost:3000 (Interface)
- **2 janelas:** Uma para cada serviço

## 🛠️ Stack Tecnológica

### **Backend:**
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT + bcrypt (autenticação)
- Zod (validação em português BR)
- Rate limiting, CORS, Helmet

### **Frontend:**
- Next.js 14 + React + TypeScript
- Tailwind CSS + Shadcn/ui
- Hooks customizados para API
- Sistema de autenticação JWT

## 📊 Funcionalidades

### **✅ Implementado (100% Funcional):**
- 🔐 Sistema de autenticação completo
- 👥 Gestão de pessoas (proprietário + participantes)
- 💸 Transações (gastos compartilhados + receitas)
- 🏷️ Sistema de tags com cores
- 💳 Pagamentos (individual + composto)
- 📊 Dashboard com estatísticas reais
- 📈 Relatórios detalhados
- ⚙️ Configurações do sistema
- 🔍 **Páginas de detalhes e edição** ← NOVO!
- ✅ **42 endpoints funcionais**
- ✅ **Zero bugs conhecidos**

### **🎨 Interface Moderna:**
- Design responsivo mobile-first
- Formulários inteligentes com validação
- Calculadora automática de divisão
- Sistema de parcelamento
- Filtros avançados
- **Páginas de detalhes completas** ← NOVO!
- **Formulários de edição** ← NOVO!
- **Modais de confirmação** ← NOVO!
- **Estados de loading/error** ← NOVO!

## 🗂️ Estrutura do Projeto

```
hub/
├── backend/           # API REST (Node.js + Express)
├── frontend/          # Interface (Next.js + React)
├── docs/             # Documentação técnica
├── start-dev.bat     # 🚀 INICIAR APLICAÇÃO
├── stop-dev.bat      # 🛑 PARAR APLICAÇÃO  
└── reset-dev.bat     # 🔄 RESET COMPLETO
```

## 🔧 Configuração Manual (Opcional)

Se preferir não usar os scripts automáticos:

### **Backend:**
```bash
cd backend
npm install
npm run dev
```

### **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### **Banco de Dados:**
```bash
cd backend
npm run setup-db
```

## 🎯 Principais Endpoints

### **Autenticação:**
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil do usuário

### **Transações:**
- `GET /api/transacoes` - Listar transações
- `POST /api/transacoes` - Criar gasto
- `POST /api/transacoes/receita` - Criar receita

### **Relatórios:**
- `GET /api/relatorios/dashboard` - Dashboard principal
- `GET /api/relatorios/saldos` - Saldos por pessoa
- `GET /api/relatorios/pendencias` - Pendências

**Total:** 42 endpoints mapeados

## 🔧 Correções Técnicas Implementadas

### **✅ Problemas Resolvidos:**
- 🐛 **Valores monetários:** Correção Prisma Decimal → Number
- 🐛 **TypeScript errors:** 11 erros → 0 erros
- 🐛 **Import errors:** AlertDialog → Dialog components
- 🐛 **Cache corruption:** Next.js cache management
- 🐛 **Navigation 404:** Rotas dinâmicas `/transacoes/[id]`

### **✅ Melhorias de Robustez:**
- 🛡️ **Null safety:** Optional chaining implementado
- 🛡️ **Type safety:** Interfaces TypeScript completas
- 🛡️ **Error handling:** Tratamento graceful de erros
- 🛡️ **Performance:** Cache otimizado e limpeza automática

## 🛠️ Solução de Problemas

### **Problema comum: Porta ocupada**
```bash
stop-dev.bat
```

### **Problema: Dependências corrompidas**
```bash
reset-dev.bat
```

### **Problema: Cache do Next.js**
```bash
# Manual:
cd frontend
rmdir /s .next
npm run dev
```

## 📝 Padrões do Projeto

### **Backend:**
- Arquitetura MVC estruturada
- Middlewares: `requireAuth` → `requireOwner` → `validateSchema`
- Respostas padronizadas: `{ success, message, data, timestamp }`
- Validação Zod com mensagens em português
- Logs estratégicos para debugging

### **Frontend:**
- Hooks customizados para API
- Componentes reutilizáveis (Shadcn/ui)
- TypeScript tipagem completa
- Sistema de cache inteligente
- Validação client-side + server-side

## 🚀 Deploy

### **Desenvolvimento:**
```bash
start-dev.bat
```

### **Produção:**
- Backend: Configurar variáveis de ambiente
- Frontend: Build + deploy estático
- Banco: PostgreSQL em produção

## 🤝 Contribuição

1. Use os scripts para desenvolvimento
2. Siga os padrões estabelecidos
3. Teste antes de commitar
4. Documente mudanças importantes

## 📞 Suporte

Se encontrar problemas:

1. **Tente:** `stop-dev.bat` → `start-dev.bat`
2. **Se persistir:** `reset-dev.bat`
3. **Verifique:** Node.js e PostgreSQL instalados
4. **Consulte:** `COMO-USAR.md` para detalhes

---

## 🎯 Resumo para Desenvolvedores

```bash
# Clonar projeto
git clone [repo-url]
cd hub

# Iniciar (SUPER SIMPLES)
start-dev.bat

# Acessar
http://localhost:3000

# Parar
stop-dev.bat
```

**Pronto para desenvolver! 🚀**
