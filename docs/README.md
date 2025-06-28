# Personal Expense Hub - Documentação Oficial

Bem-vindo à documentação oficial do Personal Expense Hub, um sistema completo para gerenciamento de despesas pessoais e compartilhadas.

Este projeto foi desenvolvido para fornecer uma solução robusta e escalável, com um backend Node.js/Express e um frontend React/Next.js.

## 📚 Navegação

- **[Arquitetura do Sistema](./ARCHITECTURE.md):** Padrões técnicos, estrutura do banco e convenções.
- **[Documentação da API](./API.md):** Detalhes de todos os endpoints disponíveis.
- **[Guia de Desenvolvimento](./DEVELOPMENT.md):** Como contribuir, padrões de código e fluxo de trabalho.
- **[Solução de Problemas](./TROUBLESHOOTING.md):** Erros comuns e como resolvê-los.
- **[Decisões Arquiteturais](./DECISIONS.md):** Histórico de decisões técnicas importantes.
- **[Regras para o Cursor AI](./CURSOR_RULES.md):** Diretrizes para a IA assistente.

## 🚀 Stack Tecnológica

- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **Autenticação:** JWT (JSON Web Tokens) com bcrypt
- **Validação:** Zod com mensagens customizadas em Português (BR)
- **Frontend:** React, Next.js, TypeScript
- **UI:** Shadcn/UI, TailwindCSS
- **Gerenciamento de Estado:** React Query, Context API

## 🛠️ Setup e Instalação

*Instruções detalhadas sobre como configurar o ambiente de desenvolvimento local.*

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd personal-expense-hub
    ```

2.  **Configure o Backend:**
    ```bash
    cd backend
    npm install
    cp env.example .env 
    # Preencha as variáveis de ambiente no arquivo .env
    npx prisma migrate dev --name initial-schema
    npm run dev
    ```

3.  **Configure o Frontend:**
    ```bash
    cd ../frontend
    npm install
    cp env.example .env.local
    # Preencha as variáveis de ambiente no arquivo .env.local
    npm run dev
    ```

## 📂 Estrutura de Pastas

Abaixo está uma visão geral da estrutura de pastas do projeto:

```
hub/
├── backend/
│   ├── controllers/    # Lógica de negócio dos endpoints
│   ├── middleware/     # Middlewares de autenticação e validação
│   ├── prisma/         # Schema do banco de dados
│   ├── routes/         # Definição das rotas da API
│   ├── schemas/        # Schemas de validação Zod
│   ├── types/          # Tipos e interfaces TypeScript
│   └── utils/          # Funções utilitárias (JWT, senhas)
├── docs/               # Documentação completa do projeto
└── frontend/
    ├── app/            # Estrutura de rotas e páginas do Next.js
    ├── components/     # Componentes React reutilizáveis
    ├── hooks/          # Hooks customizados
    ├── lib/            # Funções utilitárias e API client
    ├── styles/         # Estilos globais
    └── types/          # Tipos e interfaces TypeScript
``` 