# Guia de Desenvolvimento - Personal Expense Hub

Este documento fornece diretrizes, padrões e checklists para garantir um desenvolvimento consistente, seguro e de alta qualidade.

## 1. Fluxo de Desenvolvimento com Cursor AI

Adotamos o protocolo **"Discovery First" (Descobrir Primeiro)**. Nenhuma linha de código deve ser escrita sem antes entender o contexto existente.

### A Mentalidade Correta:
- **NÃO:** "Vou criar o endpoint `getSaldos` como imagino que seja."
- **SIM:** "Vou usar `@routes` para ver se um endpoint de saldos já existe. Vou usar `@controllers` para entender como os controllers de relatório são implementados. Vou usar `@schemas` para ver as validações de relatório existentes."

### Comandos de Descoberta Obrigatórios:
Use estes comandos para investigar o codebase ANTES de codificar:

1.  `@codebase`: Análise geral da arquitetura e estrutura.
2.  `@routes`: Mapear todos os endpoints existentes e seus padrões.
3.  `@controllers`: Analisar implementações e padrões de lógica de negócio.
4.  `@schemas`: Verificar todas as validações Zod e seus formatos.
5.  `@prisma/schema.prisma`: Entender a estrutura completa do banco de dados.
6.  `@middleware`: Descobrir middlewares disponíveis (auth, RLS, etc).
7.  `@types`: Verificar interfaces e tipos definidos.
8.  `@utils`: Identificar helpers e utilitários reutilizáveis.

## 2. Padrões de Código Backend

### Padrões de Controller
Os controllers, localizados em `backend/controllers/`, são o coração da lógica de negócio.

-   **Nomenclatura:** As funções seguem o padrão `verboAcaoRecurso` (ex: `listMembros`, `createTag`, `getTransacao`).
-   **Assincronicidade:** Todas as funções de controller são `async` e retornam `Promise<void>`.
-   **Acesso ao Prisma:** O Prisma Client seguro e com RLS **deve** ser acessado através de `req.prisma`. Ele já é injetado pelo middleware `injectPrismaClient`. Não instancie um novo `PrismaClient` dentro de um controller.
    ```typescript
    // Certo ✅
    export const listTags = async (req: Request, res: Response): Promise<void> => {
      const tags = await req.prisma.tags.findMany(...);
      // ...
    }

    // Errado ❌
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient(); // Isto ignora o RLS!
    ```
-   **Tratamento de Erros:** Use blocos `try...catch` para capturar exceções. Logue o erro e envie uma resposta padronizada.
-   **Tipagem:** Use os tipos dos schemas Zod para tipar o `body`, `query` e `params` da requisição para ter autocomplete e segurança de tipos.

### Padrões de Validação com Zod
Os schemas de validação estão em `backend/schemas/`.

-   **Mensagens em Português:** Todos os erros de validação devem ter mensagens claras em português.
    ```typescript
    z.string({ required_error: "O nome é obrigatório." })
     .min(3, { message: "O nome deve ter pelo menos 3 caracteres." })
    ```
-   **Coerção de Tipos:** Para `query` e `params`, onde tudo é string, use `z.coerce` para converter tipos automaticamente.
    ```typescript
    const listQuerySchema = z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      ativo: z.coerce.boolean().optional(),
    });
    ```
-   **Reutilização:** Exporte tanto o schema (`minhaSchema`) quanto o tipo inferido (`MinhaSchemaInput`) para ser usado nos controllers.

### Logs Estratégicos
Use o logger Winston configurado em `utils/logger.ts` para registrar eventos importantes.

-   **Obtenha uma instância do logger:**
    ```typescript
    import { getLogger } from '../utils/logger';
    const logger = getLogger('meu-modulo'); // ex: 'pagamentoController'
    ```
-   **Níveis de Log:**
    -   `logger.error(message, errorObject)`: Para erros capturados em blocos `catch`.
    -   `logger.warn(message)`: Para situações inesperadas, mas que não quebram a aplicação.
    -   `logger.info(message)`: Para eventos importantes do fluxo (ex: "Pagamento composto X processado com sucesso").
    -   `logger.debug(message)`: Para informações detalhadas úteis apenas em desenvolvimento.

## 3. Checklist de Limpeza Pós-Correção
Após confirmar que um bug foi corrigido ou uma feature foi implementada:

-   [ ] **Remover `console.log`:** Substitua todos os `console.log` de debug por `logger.debug()` ou remova-os completamente.
-   [ ] **Apagar Código Comentado:** Delete linhas de código que foram comentadas durante o desenvolvimento.
-   [ ] **Verificar Imports:** Remova quaisquer imports que não estão sendo utilizados.
-   [ ] **Remover Variáveis Não Usadas:** Verifique se há variáveis declaradas que nunca são lidas.
-   [ ] **Consistência de Nomenclatura:** Garanta que novas funções e variáveis seguem os padrões do projeto.

## 4. Checklist de Validação Final
Antes de considerar uma tarefa concluída:

-   [ ] **Descoberta:** O código foi desenvolvido com base na análise do codebase existente?
-   [ ] **Funcionalidade:** A nova feature ou correção foi testada manualmente e funciona como esperado?
-   [ ] **Consistência:** A implementação segue os padrões de arquitetura e código descritos neste documento?
-   [ ] **Segurança:**
    -   Os middlewares de autenticação (`requireAuth`) e RLS (`injectPrismaClient`) foram aplicados nas rotas?
    -   O controle de acesso por papel (`requireHubRole`) foi usado onde necessário?
-   [ ] **Validação:** Todos os dados de entrada (body, params, query) são validados com um schema Zod?
-   [ ] **Tipagem:** O código está totalmente tipado e sem erros do TypeScript?
-   [ ] **Logs:** Logs estratégicos (`info`, `warn`, `error`) foram adicionados em pontos críticos?
-   [ ] **Limpeza:** O checklist de limpeza foi seguido?
-   [ ] **Documentação:** A documentação relevante (`API.md`, `ARCHITECTURE.md`, etc.) foi atualizada para refletir as mudanças?

## 5. Padrões de Desenvolvimento Frontend

### Hooks Customizados de Dados

-   **Padrão:** Para buscar dados da API, utilize ou crie hooks customizados em `frontend/hooks/`.
-   **Estrutura do Hook:** Um hook de dados deve encapsular a lógica de `fetch`, `loading`, `error` e o estado dos dados. Ele deve retornar esses estados para que o componente possa reagir a eles.
-   **Exemplo (`useTransacoes.ts`):** Este hook não só busca os dados, mas também implementa cache em memória e debounce para otimizar as chamadas à API.

### Componentes

-   **Reutilização:** Crie componentes genéricos sempre que possível e coloque-os em `frontend/components/common`.
-   **Componentes de UI vs. Lógica:** Mantenha os componentes do `components/ui` puros e focados na aparência. Componentes em `components/common` ou `components/forms` podem conter mais lógica de aplicação.
-   **Estado de Carregamento (Loading):** Use o componente `Skeleton` de `components/ui/skeleton.tsx` para indicar o carregamento de dados e melhorar a experiência do usuário (UX).

### Validação de Formulários

-   **Client-Side e Server-Side:** A validação deve existir em ambos os lados.
-   **Zod + React Hook Form:** Use schemas Zod para definir as regras de validação. Passe o schema para o `useForm` do React Hook Form através do `@hookform/resolvers/zod` para obter validação em tempo real no cliente.

```typescript
// Exemplo de uso em um componente de formulário
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  // ...
});

type FormData = z.infer<typeof formSchema>;

const MyForm = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { ... },
  });

  // ...
}
```

### Tratamento de Dados Mockados

-   **Desenvolvimento Inicial:** É aceitável usar dados mockados (de `lib/constants.ts`) durante o desenvolvimento inicial de uma UI.
-   **Integração Final:** Antes de finalizar uma funcionalidade, os dados mockados **devem ser substituídos** pela integração real com os hooks de dados que consomem a API. A página do Dashboard é um exemplo que ainda está em transição, usando `useDashboardFallback`. 