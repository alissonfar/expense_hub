# Regras para o Assistente Cursor AI

Este documento estabelece as regras e o fluxo de trabalho obrigatórios para o desenvolvimento assistido por IA neste projeto. O objetivo é garantir que a IA atue como um "detetive" do código, maximizando a consistência e a qualidade.

## 🎯 Princípio Fundamental: Descobrir, Nunca Assumir

A IA **NUNCA** deve assumir a existência de código, padrões ou estruturas. A base de todo o trabalho deve ser a **descoberta dinâmica** do estado atual do projeto.

-   **MENTALIDADE ERRADA:** "Vou criar o que imagino que exista", "Acho que segue o padrão X".
-   **MENTALIDADE CORRETA:** "Vou usar os comandos de descoberta para entender COMO o código está implementado e SEGUIR os padrões existentes."

## 🔍 Fluxo de Investigação Obrigatório

Antes de escrever ou modificar qualquer linha de código, a IA **DEVE** seguir este fluxo para obter contexto completo:

1.  **`@codebase`**: Análise geral da arquitetura, estrutura de pastas e tecnologias.
2.  **`@routes`**: Mapear todos os endpoints existentes para entender a API.
3.  **`@controllers`**: Analisar implementações de controllers para aprender os padrões de lógica de negócio.
4.  **`@schemas`**: Verificar todas as validações Zod para entender as regras de dados.
5.  **`@prisma/schema.prisma`**: Estudar o schema para compreender a estrutura completa do banco de dados.
6.  **`@middleware`**: Descobrir os middlewares de segurança e validação disponíveis.
7.  **`@types`**: Verificar as interfaces e tipos TypeScript existentes para reutilização.
8.  **`@utils`**: Identificar utilitários e helpers já implementados.
9.  **`@docs`**: Consultar a documentação existente para entender o contexto e as decisões arquiteturais.

## ✅ Checklist de Validação Final da IA

Antes de apresentar qualquer solução como "concluída", a IA deve validar internamente os seguintes pontos:

1.  **[ ] Descoberta Completa:** A análise do código existente foi realizada?
2.  **[ ] Consistência com Padrões:** A solução segue os padrões descobertos no `@codebase` e nos `@controllers`?
3.  **[ ] Reutilização de Código:** Foram utilizados helpers de `@utils` e tipos de `@types` sempre que possível?
4.  **[ ] Validação Zod:** Novas validações seguem o padrão existente, com mensagens em português?
5.  **[ ] Segurança Aplicada:** Os middlewares de autenticação (`requireAuth`, `requireOwner`) foram aplicados corretamente nas novas rotas?
6.  **[ ] Tipagem Correta:** O código TypeScript está 100% tipado e sem erros?
7.  **[ ] Documentação Atualizada:** A IA sugeriu as atualizações necessárias nos arquivos de documentação (`API.md`, `ARCHITECTURE.md`, etc.)?

## 🧹 Limpeza Pós-Correção Crítica

A IA é responsável por garantir que o código entregue seja limpo. Isso inclui a **remoção obrigatória** de:

-   `console.log()` e outros logs de debug temporários.
-   Código comentado de tentativas anteriores.
-   Variáveis, funções e imports que não estão sendo utilizados.

A IA deve manter apenas logs estratégicos (como `console.error` em blocos `catch`) e comentários que agreguem valor real ao entendimento do código. 