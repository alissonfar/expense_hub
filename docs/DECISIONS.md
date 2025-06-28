# Histórico de Decisões Arquiteturais

Este documento registra as decisões técnicas importantes tomadas durante o desenvolvimento do Personal Expense Hub, explicando o "porquê" por trás das escolhas.

## Template para Novas Decisões

Use este template para documentar novas decisões arquiteturais.

---

### **[Título da Decisão]**

-   **Data:** YYYY-MM-DD
-   **Status:** Proposta | Aceita | Rejeitada | Descontinuada
-   **Contexto:** Qual problema ou necessidade está sendo abordado? Qual era o cenário antes desta decisão?
-   **Alternativas Consideradas:**
    -   **Alternativa 1:** (ex: Passport.js, TypeORM, etc.)
        -   *Prós:* ...
        -   *Contras:* ...
    -   **Alternativa 2:** ...
-   **Decisão:** Qual foi a escolha final e por quê? Detalhe os motivos, como simplicidade, performance, familiaridade da equipe, ecossistema, etc.
-   **Consequências:** Quais são os resultados esperados ou os impactos dessa decisão no projeto? (Positivos e negativos).

---

## Decisões Implementadas

### **Uso de JWT para Autenticação**

-   **Data:** 2024-05-10
-   **Status:** Aceita
-   **Contexto:** O sistema precisava de um mecanismo de autenticação seguro e stateless para proteger os endpoints da API.
-   **Alternativas Consideradas:**
    -   **Sessões baseadas em Cookie:** Solução stateful tradicional.
        -   *Prós:* Mais simples de começar, amplamente compreendido.
        -   *Contras:* Requer armazenamento de sessão no servidor, o que dificulta a escalabilidade horizontal. Menos ideal para APIs consumidas por diferentes tipos de clientes (web, mobile).
-   **Decisão:** Foi escolhido o **JWT (JSON Web Tokens)**. O token é gerado no login e armazenado no cliente (localStorage). Ele é enviado em cada requisição no header `Authorization`.
    -   **Motivo:** A natureza stateless do JWT simplifica a arquitetura do backend, melhora a escalabilidade e o torna ideal para ser consumido por clientes diversos (como a SPA Next.js).
-   **Consequências:** O backend não precisa manter estado de sessão. A lógica de autenticação fica contida no próprio token, e a verificação é rápida. É necessário lidar com o armazenamento seguro do token no cliente e implementar uma estratégia para expiração e renovação.

### **Uso de Zod para Validação de Dados**

-   **Data:** 2024-05-12
-   **Status:** Aceita
-   **Contexto:** Era necessário um sistema robusto para validar todos os dados de entrada da API (body, query, params), garantindo a integridade dos dados antes de chegarem à lógica de negócio.
-   **Alternativas Consideradas:**
    -   **Validação manual com `if/else`:**
        -   *Prós:* Nenhuma dependência externa.
        -   *Contras:* Extremamente verboso, propenso a erros, difícil de manter e reutilizar.
    -   **Joi / Yup:** Bibliotecas populares de validação.
        -   *Prós:* Robustas e com bom ecossistema.
        -   *Contras:* Zod oferece uma integração superior com TypeScript, inferindo tipos estáticos a partir dos schemas de validação, o que elimina a necessidade de duplicar a definição de tipos.
-   **Decisão:** Foi escolhido o **Zod**. Os schemas de validação são a "fonte da verdade" para os tipos de dados de entrada.
    -   **Motivo:** A inferência de tipos do Zod (`z.infer<typeof schema>`) é uma vantagem massiva em um projeto TypeScript. A capacidade de customizar mensagens de erro para português foi um fator decisivo para a UX.
-   **Consequências:** Código mais seguro e conciso. Redução drástica de código boilerplate para validação e tipagem. Respostas de erro de validação são claras e informativas para o cliente.

### **Implementação de Soft Delete com `ativo: boolean`**

-   **Data:** 2024-05-15
-   **Status:** Aceita
-   **Contexto:** Ao excluir dados importantes (como `pessoas` ou `tags`), uma exclusão física (`DELETE FROM ...`) poderia levar à perda de dados históricos e quebrar a integridade referencial de registros antigos (transações, pagamentos).
-   **Alternativas Consideradas:**
    -   **Hard Delete (Exclusão Física):**
        -   *Prós:* Simples de implementar, remove permanentemente os dados.
        -   *Contras:* Perda de histórico, arriscado, pode causar erros em cascata se os relacionamentos não forem bem gerenciados.
-   **Decisão:** Foi implementado o padrão **Soft Delete**. Em vez de deletar o registro, uma flag `ativo` (ou similar) é definida como `false`.
    -   **Motivo:** Preserva o histórico de dados, mantém a integridade referencial e permite a "restauração" de dados simplesmente alterando a flag de volta para `true`. É uma abordagem muito mais segura para sistemas financeiros.
-   **Consequências:** Todas as queries de listagem (`findMany`) precisam incluir uma cláusula `where: { ativo: true }` para filtrar os registros "deletados". Isso adiciona uma pequena complexidade às queries, mas os benefícios de segurança e integridade superam em muito essa desvantagem.

---

### **Lógica de Exclusão de Pagamentos com Transações Atômicas**

-   **Data:** 2024-06-27
-   **Status:** Aceita
-   **Contexto:** A funcionalidade de excluir um pagamento (`DELETE /api/pagamentos/:id`) é uma operação crítica que afeta múltiplos modelos no banco de dados (Pagamentos, Transações, Participantes). Uma falha no meio do processo poderia deixar o banco em um estado inconsistente (ex: o pagamento é deletado, mas o valor não é revertido na transação original).
-   **Alternativas Consideradas:**
    -   **Execução Sequencial de Queries:** Executar cada `DELETE` e `UPDATE` como uma chamada separada ao Prisma.
        -   *Prós:* Mais simples de escrever inicialmente.
        -   *Contras:* Altamente perigoso. Se uma query no meio da sequência falhar, as queries anteriores não são desfeitas, resultando em dados corrompidos.
-   **Decisão:** Toda a lógica de exclusão foi encapsulada em um bloco **`prisma.$transaction([...])`**. Também foi decidido confiar na restrição `onDelete: Cascade` do Prisma para lidar com a exclusão de registros filhos (`pagamento_transacoes`), em vez de gerenciá-los manualmente.
    -   **Motivo:** O uso de transações garante a **atomicidade**: ou todas as operações (reverter valores, atualizar status, deletar pagamento, deletar receita de excedente) são bem-sucedidas, ou todas são revertidas em caso de erro. Isso mantém a integridade dos dados financeiros, que é a principal prioridade do sistema. Confiar no `onDelete: Cascade` simplifica o código e reduz a chance de erros manuais.
-   **Consequências:** A lógica do controller ficou um pouco mais aninhada, mas a robustez e a segurança do sistema aumentaram significativamente. O código agora é resiliente a falhas parciais durante a operação de exclusão.

---

### **Multi-Tenancy via RLS com Prisma Estendido**

-   **Data:** 2024-06-28
-   **Status:** Aceita
-   **Contexto:** Com a introdução do conceito de "Hubs", tornou-se crítico garantir que os dados de um Hub (tenant) fossem completamente isolados e inacessíveis para usuários de outros Hubs.
-   **Alternativas Consideradas:**
    -   **Banco de Dados Separado por Tenant:**
        -   *Prós:* Isolamento máximo.
        -   *Contras:* Altíssima complexidade de provisionamento, manutenção, migrações e custos.
    -   **Schema Separado por Tenant (no mesmo DB):**
        -   *Prós:* Bom isolamento.
        -   *Contras:* Complexo de gerenciar com o Prisma, especialmente para migrações e conexões dinâmicas.
    -   **Filtragem Manual em cada Query:** Adicionar `where: { hubId: ... }` em todos os controllers.
        -   *Prós:* Simples de entender inicialmente.
        -   *Contras:* Extremamente propenso a erros humanos. Esquecer uma única cláusula `where` em um único controller levaria a um vazamento de dados catastrófico.
-   **Decisão:** Foi decidido usar uma **única base de dados e um único schema**, mas forçar o isolamento dos dados usando uma **extensão do Prisma Client (`$extends`)**. Esta extensão intercepta todas as queries e adiciona automaticamente a cláusula `where: { hubId: '...' }` com base no `hubId` presente no token JWT do usuário.
    -   **Motivo:** Esta abordagem combina a simplicidade de gerenciamento de um único banco de dados com a segurança do isolamento de dados. A lógica de segurança é centralizada em um único local (`utils/prisma.ts`), tornando-a reutilizável, transparente para os controllers e, o mais importante, **difícil de burlar acidentalmente**.
-   **Consequências:** Os controllers tornaram-se mais simples e seguros, pois não precisam mais se preocupar com o `hubId` nas queries. A complexidade de segurança foi abstraída para a camada de acesso a dados. Isso exige uma ordem rigorosa de middlewares nas rotas (`requireAuth` sempre antes de `injectPrismaClient`).

---

### **Fluxo de Autenticação em Duas Etapas (Refresh + Access Token)**

-   **Data:** 2024-06-28
-   **Status:** Aceita
-   **Contexto:** Em um ambiente multi-tenant, um usuário pode pertencer a vários Hubs. Era necessário um fluxo de autenticação que permitisse ao usuário alternar entre seus Hubs de forma segura e eficiente, sem a necessidade de fazer login repetidamente.
-   **Alternativas Consideradas:**
    -   **Um Access Token por Login:** Forçaria o usuário a inserir suas credenciais toda vez que quisesse trocar de Hub. Uma péssima experiência de usuário.
    -   **Access Token Único com Todas as Permissões:** O token JWT conteria um array de Hubs e permissões.
        -   *Prós:* Menos chamadas de API para autenticação.
        -   *Contras:* O token poderia se tornar muito grande. Uma mudança de permissão em um único Hub exigiria a reemissão de todo o token. O escopo do token seria muito amplo, o que é uma má prática de segurança.
-   **Decisão:** Foi implementado um fluxo de autenticação em duas etapas:
    1.  **`POST /api/auth/login`**: Retorna um **Refresh Token** de longa duração (que apenas identifica o usuário) e a lista de Hubs disponíveis para ele.
    2.  **`POST /api/auth/select-hub`**: O cliente envia o Refresh Token e o `hubId` desejado, recebendo em troca um **Access Token** de curta duração, cujo escopo é limitado àquele Hub específico (contém `hubId` e o `role` do usuário naquele Hub).
    -   **Motivo:** Esta abordagem oferece um excelente equilíbrio entre segurança e experiência do usuário. O Access Token é leve, tem um escopo bem definido e é de curta duração, seguindo as melhores práticas de segurança. A troca de Hubs é uma operação rápida que não expõe as credenciais do usuário novamente.
-   **Consequências:** A lógica no cliente (frontend) se torna um pouco mais complexa, pois precisa gerenciar o Refresh Token, o Access Token e o fluxo de seleção/troca de Hub. No entanto, essa complexidade é justificada pelos ganhos em segurança e usabilidade.

---

## [2024-06-28] Correção Crítica: Isolamento Multi-Tenant em findUnique (Prisma Extension)

### Contexto
Durante testes automatizados de isolamento multi-tenant, foi identificado que operações do tipo `findUnique` em modelos de tenant (ex: transacoes, tags, pagamentos) não aplicavam o filtro de `hubId` na Prisma Extension. Isso permitia que um usuário acessasse dados de outros hubs conhecendo apenas o ID, violando o isolamento de dados.

### Diagnóstico
- A Prisma Extension estava configurada para **não aplicar** filtro de segurança em `findUnique`, sob a justificativa de que só aceita chave única.
- Isso é incorreto para multi-tenancy: mesmo buscas por chave única devem garantir que o registro pertence ao hub do usuário.

### Solução
- A lógica da Prisma Extension foi corrigida para, em operações `findUnique` de modelos de tenant, buscar normalmente e, caso o registro retornado não pertença ao `hubId` do contexto, retornar `null`.
- Isso garante que, mesmo conhecendo o ID, um usuário não pode acessar dados de outro hub.

### Impacto
- Isolamento multi-tenant garantido em todas as operações, inclusive `findUnique`.
- Segurança centralizada e consistente, sem necessidade de lógica manual nos controllers.
- Todos os testes automatizados de isolamento passaram 100%.

### Referência
- Script de teste: `backend/scripts/test-isolamento-multitenant.js`
- Código: `backend/utils/prisma.ts` (função getExtendedPrismaClient)

--- 