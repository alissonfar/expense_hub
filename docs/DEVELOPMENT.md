# Guia de Desenvolvimento

Este guia fornece diretrizes e padrões para o desenvolvimento de novas funcionalidades e manutenção do código no Personal Expense Hub.

## 1. Fluxo de Trabalho com Cursor AI

Para garantir a consistência e a qualidade, o desenvolvimento assistido por IA deve seguir um fluxo investigativo rigoroso. A regra principal é: **SEMPRE DESCOBRIR, NUNCA ASSUMIR**.

### Metodologia de Descoberta Dinâmica

Antes de escrever qualquer linha de código, utilize os seguintes comandos para investigar o estado atual do projeto:

1.  **`@codebase`**: Análise geral da arquitetura, estrutura de pastas e padrões.
2.  **`@routes`**: Mapeamento de todos os endpoints existentes na API.
3.  **`@controllers`**: Análise das implementações atuais nos controllers.
4.  **`@schemas`**: Verificação dos schemas de validação Zod existentes.
5.  **`@prisma/schema.prisma`**: Entendimento completo do modelo de dados.
6.  **`@middleware`**: Descoberta de middlewares de autenticação e validação.
7.  **`@types`**: Verificação de tipos e interfaces TypeScript disponíveis.
8.  **`@utils`**: Identificação de funções utilitárias que podem ser reutilizadas.

## 2. Padrões de Implementação

### Padrões de Controller

-   **Responsabilidade Única:** Cada função do controller deve lidar com uma única ação (ex: `listar`, `criar`, `atualizar`).
-   **Tratamento de Erros:** Use blocos `try...catch` para capturar exceções e retornar respostas de erro padronizadas.
-   **Validação de Entrada:** A validação deve ser feita no nível do middleware (`validateSchema`), não no controller.
-   **Lógica de Negócio:** Mantenha a lógica de negócio complexa nos controllers, mas considere mover para serviços dedicados se a complexidade aumentar.

### Configurações Zod (`/backend/schemas`)

-   **Schemas por Recurso:** Crie arquivos de schema separados por recurso (ex: `pessoa.ts`, `transacao.ts`).
-   **Mensagens Claras:** Sempre forneça mensagens de erro em português para os campos.
-   **Coerção de Tipos:** Use `z.coerce.number()` ou `z.coerce.date()` quando receber dados de `req.query` ou `req.params`, que são sempre strings.

**Exemplo de Schema Zod:**

```typescript
// backend/schemas/tag.ts
import { z } from 'zod';

export const createTagSchema = z.object({
  nome: z.string({ required_error: 'Nome da tag é obrigatório' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal').optional(),
  icone: z.string().max(10, 'Ícone pode ter no máximo 10 caracteres').optional(),
});
```

### Logs Estratégicos

-   **`console.log` para Debug:** Use `console.log` livremente durante o desenvolvimento, mas **remova-os antes de commitar**.
-   **`console.error` para Erros:** Use `console.error` dentro dos blocos `catch` nos controllers para registrar exceções no servidor.
-   **Logs Permanentes:** Para logs estratégicos que devem permanecer em produção, use um logger mais robusto (implementação futura).

## 3. Checklist de Qualidade

### Limpeza Pós-Correção (Obrigatório)

Após resolver um bug ou implementar uma funcionalidade, é **crítico** realizar uma limpeza:

-   [ ] Remover todos os `console.log` de debug.
-   [ ] Apagar código comentado de tentativas anteriores.
-   [ ] Verificar e remover variáveis ou imports não utilizados.
-   [ ] Garantir que não há duplicação de código.

### Validação Final (Obrigatório)

Antes de considerar uma tarefa concluída, verifique os seguintes pontos:

1.  **[ ] Descoberta:** O código existente foi completamente analisado?
2.  **[ ] Funcionalidade:** A implementação foi testada e funciona como esperado?
3.  **[ ] Consistência:** Os padrões de arquitetura e código do projeto foram seguidos?
4.  **[ ] Validação:** Os dados de entrada são validados com Zod e mensagens em português?
5.  **[ ] Segurança:** Os middlewares de autenticação (`requireAuth`, `requireOwner`) foram aplicados corretamente?
6.  **[ ] Tipagem:** O código TypeScript está corretamente tipado e sem erros?
7.  **[ ] Limpeza:** Todo o código de debug foi removido?
8.  **[ ] Documentação:** A documentação relevante (`API.md`, `ARCHITECTURE.md`) foi atualizada?

## 4. Padrões de Desenvolvimento Frontend

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