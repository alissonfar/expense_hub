# PROJECT RULE - Personal Expense Hub Multi-Tenant

## Stack Tecnológica
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Shadcn/UI, React Hook Form, Zod
- **Backend**: Node.js 18+, Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT, bcrypt, Winston
- **Banco de Dados**: PostgreSQL com Row-Level Security (RLS) para multi-tenancy
- **Infraestrutura**: Scripts de desenvolvimento (.bat), ESLint, Prettier, cross-env
- **Validação**: Zod schemas compartilhados entre frontend e backend
- **Autenticação**: JWT com refresh tokens, sistema RBAC (4 roles)

## Arquitetura e Padrões
- **Arquitetura**: Multi-tenant com isolamento por Hub (workspace)
- **Backend**: API RESTful com middleware chain (auth → RLS → validation → controller)
- **Frontend**: Next.js App Router com Server/Client Components, Context API para estado global
- **Estrutura**: Separação clara de responsabilidades por domínios funcionais
- **Convenções**: 
  - Controllers: `verboAcaoRecurso` (ex: `listMembros`, `createTag`)
  - Schemas: Mensagens de erro em português
  - Componentes: Reutilização com `components/ui` (primitivos) e `components/common`

## Boas Práticas do Projeto
- **Segurança Multi-Tenant**: Row-Level Security automático via Prisma Client estendido
- **Validação Dupla**: Zod schemas no frontend e backend para consistência
- **Middleware Chain**: `requireAuth` → `injectPrismaClient` → `validateSchema` → `Controller`
- **Logs Estruturados**: Winston com diferentes níveis (error, warn, info, debug)
- **Tipagem Completa**: TypeScript strict mode com tipos inferidos do Zod
- **Cache Inteligente**: Instâncias Prisma em cache por contexto de usuário
- **Tratamento de Erros**: Respostas padronizadas com `success`, `error`, `timestamp`
- **Rate Limiting**: Implementado para operações sensíveis

## Diretrizes para Desenvolvimento
- **Discovery First**: SEMPRE usar comandos de descoberta (@codebase, @routes, @controllers, etc.) antes de codificar
- **Acesso ao Prisma**: OBRIGATÓRIO usar `req.prisma` (com RLS) em controllers, nunca instanciar novo PrismaClient
- **Autenticação**: Aplicar `requireAuth` + `injectPrismaClient` em todas as rotas protegidas
- **Autorização**: Usar `requireHubRole([roles])` para controle de acesso por papel
- **Validação**: Todo input deve ter schema Zod correspondente
- **Frontend**: Hooks customizados para data fetching, React Hook Form + Zod para formulários
- **Logs**: Usar `getLogger('modulo')` para logs estratégicos, remover `console.log` em produção
- **Limpeza**: Seguir checklist pós-desenvolvimento (remover código comentado, imports não usados, etc.)

## Sistema de Roles (RBAC)
- **PROPRIETARIO**: Acesso total ao Hub, pode gerenciar membros e configurações
- **ADMINISTRADOR**: Pode gerenciar dados e membros, exceto configurações críticas
- **COLABORADOR**: Pode criar/editar próprios dados, visualizar dados do Hub
- **VISUALIZADOR**: Apenas leitura, pode ter política de acesso INDIVIDUAL ou TOTAL

## Estrutura de Dados Multi-Tenant
- **Hub**: Entidade central (tenant), contém `codigoAcesso` para convites
- **membros_hub**: Tabela de junção com role e dataAccessPolicy
- **Isolamento**: Todos os modelos tenant têm `hubId` obrigatório
- **RLS Automático**: Prisma Client estendido injeta `WHERE hubId = ...` automaticamente
- **Políticas de Acesso**: INDIVIDUAL (apenas próprios dados) ou TOTAL (todos do Hub)

## Observações Importantes
- **Middleware Order**: A ordem dos middlewares é crítica para segurança
- **Cache Management**: Instâncias Prisma são cacheadas por contexto, limpar quando necessário
- **Convites**: Sistema complexo com estados (inválido, inativo, expirado, ativado)
- **Validação de Senha**: Regex específico implementado, manter consistência
- **Telefone**: Formato brasileiro obrigatório nas validações
- **Empty States**: Implementar estados vazios educativos em todas as páginas
- **Onboarding**: Checklist interativo para novos usuários
- **Notificações**: Sistema de notificações para ações importantes do Hub
- **Performance**: Lazy loading e code splitting necessários no frontend
- **Responsividade**: Interface deve funcionar em mobile e desktop
- **Acessibilidade**: Componentes Shadcn/UI já são acessíveis por padrão