# Arquitetura e Padrões Técnicos

Este documento descreve a arquitetura, os padrões e as convenções técnicas utilizadas no projeto Personal Expense Hub. O objetivo é manter a consistência, a qualidade e a manutenibilidade do código.

## 1. Visão Geral da Arquitetura

O sistema é dividido em duas partes principais:

-   **Backend:** Uma API RESTful construída com **Node.js**, **Express** e **TypeScript**. É responsável pela lógica de negócio, autenticação, acesso ao banco de dados e validação.
-   **Frontend:** Uma Single Page Application (SPA) construída com **React**, **Next.js** e **TypeScript**, que consome a API do backend.

## 2. Backend

### 2.1. Estrutura de Pastas

A estrutura do backend foi projetada para separar as responsabilidades de forma clara:

```
backend/
├── controllers/    # Lógica de negócio e controle dos endpoints
├── middleware/     # Funções que rodam antes dos controllers (auth, validação)
├── prisma/         # Schema e migrações do banco de dados (Prisma)
├── routes/         # Definição e agrupamento de rotas da API
├── schemas/        # Schemas de validação de dados com Zod
├── types/          # Interfaces e tipos globais do TypeScript
└── utils/          # Funções utilitárias (JWT, hash de senha)
```

### 2.2. Padrões de Controller

Os controllers contêm a lógica principal da aplicação. Eles seguem os seguintes padrões:

-   **Funções Assíncronas:** Todos os controllers são `async` e utilizam `try...catch` para tratamento de erros.
-   **Requisição e Resposta Tipadas:** Utilizam os tipos `Request` and `Response` do Express.
-   **Acesso ao Prisma:** O cliente Prisma é acessado através de `req.prisma`.
-   **Estrutura de Resposta Padrão:** As respostas seguem um formato consistente (veja seção 2.7).

**Exemplo de um método de controller:**

```typescript
// backend/controllers/pessoaController.ts

export const listPessoas = async (req: Request, res: Response): Promise<void> => {
  try {
    // ... lógica de busca e paginação ...

    res.json({
      success: true,
      message: `${pessoas.length} pessoa(s) encontrada(s)`,
      data: pessoas,
      pagination: { ... },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar as pessoas',
      timestamp: new Date().toISOString()
    });
  }
};
```

### 2.3. Middlewares e Fluxo de Requisição

Os middlewares são usados extensivamente para validação, autenticação e autorização. O fluxo de uma requisição protegida geralmente é:

`Requisição -> Middleware de Autenticação (requireAuth) -> Middleware de Autorização (requireOwner - se necessário) -> Middleware de Validação (validateSchema) -> Controller`

**Middlewares principais (`backend/middleware/auth.ts`):**

-   `requireAuth`: Verifica a validade do token JWT no header `Authorization`. Se válido, anexa os dados do usuário (`JWTPayload`) ao objeto `req.user`.
-   `requireOwner`: Garante que o usuário autenticado tem a flag `eh_proprietario` como `true`.
-   `validateSchema(schema)`: Valida o `req.body` contra um schema Zod.
-   `validateParams(schema)`: Valida os `req.params` (parâmetros da URL).
-   `validateQuery(schema)`: Valida os `req.query` (query strings).

### 2.4. Autenticação com JWT

O sistema utiliza JSON Web Tokens (JWT) para autenticação.

-   **Geração do Token:** Após o login/registro, um token é gerado contendo o payload do usuário.
-   **Payload do Token (`JWTPayload`):**
    -   `user_id`: ID do usuário.
    -   `email`: Email do usuário.
    -   `eh_proprietario`: Booleano que indica se o usuário é proprietário.
-   **Envio:** O token é enviado no header `Authorization` como `Bearer <token>`.
-   **Verificação:** O middleware `requireAuth` verifica e decodifica o token em cada requisição protegida.

### 2.5. Validação com Zod

A validação de todos os dados de entrada (body, params, query) é feita com a biblioteca **Zod**.

-   **Schemas Centralizados:** Os schemas de validação ficam na pasta `backend/schemas/`, organizados por recurso.
-   **Mensagens em Português:** As mensagens de erro são customizadas para o português.
-   **Transformação de Dados:** Zod é usado para transformar e coagir tipos de dados (ex: string para número).

### 2.6. Prisma e Banco de Dados

O **Prisma ORM** é usado para interagir com o banco de dados PostgreSQL.

-   **Schema como Fonte da Verdade:** O arquivo `backend/prisma/schema.prisma` define os modelos de dados, relacionamentos, índices e constraints.
-   **Migrações:** O `Prisma Migrate` é usado para gerenciar a evolução do schema do banco.
-   **Tipagem Automática:** O Prisma Client (`req.prisma`) é totalmente tipado com base no schema, garantindo segurança de tipos nas operações de banco.

**Principais Tabelas:**

-   `pessoas`: Usuários e participantes do sistema.
-   `transacoes`: Registros de gastos e receitas.
-   `transacao_participantes`: Tabela pivot para o relacionamento N:N entre transações e pessoas.
-   `pagamentos`: Registros de pagamentos feitos por pessoas.
-   `tags`: Categorias para as transações.
-   `configuracoes_sistema`: Configurações globais da aplicação.

### 2.7. Estrutura de Resposta da API

Para manter a consistência, todas as respostas da API seguem um formato padrão:

**Resposta de Sucesso:**

```json
{
  "success": true,
  "message": "Operação realizada com sucesso.",
  "data": { ... }, // O payload de dados
  "pagination": { ... }, // Opcional, para listas
  "timestamp": "2024-06-27T12:00:00.000Z"
}
```

**Resposta de Erro:**

```json
{
  "success": false,
  "error": "Código do Erro (ex: 'Token inválido')",
  "message": "Descrição do erro para o usuário.",
  "details": [ ... ], // Opcional, para erros de validação
  "timestamp": "2024-06-27T12:00:00.000Z"
}
```

### 2.8. Tipagem com TypeScript

O TypeScript é usado em todo o backend para garantir a segurança e a clareza do código.

-   **Tipos Centralizados:** Interfaces e tipos reutilizáveis são definidos em `backend/types/index.ts`.
-   **Tipos Inferidos:** Sempre que possível, a inferência de tipos do TypeScript e do Prisma é aproveitada.
-   **Tipos de API:** Tipos específicos para `Request` e `Response` de cada endpoint são definidos para maior clareza.
-   **`JWTPayload`:** A interface `JWTPayload` estende o objeto `Request` do Express para adicionar o `req.user` de forma tipada.

## 3. Frontend

A arquitetura do frontend é baseada em **Next.js** (com App Router), **TypeScript** e **TailwindCSS**.

### 3.1. Estrutura de Pastas

```
frontend/
├── app/            # Rotas, páginas e layouts (Next.js App Router)
│   ├── (auth)/     # Grupo de rotas protegidas por autenticação
│   └── login/      # Rota pública de login
├── components/     # Componentes React reutilizáveis
│   ├── ui/         # Componentes base do Shadcn/UI (primitivos)
│   ├── common/     # Componentes de propósito geral (StatsCard)
│   └── forms/      # Componentes de formulário complexos
├── hooks/          # Hooks customizados para lógica de estado e dados
├── lib/            # Funções utilitárias, API client e constantes
└── styles/         # Estilos globais
```

### 3.2. Gerenciamento de Estado

-   **Estado do Servidor (Server State):** A aplicação utiliza hooks customizados (ex: `useTransacoes`) para buscar, armazenar em cache e gerenciar dados que vêm da API. Embora use um padrão similar ao **React Query**, a implementação é manual com `useState`/`useEffect`, incluindo sua própria lógica de cache, debounce e tratamento de estados de `loading`/`error`.
-   **Estado do Cliente (Client State):** O estado local dos componentes é gerenciado com `useState`. Para estado global compartilhado no lado do cliente (como informações do usuário autenticado), o **React Context API** é utilizado (ver `lib/auth.tsx`).
-   **Formulários:** O **React Hook Form** é usado para gerenciar o estado de formulários complexos, integrado com **Zod** para validação do lado do cliente.

### 3.3. Comunicação com a API

-   **Axios Client:** Um cliente Axios centralizado (`lib/api.ts`) é configurado para todas as chamadas à API.
-   **Interceptors:**
    -   **Request Interceptor:** Adiciona automaticamente o token JWT (armazenado no `localStorage`) ao header `Authorization` de cada requisição.
    -   **Response Interceptor:** Padroniza o tratamento de erros, extraindo mensagens de erro da resposta da API e realizando ações globais (como limpar o `localStorage` em caso de erro `401`).

### 3.4. Componentes e Estilização

-   **Shadcn/UI:** A base da biblioteca de componentes é o **Shadcn/UI**, que fornece componentes acessíveis e estilizáveis construídos sobre os primitivos do **Radix UI**.
-   **TailwindCSS:** A estilização é feita primariamente com **TailwindCSS**, utilizando o sistema de classes utilitárias. A biblioteca `tailwind-merge` é usada para evitar conflitos de classes.
-   **Estrutura de Componentes:** Os componentes são organizados em `components/ui` (primitivos do Shadcn), `components/common` (componentes de aplicação, como `StatsCard`) e `components/forms` (componentes de formulário reutilizáveis).

### 3.5. Rotas e Autenticação

-   **Next.js App Router:** A estrutura de rotas é baseada em diretórios dentro de `app/`.
-   **Grupos de Rota:** O diretório `(auth)` agrupa todas as rotas que exigem que o usuário esteja autenticado. O layout `app/(auth)/layout.tsx` contém a lógica para proteger essas rotas.
-   **Páginas Públicas:** Rotas fora do grupo `(auth)`, como `/login`, são públicas. 