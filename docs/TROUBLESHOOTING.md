# Guia de Solução de Problemas (Troubleshooting)

Este documento centraliza problemas conhecidos, erros comuns e suas respectivas soluções para agilizar o processo de debugging.

## 1. Erros Comuns de Autenticação

### 🔴 **Erro: `401 Unauthorized` com mensagem `Token não fornecido`**

-   **Causa Provável:** A requisição para um endpoint protegido foi feita sem o header `Authorization`.
-   **Solução:** Garanta que o frontend (ou cliente da API) está enviando o header corretamente: `Authorization: Bearer <seu-token-jwt>`.

### 🔴 **Erro: `401 Unauthorized` com mensagem `Token inválido` ou `jwt malformed`**

-   **Causa Provável:**
    1.  O token JWT expirou.
    2.  O token está corrompido ou foi modificado.
    3.  A chave secreta (`JWT_SECRET`) usada para assinar o token no backend é diferente da usada para verificar.
-   **Solução:**
    1.  Implemente um fluxo de renovação de token (refresh token) ou force o usuário a fazer login novamente.
    2.  Verifique se o token não está sendo alterado no cliente.
    3.  Confirme que a variável de ambiente `JWT_SECRET` está configurada corretamente no arquivo `.env` do backend.

### 🔴 **Erro: `403 Forbidden` com mensagem `Acesso negado`**

-   **Causa Provável:** O usuário autenticado (com um token válido) não tem a permissão necessária para acessar o recurso. Geralmente, isso acontece ao tentar acessar uma rota protegida por `requireOwner` sem ser um proprietário.
-   **Solução:** Verifique a lógica de permissões no frontend ou a lógica de negócio que está tentando acessar um recurso restrito.

## 2. Debugging de Validação Zod

### 🔴 **Erro: `400 Bad Request` com `details` contendo erros de campo**

-   **Causa Provável:** Os dados enviados no `body`, `query` ou `params` da requisição não correspondem ao schema Zod definido para a rota.
-   **Solução:**
    1.  **Analise o `details`:** A propriedade `details` na resposta de erro informa exatamente qual campo falhou na validação e o motivo.
    2.  **Verifique os Tipos:** Lembre-se que `query` e `params` sempre chegam como `string`. Use `z.coerce.number()` ou `z.coerce.date()` no schema para conversão automática.
    3.  **Teste no Cliente:** Verifique os dados que estão sendo enviados pelo frontend antes da requisição.

## 3. Problemas de Banco de Dados (Prisma)

### 🔴 **Erro: `Unique constraint failed on the fields: (email)`**

-   **Causa Provável:** Tentativa de criar ou atualizar um registro (`pessoas`) com um email que já existe no banco.
-   **Solução:** Antes de executar a operação `create` ou `update`, faça uma verificação `findUnique` para garantir que o email não está em uso.

### 🔴 **Erro: Conexão com o banco de dados falha ao iniciar o servidor**

-   **Causa Provável:**
    1.  A URL do banco de dados (`DATABASE_URL`) no arquivo `.env` está incorreta.
    2.  O container Docker (ou serviço) do PostgreSQL não está em execução.
    3.  Firewall bloqueando a conexão.
-   **Solução:**
    1.  Verifique as credenciais, host e porta na `DATABASE_URL`.
    2.  Garanta que o serviço do banco de dados está ativo.
    3.  Verifique as regras de firewall.

### 🔴 **Erro: `The table X does not exist in the current database.`**

-   **Causa Provável:** As migrações do Prisma não foram executadas ou estão desatualizadas.
-   **Solução:** Execute o comando de migração para sincronizar o schema do banco com o seu `schema.prisma`.
    ```bash
    npx prisma migrate dev
    ```

## 4. Performance e Otimização

### 🐌 **Lentidão em queries que listam muitos dados (ex: `GET /api/transacoes`)**

-   **Causa Provável:** A query está retornando muitos registros de uma vez, sem paginação, ou buscando campos desnecessários.
-   **Solução:**
    1.  **Paginação:** Sempre implemente paginação (`skip`, `take`) em endpoints que podem retornar listas longas.
    2.  **`select` Específico:** Use a cláusula `select` do Prisma para buscar apenas os campos que você realmente precisa. Evite buscar todos os campos de um modelo se não for necessário.
    3.  **Índices:** Verifique se os campos usados em cláusulas `where` ou `orderBy` frequentes possuem índices no `schema.prisma`.
    4.  **N+1 Problema:** Tenha cuidado com queries aninhadas dentro de loops. Use as funcionalidades do Prisma para buscar dados relacionados em uma única query sempre que possível. 