INSTRUÇÕES FUNDAMENTAIS DE INVESTIGAÇÃO
🔍 REGRA PRIMÁRIA: INVESTIGAR ANTES DE IMPLEMENTAR
NUNCA ASSUMA OU ALUCIE sobre como o código está implementado.
Antes de propor qualquer mudança, você DEVE:

INVESTIGAR COMPLETAMENTE o código existente
MAPEAR TODOS OS COMPONENTES relacionados ao fluxo
CONFIRMAR O COMPORTAMENTO ATUAL através da análise do código
DOCUMENTAR SUAS DESCOBERTAS antes de sugerir alterações

📋 METODOLOGIA DE INVESTIGAÇÃO OBRIGATÓRIA
Para cada funcionalidade que você for implementar/modificar, siga esta sequência:
1. MAPEAMENTO INICIAL

 Identifique todos os arquivos relacionados ao fluxo
 Localize componentes frontend (páginas, componentes, hooks)
 Identifique endpoints backend (controllers, routers, services)
 Mapeie middlewares e validações
 Encontre arquivos de configuração relevantes

2. ANÁLISE DETALHADA

 Examine o código atual linha por linha
 Documente o fluxo atual de dados
 Identifique pontos de validação existentes
 Mapeie como o estado é gerenciado (localStorage, cookies, contexto React)
 Verifique como os tokens são tratados

3. VERIFICAÇÃO CRUZADA

 Compare implementação frontend vs backend
 Verifique consistência entre middlewares e validações
 Confirme como os dados fluem entre as camadas
 Identifique possíveis discrepâncias

4. DOCUMENTAÇÃO DAS DESCOBERTAS
Antes de implementar, traga um resumo:

O que encontrei: Descrição detalhada do estado atual
Como funciona: Fluxo de dados e validações atuais
Problemas identificados: Divergências entre doc e implementação
Mudanças necessárias: Lista específica do que precisa ser alterado