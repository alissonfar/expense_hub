# Personal Expense Hub - Documentação Oficial

Bem-vindo à documentação oficial do Personal Expense Hub, um sistema completo para gerenciamento de despesas pessoais e compartilhadas, agora com suporte a Multi-Tenancy (múltiplos Hubs).

Este projeto foi desenvolvido para fornecer uma solução robusta e escalável, com um backend Node.js/Express e um frontend React/Next.js.

## 📚 Navegação Rápida

- **[Arquitetura do Sistema](./ARCHITECTURE.md):** Padrões técnicos, estrutura do banco e convenções.
- **[Documentação da API](./API.md):** Detalhes de todos os endpoints disponíveis.
- **[Guia de Desenvolvimento](./DEVELOPMENT.md):** Como contribuir, padrões de código e fluxo de trabalho.
- **[Solução de Problemas](./TROUBLESHOOTING.md):** Erros comuns e como resolvê-los.
- **[Decisões Arquiteturais](./DECISIONS.md):** Histórico de decisões técnicas importantes.
- **[Regras para o Cursor AI](./CURSOR_RULES.md):** Diretrizes para a IA assistente.

## 🚀 Stack Tecnológica

### **Backend:**
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Autenticação: JWT (JSON Web Tokens) com bcrypt
- Validação: Zod com mensagens customizadas em Português (BR)
- Segurança: Helmet, CORS, Rate Limiting

### **Frontend:**
- Next.js 14 + React + TypeScript
- Tailwind CSS + Shadcn/ui
- Gerenciamento de Estado: Hooks customizados, Context API
- Formulários: React Hook Form com Zod

## 🛠️ Setup e Instalação (Modo Desenvolvimento)

### **Forma mais simples (Recomendado):**

1.  Execute o script `start-dev.bat` com um duplo clique.
    ```bash
    ./start-dev.bat
    ```
2.  Aguarde as duas janelas (Backend e Frontend) iniciarem.
3.  Acesse o sistema em `http://localhost:3000`.

### **Instalação Manual:**

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd hub
    ```

2.  **Configure o Backend:**
    ```bash
    cd backend
    npm install
    npx prisma generate
    npx prisma migrate dev --name multi-tenant-initial-schema
    npm run dev
    ```
    *O backend estará rodando em `http://localhost:3001`.*

3.  **Configure o Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```
    *O frontend estará rodando em `http://localhost:3000`.*

## 📂 Estrutura de Pastas Principal

```
hub/
├── backend/            # API RESTful (Node.js, Express, Prisma)
│   ├── controllers/    # Lógica de negócio e regras da aplicação
│   ├── middleware/     # Middlewares (autenticação, validação, RLS)
│   ├── prisma/         # Schema e migrações do banco de dados
│   ├── routes/         # Definição dos endpoints da API
│   ├── schemas/        # Schemas de validação com Zod
│   ├── types/          # Interfaces e tipos globais
│   └── utils/          # Funções utilitárias reutilizáveis
├── docs/               # Documentação completa do projeto
└── frontend/           # Aplicação Web (Next.js, React)
    ├── app/            # Rotas e páginas (App Router)
    ├── components/     # Componentes React reutilizáveis
    ├── hooks/          # Hooks customizados para lógica e dados
    ├── lib/            # API client, providers e utils
    └── styles/         # Estilos globais
```

## Scripts Principais

| Script | Função | Descrição |
|---|---|---|
| `start-dev.bat` | 🚀 Inicia todo o ambiente | Sobe o backend, frontend e monitora mudanças. |
| `stop-dev.bat` | 🛑 Para todos os processos | Encerra as janelas do `cmd` abertas pelo `start-dev`. |
| `reset-dev.bat` | 🔄 Reset completo do ambiente | Apaga `node_modules`, `dist`, etc., e reinstala tudo. Útil para resolver problemas de dependência. |
| `backend/reset-database.bat` | 💥 Reseta o banco de dados | Executa `prisma migrate reset` para limpar e recriar o banco. **CUIDADO: APAGA TODOS OS DADOS.** | 