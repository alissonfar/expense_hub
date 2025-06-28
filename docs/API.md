# Documentação da API - Personal Expense Hub v2.0 (Multi-Tenant)

Esta documentação detalha todos os endpoints disponíveis na API do Personal Expense Hub.

## Autenticação e Autorização

A API utiliza um fluxo de autenticação em duas etapas para o ambiente multi-tenant:

1.  **Login Inicial**: O usuário envia `email` e `senha` para `POST /api/auth/login`. A API retorna um **Refresh Token** de longa duração e a lista de Hubs aos quais o usuário pertence.
2.  **Seleção de Hub**: O cliente envia o **Refresh Token** (no header `Authorization: Bearer <refresh_token>`) e um `hubId` para `POST /api/auth/select-hub`. A API valida e retorna um **Access Token** de curta duração, específico para aquele Hub.
3.  **Requisições Autenticadas**: Todas as outras requisições a endpoints protegidos devem incluir o **Access Token** no header `Authorization: Bearer <access_token>`.

O controle de acesso é baseado em papéis (RBAC) dentro de cada Hub, definidos pelo enum `Role` (`PROPRIETARIO`, `ADMINISTRADOR`, `COLABORADOR`, `VISUALIZADOR`).

---

## 1. Auth (`/api/auth`)

Endpoints para registro, login e gerenciamento de perfil.

### `POST /api/auth/register`
- **Descrição:** Registra um novo usuário e seu primeiro Hub.
- **Autenticação:** Nenhuma.
- **Rate Limit:** Estrito.
- **Body:** `{ nome, email, senha, nomeHub }` (validados por `registerSchema`).

### `POST /api/auth/login`
- **Descrição:** Autentica um usuário e retorna a lista de Hubs disponíveis e um Refresh Token.
- **Autenticação:** Nenhuma.
- **Rate Limit:** Estrito.
- **Body:** `{ email, senha }` (validados por `loginSchema`).
- **Resposta:** `{ hubs: [...], refreshToken: '...' }`

### `POST /api/auth/select-hub`
- **Descrição:** Seleciona um Hub e retorna um Access Token para ele.
- **Autenticação:** Refresh Token (`Authorization: Bearer <refresh_token>`).
- **Rate Limit:** Estrito.
- **Body:** `{ hubId }` (validado por `selectHubSchema`).
- **Resposta:** `{ accessToken: '...' }`

### `GET /api/auth/me`
- **Descrição:** Retorna o perfil do usuário logado e seu contexto no Hub.
- **Autenticação:** Access Token.

### `PUT /api/auth/profile`
- **Descrição:** Atualiza o perfil do usuário logado.
- **Autenticação:** Access Token.
- **Body:** `{ nome, email, telefone }` (validados por `updateProfileSchema`).

### `PUT /api/auth/change-password`
- **Descrição:** Altera a senha do usuário logado.
- **Autenticação:** Access Token.
- **Rate Limit:** Estrito.
- **Body:** `{ senhaAtual, novaSenha }` (validados por `changePasswordSchema`).

---

## 2. Membros (`/api/pessoas`)

Endpoints para gerenciar membros dentro de um Hub.

### `GET /api/pessoas`
- **Descrição:** Lista todos os membros do Hub atual.
- **Autenticação:** Access Token.
- **Query:** `{ ativo, role, page, limit }` (validados por `listMembrosQuerySchema`).

### `POST /api/pessoas`
- **Descrição:** Convida um novo membro para o Hub, criando o usuário se ele não existir no sistema.
- **Autenticação:** Access Token com `role` de `PROPRIETARIO` ou `ADMINISTRADOR`.
- **Body:** `{ email, role }` (validado por `createMembroSchema`).

### `GET /api/pessoas/:id`
- **Descrição:** Busca detalhes de um membro específico do Hub pelo ID da pessoa.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `membroParamsSchema`).

### `PUT /api/pessoas/:id`
- **Descrição:** Atualiza o papel (`role`) ou o status de um membro no Hub.
- **Autenticação:** Access Token com `role` de `PROPRIETARIO` ou `ADMINISTRADOR`.
- **Params:** `id` (validado por `membroParamsSchema`).
- **Body:** `{ role, ativo }` (validado por `updateMembroSchema`).

### `DELETE /api/pessoas/:id`
- **Descrição:** Desativa (soft delete) um membro do Hub.
- **Autenticação:** Access Token com `role` de `PROPRIETARIO` ou `ADMINISTRADOR`.
- **Params:** `id` (validado por `membroParamsSchema`).

---

## 3. Tags (`/api/tags`)

Endpoints para gerenciar tags (categorias) dentro de um Hub.

### `GET /api/tags`
- **Descrição:** Lista todas as tags do Hub atual.
- **Autenticação:** Access Token.
- **Query:** `{ ativo, page, limit }` (validados por `tagQuerySchema`).

### `POST /api/tags`
- **Descrição:** Cria uma nova tag no Hub.
- **Autenticação:** Access Token.
- **Body:** `{ nome, cor, icone }` (validado por `createTagSchema`).

### `GET /api/tags/:id`
- **Descrição:** Busca detalhes de uma tag específica.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `tagParamsSchema`).

### `PUT /api/tags/:id`
- **Descrição:** Atualiza uma tag.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `tagParamsSchema`).
- **Body:** `{ nome, cor, icone }` (validado por `updateTagSchema`).

### `DELETE /api/tags/:id`
- **Descrição:** Desativa (soft delete) uma tag.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `tagParamsSchema`).

---

## 4. Transações (`/api/transacoes`)

Endpoints para gerenciar gastos e receitas.

### `GET /api/transacoes`
- **Descrição:** Lista transações com filtros avançados.
- **Autenticação:** Access Token.
- **Query:** (Complexo, validado por `transacaoQuerySchema`).

### `POST /api/transacoes` (Gasto)
- **Descrição:** Cria um novo gasto, com suporte a parcelamento e divisão entre participantes.
- **Autenticação:** Access Token.
- **Body:** (Complexo, validado por `createGastoSchema`).

### `POST /api/transacoes/receita`
- **Descrição:** Cria uma nova receita.
- **Autenticação:** Access Token.
- **Body:** (Complexo, validado por `createReceitaSchema`).

### `GET /api/transacoes/:id`
- **Descrição:** Busca detalhes completos de uma transação.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `transacaoParamsSchema`).

### `PUT /api/transacoes/:id` (Gasto)
- **Descrição:** Atualiza um gasto existente.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `transacaoParamsSchema`).
- **Body:** (validado por `updateGastoSchema`).

### `PUT /api/transacoes/receita/:id`
- **Descrição:** Atualiza uma receita existente.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `transacaoParamsSchema`).
- **Body:** (validado por `updateReceitaSchema`).

### `DELETE /api/transacoes/:id`
- **Descrição:** Exclui uma transação.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `transacaoParamsSchema`).

---

## 5. Pagamentos (`/api/pagamentos`)

Endpoints para registrar e gerenciar pagamentos de transações.

### `GET /api/pagamentos`
- **Descrição:** Lista pagamentos com filtros avançados.
- **Autenticação:** Access Token.
- **Query:** (Complexo, validado por `pagamentoQuerySchema`).

### `POST /api/pagamentos`
- **Descrição:** Cria um pagamento, que pode ser individual ou composto (quitar várias transações de uma vez).
- **Autenticação:** Access Token.
- **Body:** (Complexo, validado por `createPagamentoSchema`).

### `GET /api/pagamentos/:id`
- **Descrição:** Busca detalhes completos de um pagamento.
- **Autenticação:** Access Token.
- **Params:** `id` (validado por `pagamentoParamsSchema`).

### `PUT /api/pagamentos/:id`
- **Descrição:** Atualiza um pagamento.
- **Autenticação:** Access Token (requer permissão específica).
- **Params:** `id` (validado por `pagamentoParamsSchema`).
- **Body:** (validado por `updatePagamentoSchema`).

### `DELETE /api/pagamentos/:id`
- **Descrição:** Exclui um pagamento.
- **Autenticação:** Access Token (requer permissão específica).
- **Params:** `id` (validado por `pagamentoParamsSchema`).

---

## 6. Relatórios (`/api/relatorios`)

Endpoints para obter dados consolidados e análises.

### `GET /api/relatorios/dashboard`
- **Descrição:** Retorna dados para o dashboard principal.
- **Autenticação:** Access Token.
- **Query:** (validado por `dashboardQuerySchema`).

### `GET /api/relatorios/saldos`
- **Descrição:** Relatório detalhado de saldos por pessoa.
- **Autenticação:** Access Token.
- **Query:** (validado por `saldosQuerySchema`).

### `GET /api/relatorios/pendencias`
- **Descrição:** Relatório de pendências e vencimentos.
- **Autenticação:** Access Token.
- **Query:** (validado por `pendenciasQuerySchema`).

### `GET /api/relatorios/transacoes`
- **Descrição:** Relatório completo e filtrável de transações.
- **Autenticação:** Access Token.
- **Query:** (validado por `transacoesQuerySchema`).

### `GET /api/relatorios/categorias`
- **Descrição:** Análise de gastos e receitas por categoria/tag.
- **Autenticação:** Access Token.
- **Query:** (validado por `categoriasQuerySchema`).

---

## 7. Configurações (`/api/configuracoes`)

Endpoints para gerenciar configurações do sistema.

### `GET /api/configuracoes/interface`
- **Descrição:** Busca as configurações de interface do usuário.
- **Autenticação:** Access Token.

### `PUT /api/configuracoes/interface`
- **Descrição:** Atualiza as configurações de interface.
- **Autenticação:** Access Token com `role` de `PROPRIETARIO` ou `ADMINISTRADOR`.
- **Body:** `{ theme_interface }` (validado por `configuracaoInterfaceSchema`).

### `GET /api/configuracoes/info`**: Documentação das rotas de configurações.

4.  **`GET /api/configuracoes/{comportamento|alertas|relatorios}`**: Rotas futuras (retornam 501 Not Implemented). 