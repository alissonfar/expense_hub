# 01 - Modelo de Dados e Schema do Banco

- **Data:** 2024-06-27
- **Status:** Proposta

Este documento detalha as alterações necessárias no arquivo `prisma/schema.prisma` para suportar a arquitetura multi-tenant.

## 1. Novos Modelos

### a) `Hub`

Este é o modelo central que representa cada workspace/tenant.

```prisma
model Hub {
  id        Int      @id @default(autoincrement())
  nome      String   @unique
  ativo     Boolean  @default(true) // Para soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  codigoAcesso String? @unique

  // Relações
  membros     MembroHub[]
  transacoes  Transacao[]
  tags        Tag[]
  pagamentos  Pagamento[]
  // ... outras relações com dados do tenant
}
```

### b) `MembroHub` (Tabela de Junção com Papéis)

Esta tabela de junção é crucial para definir a relação e o papel de cada `Pessoa` dentro de um `Hub`.

```prisma
enum Role {
  PROPRIETARIO
  ADMINISTRADOR
  COLABORADOR
  VISUALIZADOR
}

enum DataAccessPolicy {
  GLOBAL
  INDIVIDUAL
}

model MembroHub {
  hubId    Int
  pessoaId Int
  role      Role      @default(COLABORADOR)
  dataAccessPolicy DataAccessPolicy? // Aplicável apenas quando role é COLABORADOR
  ativo     Boolean   @default(true) // Para revogar acesso (soft delete)
  joinedAt  DateTime  @default(now())

  hub       Hub       @relation(fields: [hubId], references: [id])
  pessoa    Pessoa   @relation(fields: [pessoaId], references: [id])

  @@id([hubId, pessoaId])
}
```

## 2. Modificações em Modelos Existentes

### a) `Pessoa`

O modelo `Pessoa` não representará mais um "usuário" no sentido tradicional, mas sim um perfil global que pode se juntar a Hubs.

-   **Remover:** `eh_proprietario`. Esta lógica agora está em `MembroHub`.
-   **Adicionar:** `ehAdministrador Boolean @default(false)` para o superusuário do sistema.
-   **Adicionar Relação:** `hubs MembroHub[]` para conectar a pessoa aos seus Hubs.
-   **Ajustar Unicidade:** O email deve ser globalmente único (`@unique`). Uma pessoa só tem uma conta no sistema.

```prisma
model Pessoa {
  id        Int      @id @default(autoincrement())
  nome      String
  email     String   @unique // Email é a chave de login global
  // ... outros campos como telefone, senha, etc.

  ehAdministrador Boolean  @default(false)
  ativo            Boolean  @default(true)

  // Relação com os Hubs dos quais é membro
  hubs      MembroHub[]

  // Relações com dados que a pessoa CRIA
  transacoes_criadas Transacao[]
  tags_criadas       Tag[]
  pagamentos_feitos  Pagamento[]
  // ...
}
```

### b) `Transacao`, `Tag`, `Pagamento`, etc. (Dados do Tenant)

Todos os modelos que contêm dados que pertencem a um Hub devem ser modificados para incluir uma referência obrigatória ao Hub.

**Exemplo para `Transacao`:**

-   **Adicionar:** `hubId Int` e `hub Hub @relation(fields: [hubId], references: [id])`.
-   **Adicionar Índice:** `@@index([hubId])` para otimizar a performance das queries de isolamento.
-   **Garantir `criadoPorId`:** A relação com o criador é agora essencial para a política de acesso `INDIVIDUAL`.
-   **Adicionar `ativo`:** Incluir o campo `ativo: Boolean` para suportar o soft delete.

```prisma
model Transacao {
  id        Int      @id @default(autoincrement())
  ativo     Boolean  @default(true)
  descricao String
  // ... outros campos da transação

  // Chave estrangeira para o Hub
  hubId Int
  hub    Hub @relation(fields: [hubId], references: [id])

  // Relação com o criador (essencial para a política de acesso INDIVIDUAL)
  criadoPorId Int
  criadoPor    Pessoa @relation(name: "transacoes_criadas", fields: [criadoPorId], references: [id])
  
  // ... outras relações

  @@index([hubId]) // Otimização CRÍTICA
}
```

Este padrão (`hubId`, relação e índice) deve ser replicado para `Tag`, `Pagamento`, `TransacaoParticipante`, e qualquer outro modelo que contenha dados específicos de um Hub. 