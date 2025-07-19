# PASSO-02: GERADOR DE DOCUMENTAÇÃO ESTRUTURADA

**🎯 OBJETIVO**: Transformar a análise bruta do PASSO-01 em documentação estruturada, organizada e consultável para uso permanente em todos os próximos passos.

**📋 ENTRADA OBRIGATÓRIA**: 
- Arquivo de análise do PASSO-01: `01-contexto-inicial/saidas/{nome-projeto}/analise-completa.md`
- Nome do projeto: `[MESMO_NOME_DO_PASSO_01]`

---

## 🔧 CONFIGURAÇÃO INICIAL

**IMPORTANTE**: Utilize o **MCP Sequential Thinking** para organizar e estruturar as informações de forma lógica e hierárquica.

### Dados de Entrada:
```
PROJETO: [NOME_DO_PROJETO]
ANÁLISE FONTE: [CAMINHO_DO_ARQUIVO_PASSO_01]
DATA ANÁLISE: [DATA_ATUAL]
VERSÃO DOC: 1.0
```

---

## 📋 PROCESSO DE DOCUMENTAÇÃO

### ETAPA 1: LEITURA E ORGANIZAÇÃO DA ANÁLISE
1. **Ler** completamente o arquivo de análise do PASSO-01
2. **Categorizar** informações por tipo e relevância
3. **Priorizar** dados críticos para consulta rápida
4. **Estruturar** em seções lógicas e navegáveis

### ETAPA 2: CRIAÇÃO DA DOCUMENTAÇÃO MESTRA
1. **Resumo Executivo**: Visão geral em 1 página
2. **Mapa Técnico**: Estrutura técnica detalhada
3. **Guia de Referência**: Informações para consulta rápida
4. **Alertas e Recomendações**: Pontos críticos destacados

### ETAPA 3: PREPARAÇÃO PARA PRÓXIMOS PASSOS
1. **Base de Contexto**: Informações para PASSO-03
2. **Pontos de Atenção**: Alertas para modificações
3. **Recursos Disponíveis**: O que já existe e pode ser usado
4. **Lacunas Identificadas**: O que precisa ser complementado

---

## 📖 TEMPLATE DE DOCUMENTAÇÃO FINAL

### 🏠 ÍNDICE RÁPIDO
- [Resumo Executivo](#resumo-executivo)
- [Mapa Técnico](#mapa-tecnico)
- [Dependências e Integrações](#dependencias)
- [Funcionalidades Mapeadas](#funcionalidades)
- [Qualidade e Testes](#qualidade)
- [Riscos e Alertas](#riscos)
- [Guia para Próximos Passos](#proximos-passos)
- [Referência Técnica](#referencia)

---

## 📋 RESUMO EXECUTIVO

### 🎯 Visão Geral
**Nome**: [Nome do Projeto/Módulo]
**Tipo**: [Frontend/Backend/Fullstack/etc.]
**Tecnologia Principal**: [React/Node.js/Python/etc.]
**Estado Atual**: [Maduro/Em Desenvolvimento/Legacy]
**Complexidade**: [Baixa/Média/Alta]
**Qualidade Geral**: [Boa/Média/Precisa Melhorar]

### 🎪 O Que Faz
[Descrição clara e concisa da função principal em 2-3 parágrafas]

### 📊 Métricas Rápidas
- **Arquivos Analisados**: [Número]
- **Dependências Mapeadas**: [Número]
- **Integrações Identificadas**: [Número]
- **Testes Encontrados**: [Sim/Não/Parcial]
- **Documentação Existente**: [Boa/Média/Inexistente]

### ⚡ Status Atual
- ✅ **Pontos Fortes**: [Listar 3-5 pontos fortes]
- ⚠️ **Pontos de Atenção**: [Listar 3-5 pontos que precisam atenção]
- 🚫 **Problemas Críticos**: [Listar problemas graves encontrados]

---

## 🗺️ MAPA TÉCNICO

### 🏗️ Arquitetura Geral
```
📁 Estrutura de Pastas:
[Representação visual da estrutura de pastas principais]

🔗 Fluxo de Dados:
[Diagrama textual do fluxo principal de dados]

🔌 Pontos de Integração:
[Mapa das integrações com outros sistemas]
```

### 🧩 Componentes Principais
| Componente | Localização | Função | Estado |
|------------|-------------|--------|--------|
| [Nome] | [Caminho] | [Função] | [OK/Atenção/Problema] |
| ... | ... | ... | ... |

### 🛠️ Tecnologias Utilizadas
| Categoria | Tecnologia | Versão | Uso |
|-----------|------------|--------|-----|
| Framework | [Nome] | [Versão] | [Principal/Secundário] |
| Biblioteca | [Nome] | [Versão] | [Específico] |
| ... | ... | ... | ... |

---

## 🔗 DEPENDÊNCIAS E INTEGRAÇÕES

### 📥 DEPENDÊNCIAS DE ENTRADA (O que consome)
| Tipo | Fonte | Descrição | Criticidade |
|------|-------|-----------|-------------|
| API | [Nome] | [O que faz] | [Alta/Média/Baixa] |
| Serviço | [Nome] | [Função] | [Crítica/Não-crítica] |
| ... | ... | ... | ... |

### 📤 DEPENDÊNCIAS DE SAÍDA (O que oferece)
| Tipo | Destino | Descrição | Impacto |
|------|---------|-----------|---------|
| Endpoint | [Quem usa] | [O que fornece] | [Alto/Médio/Baixo] |
| Componente | [Onde usado] | [Função] | [Crítico/Não-crítico] |
| ... | ... | ... | ... |

### 🌐 INTEGRAÇÕES EXTERNAS
- **APIs Externas**: [Listar APIs de terceiros usadas]
- **Serviços Cloud**: [AWS, Azure, GCP, etc.]
- **Bancos de Dados**: [Tipos e conexões]
- **Sistemas Legados**: [Integrações com sistemas antigos]

---

## ⚙️ FUNCIONALIDADES MAPEADAS

### 🎯 Funcionalidade Principal
**Nome**: [Nome da função principal]
**Descrição**: [O que faz detalhadamente]
**Fluxo**: [Como funciona passo a passo]
**Entradas**: [O que recebe]
**Saídas**: [O que produz]

### 🔧 Subfuncionalidades
| Funcionalidade | Descrição | Localização | Estado |
|----------------|-----------|-------------|--------|
| [Nome] | [O que faz] | [Onde está] | [Funcionando/Com problema] |
| ... | ... | ... | ... |

### 📊 Casos de Uso Identificados
1. **[Nome do Caso de Uso]**
   - **Ator**: [Quem usa]
   - **Cenário**: [Como usa]
   - **Resultado**: [O que obtém]

---

## 🧪 QUALIDADE 


### 📏 Padrões de Qualidade
- **Linting**: [ESLint/Prettier/etc.] - [Configurado/Não]
- **Formatação**: [Padrão identificado]
- **Comentários**: [Boa/Média/Inexistente]
- **Documentação de Código**: [Nível encontrado]

### 📝 Documentação Existente
- **README**: [Existe/Não] - [Qualidade]
- **API Docs**: [Existe/Não] - [Atualizada/Desatualizada]
- **Comentários no Código**: [Suficientes/Insuficientes]
- **Documentação Técnica**: [Nível de detalhamento]

---

## ⚠️ RISCOS E ALERTAS

### 🚨 PROBLEMAS CRÍTICOS
1. **[Problema 1]**
   - **Descrição**: [O que é o problema]
   - **Impacto**: [O que pode acontecer]
   - **Localização**: [Onde está]
   - **Prioridade**: [Alta/Média/Baixa]

### ⚡ PONTOS DE ATENÇÃO
- **Código Complexo**: [Onde e por quê]
- **Dependências Frágeis**: [Quais e riscos]
- **Performance**: [Gargalos identificados]
- **Segurança**: [Vulnerabilidades potenciais]

### 🔧 DÉBITO TÉCNICO
- **TODOs**: [Lista de TODOs encontrados]
- **FIXMEs**: [Lista de FIXMEs encontrados]
- **Code Smells**: [Padrões problemáticos identificados]
- **Refatoração Necessária**: [O que precisa ser melhorado]

---

## 🚀 GUIA PARA PRÓXIMOS PASSOS

### ✅ PONTOS SEGUROS PARA MODIFICAÇÃO
1. **[Local/Componente]**
   - **Por que é seguro**: [Justificativa]
   - **Tipo de mudança recomendada**: [Add/Modify/Remove]
   - **Impacto esperado**: [Baixo/Médio/Alto]

### 🧪 ESTRATÉGIAS DE VALIDAÇÃO
- **Testes Obrigatórios**: [Quais testes executar sempre]
- **Pontos de Verificação**: [O que checar após mudanças]
- **Rollback**: [Como desfazer mudanças se necessário]
- **Monitoramento**: [O que observar em produção]

### 📋 PREPARAÇÃO PARA PASSO-03
**Contexto Disponível**: Esta documentação serve como base completa
**Tipos de Ação Suportados**:
- ✅ Correção de Bugs (dados suficientes)
- ✅ Refatoração (mapa completo)
- ✅ Nova Feature (arquitetura mapeada)
- ✅ Otimização (gargalos identificados)

### 🎯 RECOMENDAÇÕES DE SEQUÊNCIA
1. **Primeiro**: [Ação mais segura/impactante]
2. **Segundo**: [Próxima ação recomendada]
3. **Por último**: [Ações que requerem mais cuidado]

---

## 📚 REFERÊNCIA TÉCNICA

### 📁 MAPEAMENTO COMPLETO DE ARQUIVOS
```
[Lista organizada de todos os arquivos importantes encontrados]
```

### 🔍 COMANDOS UTILIZADOS NA ANÁLISE
```bash
# Comandos do PASSO-01 que geraram esta documentação
[Lista dos comandos executados]
```

### 🏷️ GLOSSÁRIO TÉCNICO
| Termo | Definição | Contexto no Projeto |
|-------|-----------|-------------------|
| [Termo] | [Significado] | [Como é usado] |
| ... | ... | ... |

### 🔗 REFERÊNCIAS EXTERNAS
- **Documentação Oficial**: [Links para docs das tecnologias]
- **Recursos Importantes**: [Stack Overflow, GitHub, etc.]
- **Ferramentas**: [Links para ferramentas usadas no projeto]

---

## 📋 METADADOS DA DOCUMENTAÇÃO

- **Criado em**: [Data]
- **Baseado na análise**: `01-contexto-inicial/saidas/{nome-projeto}/analise-completa.md`
- **Versão**: 1.0
- **Próxima revisão**: [Quando atualizar]
- **Responsável**: [Quem criou]

---

## 🔄 CONEXÃO COM PRÓXIMOS PASSOS

**ENTRADA RECEBIDA**: Análise bruta e não estruturada do PASSO-01
**SAÍDA PRODUZIDA**: Documentação completa, estruturada e consultável
**PRÓXIMOS PASSOS HABILITADOS**: 
- PASSO-03: Análise específica (bugs/refatoração/features)
- PASSO-04: Implementação de soluções

**ARQUIVO DE SAÍDA**: `01-contexto-inicial/saidas/{nome-projeto}/documentacao-final.md`

---

**📖 RESULTADO**: Uma documentação completa que serve como fonte única de verdade sobre o projeto/módulo para todas as ações futuras!