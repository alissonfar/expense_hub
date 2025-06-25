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
- Backup e manutenção mais elaborados

**Alternativas Consideradas:**
- MySQL (menor precisão decimal)
- SQLite (limitações de concorrência)
- MongoDB (sem ACID completo)

---

## **003 - Prisma ORM para Abstração de Banco**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de ORM type-safe e produtivo

**Decisão:** Prisma 6.10.1 como ORM principal

**Consequências:**
✅ **Positivas:**
- Type safety completa com TypeScript
- Migrations automáticas
- Query builder intuitivo
- Introspection de schema
- Performance otimizada

❌ **Negativas:**
- Curva de aprendizado inicial
- Dependência de ferramenta externa
- Algumas queries complexas requerem SQL raw

**Alternativas Consideradas:**
- TypeORM (mais complexo)
- Sequelize (menos type-safe)
- SQL puro (muito verboso)

---

## **004 - JWT para Autenticação Stateless**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de autenticação escalável sem sessões

**Decisão:** 
- JWT com payload: `{user_id, email, nome, eh_proprietario}`
- Expiração: 7 dias
- Refresh tokens para renovação

**Consequências:**
✅ **Positivas:**
- Stateless (sem armazenamento servidor)
- Escalável horizontalmente
- Funciona com múltiplos frontends
- Informações do usuário no token

❌ **Negativas:**
- Não pode ser revogado facilmente
- Tamanho maior que session IDs
- Informações sensíveis no cliente

**Alternativas Consideradas:**
- Sessions com Redis
- OAuth 2.0 completo
- API Keys simples

---

## **005 - Zod para Validação com Mensagens em Português**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de validação type-safe e UX em português

**Decisão:** 
- Zod para todas as validações
- Mensagens customizadas em português brasileiro
- Schemas reutilizáveis
- Transformações automáticas (toLowerCase, trim)

**Consequências:**
✅ **Positivas:**
- Type safety com inferência automática
- Mensagens amigáveis ao usuário brasileiro
- Validação consistente em toda aplicação
- Facilita manutenção de regras

❌ **Negativas:**
- Dependência adicional
- Necessidade de traduzir todas as mensagens

**Alternativas Consideradas:**
- Joi (menos type-safe)
- Yup (menos performante)
- Validação manual (muito trabalhoso)

---

## **006 - Sistema de Proprietário Único**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Controle centralizado de gastos familiares/compartilhados

**Decisão:** 
- Um proprietário por sistema
- Primeiro usuário = proprietário automático
- Proprietário controla: pessoas, transações, configurações
- Participantes: apenas visualizam e fazem pagamentos

**Consequências:**
✅ **Positivas:**
- Controle total sobre finanças
- Evita conflitos de permissões
- Simplifica regras de negócio
- Ideal para famílias

❌ **Negativas:**
- Menos flexível para grupos
- Dependência de uma pessoa
- Não suporta múltiplos administradores

**Alternativas Consideradas:**
- Sistema de roles complexo
- Múltiplos proprietários
- Permissões granulares

---

## **007 - Valores Fixos em vez de Percentuais**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Divisão de gastos mais precisa e flexível

**Decisão:** 
- Participantes têm valores fixos específicos
- Soma deve bater com valor total (±1 centavo)
- Não usa percentuais automáticos

**Consequências:**
✅ **Positivas:**
- Divisão precisa e justa
- Flexibilidade total na distribuição
- Evita erros de arredondamento
- Transparência nos valores

❌ **Negativas:**
- Mais trabalho para calcular
- Usuário deve fazer matemática

**Alternativas Consideradas:**
- Divisão igual automática
- Percentuais por participante
- Pesos relativos

---

## **008 - Soft Delete para Preservar Histórico**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de manter histórico financeiro íntegro

**Decisão:** 
- Campo `ativo: boolean` em todas as entidades
- Exclusão = `ativo: false`
- Queries filtram por `ativo: true` por padrão

**Consequências:**
✅ **Positivas:**
- Histórico preservado sempre
- Auditoria completa
- Possibilidade de restaurar
- Integridade referencial mantida

❌ **Negativas:**
- Banco cresce indefinidamente
- Queries mais complexas
- Necessidade de filtros constantes

**Alternativas Consideradas:**
- Delete físico (perde histórico)
- Tabelas de auditoria separadas
- Archive em tabelas específicas

---

## **009 - Parcelamento com UUID de Grupo**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Necessidade de agrupar parcelas relacionadas

**Decisão:** 
- Campo `grupo_parcela: UUID` para agrupar parcelas
- Cada parcela é uma transação independente
- Valores podem ser diferentes por parcela

**Consequências:**
✅ **Positivas:**
- Flexibilidade total nos valores
- Parcelas independentes para pagamento
- Fácil agrupamento e consulta
- Suporte a parcelas variáveis

❌ **Negativas:**
- Complexidade adicional
- Múltiplas transações para um gasto

**Alternativas Consideradas:**
- Tabela separada de parcelas
- Valores iguais obrigatórios
- Sistema de recorrência

---

## **010 - Pagamentos Compostos com Excedentes**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Facilitar pagamentos de múltiplas transações

**Decisão:** 
- Pagamentos podem cobrir múltiplas transações
- Excedentes viram receitas automaticamente
- Configuração de valor mínimo para excedente

**Consequências:**
✅ **Positivas:**
- UX simplificada para usuário
- Aproveitamento de excedentes
- Flexibilidade nos pagamentos
- Menos transações manuais

❌ **Negativas:**
- Lógica complexa de distribuição
- Possibilidade de erros de cálculo

**Alternativas Consideradas:**
- Pagamentos apenas individuais
- Excedentes perdidos
- Créditos em conta

---

## **011 - Tags com Limite de 5 por Transação**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Evitar over-tagging e manter organização

**Decisão:** 
- Máximo 5 tags por transação
- Tags com cores hexadecimais
- Sistema N:N entre transações e tags

**Consequências:**
✅ **Positivas:**
- Categorização organizada
- Performance de queries
- UI mais limpa
- Força foco nas tags importantes

❌ **Negativas:**
- Limitação para casos complexos
- Necessidade de escolher prioridades

**Alternativas Consideradas:**
- Tags ilimitadas
- Sistema hierárquico
- Tags obrigatórias

---

## **012 - Next.js 14 com App Router**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Frontend moderno e performático

**Decisão:** 
- Next.js 14 com App Router
- Server Components quando possível
- TypeScript obrigatório

**Consequências:**
✅ **Positivas:**
- Performance otimizada
- SEO melhorado
- Code splitting automático
- Developer experience excelente

❌ **Negativas:**
- Curva de aprendizado
- Algumas limitações do App Router

**Alternativas Consideradas:**
- Create React App
- Vite + React
- Next.js com Pages Router

---

## **013 - Shadcn/ui para Componentes**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Componentes consistentes e customizáveis

**Decisão:** 
- Shadcn/ui como base de componentes
- Tailwind CSS para estilização
- Radix UI como primitivos

**Consequências:**
✅ **Positivas:**
- Componentes acessíveis
- Design system consistente
- Customização total
- Qualidade profissional

❌ **Negativas:**
- Dependência de múltiplas libs
- Tamanho do bundle

**Alternativas Consideradas:**
- Material-UI
- Chakra UI
- Ant Design

---

## **014 - Logs Estratégicos sem Biblioteca Externa**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Debugging eficiente sem complexidade adicional

**Decisão:** 
- Console.log nativo para logs
- Padrão: `[FunctionName] Mensagem { context }`
- Logs em pontos estratégicos apenas

**Consequências:**
✅ **Positivas:**
- Simplicidade máxima
- Sem dependências extras
- Debugging eficiente
- Performance excelente

❌ **Negativas:**
- Sem níveis de log avançados
- Sem persistência automática
- Menos features que libs dedicadas

**Alternativas Consideradas:**
- Winston
- Pino
- Morgan

---

## **015 - Estrutura de Response Padronizada**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Consistência na API e facilidade de consumo

**Decisão:** 
```json
{
  "success": boolean,
  "message": "string",
  "data": any,
  "timestamp": "ISO string"
}
```

**Consequências:**
✅ **Positivas:**
- Consistência total na API
- Facilita tratamento no frontend
- Timestamps para debugging
- Estrutura previsível

❌ **Negativas:**
- Overhead em responses simples
- Necessidade de wrapper sempre

**Alternativas Consideradas:**
- Response direto dos dados
- Diferentes formatos por endpoint
- Padrão REST puro

---

## **016 - Hooks Customizados para Estado**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Reutilização de lógica e estado no frontend

**Decisão:** 
- Hooks customizados para cada domínio
- Estados locais com useState/useReducer
- Sem state management global complexo

**Consequências:**
✅ **Positivas:**
- Reutilização de lógica
- Componentes mais limpos
- Facilita testes
- Menos dependências

❌ **Negativas:**
- Possível duplicação de requests
- Sem cache global automático

**Alternativas Consideradas:**
- Redux Toolkit
- Zustand
- React Query

---

## **017 - Validação Dupla (Frontend + Backend)**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** UX rápida e segurança garantida

**Decisão:** 
- Validação no frontend para UX
- Validação obrigatória no backend para segurança
- Mesmos critérios em ambos

**Consequências:**
✅ **Positivas:**
- UX responsiva
- Segurança garantida
- Feedback imediato

❌ **Negativas:**
- Duplicação de código de validação
- Necessidade de sincronizar regras

**Alternativas Consideradas:**
- Apenas backend (UX ruim)
- Apenas frontend (inseguro)
- Schema compartilhado

---

## **018 - Scripts Batch para Windows**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Facilitar desenvolvimento em ambiente Windows

**Decisão:** 
- Scripts .bat para automação
- start-dev.bat, stop-dev.bat, reset-dev.bat
- Verificações automáticas de dependências

**Consequências:**
✅ **Positivas:**
- Facilita onboarding
- Reduz erros de setup
- Automação completa

❌ **Negativas:**
- Específico para Windows
- Manutenção adicional

**Alternativas Consideradas:**
- Scripts npm apenas
- Docker Compose
- Makefile

---

## **019 - Conversão Decimal para Number**

**Data:** 2024-12-01  
**Status:** Aceita  
**Contexto:** Problemas de formatação com Prisma Decimal

**Decisão:** 
- Conversão automática no backend: `Number(valor_decimal)`
- formatCurrency robusta no frontend
- Suporte a múltiplos tipos

**Consequências:**
✅ **Positivas:**
- Valores exibem corretamente
- Compatibilidade com frontend
- Performance melhor que strings

❌ **Negativas:**
- Possível perda de precisão extrema
- Conversão manual necessária

**Alternativas Consideradas:**
- Manter como Decimal (problemas de UI)
- Converter para string (problemas de cálculo)
- Biblioteca específica para dinheiro

---

## **020 - Documentação Completa em docs/**

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