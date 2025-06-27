# Documentação da API (Endpoints)

Este documento detalha todos os endpoints da API do Personal Expense Hub.

## Autenticação

A autenticação é feita via **JWT (JSON Web Token)**. Para todas as rotas protegidas, você deve incluir o token no header `Authorization`:

`Authorization: Bearer <seu-token-jwt>`

## Respostas Padrão

-   **Sucesso (2xx):** `{ "success": true, "data": {...}, "message": "...", "timestamp": "..." }`
-   **Erro do Cliente (4xx):** `{ "success": false, "error": "...", "message": "...", "details"?: [...], "timestamp": "..." }`
-   **Erro do Servidor (5xx):** `{ "success": false, "error": "...", "message": "...", "timestamp": "..." }`

---

## Endpoints

[[memory:6830135959561837192]]

A lista a seguir foi gerada com base no mapeamento completo do sistema e representa o estado atual de todos os 42 endpoints.

### 🏛️ Autenticação (`/api/auth`)

1.  **`POST /api/auth/register`**: Registrar novo usuário.
    -   **Body:** `{ nome, email, senha, telefone? }`
    -   **Validação:** Senha forte (8+, maiúscula, minúscula, número, especial).
    -   **Response (201):** `{ token, user, refreshToken }`

2.  **`POST /api/auth/login`**: Autenticar um usuário.
    -   **Body:** `{ email, senha }`
    -   **Response (200):** `{ token, user, refreshToken }`

3.  **`GET /api/auth/me`**: Obter perfil do usuário logado.
    -   **Auth:** `requireAuth`
    -   **Response (200):** `{ userProfile }`

4.  **`PUT /api/auth/profile`**: Atualizar perfil do usuário logado.
    -   **Auth:** `requireAuth`
    -   **Body:** `{ nome?, email?, telefone? }`

5.  **`PUT /api/auth/change-password`**: Alterar a senha.
    -   **Auth:** `requireAuth`
    -   **Body:** `{ senhaAtual, novaSenha, confirmarSenha }`

6.  **`GET /api/auth/info`**: Documentação das rotas de autenticação.

### 👥 Pessoas (`/api/pessoas`)

1.  **`GET /api/pessoas`**: Listar pessoas com filtros e paginação.
    -   **Auth:** `requireAuth`
    -   **Query:** `{ ativo?, proprietario?, page?, limit? }`
    -   **Response (200):** `{ pessoas[], pagination }`

2.  **`POST /api/pessoas`**: Criar uma nova pessoa.
    -   **Auth:** `requireAuth`, `requireOwner`
    -   **Body:** `{ nome, email, telefone?, eh_proprietario? }`

3.  **`GET /api/pessoas/:id`**: Detalhes de uma pessoa e suas estatísticas.
    -   **Auth:** `requireAuth`
    -   **Params:** `id` (numérico)
    -   **Response (200):** `{ pessoa, estatisticas }`

4.  **`PUT /api/pessoas/:id`**: Editar uma pessoa.
    -   **Auth:** `requireAuth`, `requireOwner`
    -   **Body:** `{ nome?, email?, telefone? }`

5.  **`DELETE /api/pessoas/:id`**: Desativar uma pessoa (soft delete).
    -   **Auth:** `requireAuth`, `requireOwner`

6.  **`GET /api/pessoas/info`**: Documentação das rotas de pessoas.

### 🏷️ Tags (`/api/tags`)

1.  **`GET /api/tags`**: Listar tags com filtros.
    -   **Auth:** `requireAuth`
    -   **Query:** `{ ativo?, criado_por?, page?, limit? }`

2.  **`POST /api/tags`**: Criar uma nova tag.
    -   **Auth:** `requireAuth`
    -   **Body:** `{ nome, cor?, icone? }`
    -   **Validação:** Cor em formato HEX (`/^#[0-9A-Fa-f]{6}$/`).

3.  **`GET /api/tags/:id`**: Detalhes e estatísticas de uma tag.
    -   **Auth:** `requireAuth`

4.  **`PUT /api/tags/:id`**: Editar uma tag.
    -   **Auth:** `requireAuth`
    -   **Body:** `{ nome?, cor?, icone? }`

5.  **`DELETE /api/tags/:id`**: Desativar uma tag (soft delete).
    -   **Auth:** `requireAuth`

6.  **`GET /api/tags/info`**: Documentação das rotas de tags.

### 💸 Transações (`/api/transacoes`)

1.  **`GET /api/transacoes`**: Listar transações com filtros avançados.
    -   **Auth:** `requireAuth`
    -   **Query:** Múltiplos filtros disponíveis (tipo, status, data, etc.).

2.  **`POST /api/transacoes`**: Criar um novo gasto (despesa).
    -   **Auth:** `requireAuth`
    -   **Body:** `{ descricao, valor_total, data_transacao, participantes[], ... }`
    -   **Validação:** Soma dos valores dos participantes deve ser igual ao valor total.

3.  **`POST /api/transacoes/receita`**: Criar uma nova receita.
    -   **Auth:** `requireAuth`
    -   **Body:** `{ descricao, valor_recebido, data_transacao, ... }`

4.  **`GET /api/transacoes/:id`**: Detalhes completos de uma transação.
    -   **Auth:** `requireAuth`
    -   **Response (200):** `{ transacao, participantes, tags, pagamentos, parcelas }`

5.  **`PUT /api/transacoes/:id`**: Editar um gasto.
    -   **Auth:** `requireAuth`

6.  **`PUT /api/transacoes/receita/:id`**: Editar uma receita.
    -   **Auth:** `requireAuth`

7.  **`DELETE /api/transacoes/:id`**: Excluir uma transação.
    -   **Auth:** `requireAuth`
    -   **Restrição:** Não pode ser excluída se tiver pagamentos associados.

8.  **`GET /api/transacoes/info`**: Documentação das rotas de transações.

### 💳 Pagamentos (`/api/pagamentos`)

1.  **`GET /api/pagamentos`**: Listar pagamentos com filtros.
    -   **Auth:** `requireAuth`

2.  **`POST /api/pagamentos`**: Criar um pagamento (simples ou composto).
    -   **Auth:** `requireAuth`
    -   **Body (Simples):** `{ transacao_id, valor_pago, ... }`
    -   **Body (Composto):** `{ transacoes: [{ transacao_id, valor_aplicado }], ... }`

3.  **`GET /api/pagamentos/:id`**: Detalhes de um pagamento.
    -   **Auth:** `requireAuth`

4.  **`PUT /api/pagamentos/:id`**: Atualizar um pagamento.
    -   **Auth:** `requireAuth` (próprio usuário ou proprietário).

5.  **`DELETE /api/pagamentos/:id`**: Excluir um pagamento.
    -   **Auth:** `requireAuth` (próprio usuário ou proprietário).
    -   **Comportamento:**
        -   Realiza a exclusão dentro de uma transação para garantir consistência.
        -   Reverte os valores pagos das transações associadas, atualizando o `valor_pago` e o `status_pagamento` de cada uma.
        -   Deleta o registro do pagamento e, em cascata (`onDelete: Cascade`), os registros da tabela `pagamento_transacoes`.
        -   Se o pagamento gerou uma receita de excedente, essa receita também é excluída.
    -   **Response (200):** Objeto com detalhes da operação, como o ID do pagamento, o número de transações afetadas e se uma receita de excedente foi removida.

6.  **`GET /api/pagamentos/configuracoes/excedente`**: Obter configurações de valor excedente.
    -   **Auth:** `requireAuth`

7.  **`PUT /api/pagamentos/configuracoes/excedente`**: Atualizar configurações de valor excedente.
    -   **Auth:** `requireAuth`, `requireOwner`

8.  **`GET /api/pagamentos/info`**: Documentação das rotas de pagamentos.

### 📊 Relatórios (`/api/relatorios`)

1.  **`GET /api/relatorios/dashboard`**: Dados para o dashboard principal.
    -   **Auth:** `requireAuth`
    -   **Query:** `{ periodo?, data_inicio?, data_fim?, ... }`

2.  **`GET /api/relatorios/saldos`**: Saldos devedores/credores por pessoa.
    -   **Auth:** `requireAuth`

3.  **`GET /api/relatorios/pendencias`**: Listar todas as pendências financeiras.
    -   **Auth:** `requireAuth`

4.  **`GET /api/relatorios/transacoes`**: Relatório avançado de transações.
    -   **Auth:** `requireAuth`

5.  **`GET /api/relatorios/categorias`**: Análise de gastos por categoria (tag).
    -   **Auth:** `requireAuth`

6.  **`GET /api/relatorios/info`**: Documentação das rotas de relatórios.

### ⚙️ Configurações (`/api/configuracoes`)

1.  **`GET /api/configuracoes/interface`**: Buscar configuração de tema da interface.
    -   **Auth:** `requireAuth`

2.  **`PUT /api/configuracoes/interface`**: Atualizar tema da interface.
    -   **Auth:** `requireAuth`, `requireOwner`
    -   **Body:** `{ theme_interface: 'light' | 'dark' | 'auto' }`

3.  **`GET /api/configuracoes/info`**: Documentação das rotas de configurações.

4.  **`GET /api/configuracoes/{comportamento|alertas|relatorios}`**: Rotas futuras (retornam 501 Not Implemented). 