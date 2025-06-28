# 00 - Visão e Arquitetura da Multi-Tenancy

- **Data:** 2024-06-27
- **Status:** Definido

## 1. Visão Geral

Este documento descreve a transição do Personal Expense Hub de uma aplicação single-user para uma plataforma **multi-tenant**, centrada no conceito de "Hubs" (workspaces). O objetivo é permitir que múltiplos grupos de usuários coexistam de forma segura e isolada na mesma instância da aplicação, abrindo caminho para funcionalidades colaborativas avançadas.

## 2. Pilares Arquiteturais

Três decisões fundamentais formam a base desta nova arquitetura:

### a) Estratégia de Banco de Dados: Schema Compartilhado

-   **Decisão:** Adotaremos um único schema de banco de dados compartilhado entre todos os tenants. A isolação dos dados será garantida por uma coluna `hubId` em todas as tabelas relevantes.
-   **Justificativa:** Esta abordagem oferece o melhor equilíbrio entre complexidade de implementação, custo de manutenção e segurança para o estágio atual do projeto. A alternativa (schemas separados por tenant) introduziria uma sobrecarga operacional desnecessária.

### b) Ciclo de Vida dos Dados: Soft Delete Mandatório e Abrangente

-   **Decisão:** Nenhuma entidade crítica será excluída fisicamente do banco de dados (hard delete). Todas as exclusões serão lógicas, utilizando uma flag `ativo: boolean`. Esta política se aplica de forma abrangente:
    -   **Entidades de Governança:** `Hub`, `Pessoa`, `MembroHub`.
    -   **Entidades Financeiras:** `Transacao`, `Pagamento`.
-   **Justificativa:** Esta abordagem unificada resolve elegantemente vários problemas complexos:
    -   **Preservação do Histórico:** Garante que o "cancelamento" de uma transação ou a remoção de um membro não corrompa o histórico financeiro do Hub.
    -   **Integridade Referencial:** Evita que um Hub fique sem dono ou que dados fiquem sem um criador associado.
    -   **Recuperabilidade e Auditoria:** Permite a reativação futura de qualquer entidade e mantém um registro de itens "excluídos" para fins de auditoria, prevenindo a perda acidental e irreversível de dados.

### c) Fluxo de Entrada: Código de Acesso

-   **Decisão:** O método primário para novos usuários se juntarem a um Hub existente será através de um "Código de Acesso" único e gerenciável.
-   **Justificativa:** Esta abordagem é mais flexível, rápida e alinhada com casos de uso modernos do que os sistemas tradicionais de convite por email. Ela dá ao proprietário do Hub controle total (podendo regenerar o código a qualquer momento) enquanto oferece uma experiência de entrada de baixo atrito para os novos membros.

## 3. Papéis, Permissões e Políticas

A estrutura de poder dentro de cada Hub será granular, separando a **função (Papel)** do **escopo de visão (Política)**.

### a) Papéis de Hub

-   **`PROPRIETARIO`:** Um por Hub. O poder supremo. Pode gerenciar a assinatura, apagar o Hub e transferir a propriedade.
-   **`ADMINISTRADOR`:** Vários por Hub. O braço direito. Gerencia membros e configurações operacionais.
-   **`COLABORADOR`:** O membro padrão. Cria e interage com os dados do Hub.
-   **`VISUALIZADOR`:** Papel de apenas leitura, ideal para consultores ou stakeholders externos.

### b) Política de Acesso a Dados (para Colaboradores)

Para o papel `COLABORADOR`, o escopo de acesso aos dados será definido por uma política específica:

-   **`GLOBAL`:** O colaborador pode ver e interagir com **todos** os dados do Hub.
-   **`INDIVIDUAL`:** O colaborador pode criar dados, mas só pode ver e editar o que **ele mesmo criou**.

### c) Administrador do Sistema

Haverá também um **Administrador do Sistema** (`ehAdministrador: true` no modelo `Pessoa`), um superusuário com visibilidade sobre todos os Hubs para fins de suporte, manutenção e análise. 