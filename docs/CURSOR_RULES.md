ANTIGA RULE ORIGINAL


# CONFIGURAÇÃO CURSOR AI - API NODE.JS

## STACK TECNOLÓGICA
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM  
- JWT + bcrypt para autenticação
- Zod para validação (mensagens em português BR)
- Rate limiting, CORS, Helmet para segurança

## DIRETRIZES GERAIS

### 1. ANÁLISE E EXPLICAÇÃO DE PROBLEMAS
- SEMPRE explicar problemas com linguagem simples e didática
- Detalhar o QUE está acontecendo, POR QUE está acontecendo, e COMO resolver
- Apresentar múltiplas soluções quando possível, explicando prós e contras
- Usar analogias do mundo real quando ajudar no entendimento

### 2. LOGS ESTRATÉGICOS
- Adicionar logs em TODOS os pontos críticos:
  - Início e fim de operações importantes
  - Antes e depois de queries no banco
  - Entrada e saída de middlewares
  - Pontos de erro e exceções
  - Validações de dados
- Usar níveis apropriados: error, warn, info, debug
- Logs devem ser informativos mas não verbosos em produção

### 3. ANÁLISE DE ESTRUTURA EXISTENTE
- SEMPRE analisar a estrutura atual do projeto antes de criar código novo
- Seguir padrões de nomenclatura já estabelecidos
- Manter consistência com arquitetura existente
- Reutilizar componentes, tipos e utilitários já criados
- Não reinventar funcionalidades que já existem

## PADRÕES DE CÓDIGO

### TypeScript
- Tipagem estrita sempre
- Interfaces para contratos de dados
- Types para unions e primitivos
- Usar generics quando apropriado
- Evitar 'any' - preferir 'unknown' quando necessário

### Express + Middlewares
- Controllers magros - lógica de negócio em services
- Middlewares reutilizáveis
- Tratamento de erro centralizado
- Request/Response sempre tipados
- Validação com Zod antes de processar

### Prisma ORM
- Queries otimizadas - usar select quando não precisar de todos os campos
- Transações para operações relacionadas
- Tratamento adequado de erros do Prisma
- Não expor dados sensíveis (senhas, tokens)

### Validação com Zod
- Schemas reutilizáveis
- Mensagens de erro em português brasileiro
- Validação tanto no body quanto em params/query
- Transform quando necessário (trim, toLowerCase, etc.)

### Segurança
- Sanitização de dados de entrada
- Rate limiting em endpoints sensíveis
- Logs de tentativas de acesso inválidas
- Headers de segurança com Helmet
- CORS configurado adequadamente

## CONVENÇÕES DE NOMENCLATURA
- Arquivos: kebab-case (user-controller.ts)
- Variáveis/funções: camelCase (getUserById)
- Classes/Interfaces: PascalCase (UserService, UserInterface)
- Constantes: UPPER_SNAKE_CASE (MAX_LOGIN_ATTEMPTS)
- Rotas: kebab-case (/api/users/profile)

## TRATAMENTO DE ERROS
- Classes de erro customizadas
- Status codes HTTP apropriados
- Mensagens de erro claras para o usuário
- Logs detalhados para debugging
- Não vazar informações sensíveis

## EXEMPLO DE ESTRUTURA DE RESPOSTA
```typescript
// Sucesso
{
  success: true,
  data: {...},
  message?: string
}

// Erro
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Mensagem amigável",
    details?: [...]
  }
}
```

## LOGS PADRÃO
```typescript
// Entrada de função
logger.info(`[${funcionName}] Iniciando operação`, { params })

// Query database
logger.debug(`[${funcionName}] Executando query`, { query })

// Erro
logger.error(`[${funcionName}] Erro na operação`, { error, context })

// Sucesso
logger.info(`[${funcionName}] Operação concluída`, { result })
```

## ARQUITETURA ESPECÍFICA DO PROJETO - PERSONAL EXPENSE HUB



### DESCOBERTA DINÂMICA DO BANCO
- SEMPRE usar @prisma/schema.prisma para verificar tabelas atuais
- NUNCA assumir estrutura de banco estática
- Analisar relacionamentos existentes antes de criar novos

### PADRÕES DE CONTROLLER ESTABELECIDOS
- Funções async/await com try/catch
- Validação: usuário logado → permissões → schema
- Response: { success, message, data, timestamp }
- Paginação: { page, limit, total, totalPages, hasNext, hasPrev }
- Soft delete: ativo: false
- Agregações para estatísticas

### PADRÕES DE ROTAS ESTABELECIDOS
- Sequência middlewares: requireAuth → requireOwner → validateSchema → controller
- Rota /info para documentação automática
- Validação separada: params, query, body
- Autenticação obrigatória (exceto login/register)

### VALIDAÇÃO ZOD ESPECÍFICA
- Mensagens em português brasileiro
- Telefone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
- Email: toLowerCase() + trim()
- Senhas: 8+ chars, maiúscula, minúscula, número, especial
- Transformações automáticas (string → number/boolean)

### SISTEMA DE AUTENTICAÇÃO
- JWT payload: { user_id, email, nome, eh_proprietario }
- requireAuth: extrai token do Authorization header
- requireOwner: verifica eh_proprietario
- bcrypt para hash de senhas
- Primeiro usuário = proprietário automático

### DESCOBERTA DINÂMICA DE ENDPOINTS
- SEMPRE usar @codebase ou @routes para descobrir endpoints existentes
- NUNCA assumir quantos endpoints existem
- Analisar estrutura atual antes de criar novos

## LIMPEZA PÓS-CORREÇÃO ⚠️ CRÍTICO
**APÓS CONFIRMAR QUE UM BUG FOI CORRIGIDO:**

1. **PROCURAR E REMOVER "LIXO":**
   - Código comentado de tentativas que não funcionaram
   - Console.log e logs de debug temporários
   - Variáveis não utilizadas
   - Imports desnecessários
   - Funções experimentais que não são mais usadas
   - Arquivos temporários criados para testes

2. **CHECKLIST DE LIMPEZA:**
   - [ ] Remover todos os console.log de debug
   - [ ] Apagar código comentado
   - [ ] Verificar imports não utilizados
   - [ ] Remover variáveis declaradas mas não usadas
   - [ ] Limpar funções experimentais
   - [ ] Verificar se todos os logs são realmente necessários
   - [ ] Confirmar que não há duplicação de código

3. **MANTER APENAS:**
   - Logs estratégicos permanentes (error, warn, info)
   - Código funcional e necessário
   - Comentários explicativos relevantes

## USO OBRIGATÓRIO DE CONTEXTO CURSOR

### COMANDOS OBRIGATÓRIOS ANTES DE CRIAR CÓDIGO
1. **@codebase** - Para análise geral do projeto
2. **@routes** - Para descobrir endpoints existentes  
3. **@controllers** - Para analisar padrões de controller
4. **@schemas** - Para verificar validações existentes
5. **@prisma/schema.prisma** - Para estrutura atual do banco
6. **@middleware** - Para verificar middlewares disponíveis

### FLUXO OBRIGATÓRIO
1. **DESCOBRIR PRIMEIRO:** Usar @codebase para entender o que já existe
2. **ANALISAR PADRÕES:** Verificar como implementações similares são feitas
3. **SEGUIR ESTRUTURA:** Manter consistência com código existente
4. **IMPLEMENTAR:** Criar código seguindo padrões descobertos
5. **LIMPAR:** Remover "lixo" após implementação

### NUNCA ASSUMIR - SEMPRE DESCOBRIR
- ❌ "Vou criar baseado no que imagino que existe"
- ✅ "Vou usar @codebase para ver como está implementado"
- ❌ "Provavelmente tem X endpoints"  
- ✅ "Vou verificar @routes para ver endpoints existentes"
- ❌ "Deve ter essas tabelas no banco"
- ✅ "Vou checar @prisma/schema.prisma para ver estrutura atual"

### PERGUNTAS OBRIGATÓRIAS ANTES DE IMPLEMENTAR
1. "O que já existe relacionado a isso no @codebase?"
2. "Como implementações similares são feitas em @controllers?"
3. "Que validações existem em @schemas?"
4. "Que middlewares estão disponíveis em @middleware?"
5. "Como está a estrutura atual em @prisma/schema.prisma?"

## DOCUMENTAÇÃO OBRIGATÓRIA

### ESTRUTURA DE DOCUMENTAÇÃO
```
docs/
├── README.md                 # Visão geral e setup inicial
├── ARCHITECTURE.md          # Arquitetura e padrões técnicos
├── API.md                   # Documentação de endpoints
├── DEVELOPMENT.md           # Guias para desenvolvimento
├── TROUBLESHOOTING.md       # Problemas conhecidos e soluções
├── DECISIONS.md             # Decisões arquiteturais e histórico
└── CURSOR_RULES.md          # Rules específicas do Cursor AI
```

### ANTES DE IMPLEMENTAR
- Verificar @docs para entender decisões anteriores
- Consultar @docs/README.md para contexto geral e setup
- Checar @docs/TROUBLESHOOTING.md para problemas conhecidos e soluções
- Usar @docs/ARCHITECTURE.md para entender padrões técnicos implementados
- Usar @docs/API.md para ver todos os 42 endpoints existentes
- Usar @docs/DECISIONS.md para entender o "porquê" das decisões arquiteturais
- Usar @docs/DEVELOPMENT.md para fluxo de desenvolvimento
- Usar @docs/CURSOR_RULES.md para rules específicas do Cursor AI

### APÓS IMPLEMENTAR ALGO NOVO
1. **ATUALIZAR DOCUMENTAÇÃO RELEVANTE:**
   - docs/API.md - Se criou/modificou endpoints
   - docs/ARCHITECTURE.md - Se mudou estrutura/padrões
   - docs/DECISIONS.md - Se tomou decisão arquitetural importante
   - docs/TROUBLESHOOTING.md - Se resolveu problema complexo

2. **FORMATO DE DOCUMENTAÇÃO:**
   ```markdown
   ## [Título da Funcionalidade]
   **Criado em:** [data]
   **Modificado em:** [data] 
   **Autor:** Cursor AI
   
   ### Problema Resolvido
   [Explicação clara do problema]
   
   ### Solução Implementada
   [Como foi resolvido]
   
   ### Arquivos Modificados
   - arquivo1.ts - [o que foi feito]
   - arquivo2.ts - [o que foi feito]
   
   ### Impactos
   [Que outras partes do sistema são afetadas]
   
   ### Testes Sugeridos
   [Como verificar se está funcionando]
   ```

### DOCUMENTAÇÃO COMO CONTEXTO
- Usar @docs/ARCHITECTURE.md para entender padrões técnicos implementados
- Usar @docs/API.md para ver todos os 42 endpoints mapeados
- Usar @docs/DECISIONS.md para entender decisões arquiteturais
- Usar @docs/TROUBLESHOOTING.md para evitar problemas conhecidos
- Usar @docs/DEVELOPMENT.md para fluxo de desenvolvimento com Cursor AI
- Usar @docs/CURSOR_RULES.md para rules específicas e padrões obrigatórios

## ANTES DE CRIAR CÓDIGO NOVO
1. **@codebase** - Analisar estrutura existente do Personal Expense Hub
2. **@routes** - Verificar se já existe funcionalidade similar
3. **@controllers @schemas** - Seguir padrões estabelecidos
4. **@middleware** - Usar middlewares existentes (requireAuth, requireOwner, validateSchema)
5. **@types** - Verificar interfaces disponíveis
6. **@utils** - Verificar utilitários disponíveis
7. **@docs** - Consultar documentação existente para contexto
8. Manter consistência com sistema de autenticação JWT descoberto
9. Seguir padrões de validação Zod encontrados
10. Respeitar arquitetura MVC e estrutura de pastas descoberta

## DIRETRIZES PARA FRONTEND

### INTEGRAÇÃO COM API
- **Sempre validar dados** antes de enviar para API
- **Usar tipos TypeScript** compatíveis com backend
- **Implementar loading states** para UX
- **Tratar erros da API** de forma amigável ao usuário
- **Cachear dados** quando apropriado para performance

### AUTENTICAÇÃO FRONTEND
- **Interceptadores** para adicionar token automaticamente
- **Refresh token** automático quando possível
- **Logout automático** em caso de token inválido
- **Proteção de rotas** privadas
- **Persistir estado** de autenticação de forma segura

### FORMULÁRIOS E VALIDAÇÃO
- **Validação client-side** usando mesmos schemas Zod do backend
- **Feedback visual** para erros de validação
- **Mensagens em português** consistentes com backend
- **Sanitização** de dados de entrada
- **Debounce** em campos de busca

### GERENCIAMENTO DE ESTADO
- **Estados globais** para dados compartilhados (user, auth)
- **Estados locais** para componentes específicos
- **Sincronização** com backend quando necessário
- **Otimistic updates** onde faz sentido

### UX/UI PADRÕES
- **Loading skeletons** em vez de spinners genéricos
- **Feedback visual** para ações (toast, alerts)
- **Confirmações** para ações destrutivas
- **Breadcrumbs** para navegação complexa
- **Responsive design** mobile-first

### PERFORMANCE FRONTEND
- **Lazy loading** de componentes pesados
- **Virtualization** para listas grandes
- **Memoização** de cálculos custosos
- **Code splitting** por rotas
- **Otimização de imagens** e assets

### TRATAMENTO DE ERROS FRONTEND
- **Boundary components** para capturar erros
- **Fallbacks** elegantes quando algo falha
- **Logs** de erros para debugging
- **Mensagens amigáveis** ao usuário
- **Retry mechanisms** quando apropriado

### TESTES FRONTEND
- **Testes unitários** para lógica de negócio
- **Testes de integração** com mocks da API
- **Testes de acessibilidade** básicos
- **Testes visuais** para componentes críticos

## VALIDAÇÃO FINAL OBRIGATÓRIA

### CHECKLIST ANTES DE ENTREGAR SOLUÇÃO
1. **FUNCIONALIDADE:** Testei se realmente funciona?
2. **CONSISTÊNCIA:** Segue padrões descobertos no @codebase?
3. **LOGS:** Adicionei logs estratégicos apropriados?
4. **VALIDAÇÃO:** Usei schemas Zod com mensagens em português?
5. **SEGURANÇA:** Apliquei middlewares de auth necessários?
6. **TIPOS:** TypeScript está tipado corretamente?
7. **LIMPEZA:** Removi todo código experimental/debug?
8. **DOCUMENTAÇÃO:** Atualizei documentação relevante em docs/?

### DOCUMENTAÇÃO AUTOMÁTICA
- Sempre explicar MUDANÇAS feitas no código existente
- Listar ARQUIVOS criados/modificados
- Destacar IMPACTOS em outras partes do sistema
- Sugerir TESTES que devem ser feitos
- **ATUALIZAR docs/ relevantes com nova implementação**

## TRATAMENTO DE CONFLITOS
- Se encontrar código inconsistente no @codebase, perguntar qual padrão seguir
- Se houver múltiplas implementações similares, escolher a mais recente/robusta
- Sempre explicar DECISÕES tomadas quando houver ambiguidade

## PERFORMANCE E OTIMIZAÇÃO
- Considerar ÍNDICES de banco para queries novas
- Avaliar necessidade de PAGINAÇÃO em listagens
- Verificar se precisa de CACHE para dados frequentes
- Usar SELECT específicos no Prisma (não buscar tudo)

## PRINCÍPIOS FUNDAMENTAIS
- Código limpo e legível
- Responsabilidade única  
- DRY (Don't Repeat Yourself)
- Fail fast - validar cedo
- Logs úteis para debugging (mas limpar depois)
- Segurança em primeiro lugar
- Performance consciente
- SEMPRE limpar "lixo" após correções
- SEMPRE usar contexto dinâmico (@codebase, @routes, etc.)
- SEMPRE manter documentação atualizada em docs/



- SEMPRE explicar problemas de forma didática