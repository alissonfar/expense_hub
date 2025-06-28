# Regras para Migração Multi-Tenancy

## 0. Filosofia Guia

Seu objetivo é executar a migração para uma arquitetura multi-tenant de forma autônoma. Os documentos na pasta `docs/multi-tenancy` são sua fonte da verdade. **Consulte-os antes de qualquer implementação.** Sua principal diretriz é forçar o isolamento de dados em nível de banco de dados e garantir que a lógica de negócios reflita o novo modelo de "Hubs" e "Membros".

**Sempre que tiver dúvidas sobre uma implementação, releia os documentos `00`, `01` e `02` em `docs/multi-tenancy` para encontrar a resposta.**

---

## 1. Princípios Fundamentais (Não negociáveis)

1.  **Fonte da Verdade:** A pasta `docs/multi-tenancy/` contém a visão, o schema e a lógica aprovados. Sua implementação deve seguir fielmente esses documentos.
2.  **Isolamento de Dados é Rei:** A principal prioridade é garantir que um usuário em um "Hub" **jamais** possa ver ou modificar dados de outro "Hub". Isso será implementado via Prisma Extension, não manualmente nos controllers.
3.  **Soft Delete é Mandatório:** Nenhuma exclusão de dados críticos (hubs, membros, transações, etc.) será física (`DELETE`). Todas as exclusões devem ser lógicas, usando um campo `ativo: boolean`. Listagens e buscas devem, por padrão, filtrar apenas por `ativo: true`.
4.  **O Contexto do Hub é Explícito:** O usuário sempre opera dentro do contexto de um Hub selecionado. Esse contexto (`hubId`, `role`, `dataAccessPolicy`) deve ser carregado no JWT e usado para todas as operações.

---

## 2. Guia de Implementação do Backend

### a) Modificação do Schema Prisma (`prisma/schema.prisma`)

1.  **Analise e Aplique:** Estude o arquivo `docs/multi-tenancy/01_DATABASE_SCHEMA.md` e o `03_PROPOSED_SCHEMA.prisma`. Sua tarefa é modificar o `prisma/schema.prisma` atual para espelhar o schema proposto.
2.  **Novos Modelos:** Implemente os modelos `Hub` e `MembroHub` exatamente como descrito.
3.  **Adaptação de Modelos Existentes:**
    *   **Pessoa:** Remova `eh_proprietario`, adicione `ehAdministrador` e a relação `hubs`.
    *   **Modelos de Tenant (`Transacao`, `Tag`, `Pagamento`, etc.):** Adicione a chave estrangeira `hubId`, a relação `@relation`, o índice `@@index([hubId])` e o campo `ativo: Boolean @default(true)`. A relação com o criador (`criadoPorId`) deve ser mantida e garantida.
4.  **Gere a Migração:** Após ajustar o schema, use o Prisma para gerar um novo arquivo de migração. **Não** use o arquivo `04_GENERATED_MIGRATION.sql` diretamente, pois ele pode estar desatualizado. Gere um novo a partir de suas alterações no `schema.prisma`.

### b) Lógica de Acesso e Segurança

1.  **Prisma Client Extension (CRÍTICO):**
    *   Crie uma extensão para o Prisma Client. Este é o único mecanismo que garantirá o isolamento de dados.
    *   A extensão deve interceptar todas as chamadas a modelos de tenant (`findMany`, `findUnique`, `update`, etc.).
    *   **Lógica de Interceptação:**
        *   Leia o `hubId`, `role`, `dataAccessPolicy` e `ehAdministrador` do contexto do usuário (que virá do JWT).
        *   Se `ehAdministrador` for `true`, pule qualquer filtragem.
        *   Caso contrário, **injete automaticamente** a cláusula `where: { hubId: 'ID_DO_HUB_DO_JWT' }`.
        *   Para `COLABORADOR` com política `INDIVIDUAL` ou `VISUALIZADOR`, adicione também `where: { criadoPorId: 'ID_DA_PESSOA_DO_JWT' }`.
2.  **Autenticação (JWT):**
    *   Modifique a lógica de login (`/api/auth/login`).
    *   Se o usuário for membro de mais de um Hub, a API deve retornar uma lista de Hubs para o frontend escolher.
    *   Após a seleção do Hub no frontend, deve haver um novo endpoint (ex: `/api/auth/select-hub`) que recebe o `hubId` e retorna um **JWT com escopo definido**, contendo `{ pessoaId, hubId, role, dataAccessPolicy, ehAdministrador }`.
3.  **Middlewares de Autorização (RBAC):**
    *   Crie um novo middleware `requireHubRole(...)` que verifica o `role` presente no JWT.
    *   Proteja os endpoints de gerenciamento (ex: convidar membro, alterar configurações) com este middleware. Ex: `requireHubRole('PROPRIETARIO', 'ADMINISTRADOR')`.

### c) Controllers e Rotas

1.  **Refatore TODOS os Endpoints:** Percorra cada controller (`transacaoController`, `pessoaController`, etc.).
2.  **Remova a Lógica de Permissão Manual:** A filtragem por `hubId` não deve mais estar nos controllers. Confie na Prisma Extension.
3.  **Adapte a Criação de Entidades:** Ao criar um novo registro (`Transacao`, `Tag`, etc.), o `hubId` deve ser extraído do JWT e inserido no novo registro. O `criadoPorId` também deve vir do JWT.
4.  **Implemente os Novos Fluxos:** Crie os endpoints e a lógica para:
    *   Criação e gerenciamento de Hubs.
    *   Geração e uso do `codigoAcesso`.
    *   Gerenciamento de membros (`MembroHub`).
    *   Troca de contexto de Hub.

---

## 3. Guia de Implementação do Frontend

1.  **Fluxo de Login e Seleção de Hub:**
    *   Após o login, se a API indicar múltiplos Hubs, exiba uma tela de seleção de Hub.
    *   Armazene o JWT com escopo de Hub retornado pela API de forma segura.
    *   Todas as requisições subsequentes à API devem usar este JWT.
2.  **Contexto Visual:**
    *   A UI deve exibir claramente em qual Hub o usuário está trabalhando (ex: no header).
    *   Deve haver um menu para o usuário trocar de Hub facilmente.
3.  **Telas de Gerenciamento:**
    *   Crie as novas páginas/componentes para:
        *   Listar e gerenciar os membros do Hub.
        *   Alterar papéis e políticas de acesso.
        *   Visualizar e regenerar o `codigoAcesso`.
        *   Criar um novo Hub.
        *   Juntar-se a um Hub com um código.
4.  **Adaptação de Componentes Existentes:**
    *   Listas, tabelas e formulários não precisam mais enviar ou se preocupar com o `hubId`. A API e o banco de dados cuidarão disso. O trabalho do frontend é garantir que o JWT correto (com `hubId`) seja enviado em cada requisição.

---

## 4. Estratégia de Descoberta e Verificação

1.  **Comece pelo Backend:** A fundação da segurança está no backend. Comece pela migração do `schema.prisma` e pela implementação da Prisma Extension.
2.  **Verifique Antes de Prosseguir:** Antes de refatorar os controllers, crie um script de teste simples para verificar se a Prisma Extension está funcionando. Tente fazer uma query diretamente com o Prisma Client (sem passar por uma rota) como um usuário normal e como um administrador. Valide se os filtros são aplicados corretamente.
3.  **Refatoração Incremental:** Modifique os endpoints de um módulo de cada vez (ex: primeiro `Tags`, depois `Transacoes`). Teste cada um após a refatoração.
4.  **Leia o Código Existente:** Use as ferramentas de busca para encontrar onde `eh_proprietario` era usado e substitua pela nova lógica de `MembroHub` e `requireHubRole`. Encontre todas as queries do Prisma e certifique-se de que a lógica de filtragem manual foi removida.
5.  **Confie nos Documentos:** Em caso de ambiguidade, a resposta está nos documentos de design em `docs/multi-tenancy`. A clareza deles é sua maior ferramenta. 