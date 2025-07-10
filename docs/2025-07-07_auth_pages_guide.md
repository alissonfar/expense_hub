# Guia de Implementação: Páginas de Autenticação

## 🎯 Objetivo
Este documento fornece um guia passo a passo para (re)construir as interfaces de usuário (UI) para o fluxo de autenticação: **Login**, **Registro** e **Seleção de Hub**.

### ‼️ Pré-requisito Essencial
A lógica de autenticação **JÁ ESTÁ IMPLEMENTADA E FUNCIONAL**. O desenvolvedor **NÃO DEVE** recriar esta lógica. O trabalho consiste em construir os componentes de UI e conectá-los aos hooks e funções existentes.

-   **Contexto Principal**: `AuthContext` em `frontend/src/contexts/AuthContext.tsx`
-   **Hooks de Apoio**: `useAuth` em `frontend/src/hooks/useAuth.ts`
-   **Middleware de Rotas**: `middleware.ts` em `frontend/middleware.ts`

## 🌊 Fluxo de Autenticação
O fluxo é linear e gerenciado pelo `AuthContext` em conjunto com o `middleware`.

```mermaid
graph TD
    A[Usuário acessa /login] --> B{Formulário de Login};
    B -- Credenciais Válidas --> C[Chama `login(email, senha)` do `useAuth`];
    C --> D{Contexto atualiza o estado};
    D --> E[Redireciona para /select-hub];
    
    subgraph "Página /select-hub"
        direction LR
        F[Busca `hubsDisponiveis` do `useAuth`] --> G[Renderiza lista de Hubs];
        G -- Usuário clica em um Hub --> H[Chama `selectHub(hubId)` do `useAuth`];
    end

    E --> F;
    H --> I{Contexto atualiza o estado com accessToken};
    I --> J[Redireciona para /dashboard];

    K[Usuário acessa /register] --> L{Formulário de Registro};
    L -- Dados Válidos --> M[Chama `register(...)` do `useAuth`];
    M --> N[Exibe Toast de sucesso];
    N --> A;
```

## 🛠️ Guia de Implementação por Página

### 1. Página de Login (`/login`)

-   **Localização**: `frontend/src/app/login/page.tsx`
-   **Responsabilidade**: Permitir que um usuário existente inicie uma sessão.

#### Componentes da UI (Shadcn/UI)
-   `<Card>` para conter o formulário.
-   `<CardHeader>`, `<CardTitle>`, `<CardDescription>` para o título.
-   `<CardContent>` para os campos do formulário.
-   `<Input />` para `email` e `senha` (tipo `password`).
-   `<Label />` para os inputs.
-   `<Button />` para submeter o formulário.
-   Um link para a página de registro (`/register`).

#### Lógica do Formulário
1.  **Estado**: Use `useState` para controlar os campos de email e senha.
2.  **Validação**: Use `react-hook-form` com `zod` para validação client-side (reutilize os schemas de `lib/validations.ts` se disponíveis).
3.  **Submissão**:
    -   Crie uma função `async function handleLogin()`.
    -   Dentro dela, chame a função `login(email, senha)` importada do `useAuth()`.
    -   O hook `useAuth` e o `middleware` cuidarão do armazenamento de tokens e do redirecionamento para `/select-hub` em caso de sucesso.

#### Feedback ao Usuário
-   Use um `try...catch` no `handleLogin`.
-   No `catch`, use o `toast()` (do `useToast`) para exibir mensagens de erro da API (ex: "Credenciais inválidas.").

---

### 2. Página de Registro (`/register`)

-   **Localização**: `frontend/src/app/register/page.tsx`
-   **Responsabilidade**: Permitir que um novo usuário crie uma conta.

#### Componentes da UI (Shadcn/UI)
-   Semelhante à página de Login, mas com campos adicionais:
    -   `<Input />` para `nome`, `email`, `senha` e `confirmarSenha`.
    -   `<Input />` para `telefone` (opcional).

#### Lógica do Formulário
1.  **Validação**: Use `react-hook-form` e `zod`. A validação deve garantir que `senha` e `confirmarSenha` sejam iguais. O campo `confirmarSenha` é apenas para a UI e não deve ser enviado na chamada da API.
2.  **Submissão**:
    -   Crie uma função `async function handleRegister()`.
    -   Monte o objeto de dados com base no formulário. A assinatura exata da função no `useAuth` é: `register(data: { nome: string; email: string; senha: string; telefone?: string; })`.
    -   Chame a função `register` do `useAuth()` com o objeto de dados.
    -   **Em caso de sucesso**:
        -   Exiba um `toast()` de sucesso: "Registro realizado! Faça o login para continuar."
        -   Redirecione o usuário para a página `/login`.

#### Feedback ao Usuário
-   Use `try...catch` para capturar erros da API (ex: "Email já cadastrado") e exibi-los em um `toast`.

---

### 3. Página de Seleção de Hub (`/select-hub`)

-   **Localização**: `frontend/src/app/select-hub/page.tsx`
-   **Responsabilidade**: Permitir que um usuário autenticado escolha em qual Hub deseja operar. Esta página só é acessível após o login.

#### Componentes da UI (Shadcn/UI)
-   `<Card>` para conter a lista de seleção.
-   `<CardHeader>` com um título como "Selecione seu Hub".
-   `<CardContent>` para a lista de Hubs.
-   Renderize a lista de Hubs usando `.map()` sobre o array `hubsDisponiveis`.
-   Para cada hub, renderize um `<Button variant="outline">` ou um item de lista clicável que exiba o `nome` do Hub.

#### Lógica da Página
1.  **Acesso aos Dados**:
    -   Importe o `useAuth()` hook.
    -   Acesse o array de hubs disponíveis: `const { hubsDisponiveis, selectHub } = useAuth();`.
2.  **Estado de Carregamento**:
    -   O `AuthContext` já fornece um estado `isLoading`. Você pode usar isso para mostrar um spinner enquanto os dados do usuário (incluindo os hubs) são carregados.
    -   Verifique se `hubsDisponiveis` existe e não está vazio antes de tentar renderizar a lista.
3.  **Ação de Seleção**:
    -   No `onClick` de cada botão de Hub, chame a função `selectHub(hub.id)`.
    -   O `AuthContext` e o `middleware` cuidarão do resto: obter o `accessToken`, armazená-lo e redirecionar para `/dashboard`.

#### Feedback ao Usuário
-   Enquanto `selectHub` estiver em execução, desabilite os botões e mostre um indicador de carregamento para evitar cliques duplos.
-   Use `try...catch` na chamada de `selectHub` para exibir um `toast` em caso de erro. 