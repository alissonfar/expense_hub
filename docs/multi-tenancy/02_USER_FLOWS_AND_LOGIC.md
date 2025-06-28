# 02 - Fluxos de Usuário e Lógica de Negócio

- **Data:** 2024-06-27
- **Status:** Proposta

Este documento descreve a lógica operacional e a jornada do usuário na nova arquitetura multi-tenant.

## 1. O Ciclo de Vida do Usuário

### a) Registro do Primeiro Usuário (Administrador do Sistema)

1.  **Gatilho:** Um novo usuário se registra e o sistema não contém nenhum outro usuário.
2.  **Ações do Sistema:**
    -   Cria a `Pessoa` com o campo `ehAdministrador` definido como `true`.
    -   Cria automaticamente o primeiro `Hub` (ex: "Workspace de [Nome]").
    -   Cria um registro na tabela `MembroHub` ligando a nova `Pessoa` ao novo `Hub` com o `role` de `PROPRIETARIO`.
3.  **Experiência do Usuário:** Ao logar, o usuário entra diretamente no seu Hub e tem acesso ao painel de administração do sistema (embora possa não ser imediatamente visível).

### b) Registro de um Novo Usuário (Padrão)

1.  **Gatilho:** Um novo usuário se registra e o sistema já possui outros usuários.
2.  **Ações do Sistema:**
    -   Cria a `Pessoa` com `ehAdministrador: false`. Nenhum Hub é associado.
3.  **Experiência do Usuário:** Após o login, o usuário é direcionado para uma tela de "Boas-vindas" que o convida a:
    -   **Opção A:** Criar seu próprio Hub (leva a um formulário simples).
    -   **Opção B:** Inserir um Código de Acesso para se juntar a um Hub existente.

## 2. O Ciclo de Vida do Hub

### a) Criação de um Hub

-   Um usuário "flutuante" (sem Hub) pode criar seu primeiro Hub a partir da tela de boas-vindas.
-   Qualquer usuário pode criar um novo Hub a partir do menu de seleção de Hubs.
-   Ao criar um Hub, o usuário se torna seu `PROPRIETARIO` automaticamente.

### b) Adesão a um Hub (Código de Acesso)

1.  **Geração:** O `PROPRIETARIO` ou `ADMINISTRADOR` de um Hub pode visualizar e regenerar um `codigoAcesso` único para seu Hub nas configurações.
2.  **Utilização:** Um usuário logado insere o código através da UI.
3.  **Ações do Sistema:**
    -   O backend valida o código.
    -   Cria um registro `MembroHub` ligando o usuário ao Hub correspondente com o `role` de `COLABORADOR`.
    -   A UI do usuário é atualizada, e ele agora tem acesso ao novo Hub.

### c) Gestão e Exclusão (Soft Delete)

-   **Remoção de Membro:** Um `PROPRIETARIO` ou `ADMINISTRADOR` pode remover um membro. A ação define `ativo: false` no registro `MembroHub` correspondente. O usuário perde o acesso, mas seus dados (`Transacao`, etc.) são preservados no Hub.
-   **Cancelamento de Transação/Pagamento:** Da mesma forma, uma transação ou pagamento pode ser "cancelado" por um usuário com as devidas permissões. A ação define `ativo: false` no registro correspondente, removendo-o das listagens padrão (que devem filtrar por `ativo: true`), mas preservando o registro para fins históricos e de auditoria.
-   **Transferência de Propriedade:** O `PROPRIETARIO` pode designar outro membro como o novo `PROPRIETARIO`. A `role` é trocada entre os dois registros em `MembroHub`.
-   **Gestão de Membros:** Um `PROPRIETARIO` ou `ADMINISTRADOR` pode gerenciar membros. A UI deve permitir:
    - **Alterar Papel:** Modificar a `role` de um membro (ex: promover `COLABORADOR` para `ADMINISTRADOR`).
    - **Alterar Política de Acesso:** Para um `COLABORADOR`, definir se seu acesso é `GLOBAL` ou `INDIVIDUAL`.
    - **Remover Membro:** A ação define `ativo: false` no registro `MembroHub`. O usuário perde o acesso, mas seus dados (`Transacao`, etc.) são preservados no Hub.
-   **Transferência de Propriedade:** O `PROPRIETARIO` pode designar um `ADMINISTRADOR` como o novo `PROPRIETARIO`. A `role` é trocada entre os dois registros em `MembroHub`.
-   **Exclusão do Hub:** Apenas o `PROPRIETARIO` pode excluir um Hub. A ação define `ativo: false` no registro do `Hub`. O Hub se torna inacessível para todos os seus membros. A ação exige alta fricção (ex: digitar o nome do Hub para confirmar).
-   **Saída de um Membro:** Um `ADMINISTRADOR` ou `COLABORADOR` pode escolher sair de um Hub. A lógica é a mesma da remoção (soft delete do `MembroHub`). Um `PROPRIETARIO` não pode sair; ele deve primeiro transferir a propriedade ou apagar o Hub.

## 3. Lógica de Acesso e Isolação de Dados

### a) Autenticação e Contexto

-   Ao fazer login, se o usuário pertencer a mais de um Hub, a UI deve apresentar uma tela de seleção.
-   Após selecionar um Hub, um **JWT** é gerado contendo `{ pessoaId, hubId, role: 'PROPRIETARIO' | '...', dataAccessPolicy: 'GLOBAL' | '...', ehAdministrador }`. O JWT conterá o papel e a política daquele usuário **neste Hub específico**.
-   A UI deve exibir persistentemente o nome do Hub ativo e fornecer um meio fácil de trocar de contexto.

### b) Isolação de Dados (Prisma Extension)

-   A segurança do isolamento de dados **NÃO** deve depender da implementação manual em cada controller.
-   Uma **Prisma Client Extension** será implementada para interceptar todas as queries em modelos de tenant (ex: `Transacao`).
-   **Lógica da Extensão:**
    1.  Obtém o `hubId`, `role`, `dataAccessPolicy` e `ehAdministrador` do JWT do usuário.
    2.  **Verificação Prioritária:** Se `ehAdministrador` for `true`, a query original prossegue **sem filtros**.
    3.  **Filtro por Hub (Obrigatório):** Se não for admin do sistema, injeta a cláusula `where: { hubId: jwt.hubId }`.
    4.  **Filtro por Visão (Adicional):** Se o `role` for `COLABORADOR` com política `INDIVIDUAL`, ou se for `VISUALIZADOR`, a extensão adiciona um segundo filtro: `AND where: { criadoPorId: jwt.pessoaId }`.
-   **Resultado:** A lógica de permissão de visualização fica centralizada, segura e automática, sem depender da implementação manual em cada controller.

### c) Controle de Acesso Baseado em Papel (RBAC)

-   Middlewares específicos verificarão o `role` do usuário para ações sensíveis.
-   `requireHubRole('PROPRIETARIO', 'ADMINISTRADOR')` para acessar as configurações do Hub.
-   `requireHubRole('PROPRIETARIO')` para apagar o Hub ou transferir a propriedade.
-   `requireAdminSystem()` para acessar os endpoints do painel de administração global. 