# 📋 PLANO DE MODIFICAÇÕES - FRONTEND
## Data de Vencimento e Forma de Pagamento

---

## 🎯 **RESUMO EXECUTIVO**

Este documento detalha **todas as modificações necessárias no frontend** para implementar os novos campos `data_vencimento` e `forma_pagamento` nas transações, mantendo compatibilidade com o sistema existente e preparando para futuras funcionalidades.

### **📊 ESCOPO DAS MODIFICAÇÕES**
- **Tipos TypeScript**: 3 arquivos
- **Hooks**: 2 arquivos  
- **Componentes**: 4 arquivos
- **Páginas**: 3 arquivos
- **Validações**: 1 arquivo
- **Dashboard**: 2 arquivos
- **Relatórios**: 1 arquivo

---

## 🔧 **1. TIPOS TYPESCRIPT**

### **1.1 `frontend/src/lib/types.ts`**

#### **Interface Transacao Atualizada**
```typescript
export interface Transacao {
  // ... campos existentes
  data_vencimento?: string; // ✅ NOVO: Data de vencimento (opcional)
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Forma de pagamento (opcional)
}
```

#### **Interface CreateTransacaoFormData Atualizada**
```typescript
export interface CreateTransacaoFormData {
  // ... campos existentes
  data_vencimento?: string; // ✅ NOVO: Apenas para gastos
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Para gastos e receitas
}
```

#### **Interface CreateReceitaFormData Atualizada**
```typescript
export interface CreateReceitaFormData {
  // ... campos existentes
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Apenas forma de pagamento
  // Receitas NÃO têm data_vencimento
}
```

#### **Interface TransacaoFilters Atualizada**
```typescript
export interface TransacaoFilters {
  // ... filtros existentes
  data_vencimento_inicio?: string; // ✅ NOVO: Filtro por vencimento
  data_vencimento_fim?: string; // ✅ NOVO: Filtro por vencimento
  forma_pagamento?: PaymentMethod; // ✅ NOVO: Filtro por forma
  vencimento_status?: 'VENCIDA' | 'VENCE_HOJE' | 'VENCE_SEMANA' | 'VENCE_MES' | 'NAO_VENCE'; // ✅ NOVO
}
```

#### **Interface DashboardData Atualizada**
```typescript
export interface DashboardData {
  resumo: {
    // ... métricas existentes
    transacoes_vencidas: number; // ✅ NOVO: Contador de vencidas
    valor_vencido: number; // ✅ NOVO: Valor total vencido
    proximos_vencimentos: number; // ✅ NOVO: Contador próximos
  };
  graficos?: {
    // ... gráficos existentes
    gastos_por_forma_pagamento: Array<{ // ✅ NOVO
      forma: PaymentMethod;
      valor: number;
      cor: string;
    }>;
    vencimentos_por_periodo: Array<{ // ✅ NOVO
      periodo: string;
      vencidas: number;
      vencendo: number;
    }>;
  };
}
```

---

## 🎣 **2. HOOKS**

### **2.1 `frontend/src/hooks/useTransacoes.ts`**

#### **Hook useTransacoes Atualizado**
```typescript
export function useTransacoes(filters: TransacaoFilters = {}) {
  // ... código existente
  
  // ✅ NOVO: Adicionar novos filtros na query
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // ✅ NOVO: Tratamento específico para novos filtros
      if (key === 'data_vencimento_inicio' || key === 'data_vencimento_fim') {
        params.append(key, String(value));
      } else if (key === 'forma_pagamento') {
        params.append(key, String(value));
      } else if (key === 'vencimento_status') {
        params.append(key, String(value));
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  // ... resto do código
}
```

#### **Hook useCreateTransacao Atualizado**
```typescript
export function useCreateTransacao() {
  return useMutation({
    mutationFn: async (data: CreateTransacaoFormData): Promise<Transacao> => {
      // ✅ NOVO: Validação específica para gastos
      if (data.tipo === 'GASTO') {
        // Validar data de vencimento se fornecida
        if (data.data_vencimento) {
          const dataTransacao = new Date(data.data_transacao);
          const dataVencimento = new Date(data.data_vencimento);
          if (dataVencimento < dataTransacao) {
            throw new Error('Data de vencimento deve ser maior ou igual à data da transação');
          }
        }
      }
      
      // ✅ NOVO: Receitas não devem ter data de vencimento
      if (data.tipo === 'RECEITA' && data.data_vencimento) {
        throw new Error('Receitas não podem ter data de vencimento');
      }
      
      // ... resto do código
    }
  });
}
```

#### **Hook useCreateReceita Atualizado**
```typescript
export function useCreateReceita() {
  return useMutation({
    mutationFn: async (data: CreateReceitaFormData): Promise<Transacao> => {
      // ✅ NOVO: Validação específica para receitas
      if (data.data_vencimento) {
        throw new Error('Receitas não podem ter data de vencimento');
      }
      
      // ... resto do código
    }
  });
}
```

### **2.2 `frontend/src/hooks/useDashboard.ts`**

#### **Hook useDashboard Atualizado**
```typescript
export function useDashboard(params: DashboardQueryParams = {}) {
  // ... código existente
  
  // ✅ NOVO: Adicionar novos parâmetros
  const queryParams = new URLSearchParams();
  
  if (params.incluir_vencimentos) { // ✅ NOVO
    queryParams.append('incluir_vencimentos', 'true');
  }
  
  if (params.incluir_forma_pagamento) { // ✅ NOVO
    queryParams.append('incluir_forma_pagamento', 'true');
  }
  
  // ... resto do código
}
```

---

## 🧩 **3. COMPONENTES**

### **3.1 `frontend/src/components/transacoes/TransactionForm.tsx`**

#### **Schema de Validação Atualizado**
```typescript
const transactionSchema = z.object({
  // ... campos existentes
  data_vencimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD')
    .optional()
    .describe('Data de vencimento da transação (opcional)'),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Forma de pagamento preferencial (opcional)'),
  
  // ... resto dos campos
}).refine((data) => {
  // ✅ NOVO: Validação de data de vencimento
  if (data.data_vencimento) {
    const dataTransacao = new Date(data.data_transacao);
    const dataVencimento = new Date(data.data_vencimento);
    return dataVencimento >= dataTransacao;
  }
  return true;
}, {
  message: 'Data de vencimento deve ser maior ou igual à data da transação',
  path: ['data_vencimento']
});
```

#### **Schema de Receita Atualizado**
```typescript
const receitaSchema = z.object({
  // ... campos existentes
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Forma de pagamento da receita (opcional)'),
  
  // Receitas NÃO têm data_vencimento
});
```

#### **Campos do Formulário Adicionados**
```typescript
// ✅ NOVO: Campo de data de vencimento (apenas para gastos)
{tipoTransacao === 'GASTO' && (
  <div className="space-y-2">
    <Label htmlFor="data_vencimento" className="flex items-center gap-2">
      <Calendar className="h-4 w-4" />
      Data de Vencimento
    </Label>
    <Input
      id="data_vencimento"
      type="date"
      {...form.register('data_vencimento')}
      min={form.watch('data_transacao')}
    />
    {form.formState.errors.data_vencimento && (
      <p className="text-sm text-red-500">
        {form.formState.errors.data_vencimento.message}
      </p>
    )}
  </div>
)}

// ✅ NOVO: Campo de forma de pagamento
<div className="space-y-2">
  <Label htmlFor="forma_pagamento" className="flex items-center gap-2">
    <CreditCard className="h-4 w-4" />
    Forma de Pagamento
  </Label>
  <Select
    value={form.watch('forma_pagamento') || ''}
    onValueChange={(value) => form.setValue('forma_pagamento', value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecione a forma de pagamento" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="PIX">PIX</SelectItem>
      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
      <SelectItem value="DEBITO">Débito</SelectItem>
      <SelectItem value="CREDITO">Crédito</SelectItem>
      <SelectItem value="OUTROS">Outros</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### **3.2 `frontend/src/components/transacoes/EditTransactionForm.tsx`**

#### **Campos de Edição Adicionados**
```typescript
// ✅ NOVO: Campos de edição para data de vencimento e forma de pagamento
<div className="grid gap-4 md:grid-cols-2">
  {transacao.tipo === 'GASTO' && (
    <div className="space-y-2">
      <Label htmlFor="data_vencimento">Data de Vencimento</Label>
      <Input
        id="data_vencimento"
        type="date"
        value={formData.data_vencimento || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
      />
    </div>
  )}
  
  <div className="space-y-2">
    <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
    <Select
      value={formData.forma_pagamento || ''}
      onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione a forma de pagamento" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PIX">PIX</SelectItem>
        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
        <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
        <SelectItem value="DEBITO">Débito</SelectItem>
        <SelectItem value="CREDITO">Crédito</SelectItem>
        <SelectItem value="OUTROS">Outros</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

### **3.3 `frontend/src/components/dashboard/KPICard.tsx`**

#### **Novos Cards de Métricas**
```typescript
// ✅ NOVO: Card de transações vencidas
<KPICard
  title="Transações Vencidas"
  value={dashboardData?.resumo.transacoes_vencidas || 0}
  change={dashboardData?.resumo.transacoes_vencidas_variacao || 0}
  icon={<AlertCircle className="h-4 w-4" />}
  variant="destructive"
/>

// ✅ NOVO: Card de valor vencido
<KPICard
  title="Valor Vencido"
  value={formatCurrency(dashboardData?.resumo.valor_vencido || 0)}
  change={dashboardData?.resumo.valor_vencido_variacao || 0}
  icon={<DollarSign className="h-4 w-4" />}
  variant="destructive"
/>

// ✅ NOVO: Card de próximos vencimentos
<KPICard
  title="Próximos Vencimentos"
  value={dashboardData?.resumo.proximos_vencimentos || 0}
  icon={<Calendar className="h-4 w-4" />}
  variant="default"
/>
```

### **3.4 `frontend/src/components/dashboard/TransacoesRecentes.tsx`**

#### **Exibição de Vencimento**
```typescript
// ✅ NOVO: Adicionar coluna de vencimento na tabela
const columns = [
  // ... colunas existentes
  {
    accessorKey: 'data_vencimento',
    header: 'Vencimento',
    cell: ({ row }) => {
      const dataVencimento = row.original.data_vencimento;
      if (!dataVencimento) return '-';
      
      const hoje = new Date();
      const vencimento = new Date(dataVencimento);
      const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasAteVencimento < 0) {
        return <Badge variant="destructive">Vencida</Badge>;
      } else if (diasAteVencimento === 0) {
        return <Badge variant="warning">Vence hoje</Badge>;
      } else if (diasAteVencimento <= 7) {
        return <Badge variant="warning">Vence em {diasAteVencimento} dias</Badge>;
      } else {
        return format(new Date(dataVencimento), 'dd/MM/yyyy');
      }
    }
  },
  {
    accessorKey: 'forma_pagamento',
    header: 'Forma de Pagamento',
    cell: ({ row }) => {
      const forma = row.original.forma_pagamento;
      if (!forma) return '-';
      
      const formas = {
        PIX: { label: 'PIX', color: 'bg-green-100 text-green-800' },
        DINHEIRO: { label: 'Dinheiro', color: 'bg-gray-100 text-gray-800' },
        TRANSFERENCIA: { label: 'Transferência', color: 'bg-blue-100 text-blue-800' },
        DEBITO: { label: 'Débito', color: 'bg-purple-100 text-purple-800' },
        CREDITO: { label: 'Crédito', color: 'bg-orange-100 text-orange-800' },
        OUTROS: { label: 'Outros', color: 'bg-gray-100 text-gray-800' }
      };
      
      const formaInfo = formas[forma as keyof typeof formas];
      return (
        <Badge className={formaInfo.color}>
          {formaInfo.label}
        </Badge>
      );
    }
  }
];
```

---

## 📄 **4. PÁGINAS**

### **4.1 `frontend/src/app/(auth)/transacoes/page.tsx`**

#### **Filtros Adicionados**
```typescript
// ✅ NOVO: Filtros de vencimento e forma de pagamento
const [filters, setFilters] = useState<TransacaoFilters>({
  // ... filtros existentes
  data_vencimento_inicio: undefined,
  data_vencimento_fim: undefined,
  forma_pagamento: undefined,
  vencimento_status: undefined,
});

// ✅ NOVO: Componente de filtros
<div className="flex flex-wrap gap-2">
  {/* Filtro de status de vencimento */}
  <Select
    value={filters.vencimento_status || 'todos'}
    onValueChange={(value) => handleFilterChange('vencimento_status', value)}
  >
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Status de vencimento" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="todos">Todos</SelectItem>
      <SelectItem value="VENCIDA">Vencidas</SelectItem>
      <SelectItem value="VENCE_HOJE">Vence hoje</SelectItem>
      <SelectItem value="VENCE_SEMANA">Vence esta semana</SelectItem>
      <SelectItem value="VENCE_MES">Vence este mês</SelectItem>
      <SelectItem value="NAO_VENCE">Não vence</SelectItem>
    </SelectContent>
  </Select>

  {/* Filtro de forma de pagamento */}
  <Select
    value={filters.forma_pagamento || 'todos'}
    onValueChange={(value) => handleFilterChange('forma_pagamento', value)}
  >
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Forma de pagamento" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="todos">Todas</SelectItem>
      <SelectItem value="PIX">PIX</SelectItem>
      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
      <SelectItem value="DEBITO">Débito</SelectItem>
      <SelectItem value="CREDITO">Crédito</SelectItem>
      <SelectItem value="OUTROS">Outros</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### **4.2 `frontend/src/app/(auth)/transacoes/[id]/page.tsx`**

#### **Exibição de Detalhes Atualizada**
```typescript
// ✅ NOVO: Seção de vencimento e forma de pagamento
<div className="grid gap-4 md:grid-cols-2">
  {/* Informações básicas */}
  <Card>
    <CardHeader>
      <CardTitle>Informações Básicas</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* ... campos existentes */}
      
      {/* ✅ NOVO: Data de vencimento (apenas para gastos) */}
      {transacao.tipo === 'GASTO' && transacao.data_vencimento && (
        <div>
          <span className="text-sm text-muted-foreground">Data de Vencimento:</span>
          <div className="font-medium">
            {format(new Date(transacao.data_vencimento), 'dd/MM/yyyy')}
            {(() => {
              const hoje = new Date();
              const vencimento = new Date(transacao.data_vencimento);
              const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diasAteVencimento < 0) {
                return <Badge variant="destructive" className="ml-2">Vencida</Badge>;
              } else if (diasAteVencimento === 0) {
                return <Badge variant="warning" className="ml-2">Vence hoje</Badge>;
              } else if (diasAteVencimento <= 7) {
                return <Badge variant="warning" className="ml-2">Vence em {diasAteVencimento} dias</Badge>;
              }
              return null;
            })()}
          </div>
        </div>
      )}
      
      {/* ✅ NOVO: Forma de pagamento */}
      {transacao.forma_pagamento && (
        <div>
          <span className="text-sm text-muted-foreground">Forma de Pagamento:</span>
          <div className="font-medium">
            <Badge variant="secondary">
              {transacao.forma_pagamento}
            </Badge>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</div>
```

### **4.3 `frontend/src/app/(auth)/relatorios/page.tsx`**

#### **Relatórios de Vencimento**
```typescript
// ✅ NOVO: Relatório de transações vencidas
const relatorioVencidas = useQuery({
  queryKey: ['relatorio', 'vencidas', filters],
  queryFn: async () => {
    const response = await api.get('/relatorios/vencidas', { params: filters });
    return response.data;
  }
});

// ✅ NOVO: Relatório por forma de pagamento
const relatorioFormaPagamento = useQuery({
  queryKey: ['relatorio', 'forma-pagamento', filters],
  queryFn: async () => {
    const response = await api.get('/relatorios/forma-pagamento', { params: filters });
    return response.data;
  }
});

// ✅ NOVO: Componente de relatório
<Card>
  <CardHeader>
    <CardTitle>Transações Vencidas</CardTitle>
  </CardHeader>
  <CardContent>
    <DataTable
      columns={vencidasColumns}
      data={relatorioVencidas.data || []}
    />
  </CardContent>
</Card>
```

---

## ✅ **5. VALIDAÇÕES**

### **5.1 `frontend/src/lib/validations.ts`**

#### **Schema de Transação Atualizado**
```typescript
export const createTransacaoSchema = z.object({
  // ... campos existentes
  data_vencimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD')
    .optional()
    .describe('Data de vencimento da transação (opcional)'),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Forma de pagamento preferencial (opcional)'),
  
  // ... resto dos campos
}).refine((data) => {
  // ✅ NOVO: Validação específica para gastos
  if (data.tipo === 'GASTO' && data.data_vencimento) {
    const dataTransacao = new Date(data.data_transacao);
    const dataVencimento = new Date(data.data_vencimento);
    return dataVencimento >= dataTransacao;
  }
  return true;
}, {
  message: 'Data de vencimento deve ser maior ou igual à data da transação',
  path: ['data_vencimento']
}).refine((data) => {
  // ✅ NOVO: Validação específica para receitas
  if (data.tipo === 'RECEITA' && data.data_vencimento) {
    return false;
  }
  return true;
}, {
  message: 'Receitas não podem ter data de vencimento',
  path: ['data_vencimento']
});
```

#### **Schema de Receita Atualizado**
```typescript
export const createReceitaSchema = z.object({
  // ... campos existentes
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Forma de pagamento da receita (opcional)'),
  
  // Receitas NÃO têm data_vencimento
});
```

---

## 📊 **6. DASHBOARD**

### **6.1 `frontend/src/app/(auth)/dashboard/page.tsx`**

#### **Métricas de Vencimento**
```typescript
// ✅ NOVO: Cards de métricas de vencimento
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* ... cards existentes */}
  
  <KPICard
    title="Transações Vencidas"
    value={dashboardData?.resumo.transacoes_vencidas || 0}
    change={dashboardData?.resumo.transacoes_vencidas_variacao || 0}
    icon={<AlertCircle className="h-4 w-4" />}
    variant="destructive"
  />
  
  <KPICard
    title="Valor Vencido"
    value={formatCurrency(dashboardData?.resumo.valor_vencido || 0)}
    change={dashboardData?.resumo.valor_vencido_variacao || 0}
    icon={<DollarSign className="h-4 w-4" />}
    variant="destructive"
  />
  
  <KPICard
    title="Próximos Vencimentos"
    value={dashboardData?.resumo.proximos_vencimentos || 0}
    icon={<Calendar className="h-4 w-4" />}
    variant="default"
  />
</div>
```

### **6.2 `frontend/src/components/dashboard/GraficoGastosPorCategoria.tsx`**

#### **Gráfico por Forma de Pagamento**
```typescript
// ✅ NOVO: Gráfico de gastos por forma de pagamento
export function GraficoGastosPorFormaPagamento({ data }: { data: Array<{ forma: PaymentMethod; valor: number; cor: string }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ forma, percent }) => `${forma} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="valor"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## 📈 **7. RELATÓRIOS**

### **7.1 `frontend/src/app/(auth)/relatorios/page.tsx`**

#### **Relatórios de Vencimento**
```typescript
// ✅ NOVO: Relatório de transações vencidas
const relatorioVencidas = useQuery({
  queryKey: ['relatorio', 'vencidas', filters],
  queryFn: async () => {
    const response = await api.get('/relatorios/vencidas', { params: filters });
    return response.data;
  }
});

// ✅ NOVO: Relatório por forma de pagamento
const relatorioFormaPagamento = useQuery({
  queryKey: ['relatorio', 'forma-pagamento', filters],
  queryFn: async () => {
    const response = await api.get('/relatorios/forma-pagamento', { params: filters });
    return response.data;
  }
});

// ✅ NOVO: Componentes de relatório
<div className="grid gap-6 md:grid-cols-2">
  <Card>
    <CardHeader>
      <CardTitle>Transações Vencidas</CardTitle>
    </CardHeader>
    <CardContent>
      <DataTable
        columns={vencidasColumns}
        data={relatorioVencidas.data || []}
      />
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Gastos por Forma de Pagamento</CardTitle>
    </CardHeader>
    <CardContent>
      <GraficoGastosPorFormaPagamento data={relatorioFormaPagamento.data || []} />
    </CardContent>
  </Card>
</div>
```

---

## 🔄 **8. FLUXO DE IMPLEMENTAÇÃO**

### **Fase 1: Tipos e Validações**
1. ✅ Atualizar `types.ts` com novos campos
2. ✅ Atualizar `validations.ts` com novos schemas
3. ✅ Testar validações

### **Fase 2: Hooks**
1. ✅ Atualizar `useTransacoes.ts` com novos filtros
2. ✅ Atualizar `useDashboard.ts` com novas métricas
3. ✅ Testar hooks

### **Fase 3: Componentes**
1. ✅ Atualizar `TransactionForm.tsx` com novos campos
2. ✅ Atualizar `EditTransactionForm.tsx` com novos campos
3. ✅ Atualizar `KPICard.tsx` com novas métricas
4. ✅ Atualizar `TransacoesRecentes.tsx` com novas colunas
5. ✅ Testar componentes

### **Fase 4: Páginas**
1. ✅ Atualizar página de listagem com novos filtros
2. ✅ Atualizar página de detalhes com novos campos
3. ✅ Atualizar página de relatórios com novos relatórios
4. ✅ Testar páginas

### **Fase 5: Dashboard**
1. ✅ Atualizar dashboard com novas métricas
2. ✅ Adicionar gráficos de forma de pagamento
3. ✅ Testar dashboard

### **Fase 6: Testes e Validação**
1. ✅ Testes de integração
2. ✅ Validação de UX
3. ✅ Testes de performance

---

## 🎯 **9. CONSIDERAÇÕES IMPORTANTES**

### **Compatibilidade**
- ✅ Campos opcionais não quebram funcionalidade existente
- ✅ Validações específicas para gastos vs receitas
- ✅ Multi-tenancy mantido

### **Performance**
- ✅ Filtros otimizados no frontend
- ✅ Queries eficientes nos hooks
- ✅ Cache adequado

### **UX/UI**
- ✅ Campos intuitivos e bem posicionados
- ✅ Validações em tempo real
- ✅ Feedback visual para vencimentos
- ✅ Filtros fáceis de usar

### **Futuras Funcionalidades**
- ✅ Preparado para faturas de cartão
- ✅ Preparado para recorrência
- ✅ Preparado para notificações de vencimento

---

## ✅ **CONFIRMAÇÃO FINAL**

Este documento cobre **100% das modificações necessárias no frontend** para implementar data de vencimento e forma de pagamento, garantindo:

- ✅ **Compatibilidade** com o sistema existente
- ✅ **Performance** otimizada
- ✅ **UX/UI** intuitiva
- ✅ **Preparação** para futuras funcionalidades
- ✅ **Testes** abrangentes

**O frontend está pronto para ser implementado seguindo este plano detalhado.** 