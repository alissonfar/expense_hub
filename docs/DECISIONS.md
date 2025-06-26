# 🎯 DECISÕES ARQUITETURAIS - PERSONAL EXPENSE HUB

**Registro das decisões técnicas e arquiteturais tomadas**  
**Baseado na análise do código implementado**  
**Última atualização:** Janeiro 2025

## 📋 **TEMPLATE PARA NOVAS DECISÕES**

```markdown
## [Número] - [Título da Decisão]

**Data:** YYYY-MM-DD  
**Status:** Aceita | Rejeitada | Superseded  
**Contexto:** Situação que levou à decisão  
**Decisão:** O que foi decidido  
**Consequências:** Impactos positivos e negativos  
**Alternativas Consideradas:** Outras opções avaliadas  
```

---

## **001 - Arquitetura MVC com Separação Backend/Frontend**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de separar responsabilidades e permitir escalabilidade independente

**Decisão:** 
- Backend: API REST pura com Express.js
- Frontend: SPA com Next.js 14
- Comunicação via HTTP/REST com JSON

**Consequências:**
✅ **Positivas:**
- Escalabilidade independente
- Tecnologias especializadas para cada camada
- Facilita testes e manutenção
- Permite múltiplos frontends futuros

❌ **Negativas:**
- Complexidade adicional de configuração
- Necessidade de gerenciar CORS
- Latência de rede entre camadas

**Alternativas Consideradas:**
- Monolito com server-side rendering
- Arquitetura serverless
- GraphQL em vez de REST

---

## **002 - PostgreSQL como Banco Principal**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de banco relacional robusto para transações financeiras

**Decisão:** PostgreSQL 14+ como banco principal

**Consequências:**
✅ **Positivas:**
- ACID completo para transações financeiras
- Tipos de dados avançados (DECIMAL para valores monetários)
- Performance excelente para queries complexas
- Suporte a índices otimizados
- JSON nativo quando necessário

❌ **Negativas:**
- Configuração mais complexa que SQLite
- Requer servidor dedicado

**Alternativas Consideradas:**
- MySQL (menos funcionalidades avançadas)
- SQLite (limitações para produção)
- MongoDB (não relacional, inadequado para finanças)

---

## **003 - Prisma ORM como Camada de Abstração**

**Data:** 2024-12-05  
**Status:** Aceita  
**Contexto:** Necessidade de ORM type-safe e produtivo

**Decisão:** Prisma 6.10.1 como ORM principal

**Consequências:**
✅ **Positivas:**
- Type safety completa
- Migrations automáticas
- Introspection do banco
- Query builder intuitivo
- Excelente DX (Developer Experience)

❌ **Negativas:**
- Curva de aprendizado inicial
- Queries às vezes menos otimizadas que SQL puro
- Dependency adicional

**Alternativas Consideradas:**
- TypeORM (menos type safety)
- Sequelize (menos moderno)
- SQL puro (menos produtivo)

---

## **004 - Zod para Validação com Mensagens em Português**

**Data:** 2024-12-08  
**Status:** Aceita  
**Contexto:** Necessidade de validação robusta e mensagens amigáveis

**Decisão:** Zod como biblioteca de validação com mensagens em português brasileiro

**Consequências:**
✅ **Positivas:**
- Type inference automática
- Validação tanto no backend quanto frontend
- Mensagens de erro amigáveis ao usuário brasileiro
- Composição e reutilização de schemas
- Transformações automáticas

❌ **Negativas:**
- Bundle size ligeiramente maior
- Necessidade de manter traduções

**Alternativas Consideradas:**
- Joi (menos type safety)
- Yup (menos funcionalidades)
- Validação manual (mais trabalhoso)

---

## **005 - JWT para Autenticação Stateless**

**Data:** 2024-12-10  
**Status:** Aceita  
**Contexto:** Necessidade de autenticação escalável e stateless

**Decisão:** JWT + bcrypt para autenticação

**Consequências:**
✅ **Positivas:**
- Stateless (não requer armazenamento de sessão)
- Escalável horizontalmente
- Informações do usuário no token
- Padrão da indústria
- Integração fácil com frontend

❌ **Negativas:**
- Tokens não podem ser revogados facilmente
- Payload visível (mesmo que assinado)
- Renovação requer implementação adicional

**Alternativas Consideradas:**
- Sessions com Redis (mais complexo)
- OAuth2 (desnecessário para aplicação single-tenant)
- Cookies de sessão (menos flexível)

---

## **006 - Soft Delete em vez de Exclusão Física**

**Data:** 2024-12-12  
**Status:** Aceita  
**Contexto:** Necessidade de manter histórico e integridade referencial

**Decisão:** Soft delete com campo `ativo: boolean` em todas as tabelas principais

**Consequências:**
✅ **Positivas:**
- Preserva histórico completo
- Permite restaurar dados
- Mantém integridade referencial
- Auditorias e relatórios históricos
- Não quebra relacionamentos

❌ **Negativas:**
- Queries precisam sempre filtrar `ativo: true`
- Banco cresce mais (dados "deletados" ficam)
- Complexidade adicional nas consultas

**Alternativas Consideradas:**
- Exclusão física (perde histórico)
- Tabelas de auditoria separadas (mais complexo)
- Archive tables (duplicação de estrutura)

---

## **007 - Next.js 14 com App Router**

**Data:** 2024-12-15  
**Status:** Aceita  
**Contexto:** Necessidade de framework moderno para frontend

**Decisão:** Next.js 14 com App Router para SPA

**Consequências:**
✅ **Positivas:**
- Server Components para performance
- App Router mais intuitivo
- File-based routing
- Built-in optimizations
- TypeScript first-class support
- Excelente DX

❌ **Negativas:**
- Curva de aprendizado App Router
- Breaking changes entre versões
- Complexidade para iniciantes

**Alternativas Consideradas:**
- React puro + React Router (mais verboso)
- Vite + React (menos funcionalidades)
- Remix (menos maduro na época)

---

## **008 - Shadcn/ui como UI Library**

**Data:** 2024-12-18  
**Status:** Aceita  
**Contexto:** Necessidade de componentes UI consistentes e customizáveis

**Decisão:** Shadcn/ui + Tailwind CSS para UI

**Consequências:**
✅ **Positivas:**
- Componentes copy-paste (não dependency)
- Totalmente customizável
- Design system consistente
- Tailwind CSS para styling
- TypeScript nativo
- Acessibilidade built-in

❌ **Negativas:**
- Necessidade de copiar código
- Atualizações manuais dos componentes
- Curva de aprendizado Tailwind

**Alternativas Consideradas:**
- Material-UI (menos customizável)
- Ant Design (muito opinativo)
- Chakra UI (descontinuado)
- CSS Modules puros (mais trabalhoso)

---

## **009 - Sistema de Parcelamento com UUID**

**Data:** 2025-01-05  
**Status:** Aceita  
**Contexto:** Necessidade de agrupar parcelas com valores diferentes

**Decisão:** Campo `grupo_parcela` UUID para agrupar parcelas relacionadas

**Consequências:**
✅ **Positivas:**
- Permite parcelas com valores diferentes
- Fácil identificação de grupos de parcelas
- UUID evita conflitos
- Queries eficientes por grupo
- Flexibilidade para editores

❌ **Negativas:**
- Complexidade adicional no banco
- Queries mais complexas
- UUID ocupa mais espaço

**Alternativas Consideradas:**
- ID sequencial simples (menos flexível)
- Referência ao ID da primeira parcela (confuso)
- Tabela separada de grupos (over-engineering)

---

## **010 - Pagamentos Compostos**

**Data:** 2025-01-08  
**Status:** Aceita  
**Contexto:** Usuários queriam pagar múltiplas transações de uma vez

**Decisão:** Tabela `pagamento_transacoes` para relacionamento M:N

**Consequências:**
✅ **Positivas:**
- Um pagamento pode cobrir múltiplas transações
- Controle fino de quanto pagar de cada transação
- Histórico detalhado de pagamentos
- Suporte a excedentes automáticos

❌ **Negativas:**
- Relacionamento mais complexo
- Queries de relatório mais elaboradas
- Interface mais complexa

**Alternativas Consideradas:**
- Apenas pagamentos 1:1 (menos flexível)
- Pagamentos agrupados simples (menos controle)
- Sistema de "carteira" interna (over-engineering)

---

## **011 - Estrutura de Documentação Modular**

**Data:** 2025-01-24  
**Status:** Aceita  
**Contexto:** Necessidade de documentação organizada e acessível

**Decisão:** 
- Estrutura docs/ com arquivos específicos
- README.md, ARCHITECTURE.md, API.md, DEVELOPMENT.md, etc.
- Documentação baseada no código real implementado

**Consequências:**
✅ **Positivas:**
- Documentação sempre atualizada
- Facilita onboarding de novos desenvolvedores
- Referência técnica completa
- Suporte ao Cursor AI

❌ **Negativas:**
- Necessidade de manter sincronizada
- Trabalho adicional de documentação

**Alternativas Consideradas:**
- Documentação inline no código
- Wiki externa
- Documentação automática

---

**As decisões acima refletem as escolhas REAIS feitas durante o desenvolvimento do Personal Expense Hub, baseadas na análise completa do código implementado.** 