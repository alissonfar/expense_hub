# PASSO-01: ANALISADOR COMPLETO DE CONTEXTO

**🎯 OBJETIVO**: Mapear completamente o contexto do projeto/módulo alvo para criar a base de conhecimento necessária para todas as ações posteriores.

**📋 ENTRADA OBRIGATÓRIA**: 
- Nome do projeto/módulo: `[PROJETO COMPLETO]`
- Tipo de análise: `[PROJETO_COMPLETO | MÓDULO_ESPECÍFICO | FUNCIONALIDADE]`

---

## 🔧 CONFIGURAÇÃO INICIAL

**IMPORTANTE**: Utilize o **MCP Sequential Thinking** para executar esta tarefa. Processe cada fase sequencialmente, documentando descobertas em cada etapa.

### Contexto Alvo:
```
PROJETO/MÓDULO: [INSERIR_NOME_AQUI]
TIPO: [Frontend | Backend | Fullstack | Mobile | Desktop]
TECNOLOGIA PRINCIPAL: [React | Node.js | Python | etc.]
```

---

## 🔍 FASE 1: RECONHECIMENTO GLOBAL (30%)

### 1.1 Mapeamento Inicial do Projeto
```bash
@codebase
@docs
@files
@package.json

# Estrutura geral
find . -type f -name "*.json" | head -10
find . -type f -name "README*" 
find . -type f -name "*.md" | grep -i doc
```

### 1.2 Localização do Módulo Alvo
```bash
# Busca direta pelo nome
find . -name "*[MÓDULO]*" -type f
find . -path "*[MÓDULO]*" -type f

# Busca por referências
grep -r "[MÓDULO]" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.json" . | head -20
```

### 1.3 Tecnologias e Dependências
```bash
@package.json @requirements.txt @pom.xml @Gemfile @composer.json

# Análise de dependências principais
grep -r "import\|require\|from" --include="*.ts" --include="*.js" . | grep "[MÓDULO]" | head -10
```

---

## 🏗️ FASE 2: ANÁLISE ESTRUTURAL PROFUNDA (40%)

### 2.1 Arquitetura de Arquivos
```bash
@[MÓDULO] @components @controllers @services @utils @types @schemas @models @routes

# Mapeamento de estrutura
tree -I 'node_modules|dist|build' -L 3
ls -la | grep -i [MÓDULO]
```

### 2.2 Padrões de Código
```bash
# Classes, interfaces e tipos
grep -r "class.*[MÓDULO]\|interface.*[MÓDULO]\|type.*[MÓDULO]" --include="*.ts" --include="*.tsx" .

# Funções e constantes
grep -r "function.*[MÓDULO]\|const.*[MÓDULO]\|export.*[MÓDULO]" --include="*.ts" --include="*.js" .

# Imports e exports
grep -r "export.*from\|import.*from" --include="*.ts" --include="*.js" . | grep -i [MÓDULO]
```

### 2.3 Estruturas de Dados
```bash
# Schemas e modelos
grep -r "schema\|model\|interface\|type" --include="*.ts" --include="*.js" . | grep -i [MÓDULO]

# Validações
grep -r "validate\|validation\|joi\|yup\|zod" --include="*.ts" --include="*.js" . | grep -i [MÓDULO]
```

---

## 🔗 FASE 3: MAPEAMENTO DE RELACIONAMENTOS (30%)

### 3.1 Dependências e Integrações
```bash
# Quem usa o módulo
grep -r "import.*[MÓDULO]\|require.*[MÓDULO]" --include="*.ts" --include="*.js" --include="*.tsx" .

# APIs e endpoints
grep -r "api\|endpoint\|route\|url" --include="*.ts" --include="*.js" . | grep -i [MÓDULO]

# Banco de dados
grep -r "database\|db\|collection\|table\|query" --include="*.ts" --include="*.js" . | grep -i [MÓDULO]
```

### 3.2 Testes e Qualidade
```bash
# Testes existentes
find . -name "*test*" -o -name "*spec*" | grep -i [MÓDULO]
grep -r "test\|spec\|describe\|it\|expect" --include="*.test.*" --include="*.spec.*" . | grep -i [MÓDULO]

# Documentação
find . -name "*.md" -exec grep -l "[MÓDULO]" {} \;
```

### 3.3 Configurações e Ambiente
```bash
# Configs relacionadas
grep -r "config\|env\|setting" --include="*.json" --include="*.js" --include="*.env*" . | grep -i [MÓDULO]

# Scripts e automação
grep -r "script\|npm\|yarn\|build\|deploy" --include="*.json" --include="*.js" . | grep -i [MÓDULO]
```

---

## 📊 ANÁLISE OBRIGATÓRIA PARA PASSO-02

### 🏗️ ARQUITETURA IDENTIFICADA
- **Localização**: [Listar pastas e arquivos principais encontrados]
- **Estrutura**: [Descrever organização dos arquivos]
- **Padrões**: [Identificar patterns, convenções, frameworks]
- **Tecnologias**: [Listar deps, libs, ferramentas específicas]

### 🔗 MAPA DE DEPENDÊNCIAS
- **Entrada** (o que o módulo consome): [APIs, serviços, bibliotecas]
- **Saída** (o que o módulo oferece): [Endpoints, componentes, funções]
- **Integrações**: [Conexões com outros módulos/sistemas]
- **Dados**: [Estruturas, schemas, modelos utilizados]

### ⚙️ FUNCIONALIDADES MAPEADAS
- **Função Principal**: [O que o módulo/projeto faz]
- **Subfuncionalidades**: [Recursos específicos identificados]
- **Fluxos Críticos**: [Principais jornadas de dados/usuário]
- **Pontos de Entrada**: [Como usuários/sistemas acessam]

### 🧪 QUALIDADE E MATURIDADE
- **Testes**: [Cobertura e tipos de teste encontrados]
- **Documentação**: [Nível de documentação existente]
- **Padrões de Código**: [Qualidade, linting, formatação]
- **TODOs/FIXMEs**: [Pendências identificadas]

### ⚠️ RISCOS E ALERTAS
- **Problemas Identificados**: [Bugs aparentes, inconsistências]
- **Código Complexo**: [Partes que precisam atenção especial]
- **Dependências Críticas**: [O que não pode ser quebrado]
- **Pontos Frágeis**: [Onde mudanças podem causar problemas]

### 🔧 PREPARAÇÃO PARA PRÓXIMOS PASSOS
- **Pontos Seguros para Modificação**: [Onde posso trabalhar com baixo risco]
- **Estratégias de Validação**: [Como testar mudanças]
- **Ordem de Prioridade**: [Sequência recomendada de ações]
- **Recursos Necessários**: [O que preciso para trabalhar]

---

## 📝 SAÍDA PADRONIZADA PARA PASSO-02

### COMANDOS EXECUTADOS:
```bash
# [LISTAR TODOS OS COMANDOS @ E GREP UTILIZADOS]
```

### ARQUIVOS ANALISADOS:
```
- [LISTA COMPLETA DOS ARQUIVOS INVESTIGADOS]
```

### RESUMO EXECUTIVO:
```
PROJETO: [Nome]
TIPO: [Tipo]
ESTADO: [Maduro | Em Desenvolvimento | Legacy | Etc.]
COMPLEXIDADE: [Baixa | Média | Alta]
QUALIDADE: [Boa | Média | Precisa Melhorar]
```

---

## ✅ VALIDAÇÕES OBRIGATÓRIAS

Antes de passar para o PASSO-02:
- [ ] Mapeei estrutura completa do projeto/módulo
- [ ] Identifiquei todas as dependências de entrada e saída
- [ ] Entendi fluxo principal de funcionamento
- [ ] Localizei testes e documentação existentes
- [ ] Mapeei integrações com outros sistemas/módulos
- [ ] Identifiquei problemas e riscos potenciais
- [ ] Preparei base para documentação estruturada
- [ ] Registrei todos os comandos executados

---

## 🔄 CONEXÃO COM PASSO-02

**SAÍDA DESTE PASSO**: Análise completa e dados brutos mapeados
**ENTRADA DO PASSO-02**: Esta análise será transformada em documentação estruturada e organizada para consulta permanente

**ARQUIVO DE SAÍDA**: `01-contexto-inicial/saidas/expense-hub/analise-completa.md`

---

**⚡ AUTONOMIA TOTAL**: Execute quantos comandos @ e grep forem necessários. Seja exaustivo - esta análise é a base de tudo que vem depois!