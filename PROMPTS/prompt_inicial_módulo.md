# 🔍 INVESTIGAÇÃO COMPLETA DE MÓDULO

**MÓDULO ALVO**: [Módulo de transações]

**IMPORTANTE**: Utilize o **MCP Sequential Thinking** para executar esta tarefa. Processe cada fase da investigação de forma sequencial e estruturada, documentando seu raciocínio e descobertas em cada etapa.

Preciso de uma investigação sistemática e completa sobre este módulo. Aplique toda a metodologia investigativa para mapear:

## 🎯 OBJETIVOS DA INVESTIGAÇÃO

1. **MAPEAMENTO COMPLETO**: Entender tudo sobre o módulo - arquitetura, funcionamento, dependências
2. **CONTEXTO OPERACIONAL**: Como se integra ao sistema maior
3. **PREPARAÇÃO PARA MODIFICAÇÃO**: Identificar pontos de atenção antes de alterar
4. **RISCOS E OPORTUNIDADES**: Problemas atuais e possíveis melhorias

## 📋 PROTOCOLO DE INVESTIGAÇÃO OBRIGATÓRIO

### FASE 1: RECONHECIMENTO GLOBAL (30%)
```bash
# Contexto geral do projeto
@codebase
@docs
@files

# Localização do módulo
find . -name "*[MÓDULO]*" -type f
find . -path "*[MÓDULO]*" -type f
grep -r "[MÓDULO]" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.json" | head -20
```

### FASE 2: ANÁLISE ESTRUTURAL (40%)
```bash
# Componentes do módulo
@[MÓDULO] @components @controllers @services @utils @types @schemas

# Padrões e estrutura
grep -r "import.*[MÓDULO]" --include="*.ts" --include="*.js" --include="*.tsx"
grep -r "export.*[MÓDULO]" --include="*.ts" --include="*.js" --include="*.tsx"
grep -r "class.*[MÓDULO]\|interface.*[MÓDULO]\|type.*[MÓDULO]" --include="*.ts"
grep -r "function.*[MÓDULO]\|const.*[MÓDULO]" --include="*.ts" --include="*.js"
```

### FASE 3: MAPEAMENTO DE RELACIONAMENTOS (30%)
```bash
# Dependências e impactos
grep -r "import.*from.*[MÓDULO]" --include="*.ts" --include="*.js" --include="*.tsx"
grep -r "[MÓDULO]" --include="*.test.*" --include="*.spec.*"
grep -r "route.*[MÓDULO]\|path.*[MÓDULO]" --include="*.ts" --include="*.js"
grep -r "api.*[MÓDULO]\|endpoint.*[MÓDULO]" --include="*.ts" --include="*.js"
```

## 🔎 ASPECTOS ESPECÍFICOS PARA INVESTIGAR

### BACKEND (se aplicável)
- **Rotas e Endpoints**: Quais APIs o módulo expõe?
- **Modelos de Dados**: Que estruturas/schemas utiliza?
- **Middleware**: Que validações/autenticações aplica?
- **Banco de Dados**: Que tabelas/coleções afeta?
- **Integração**: Que serviços externos consome/chama?

### FRONTEND (se aplicável)
- **Componentes**: Que telas/componentes implementa?
- **Estado**: Como gerencia state (Redux, Context, etc.)?
- **Roteamento**: Que rotas/navegação controla?
- **API**: Que endpoints backend consome?
- **UI/UX**: Que experiência oferece ao usuário?

### COMUM (Backend/Frontend)
- **Lógica de Negócio**: Que regras implementa?
- **Validações**: Que validações de dados possui?
- **Tratamento de Erros**: Como lida com falhas?
- **Performance**: Que otimizações/gargalos existem?
- **Segurança**: Que controles de acesso implementa?

## 📊 TEMPLATE DE ENTREGA OBRIGATÓRIO

### 🏗️ ARQUITETURA DO MÓDULO
- **Localização**: [Pastas e arquivos principais]
- **Estrutura**: [Organização interna dos arquivos]
- **Padrões**: [Convenções e patterns utilizados]
- **Tecnologias**: [Libs, frameworks, dependências específicas]

### 🔗 MAPEAMENTO DE DEPENDÊNCIAS
- **Dependências de Entrada**: [O que o módulo importa/usa]
- **Dependências de Saída**: [O que usa/depende do módulo]
- **Integração com Sistema**: [Como se conecta ao resto da aplicação]
- **APIs/Endpoints**: [Interfaces de comunicação]

### ⚙️ FUNCIONALIDADES MAPEADAS
- **Função Principal**: [O que o módulo faz]
- **Subfuncionalidades**: [Recursos específicos implementados]
- **Fluxos de Dados**: [Como dados entram, são processados e saem]
- **Casos de Uso**: [Cenários de utilização]

### 🧪 TESTES E QUALIDADE
- **Cobertura de Testes**: [Testes existentes encontrados]
- **Padrões de Qualidade**: [Code quality, linting, etc.]
- **Documentação**: [Docs, comentários, README]
- **TODO/FIXME**: [Pendências encontradas no código]

### ⚠️ ANÁLISE DE RISCOS
- **Problemas Identificados**: [Bugs, inconsistências, code smells]
- **Pontos de Atenção**: [Código complexo, acoplamento, performance]
- **Impactos de Modificação**: [O que pode quebrar se alterar]
- **Dependências Críticas**: [Módulos que não podem ser quebrados]

### 🚀 PREPARAÇÃO PARA MODIFICAÇÃO
- **Pontos de Entrada Seguros**: [Onde posso modificar com baixo risco]
- **Estratégias de Teste**: [Como validar mudanças]
- **Backups Necessários**: [O que preciso preservar]
- **Ordem de Implementação**: [Sequência recomendada de mudanças]

### 🔍 COMANDOS EXECUTADOS
```bash
[LISTAR TODOS OS COMANDOS @ E GREP UTILIZADOS]
```

### 📁 ARQUIVOS ANALISADOS
- [LISTA COMPLETA DOS ARQUIVOS INVESTIGADOS]

## 🎯 PERGUNTAS DIRECIONADORAS

Durante a investigação, responda:

1. **IDENTIDADE**: O que exatamente este módulo faz?
2. **RESPONSABILIDADES**: Quais são suas responsabilidades principais?
3. **INTERFACES**: Como outros módulos interagem com ele?
4. **DADOS**: Que dados manipula e como?
5. **DEPENDÊNCIAS**: De que depende e o que depende dele?
6. **ESTADO ATUAL**: Qual a qualidade e maturidade do código?
7. **RISCOS**: O que pode dar errado ao modificar?
8. **OPORTUNIDADES**: Que melhorias são possíveis?

## ✅ VALIDAÇÕES OBRIGATÓRIAS

Antes de concluir a investigação:
- [ ] Mapeei todos os arquivos relacionados ao módulo
- [ ] Identifiquei todas as dependências (entrada e saída)
- [ ] Entendi o fluxo principal de funcionamento
- [ ] Localizei testes existentes
- [ ] Mapeei pontos de integração com outros módulos
- [ ] Identifiquei possíveis problemas/riscos
- [ ] Preparei estratégia segura para modificação
- [ ] Documentei todos os comandos utilizados

## 🔄 ITERAÇÃO E APROFUNDAMENTO

Se necessário, execute investigações adicionais:
- **Investigação de Performance**: Gargalos e otimizações
- **Investigação de Segurança**: Vulnerabilidades e proteções
- **Investigação de Usabilidade**: Experiência do usuário
- **Investigação de Escalabilidade**: Capacidade de crescimento

---

**LEMBRE-SE**: Esta investigação deve me deixar 100% confiante para modificar o módulo. Não deixe pedras sem virar. Use todos os comandos @ necessários e grep extensivamente.

**AUTONOMIA TOTAL**: Você tem liberdade para executar quantos comandos @ e grep forem necessários para mapear completamente o módulo. Seja exaustivo na investigação.