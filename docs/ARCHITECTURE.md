# Arquitetura e Padrões Técnicos

Este documento descreve a arquitetura, os padrões e as convenções técnicas utilizadas no projeto Personal Expense Hub, com foco na implementação de Multi-Tenancy.

## 1. Visão Geral da Arquitetura

O sistema é uma aplicação web completa com uma arquitetura desacoplada:

-   **Backend:** Uma API RESTful construída com **Node.js**, **Express** e **TypeScript**. É o cérebro da aplicação, responsável pela lógica de negócio, autenticação, acesso seguro ao banco de dados e validação.
-   **Frontend:** Uma Single Page Application (SPA) reativa construída com **React**, **Next.js** e **TypeScript**, que consome a API do backend de forma segura.

## 2. Arquitetura Multi-Tenant

O pilar da arquitetura é o **isolamento de dados por Hub (tenant)**. Cada Hub é um workspace independente com seus próprios usuários, transações e configurações.

### 2.1. Modelo de Isolamento de Dados

-   **Nível de Banco de Dados (Row-Level Security - RLS):** O isolamento é garantido no nível mais baixo possível, o banco de dados. Utilizamos um **Prisma Client Estendido** que injeta automaticamente cláusulas `WHERE { hubId: '...' }` em todas as queries relevantes. Isso previne vazamento de dados entre tenants.
-   **Nível de Aplicação (Middleware):** Antes de cada requisição a um endpoint protegido, middlewares validam o token JWT e o contexto do Hub, garantindo que o usuário tem as permissões corretas para acessar os dados solicitados.

## 3. Backend

### 3.1. Estrutura de Pastas

A estrutura do backend é modular e orientada a domínios:

```
backend/
├── controllers/    # Lógica de negócio e orquestração de serviços
├── middleware/     # Funções que interceptam requisições (auth, RLS, validação)
├── prisma/         # Schema, migrações e seeds do banco de dados
├── routes/         # Definição e agrupamento de rotas da API por recurso
├── schemas/        # Schemas de validação de dados de entrada com Zod
├── types/          # Interfaces e tipos globais do TypeScript
└── utils/          # Funções utilitárias (JWT, hash, logger, Prisma estendido)
```

### 3.2. Prisma e Schema do Banco de Dados

O **Prisma ORM** é a camada de acesso a dados. O `backend/prisma/schema.prisma` é a fonte da verdade para a estrutura do banco.

#### Principais Modelos Multi-Tenant:

1.  **`Hub`**: O modelo central que representa um tenant. Contém o nome do Hub e gerencia os relacionamentos com todos os dados que pertencem a ele.
2.  **`MembroHub`**: Tabela de junção que conecta `pessoas` (usuários) a `Hubs`. Define o **papel (Role)** de um usuário dentro de um Hub (`PROPRIETARIO`, `ADMINISTRADOR`, `COLABORADOR`, `VISUALIZADOR`), que é crucial para o controle de acesso (RBAC).
3.  **Modelos Tenant-Specific**: Tabelas como `transacoes`, `tags`, e `pagamentos` possuem uma chave estrangeira `hubId` obrigatória, garantindo que cada registro pertença a um e somente um Hub. Índices em `hubId` são usados para otimizar as queries.

### 3.3. Middlewares e Fluxo de Requisição Segura

O fluxo de uma requisição a um endpoint protegido é o seguinte:

`Requisição -> requireAuth -> injectPrismaClient -> [validateSchema] -> Controller`

1.  **`requireAuth` (`middleware/auth.ts`):**
    -   Extrai o token JWT do header `Authorization`.
    -   Verifica a validade do token.
    -   Anexa o payload decodificado (`AuthContext`) ao objeto `req.auth`.

2.  **`injectPrismaClient` (`middleware/prisma.ts`):**
    -   Recebe o `AuthContext` do `req.auth`.
    -   Cria uma **instância estendida e segura do Prisma Client** usando a função `getExtendedPrismaClient`.
    -   Esta instância já contém a lógica de RLS embutida.
    -   Injeta o Prisma Client seguro em `req.prisma`.

3.  **`validateSchema` (`middleware/auth.ts`):**
    -   Valida o corpo (`body`), parâmetros (`params`) ou query (`query`) da requisição contra um schema Zod. Garante a integridade dos dados antes de chegar ao controller.

4.  **`Controller`:**
    -   Executa a lógica de negócio usando `req.prisma`, que já está filtrado para o Hub correto. O controller não precisa saber sobre `hubId`, pois a camada de segurança já abstraiu isso.

### 3.4. Funções Utilitárias (`utils/`)

A pasta `utils/` contém módulos reutilizáveis e desacoplados.

#### `jwt.ts`
-   **Responsabilidade:** Gerenciar todo o ciclo de vida dos JSON Web Tokens.
-   **Funções Principais:**
    -   `generateAccessToken(context)`: Gera um token de acesso de curta duração com o `AuthContext` completo (incluindo `hubId` e `role`).
    -   `generateRefreshToken(user)`: Gera um refresh token de longa duração, contendo apenas a identidade do usuário.
    -   `verifyAccessToken(token)` e `verifyRefreshToken(token)`: Verificam a assinatura e a validade dos tokens.

#### `prisma.ts`
-   **Responsabilidade:** Implementar a lógica de Row-Level Security (RLS) para Multi-Tenancy.
-   **Função Principal:**
    -   `getExtendedPrismaClient(ctx)`: Retorna uma instância do Prisma Client que estende o comportamento padrão de todas as queries (`findMany`, `create`, `update`, etc.). A extensão **injeta automaticamente as cláusulas `WHERE { hubId: ... }`** e, quando aplicável, `WHERE { criado_por: ... }`, com base no `AuthContext` da requisição. Isso torna impossível, por padrão, que uma query acesse dados de outro tenant.

#### `password.ts`
-   **Responsabilidade:** Lidar com a segurança de senhas.
-   **Funções Principais:**
    -   `hashPassword(password)`: Gera um hash seguro da senha usando `bcrypt`.
    -   `verifyPassword(password, hash)`: Compara uma senha com seu hash de forma segura.
    -   `validatePasswordStrength(password)`: Verifica se a senha atende a critérios de complexidade (tamanho, caracteres, etc.).

#### `logger.ts`
-   **Responsabilidade:** Configurar um sistema de logs estruturados e flexíveis.
-   **Implementação:** Utiliza a biblioteca **Winston**.
    -   **Em produção:** Logs são escritos em arquivos (`error.log`, `combined.log`) em formato JSON.
    -   **Em desenvolvimento:** Logs são exibidos no console com cores para melhor legibilidade.
    -   `getLogger(module)`: Permite criar um logger filho com o nome do módulo, facilitando o rastreamento da origem dos logs.

### 3.5. Estrutura de Resposta da API

Para manter a consistência, todas as respostas da API seguem um formato padrão e previsível, tanto para sucesso quanto para erro.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Operação realizada com sucesso.",
  "data": { ... }, // O payload de dados
  "pagination": { ... }, // Opcional, para listas
  "timestamp": "2024-06-28T12:00:00.000Z"
}
```

**Resposta de Erro:**
```json
{
  "success": false,
  "error": {
    "code": "CODIGO_DO_ERRO", // Ex: "TOKEN_INVALIDO"
    "message": "Descrição do erro para o usuário.",
    "details": [ ... ] // Opcional, para erros de validação Zod
  },
  "timestamp": "2024-06-28T12:00:00.000Z"
}
```

## 4. Frontend

A arquitetura do frontend é baseada em **Next.js** (com App Router), **TypeScript** e **TailwindCSS**. Ela é projetada para ser reativa, tipada e de fácil manutenção.

### 4.1. Estrutura de Pastas

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

### 4.2. Gerenciamento de Estado

-   **Estado do Servidor (Server State):** A aplicação utiliza hooks customizados (ex: `useTransacoes`) para buscar, armazenar em cache e gerenciar dados que vêm da API. Embora use um padrão similar ao **React Query**, a implementação é manual com `useState`/`useEffect`, incluindo sua própria lógica de cache, debounce e tratamento de estados de `loading`/`error`.
-   **Estado do Cliente (Client State):** O estado local dos componentes é gerenciado com `useState`. Para estado global compartilhado no lado do cliente (como informações do usuário autenticado), o **React Context API** é utilizado (ver `lib/auth.tsx`).
-   **Formulários:** O **React Hook Form** é usado para gerenciar o estado de formulários complexos, integrado com **Zod** para validação do lado do cliente.

### 4.3. Comunicação com a API

-   **Axios Client:** Um cliente Axios centralizado (`lib/api.ts`) é configurado para todas as chamadas à API.
-   **Interceptors:**
    -   **Request Interceptor:** Adiciona automaticamente o token JWT (armazenado no `localStorage`) ao header `Authorization` de cada requisição.
    -   **Response Interceptor:** Padroniza o tratamento de erros, extraindo mensagens de erro da resposta da API e realizando ações globais (como limpar o `localStorage` em caso de erro `401`).

### 4.4. Componentes e Estilização

-   **Shadcn/UI:** A base da biblioteca de componentes é o **Shadcn/UI**, que fornece componentes acessíveis e estilizáveis construídos sobre os primitivos do **Radix UI**.
-   **TailwindCSS:** A estilização é feita primariamente com **TailwindCSS**, utilizando o sistema de classes utilitárias. A biblioteca `tailwind-merge` é usada para evitar conflitos de classes.
-   **Estrutura de Componentes:** Os componentes são organizados em `components/ui` (primitivos do Shadcn), `components/common` (componentes de aplicação, como `StatsCard`) e `components/forms` (componentes de formulário reutilizáveis).

### 4.5. Rotas e Autenticação

-   **Next.js App Router:** A estrutura de rotas é baseada em diretórios dentro de `app/`.
-   **Grupos de Rota:** O diretório `(auth)` agrupa todas as rotas que exigem que o usuário esteja autenticado. O layout `app/(auth)/layout.tsx` contém a lógica para proteger essas rotas.
-   **Páginas Públicas:** Rotas fora do grupo `(auth)`, como `/login`, são públicas. 