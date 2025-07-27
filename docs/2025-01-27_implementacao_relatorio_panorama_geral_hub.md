 # 📊 Documento de Implementação: Relatório de Panorama Geral do HUB

## 📋 Visão Geral

### 🎯 Objetivo
Implementar um relatório abrangente de panorama geral do HUB que forneça visibilidade completa sobre dívidas pendentes, saldos por pessoa e métricas financeiras em tempo real.

### 🏗️ Contexto Atual
- **Backend**: Sistema robusto de relatórios já implementado com endpoints para saldos, pendências, transações e categorias
- **Frontend**: Dashboard de relatórios existente com filtros avançados e exportação
- **Banco de Dados**: Estrutura completa com transações, participantes, pagamentos e relacionamentos

### 🎯 Funcionalidades a Implementar
1. **Novo endpoint**: `/api/relatorios/panorama-geral`
2. **Componente frontend**: `PanoramaGeralHub`
3. **Hook personalizado**: `usePanoramaGeral`
4. **Integração**: Com sistema de relatórios existente

---

## 🏗️ Arquitetura

### 📊 Estrutura de Dados

#### Backend - Novo Endpoint
```typescript
// GET /api/relatorios/panorama-geral
interface PanoramaGeralQuery {
  periodo?: 'mes_atual' | 'personalizado';
  data_inicio?: string; // YYYY-MM-DD
  data_fim?: string;    // YYYY-MM-DD
  pessoa_id?: number;   // Filtrar pessoa específica
  status_pagamento?: 'PENDENTE' | 'PAGO_PARCIAL' | 'TODOS';
  ordenar_por?: 'nome' | 'valor_devido' | 'dias_atraso';
  ordem?: 'asc' | 'desc';
  incluir_detalhes?: boolean;
}

interface PanoramaGeralResponse {
  resumo: {
    total_dividas_pendentes: number;
    total_dividas_vencidas: number;
    pessoas_com_dividas: number;
    media_divida_por_pessoa: number;
    total_transacoes_pendentes: number;
    valor_maior_divida: number;
    pessoa_maior_devedora: string;
  };
  devedores: Array<{
    pessoa_id: number;
    nome: string;
    total_devido: number;
    total_pago: number;
    saldo_devido: number;
    transacoes_pendentes: number;
    transacoes_vencidas: number;
    ultimo_pagamento?: string;
    dias_sem_pagamento: number;
    detalhes_transacoes?: Array<{
      transacao_id: number;
      descricao: string;
      valor_devido: number;
      valor_pago: number;
      data_transacao: string;
      data_vencimento?: string;
      status: string;
      dias_atraso?: number;
    }>;
  }>;
  analise_por_status: {
    pendentes: { valor: number; quantidade: number };
    vencidas: { valor: number; quantidade: number };
    vence_hoje: { valor: number; quantidade: number };
    vence_semana: { valor: number; quantidade: number };
  };
  filtros_aplicados: PanoramaGeralQuery;
}
```

#### Frontend - Tipos
```typescript
// frontend/src/hooks/usePanoramaGeral.ts
export interface PanoramaGeralParams {
  periodo?: 'mes_atual' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
  pessoaId?: number;
  statusPagamento?: 'PENDENTE' | 'PAGO_PARCIAL' | 'TODOS';
  ordenarPor?: 'nome' | 'valor_devido' | 'dias_atraso';
  ordem?: 'asc' | 'desc';
  incluirDetalhes?: boolean;
}

export interface PanoramaGeralData {
  resumo: PanoramaGeralResumo;
  devedores: Devedor[];
  analisePorStatus: AnalisePorStatus;
  filtrosAplicados: PanoramaGeralParams;
}
```

### 🔄 Fluxo de Dados
```
Frontend (usePanoramaGeral) 
    ↓
Backend (/api/relatorios/panorama-geral)
    ↓
Database (Prisma Queries)
    ↓
Cálculo de Dívidas (valor_devido - valor_pago)
    ↓
Resposta Estruturada
    ↓
Frontend (PanoramaGeralHub)
```

---

## 🧩 Componentes

### 1. Backend - Controller

#### Arquivo: `backend/controllers/relatorioController.ts`
```typescript
/**
 * GET /api/relatorios/panorama-geral
 * Relatório de panorama geral do HUB com foco em dívidas
 */
export const getPanoramaGeral = async (req: Request, res: Response): Promise<void> => {
  try {
    const prisma = getExtendedPrismaClient(req.auth!);
    const queryData = panoramaGeralQuerySchema.parse(req.query);
    
    // 1. Calcular período de análise
    const periodo = calcularPeriodoAnalise(queryData);
    
    // 2. Buscar transações com dívidas pendentes
    const transacoesComDividas = await buscarTransacoesComDividas(prisma, periodo, queryData);
    
    // 3. Calcular saldos por pessoa
    const saldosPorPessoa = await calcularSaldosPorPessoa(prisma, transacoesComDividas);
    
    // 4. Gerar resumo executivo
    const resumo = gerarResumoExecutivo(saldosPorPessoa);
    
    // 5. Analisar por status
    const analisePorStatus = analisarPorStatus(transacoesComDividas);
    
    // 6. Formatar resposta
    const resposta = {
      resumo,
      devedores: saldosPorPessoa,
      analise_por_status: analisePorStatus,
      filtros_aplicados: queryData
    };
    
    res.json(resposta);
  } catch (error) {
    handleError(res, error, 'Erro ao gerar panorama geral');
  }
};
```

### 2. Backend - Schema

#### Arquivo: `backend/schemas/relatorio.ts`
```typescript
/**
 * Schema para parâmetros de query do panorama geral
 */
export const panoramaGeralQuerySchema = z.object({
  periodo: z
    .enum(['mes_atual', 'personalizado'])
    .default('mes_atual')
    .describe('Período de análise'),
  
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  pessoa_id: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .optional(),
  
  status_pagamento: z
    .enum(['PENDENTE', 'PAGO_PARCIAL', 'TODOS'])
    .default('TODOS')
    .describe('Status do pagamento'),
  
  ordenar_por: z
    .enum(['nome', 'valor_devido', 'dias_atraso'])
    .default('valor_devido')
    .describe('Campo para ordenação'),
  
  ordem: z
    .enum(['asc', 'desc'])
    .default('desc')
    .describe('Direção da ordenação'),
  
  incluir_detalhes: z
    .union([z.string(), z.boolean()])
    .default('false')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir detalhes das transações')
});

export type PanoramaGeralQueryInput = z.infer<typeof panoramaGeralQuerySchema>;
```

### 3. Frontend - Hook

#### Arquivo: `frontend/src/hooks/usePanoramaGeral.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface PanoramaGeralParams {
  periodo?: 'mes_atual' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
  pessoaId?: number;
  statusPagamento?: 'PENDENTE' | 'PAGO_PARCIAL' | 'TODOS';
  ordenarPor?: 'nome' | 'valor_devido' | 'dias_atraso';
  ordem?: 'asc' | 'desc';
  incluirDetalhes?: boolean;
}

export interface PanoramaGeralResumo {
  totalDividasPendentes: number;
  totalDividasVencidas: number;
  pessoasComDividas: number;
  mediaDividaPorPessoa: number;
  totalTransacoesPendentes: number;
  valorMaiorDivida: number;
  pessoaMaiorDevedora: string;
}

export interface Devedor {
  pessoaId: number;
  nome: string;
  totalDevido: number;
  totalPago: number;
  saldoDevido: number;
  transacoesPendentes: number;
  transacoesVencidas: number;
  ultimoPagamento?: string;
  diasSemPagamento: number;
  detalhesTransacoes?: Array<{
    transacaoId: number;
    descricao: string;
    valorDevido: number;
    valorPago: number;
    dataTransacao: string;
    dataVencimento?: string;
    status: string;
    diasAtraso?: number;
  }>;
}

export interface AnalisePorStatus {
  pendentes: { valor: number; quantidade: number };
  vencidas: { valor: number; quantidade: number };
  venceHoje: { valor: number; quantidade: number };
  venceSemana: { valor: number; quantidade: number };
}

export interface PanoramaGeralData {
  resumo: PanoramaGeralResumo;
  devedores: Devedor[];
  analisePorStatus: AnalisePorStatus;
  filtrosAplicados: PanoramaGeralParams;
}

/**
 * Hook para dados do panorama geral do HUB
 */
export function usePanoramaGeral(params: PanoramaGeralParams = {}) {
  const { accessToken, hubAtual } = useAuth();

  const defaultParams: PanoramaGeralParams = {
    periodo: 'mes_atual',
    statusPagamento: 'TODOS',
    ordenarPor: 'valor_devido',
    ordem: 'desc',
    incluirDetalhes: false,
    ...params,
  };

  return useQuery<PanoramaGeralData>({
    queryKey: ['panorama-geral', hubAtual?.id, defaultParams],
    queryFn: async () => {
      const response = await api.get('/relatorios/panorama-geral', {
        params: {
          periodo: defaultParams.periodo,
          data_inicio: defaultParams.dataInicio,
          data_fim: defaultParams.dataFim,
          pessoa_id: defaultParams.pessoaId,
          status_pagamento: defaultParams.statusPagamento,
          ordenar_por: defaultParams.ordenarPor,
          ordem: defaultParams.ordem,
          incluir_detalhes: defaultParams.incluirDetalhes,
        },
      });
      return response.data;
    },
    enabled: !!accessToken && !!hubAtual?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // 30 segundos (tempo real)
  });
}
```

### 4. Frontend - Componente Principal

#### Arquivo: `frontend/src/components/relatorios/PanoramaGeralHub.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { usePanoramaGeral, PanoramaGeralParams } from '@/hooks/usePanoramaGeral';
import { PanoramaGeralResumo } from './PanoramaGeralResumo';
import { ListaDevedores } from './ListaDevedores';
import { AnalisePorStatus } from './AnalisePorStatus';
import { FiltrosPanoramaGeral } from './FiltrosPanoramaGeral';
import { AnimatedCard, StaggeredGrid, FadeIn } from './RelatoriosAnimations';
import { cn } from '@/lib/utils';

interface PanoramaGeralHubProps {
  className?: string;
}

export function PanoramaGeralHub({ className }: PanoramaGeralHubProps) {
  const [filtros, setFiltros] = useState<PanoramaGeralParams>({
    periodo: 'mes_atual',
    statusPagamento: 'TODOS',
    ordenarPor: 'valor_devido',
    ordem: 'desc',
    incluirDetalhes: false,
  });

  const { data, isLoading, error, refetch } = usePanoramaGeral(filtros);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Erro ao carregar panorama geral</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente novamente em alguns instantes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panorama Geral do HUB</h2>
          <p className="text-gray-600">
            Visão completa das dívidas e saldos em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          {data && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <FadeIn delay={0.1}>
        <FiltrosPanoramaGeral 
          filtros={filtros} 
          onFiltrosChange={setFiltros}
        />
      </FadeIn>

      {/* Resumo Executivo */}
      <FadeIn delay={0.2}>
        <PanoramaGeralResumo 
          resumo={data?.resumo}
          loading={isLoading}
        />
      </FadeIn>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="devedores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devedores">
            <Users className="h-4 w-4 mr-2" />
            Devedores
          </TabsTrigger>
          <TabsTrigger value="status">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Por Status
          </TabsTrigger>
          <TabsTrigger value="tendencias">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devedores" className="mt-6">
          <FadeIn delay={0.3}>
            <ListaDevedores 
              devedores={data?.devedores}
              loading={isLoading}
              incluirDetalhes={filtros.incluirDetalhes}
            />
          </FadeIn>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <FadeIn delay={0.3}>
            <AnalisePorStatus 
              analise={data?.analisePorStatus}
              loading={isLoading}
            />
          </FadeIn>
        </TabsContent>

        <TabsContent value="tendencias" className="mt-6">
          <FadeIn delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle>Evolução das Dívidas</CardTitle>
                <CardDescription>
                  Tendência dos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Gráfico de evolução temporal (em desenvolvimento)
                  </p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 5. Componentes Auxiliares

#### Arquivo: `frontend/src/components/relatorios/PanoramaGeralResumo.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  User
} from 'lucide-react';
import { PanoramaGeralResumo as ResumoData } from '@/hooks/usePanoramaGeral';

interface PanoramaGeralResumoProps {
  resumo?: ResumoData;
  loading?: boolean;
}

export function PanoramaGeralResumo({ resumo, loading = false }: PanoramaGeralResumoProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumo) return null;

  const cards = [
    {
      title: "Total Dívidas Pendentes",
      value: resumo.totalDividasPendentes,
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Valor total em dívidas",
      format: "currency"
    },
    {
      title: "Pessoas com Dívidas",
      value: resumo.pessoasComDividas,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Quantidade de devedores",
      format: "number"
    },
    {
      title: "Média por Pessoa",
      value: resumo.mediaDividaPorPessoa,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Média de dívida por devedor",
      format: "currency"
    },
    {
      title: "Maior Devedor",
      value: resumo.valorMaiorDivida,
      icon: User,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: resumo.pessoaMaiorDevedora,
      format: "currency"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("p-2 rounded-full", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.format === "currency" 
                ? `R$ ${card.value.toFixed(2)}`
                : card.value.toString()
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## 🔄 Fluxos

### 1. Fluxo de Carregamento
```
Usuário acessa página
    ↓
usePanoramaGeral hook é executado
    ↓
API call para /api/relatorios/panorama-geral
    ↓
Backend processa query com Prisma
    ↓
Cálculo de dívidas (valor_devido - valor_pago)
    ↓
Resposta estruturada retorna
    ↓
Frontend atualiza componentes
    ↓
Dados são exibidos em tempo real
```

### 2. Fluxo de Filtros
```
Usuário altera filtros
    ↓
setFiltros atualiza estado
    ↓
usePanoramaGeral re-executa com novos params
    ↓
Query key muda (React Query)
    ↓
Nova requisição é feita
    ↓
Dados atualizados são exibidos
```

### 3. Fluxo de Atualização em Tempo Real
```
Dados são carregados
    ↓
refetchInterval: 30s (React Query)
    ↓
Verificação automática de mudanças
    ↓
Se houver mudanças, dados são atualizados
    ↓
Componentes re-renderizam
    ↓
Usuário vê dados sempre atualizados
```

---

## 🛠️ Implementação

### Fase 1: Backend (2-3 horas)

#### 1.1 Adicionar Schema
```bash
# Editar backend/schemas/relatorio.ts
# Adicionar panoramaGeralQuerySchema
```

#### 1.2 Implementar Controller
```bash
# Editar backend/controllers/relatorioController.ts
# Adicionar função getPanoramaGeral
```

#### 1.3 Adicionar Rota
```bash
# Editar backend/routes/relatorio.ts
# Adicionar rota GET /panorama-geral
```

#### 1.4 Funções Auxiliares
```typescript
// Funções a implementar no controller:
- calcularPeriodoAnalise()
- buscarTransacoesComDividas()
- calcularSaldosPorPessoa()
- gerarResumoExecutivo()
- analisarPorStatus()
```

### Fase 2: Frontend (3-4 horas)

#### 2.1 Criar Hook
```bash
# Criar frontend/src/hooks/usePanoramaGeral.ts
```

#### 2.2 Componente Principal
```bash
# Criar frontend/src/components/relatorios/PanoramaGeralHub.tsx
```

#### 2.3 Componentes Auxiliares
```bash
# Criar componentes:
- PanoramaGeralResumo.tsx
- ListaDevedores.tsx
- AnalisePorStatus.tsx
- FiltrosPanoramaGeral.tsx
```

#### 2.4 Integração
```bash
# Adicionar à página de relatórios existente
# frontend/src/app/(auth)/relatorios/page.tsx
```

### Fase 3: Testes e Validação (1-2 horas)

#### 3.1 Testes Backend
```bash
# Testar endpoint com diferentes filtros
# Validar cálculos de dívidas
# Verificar performance
```

#### 3.2 Testes Frontend
```bash
# Testar carregamento de dados
# Validar filtros funcionando
# Verificar atualização em tempo real
```

---

## ✅ Validação

### Critérios de Sucesso

#### 1. Funcionalidade
- ✅ Endpoint retorna dados corretos
- ✅ Cálculos de dívidas estão precisos
- ✅ Filtros funcionam corretamente
- ✅ Atualização em tempo real funciona

#### 2. Performance
- ✅ Resposta em < 2 segundos
- ✅ Dados atualizados a cada 30s
- ✅ Sem memory leaks no frontend

#### 3. UX/UI
- ✅ Interface intuitiva e clara
- ✅ Loading states apropriados
- ✅ Error handling robusto
- ✅ Responsivo em diferentes telas

#### 4. Integração
- ✅ Compatível com sistema existente
- ✅ Não quebra funcionalidades atuais
- ✅ Segue padrões estabelecidos

### Checklist de Validação

#### Backend
- [ ] Endpoint `/api/relatorios/panorama-geral` responde corretamente
- [ ] Cálculo de dívidas: `valor_devido - valor_pago`
- [ ] Filtros funcionam: período, pessoa, status
- [ ] Ordenação funciona: nome, valor, dias atraso
- [ ] Performance: resposta < 2s
- [ ] Validação de parâmetros com Zod

#### Frontend
- [ ] Hook `usePanoramaGeral` carrega dados
- [ ] Componente `PanoramaGeralHub` renderiza
- [ ] Filtros atualizam dados em tempo real
- [ ] Loading states funcionam
- [ ] Error handling adequado
- [ ] Responsivo em mobile/desktop

#### Integração
- [ ] Integrado à página de relatórios
- [ ] Não conflita com funcionalidades existentes
- [ ] Segue padrões de design estabelecidos
- [ ] Exportação funciona (se implementada)

---

## 📋 Cronograma Estimado

### Dia 1 (4-5 horas)
- ✅ Análise e documentação (1h)
- ✅ Backend: Schema e Controller (2h)
- ✅ Backend: Rota e funções auxiliares (1-2h)

### Dia 2 (4-5 horas)
- ✅ Frontend: Hook e componente principal (2h)
- ✅ Frontend: Componentes auxiliares (2h)
- ✅ Integração e testes básicos (1h)

### Dia 3 (2-3 horas)
- ✅ Testes completos
- ✅ Ajustes e refinamentos
- ✅ Documentação final

**Total Estimado: 10-13 horas**

---

## 🚀 Próximos Passos

1. **Implementar Backend** - Começar com schema e controller
2. **Criar Frontend** - Hook e componente principal
3. **Testar Integração** - Validar funcionamento completo
4. **Refinamentos** - Ajustes baseados em feedback

**Status**: 📋 Documentação completa - Pronto para implementação