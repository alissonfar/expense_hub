# Guia de Implementação: Dashboard Financeiro

## 1. Visão Geral e Objetivo
O Dashboard é o ponto central de análise visual do Hub, oferecendo um resumo rápido e intuitivo da saúde financeira. O objetivo é permitir que os membros, especialmente `PROPRIETARIOS` e `ADMINISTRADORES`, entendam rapidamente as tendências de gastos, receitas e saldos.

Este documento serve como um guia para a implementação do frontend, detalhando a fonte de dados e sugerindo como visualizar cada informação para criar uma experiência de usuário clara e impactante.

---

## 2. Fonte de Dados: A API do Dashboard

Toda a informação exibida no dashboard é fornecida por um único endpoint.

- **Endpoint:** `GET /api/relatorios/dashboard`
- **Autenticação:** Requerida para todos os papéis de membro (`PROPRIETARIO`, `ADMINISTRADOR`, `COLABORADOR`, `VISUALIZADOR`).

### Parâmetros da Requisição (Query Params)
| Parâmetro | Tipo | Descrição | Padrão |
| :--- | :--- | :--- | :--- |
| `periodo` | `string` | Define o intervalo de tempo. Opções: `7_dias`, `30_dias`, `90_dias`, `1_ano`, `personalizado`. | `30_dias` |
| `data_inicio` | `string` | `YYYY-MM-DD`. Obrigatório apenas se `periodo` for `personalizado`. | - |
| `data_fim` | `string` | `YYYY-MM-DD`. Obrigatório apenas se `periodo` for `personalizado`. | - |
| `incluir_graficos` | `boolean`| Se `true`, a resposta incluirá os dados para os gráficos. | `true` |
| `incluir_comparativo`| `boolean`| Se `true`, a resposta incluirá a variação percentual em relação ao período anterior. | `true` |

### Estrutura da Resposta (Payload)
A API retorna um objeto JSON com a seguinte estrutura:

```json
{
  "resumo": {
    "total_gastos": 1500.75,
    "total_receitas": 3000.00,
    "saldo_periodo": 1499.25,
    "transacoes_pendentes": 5,
    "pessoas_devedoras": 3
  },
  "comparativo": {
    "gastos_variacao": 15.5,  // Variação de +15.5% em gastos
    "receitas_variacao": -5.2, // Variação de -5.2% em receitas
    "transacoes_variacao": 10.0
  },
  "graficos": {
    "gastosPorDia": [
      { "data": "2025-07-01", "valor": 100.00 },
      { "data": "2025-07-02", "valor": 75.50 }
    ],
    "gastosPorCategoria": [
      { "nome": "Alimentação", "valor": 800.00, "cor": "#FF6384" },
      { "nome": "Transporte", "valor": 400.50, "cor": "#36A2EB" },
      { "nome": "Lazer", "valor": 300.25, "cor": "#FFCE56" }
    ]
  },
  "periodo": {
    "tipo": "30_dias",
    "data_inicio": "2025-06-07",
    "data_fim": "2025-07-07"
  }
}
```

---

## 3. Guia de Componentes Visuais

Esta seção descreve como transformar os dados da API em componentes visuais no frontend.

### 3.1. Cards de KPI (Key Performance Indicators)
- **Fonte de Dados:** `resumo` e `comparativo`
- **Visualização:** Uma fileira de cards no topo da página, cada um destacando uma métrica principal.
- **Componentes Sugeridos:**
  1.  **Card "Receitas no Período":**
      - **Valor Principal:** `resumo.total_receitas` (formatado como R$).
      - **Comparativo:** Exibir `comparativo.receitas_variacao` com um ícone (seta para cima/baixo) e cor (verde/vermelho) para indicar a tendência.
  2.  **Card "Despesas no Período":**
      - **Valor Principal:** `resumo.total_gastos`.
      - **Comparativo:** Exibir `comparativo.gastos_variacao`.
  3.  **Card "Saldo do Período":**
      - **Valor Principal:** `resumo.saldo_periodo`.
      - **Cor Dinâmica:** O valor pode ser verde se positivo, vermelho se negativo.
  4.  **Card "Pendências":**
      - **Valor Principal:** `resumo.transacoes_pendentes`.
      - **Subtexto:** "transações pendentes de `resumo.pessoas_devedoras` pessoas".

### 3.2. Gráfico: Evolução de Gastos
- **Fonte de Dados:** `graficos.gastosPorDia`
- **Visualização:** Um **Gráfico de Linha ou Barras** para mostrar a tendência de gastos ao longo do tempo.
- **Implementação:**
  - O eixo X representa a `data`.
  - O eixo Y representa o `valor`.
  - Utilize **tooltips** interativos que, ao passar o mouse, mostrem a data e o valor exato gasto naquele dia.

### 3.3. Gráfico: Composição de Gastos
- **Fonte de Dados:** `graficos.gastosPorCategoria`
- **Visualização:** Um **Gráfico de Pizza ou Donut** para mostrar a distribuição dos gastos entre as diferentes categorias.
- **Implementação:**
  - Cada fatia do gráfico representa uma categoria.
  - O tamanho da fatia é proporcional ao `valor`.
  - A cor da fatia deve usar a `cor` fornecida pela API.
  - A legenda deve listar o `nome` de cada categoria.
  - **Tooltips** devem mostrar o nome da categoria e o valor exato.

### 3.4. Tabela: Transações Recentes
- **Fonte de Dados:** `GET /api/transacoes?limit=5` (uma chamada separada)
- **Visualização:** Uma tabela compacta na parte inferior do dashboard.
- **Objetivo:** Dar uma visão rápida das últimas atividades sem precisar ir para a tela de transações.
- **Colunas Sugeridas:** Descrição, Valor, Data.

---

## 4. UX e Interatividade

### 4.1. Filtro de Período
- **Componente:** Um `Select` ou `Dropdown` no topo da página.
- **Opções:** "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias", "Último Ano", "Período Personalizado".
- **Fluxo:**
  1.  O usuário seleciona uma nova opção.
  2.  O frontend faz uma nova chamada à API `GET /api/relatorios/dashboard` com o parâmetro `periodo` correspondente.
  3.  Se "Período Personalizado" for escolhido, um `DateRangePicker` é exibido.
  4.  Enquanto os novos dados estão sendo buscados, a UI deve exibir um estado de carregamento.

### 4.2. Estados da Interface
- **Estado de Carregamento (Loading):** Ao carregar a página ou mudar o filtro de período, cada componente do dashboard (cards, gráficos) deve exibir um **esqueleto (skeleton loader)**. Isso melhora a percepção de performance.
- **Estado Vazio (Empty State):** Se a API retornar dados zerados (ex: um Hub recém-criado), o dashboard não deve ficar em branco. Cada componente deve exibir uma mensagem amigável:
  - **Gráficos:** "Ainda não há dados para exibir neste período."
  - **Cards:** Mostrar "R$ 0,00".
- **Estado de Erro:** Se a chamada à API falhar, exibir um alerta global com um botão para "Tentar Novamente".

---

## 5. Interatividade e Navegação (Drill-Down)
Para transformar o dashboard de uma tela passiva em uma ferramenta de exploração, os seguintes elementos devem ser interativos:

- **Card "Pendências":** Ao ser clicado, deve navegar o usuário para a tela do **Relatório de Pendências**, já filtrado para o período selecionado no dashboard.
  - *Exemplo de Navegação:* `/relatorios/pendencias?periodo=30_dias`

- **Fatias do Gráfico "Gastos por Categoria":** Ao clicar em uma fatia (ex: "Alimentação"), o usuário deve ser levado para a tela de **Transações**, com os filtros de período e da categoria específica já aplicados.
  - *Exemplo de Navegação:* `/transacoes?periodo=30_dias&tag=Alimentação`

- **Pontos do Gráfico "Evolução de Gastos":** Ao clicar em um ponto ou barra de um dia específico, a UI deve abrir um **Modal** ou **Popover** listando as transações daquele dia, sem sair da tela do dashboard.

---

## 6. Visão por Papel de Usuário (RBAC na UI)
Embora a API retorne os mesmos dados para todos, a interface deve adaptar a visualização para ser relevante a cada papel:

- **`PROPRIETARIO` / `ADMINISTRADOR`:** Visualização completa com todos os KPIs, gráficos e tabelas.
- **`COLABORADOR`:** Visualização completa, pois participam ativamente da gestão financeira.
- **`VISUALIZADOR`:** Uma visão simplificada. Sugere-se ocultar os KPIs financeiros mais sensíveis como "Receitas no Período" e "Saldo do Período", mantendo a visão geral de "Despesas", os gráficos e as transações recentes.

---

## 7. Design Responsivo e Mobile
Um dashboard com múltiplos cards e gráficos é um desafio em telas menores. A adaptação deve seguir as seguintes diretrizes:

- **Layout:** Em telas de **celular**, o layout de múltiplas colunas deve ser empilhado verticalmente (uma coluna).
- **KPI Cards:** A fileira horizontal de cards deve se transformar em uma grade 2x2 em **tablets** e uma lista vertical em **celulares**.
- **Gráficos:**
  - **Legibilidade:** Em telas estreitas, gráficos de pizza podem se tornar gráficos de barras verticais, que são mais fáceis de ler.
  - **Simplificação:** Ocultar legendas ou eixos menos críticos em telas de celular para economizar espaço, confiando nos tooltips para fornecer os detalhes.
- **Tabelas:** A tabela de "Transações Recentes" deve ser substituída por uma **lista de cards**, onde cada card representa uma transação, otimizando o espaço vertical. 