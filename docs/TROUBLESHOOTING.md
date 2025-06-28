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

## 5. Erros de Multi-Tenancy (Isolamento de Dados)

### 🔴 **Erro: Dados de outro Hub estão visíveis ou sendo modificados.**

-   **Causa Provável:** Esta é uma falha de segurança crítica. Geralmente ocorre porque uma rota está acessando o banco de dados sem o devido isolamento do `hubId`.
    1.  O middleware `injectPrismaClient` está faltando na definição da rota em `backend/routes/*.ts`.
    2.  Um controller está usando a instância global do Prisma (`import { prisma } from '../utils/prisma'`) em vez da instância injetada na requisição (`req.prisma`).
-   **Solução:**
    1.  **GARANTA** que todas as rotas protegidas que acessam o banco de dados usem o middleware `injectPrismaClient` **depois** de `requireAuth`.
    2.  **SEMPRE** use `req.prisma` nos controllers para operações de negócio. A instância global `prisma` só deve ser usada em contextos sem Hub (ex: no processo de login inicial).

### 🔴 **Erro: `Cannot read property 'hubId' of undefined` no middleware `injectPrismaClient`**

-   **Causa Provável:** A ordem dos middlewares está incorreta na rota. `injectPrismaClient` está sendo executado **antes** de `requireAuth`.
-   **Solução:** A ordem é **crítica** e deve ser sempre a mesma: primeiro `requireAuth` (que popula `req.auth`), depois `injectPrismaClient` (que usa `req.auth` para criar o cliente seguro).
    ```typescript
    // Certo ✅
    router.use(requireAuth, injectPrismaClient);

    // Errado ❌
    router.use(injectPrismaClient, requireAuth);
    ```

### 🔴 **Erro: `Null constraint violation on column 'hubId'` ao criar um novo registro.**

-   **Causa Provável:** A lógica de extensão do Prisma em `utils/prisma.ts` não está injetando o `hubId` na operação de `create` ou `createMany`.
-   **Solução:**
    1.  Verifique se o modelo em questão está listado no array `TENANT_MODELS` em `backend/utils/prisma.ts`.
    2.  Revise a lógica `getExtendedPrismaClient` para as operações `create` e `createMany`, garantindo que o `hubId` do contexto de autenticação (`ctx.hubId`) está sendo mesclado aos dados da criação.

## 6. Casos de Debugging Complexos

### 🐞 **Exclusão de Pagamento (`DELETE /api/pagamentos/:id`)**

-   **Data da Resolução:** 2024-06-27
-   **Autor:** Cursor AI
-   **Sintoma:** O backend travava ou retornava erros de banco de dados ao tentar excluir um pagamento que possuía relações complexas (transações múltiplas, receita de excedente).

#### Problema Resolvido

A implementação inicial da exclusão de pagamento não lidava corretamente com a lógica de negócio e as restrições do banco de dados, resultando em uma série de erros em cascata.

#### Solução Implementada

A solução envolveu a reescrita da lógica dentro de uma **transação do Prisma (`$transaction`)** para garantir que todas as operações fossem atômicas (ou tudo funciona, ou nada é alterado). O processo de debugging resolveu 4 erros distintos:

1.  **Erro de Sintaxe (TS2353):**
    -   **Causa:** A query para atualizar os participantes da transação usava uma sintaxe incorreta para a chave única composta (`@@unique([transacao_id, pessoa_id])`).
    -   **Correção:** A cláusula `where` foi corrigida para usar o formato `where: { participante_transacao_unico: { transacao_id, pessoa_id } }`, que o Prisma entende para chaves compostas.

2.  **Erro de Conflito com Cascata (Prisma P2025):**
    -   **Causa:** O código tentava deletar manualmente os registros na tabela `pagamento_transacoes` *antes* de deletar o pagamento principal. No entanto, o `schema.prisma` já definia `onDelete: Cascade`, fazendo com que o Prisma tentasse deletar os mesmos registros duas vezes, causando um erro "Record not found".
    -   **Correção:** A exclusão manual dos registros filhos foi removida. A lógica agora confia na regra `onDelete: Cascade` para remover os `pagamento_transacoes` automaticamente após a exclusão do `pagamento` principal.

3.  **Erro de Chave Estrangeira (Prisma P2003):**
    -   **Causa:** O código tentava deletar a `transacao` referente à receita de excedente *antes* de remover o registro de `pagamento` que a referenciava (através do campo `receita_excedente_id`). Isso violava uma restrição de chave estrangeira.
    -   **Correção:** A ordem das operações foi invertida. Agora, o `pagamento` principal é deletado primeiro, e só então a `transacao` de excedente (se houver) é removida.

4.  **Erro de Escopo (TypeScript TS2304):**
    -   **Causa:** A variável `receitaExcedenteId` era declarada dentro do bloco `$transaction`, tornando-a inacessível para a lógica que montava a resposta JSON final.
    -   **Correção:** A variável foi movida para um escopo superior, antes do início do bloco `$transaction`, garantindo sua disponibilidade durante todo o processo.

#### Testes Sugeridos
-   Excluir um pagamento simples.
-   Excluir um pagamento que cobre múltiplas transações.
-   Excluir um pagamento que gerou uma receita de excedente.
-   Verificar (em `GET /api/transacoes/:id`) se os valores pagos e os status das transações afetadas foram corretamente revertidos após a exclusão. 