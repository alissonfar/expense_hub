# Regras para o Assistente Cursor AI (v2)

Este documento dita o comportamento obrigatório da IA neste projeto. O objetivo é garantir que a IA atue como uma extensão inteligente da equipe, respeitando a arquitetura e os padrões existentes.

## 1. O Protocolo "Discovery First"

**Princípio Não-Negociável:** NUNCA implemente com base em suposições. SEMPRE investigue o estado atual do código antes de agir.

A IA deve usar a documentação e os comandos de descoberta para responder a estas perguntas **antes de escrever código**:
1.  "O que já existe relacionado a isto?" (`@docs`, `@codebase`)
2.  "Como implementações similares são feitas?" (`@controllers`, `@routes`)
3.  "Quais são as regras de dados e segurança?" (`@schemas`, `@middleware`)

## 2. A Fonte da Verdade é a Documentação

A IA deve tratar os seguintes arquivos como a fonte da verdade para o projeto. As respostas e implementações devem ser consistentes com o que está documentado aqui:

-   **Visão Geral e Setup:** `docs/README.md`
-   **Arquitetura e Padrões:** `docs/ARCHITECTURE.md`
-   **Endpoints da API:** `docs/API.md`
-   **Fluxo de Desenvolvimento:** `docs/DEVELOPMENT.md`
-   **Decisões Históricas:** `docs/DECISIONS.md`
-   **Solução de Problemas:** `docs/TROUBLESHOOTING.md`

## 3. Comandos de Descoberta

Quando a documentação não for suficiente, use os seguintes comandos para investigar o código diretamente:

| Comando | Propósito |
|---|---|
| `@codebase` | Entender a arquitetura geral, estrutura, padrões. |
| `@routes` | Mapear todos os endpoints e suas configurações. |
| `@controllers` | Estudar implementações atuais e lógica de negócio. |
| `@schemas` | Entender os padrões de validação de dados com Zod. |
| `@prisma/schema.prisma` | Ver a estrutura completa e atual do banco de dados. |
| `@middleware` | Descobrir proteções (`requireAuth`) e injetores (`injectPrismaClient`). |

## 4. Checklist de Validação Final

Antes de finalizar qualquer tarefa, a IA deve garantir que a solução:

-   [ ] **É Consistente:** Segue os padrões do `ARCHITECTURE.md` e `DEVELOPMENT.md`.
-   [ ] **É Segura:** Aplica corretamente os middlewares de `requireAuth` e `injectPrismaClient`. Usa o RBAC (`requireHubRole`) quando necessário.
-   [ ] **É Validada:** Utiliza schemas Zod para todos os dados de entrada.
-   [ ] **É Tipada:** Não contém erros de TypeScript.
-   [ ] **É Limpa:** Não possui `console.log` de debug, código comentado ou imports não utilizados.
-   [ ] **É Documentada:** As mudanças estão refletidas (ou foi sugerida a atualização) na documentação relevante (`API.md`, etc.).

## 5. Limpeza de Código é Obrigatória

Qualquer código gerado pela IA deve ser limpo e pronto para produção. É **obrigatória a remoção** de qualquer artefato de desenvolvimento, como logs de debug e código comentado, antes de finalizar uma resposta. 