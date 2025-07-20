# 📋 PLANO DE IMPLEMENTAÇÃO: DATA DE VENCIMENTO E FORMA DE PAGAMENTO

## 🎯 OBJETIVO
Implementar as funcionalidades de **data de vencimento** e **forma de pagamento** no módulo de transações do backend, preparando a base para futuras funcionalidades como faturas de cartão de crédito.

---

## 🏗️ ARQUITETURA ATUAL ANALISADA

### **Estrutura de Dados Existente**
```sql
-- Modelo atual de transações
model transacoes {
  id: number
  tipo: string // 'GASTO' | 'RECEITA'
  descricao: string
  valor_total: Decimal
  data_transacao: DateTime // Data da transação
  eh_parcelado: boolean
  parcela_atual: number
  total_parcelas: number
  grupo_parcela: string // UUID para agrupar parcelas
  status_pagamento: string // 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL'
  // ... outros campos
}

-- Modelo de pagamentos (já tem forma_pagamento)
model pagamentos {
  id: number
  forma_pagamento: string // 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS'
  // ... outros campos
}
```

### **Fluxo Atual**
1. **Criação**: Frontend → Validação Zod → Controller → Prisma → Banco
2. **Parcelamento**: Cria múltiplas transações com `grupo_parcela` UUID
3. **Pagamentos**: Sistema separado que referencia transações
4. **Relatórios**: Já tem estrutura para vencimentos

---

## 🔧 MODIFICAÇÕES NECESSÁRIAS

### **1. MIGRAÇÃO DO BANCO DE DADOS**

#### **1.1 Nova Migration Prisma**
```sql
-- Migration: add_vencimento_forma_pagamento_transacoes
ALTER TABLE transacoes 
ADD COLUMN data_vencimento DATE NULL,
ADD COLUMN forma_pagamento VARCHAR(15) NULL;

-- Índices para performance
CREATE INDEX idx_transacoes_data_vencimento ON transacoes(data_vencimento);
CREATE INDEX idx_transacoes_forma_pagamento ON transacoes(forma_pagamento);
CREATE INDEX idx_transacoes_hub_vencimento ON transacoes(hubId, data_vencimento);
CREATE INDEX idx_transacoes_hub_forma ON transacoes(hubId, forma_pagamento);
CREATE INDEX idx_transacoes_vencimento_status ON transacoes(data_vencimento, status_pagamento);
```

#### **1.2 Schema Prisma Atualizado**
```prisma
model transacoes {
  // ... campos existentes
  data_vencimento                              DateTime?                 @db.Date
  forma_pagamento                              String?                  @db.VarChar(15)
  
  // ... índices existentes
  @@index([data_vencimento], map: "idx_transacoes_data_vencimento")
  @@index([forma_pagamento], map: "idx_transacoes_forma_pagamento")
  @@index([hubId, data_vencimento], map: "idx_transacoes_hub_vencimento")
  @@index([hubId, forma_pagamento], map: "idx_transacoes_hub_forma")
  @@index([data_vencimento, status_pagamento], map: "idx_transacoes_vencimento_status")
}
```

---

### **2. SCHEMAS DE VALIDAÇÃO**

#### **2.1 Função de Validação de Data de Vencimento**
```typescript
// backend/schemas/transacao.ts

/**
 * Função para validar data de vencimento
 * - Deve ser >= data_transacao
 * - Pode ser futura (diferente da data_transacao)
 * - Deve estar entre 2000-2050
 */
const validarDataVencimento = (dataVencimento: string, dataTransacao: string): boolean => {
  const vencimento = new Date(dataVencimento);
  const transacao = new Date(dataTransacao);
  
  // Verificar se a data é válida
  if (isNaN(vencimento.getTime())) {
    return false;
  }
  
  // Verificar se está dentro de uma faixa razoável (2000-2050)
  const year = vencimento.getFullYear();
  if (year < 2000 || year > 2050) {
    return false;
  }
  
  // Verificar se é >= data_transacao
  return vencimento >= transacao;
};
```

#### **2.2 Schema de Criação de Gasto Atualizado**
```typescript
export const createGastoSchema = z.object({
  // ... campos existentes
  
  // Novos campos
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
})
.refine(
  (data) => {
    // Validar data de vencimento se fornecida
    if (data.data_vencimento) {
      return validarDataVencimento(data.data_vencimento, data.data_transacao);
    }
    return true;
  },
  {
    message: 'Data de vencimento deve ser maior ou igual à data da transação',
    path: ['data_vencimento']
  }
);
```

#### **2.3 Schema de Criação de Receita Atualizado**
```typescript
export const createReceitaSchema = z.object({
  // ... campos existentes
  
  // Novos campos (apenas forma_pagamento, receitas não têm vencimento)
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Forma de pagamento da receita (opcional)'),
  
  // ... resto dos campos
});
```

#### **2.4 Schema de Atualização de Gasto Atualizado**
```typescript
export const updateGastoSchema = z.object({
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
});
```

#### **2.5 Schema de Atualização de Receita Atualizado**
```typescript
export const updateReceitaSchema = z.object({
  // ... campos existentes
  
  // Novos campos (apenas forma_pagamento, receitas não têm vencimento)
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Forma de pagamento da receita (opcional)'),
  
  // ... resto dos campos
});
```

#### **2.6 Schema de Query Atualizado**
```typescript
export const transacaoQuerySchema = z.object({
  // ... filtros existentes
  
  // Novos filtros
  data_vencimento_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_vencimento_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional(),
  
  vencimento_status: z
    .enum(['VENCIDA', 'VENCE_HOJE', 'VENCE_SEMANA', 'VENCE_MES', 'NAO_VENCE'])
    .optional(),
  
  // ... resto dos filtros
})
.refine(
  (data) => {
    if (data.data_vencimento_inicio && data.data_vencimento_fim) {
      return new Date(data.data_vencimento_inicio) <= new Date(data.data_vencimento_fim);
    }
    return true;
  },
  {
    message: 'Data de vencimento início deve ser anterior ou igual à data de vencimento fim',
    path: ['data_vencimento_inicio']
  }
);
```

---

### **3. CONTROLLERS**

#### **3.1 Controller de Criação Atualizado**
```typescript
// backend/controllers/transacaoController.ts

export const createGasto = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { hubId, pessoaId: userId } = req.auth!;
  const data: CreateGastoInput = req.body;

  try {
    // ... validações existentes
    
    const { 
      descricao, 
      local, 
      valor_total, 
      data_transacao, 
      observacoes, 
      participantes, 
      tags = [], 
      eh_parcelado, 
      total_parcelas,
      data_vencimento, // Novo campo
      forma_pagamento  // Novo campo
    } = data;

    // ... validações existentes

    // LÓGICA PARA DATA DE VENCIMENTO
    let dataVencimentoFinal = data_vencimento ? new Date(data_vencimento) : null;
    
    // Se não informada, usar padrão: data_transacao + 30 dias
    if (!dataVencimentoFinal) {
      dataVencimentoFinal = new Date(data_transacao);
      dataVencimentoFinal.setDate(dataVencimentoFinal.getDate() + 30);
    }

    const transacoesCriadas: any[] = [];

    await prisma.$transaction(async (tx) => {
      const extendedTx = getExtendedPrismaClient(req.auth!).$extends({
        client: { $transaction: tx }
      });

      if (ehParcelado && totalParcelas > 1) {
        // LÓGICA DE PARCELAMENTO COM VENCIMENTO
        const valorParcela = parseFloat((valor_total / totalParcelas).toFixed(2));
        const somaOriginalParticipantes = participantes.reduce((acc, p) => acc + p.valor_devido, 0);

        for (let i = 1; i <= totalParcelas; i++) {
          const dataParcela = new Date(data_transacao);
          dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

          // Calcular vencimento da parcela
          const vencimentoParcela = new Date(dataVencimentoFinal!);
          vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - 1));

          const transacaoData = {
            // ... campos existentes
            data_vencimento: vencimentoParcela, // Novo campo
            forma_pagamento: forma_pagamento || null, // Novo campo
            // ... resto dos campos
          };
          
          const novaTransacao = await extendedTx.transacoes.create({ data: transacaoData });
          transacoesCriadas.push(novaTransacao);
        }
      } else {
        const transacaoData = {
          // ... campos existentes
          data_vencimento: dataVencimentoFinal, // Novo campo
          forma_pagamento: forma_pagamento || null, // Novo campo
          // ... resto dos campos
        };
        
        const novaTransacao = await extendedTx.transacoes.create({ data: transacaoData });
        transacoesCriadas.push(novaTransacao);
      }
    });

    // ... resposta existente
  } catch (error) {
    // ... tratamento de erro existente
  }
};
```

#### **3.2 Controller de Listagem Atualizado**
```typescript
export const listTransacoes = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  try {
    const {
      // ... filtros existentes
      data_vencimento_inicio,
      data_vencimento_fim,
      forma_pagamento,
      vencimento_status
    }: TransacaoQueryInput = req.query;

    const where: Prisma.transacoesWhereInput = {
      ativo: true
    };

    // ... filtros existentes

    // NOVOS FILTROS
    if (data_vencimento_inicio) {
      where.data_vencimento = { ...where.data_vencimento as object, gte: new Date(data_vencimento_inicio) };
    }
    if (data_vencimento_fim) {
      where.data_vencimento = { ...where.data_vencimento as object, lte: new Date(data_vencimento_fim) };
    }
    if (forma_pagamento) {
      where.forma_pagamento = forma_pagamento;
    }
    if (vencimento_status) {
      const hoje = new Date();
      const fimSemana = new Date();
      fimSemana.setDate(hoje.getDate() + 7);
      const fimMes = new Date();
      fimMes.setMonth(hoje.getMonth() + 1);

      switch (vencimento_status) {
        case 'VENCIDA':
          where.data_vencimento = { lt: hoje };
          break;
        case 'VENCE_HOJE':
          where.data_vencimento = { 
            gte: new Date(hoje.setHours(0, 0, 0, 0)),
            lt: new Date(hoje.setHours(23, 59, 59, 999))
          };
          break;
        case 'VENCE_SEMANA':
          where.data_vencimento = { gte: hoje, lte: fimSemana };
          break;
        case 'VENCE_MES':
          where.data_vencimento = { gte: hoje, lte: fimMes };
          break;
        case 'NAO_VENCE':
          where.data_vencimento = { gt: fimMes };
          break;
      }
    }

    // ... resto da lógica existente
  } catch (error) {
    // ... tratamento de erro existente
  }
};
```

#### **3.3 Controller de Atualização Atualizado**
```typescript
export const updateTransacao = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { id } = req.params;
  const data: UpdateGastoInput = req.body;
  const { hubId } = req.auth!;

  try {
    // ... validações existentes

    // VALIDAÇÃO DE DATA DE VENCIMENTO
    if (data.data_vencimento) {
      const transacao = await prisma.transacoes.findUnique({
        where: { id: parseInt(id, 10) },
        select: { data_transacao: true }
      });
      
      if (transacao && !validarDataVencimento(data.data_vencimento, transacao.data_transacao.toISOString().split('T')[0])) {
        res.status(400).json({
          error: 'DataVencimentoInvalida',
          message: 'Data de vencimento deve ser maior ou igual à data da transação',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Constrói o objeto de atualização
    const updateData: Prisma.transacoesUpdateInput = {};
    // ... campos existentes
    
    // NOVOS CAMPOS
    if (data.data_vencimento !== undefined) {
      updateData.data_vencimento = data.data_vencimento ? new Date(data.data_vencimento) : null;
    }
    if (data.forma_pagamento !== undefined) {
      updateData.forma_pagamento = data.forma_pagamento || null;
    }

    const transacaoAtualizada = await prisma.transacoes.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    // ... resposta existente
  } catch (error) {
    // ... tratamento de erro existente
  }
};
```

#### **3.4 Controller de Receitas Atualizado**
```typescript
export const createReceita = async (req: Request, res: Response): Promise<void> => {
  const { pessoaId: userId, hubId } = req.auth!;
  const prisma = getExtendedPrismaClient(req.auth!);

  try {
    // ... validações existentes

    const {
      descricao,
      local,
      valor_recebido,
      data_transacao,
      observacoes,
      tags = [],
      forma_pagamento // Novo campo
    }: CreateReceitaInput = req.body;

    const novaReceita = await prisma.transacoes.create({
      data: {
        hubId,
        tipo: 'RECEITA',
        proprietario_id: userId,
        descricao,
        local: local || null,
        valor_total: valor_recebido,
        data_transacao: new Date(data_transacao),
        observacoes: observacoes || null,
        status_pagamento: 'PAGO_TOTAL',
        criado_por: userId,
        valor_parcela: valor_recebido,
        forma_pagamento: forma_pagamento || null, // Novo campo
        // Receitas NÃO têm data_vencimento
        transacao_participantes: {
          create: {
            pessoa_id: userId,
            valor_devido: valor_recebido,
            valor_pago: valor_recebido,
            eh_proprietario: true
          }
        },
        transacao_tags: {
          create: tags.map(tagId => ({ tag_id: tagId }))
        }
      }
    });
    res.status(201).json({ success: true, message: 'Receita criada com sucesso', data: novaReceita });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};
```

---

### **4. RELATÓRIOS E DASHBOARD**

#### **4.1 Schema de Relatórios Atualizado**
```typescript
// backend/schemas/relatorio.ts

export const pendenciasQuerySchema = z.object({
  // ... filtros existentes
  
  // Novos filtros específicos para vencimentos
  vencimento_ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD')
    .optional()
    .describe('Mostrar pendências vencidas até esta data'),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional()
    .describe('Filtrar por forma de pagamento'),
  
  // ... resto dos filtros
});
```

#### **4.2 Controller de Relatórios Atualizado**
```typescript
// backend/controllers/relatorioController.ts

export const getPendencias = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { hubId } = req.auth!;
  
  try {
    const {
      // ... filtros existentes
      vencimento_ate,
      forma_pagamento
    }: PendenciasQueryInput = req.query;

    const where: Prisma.transacoesWhereInput = {
      hubId,
      ativo: true,
      tipo: 'GASTO',
      status_pagamento: { not: 'PAGO_TOTAL' }
    };

    // ... filtros existentes

    // NOVOS FILTROS
    if (vencimento_ate) {
      where.data_vencimento = {
        lte: new Date(vencimento_ate)
      };
    }
    if (forma_pagamento) {
      where.forma_pagamento = forma_pagamento;
    }

    const pendencias = await prisma.transacoes.findMany({
      where,
      include: {
        transacao_participantes: {
          include: {
            pessoas: { select: { id: true, nome: true } }
          }
        },
        transacao_tags: { include: { tags: true } }
      },
      orderBy: [
        { data_vencimento: 'asc' },
        { valor_total: 'desc' }
      ]
    });

    // Calcular estatísticas de vencimento
    const hoje = new Date();
    const estatisticas = {
      total_pendencias: pendencias.length,
      vencidas: pendencias.filter(p => p.data_vencimento && p.data_vencimento < hoje).length,
      vencem_hoje: pendencias.filter(p => {
        if (!p.data_vencimento) return false;
        const vencimento = new Date(p.data_vencimento);
        return vencimento.toDateString() === hoje.toDateString();
      }).length,
      vencem_semana: pendencias.filter(p => {
        if (!p.data_vencimento) return false;
        const vencimento = new Date(p.data_vencimento);
        const fimSemana = new Date();
        fimSemana.setDate(hoje.getDate() + 7);
        return vencimento >= hoje && vencimento <= fimSemana;
      }).length
    };

    res.json({
      success: true,
      data: {
        pendencias,
        estatisticas
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // ... tratamento de erro
  }
};
```

---

### **5. TIPOS TYPESCRIPT**

#### **5.1 Tipos Atualizados**
```typescript
// backend/types/index.ts

export interface Transacao {
  // ... campos existentes
  data_vencimento?: string;
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
}

export interface CreateGastoInput {
  // ... campos existentes
  data_vencimento?: string;
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
}

export interface CreateReceitaInput {
  // ... campos existentes
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
  // Receitas NÃO têm data_vencimento
}

export interface UpdateGastoInput {
  // ... campos existentes
  data_vencimento?: string;
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
}

export interface UpdateReceitaInput {
  // ... campos existentes
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
  // Receitas NÃO têm data_vencimento
}

export interface TransacaoQueryInput {
  // ... filtros existentes
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  forma_pagamento?: 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OUTROS';
  vencimento_status?: 'VENCIDA' | 'VENCE_HOJE' | 'VENCE_SEMANA' | 'VENCE_MES' | 'NAO_VENCE';
}
```

---

## 📊 ÍNDICES DE PERFORMANCE

### **Índices Criados**
```sql
-- Índices principais
CREATE INDEX idx_transacoes_data_vencimento ON transacoes(data_vencimento);
CREATE INDEX idx_transacoes_forma_pagamento ON transacoes(forma_pagamento);

-- Índices compostos para consultas frequentes
CREATE INDEX idx_transacoes_hub_vencimento ON transacoes(hubId, data_vencimento);
CREATE INDEX idx_transacoes_hub_forma ON transacoes(hubId, forma_pagamento);
CREATE INDEX idx_transacoes_vencimento_status ON transacoes(data_vencimento, status_pagamento);

-- Índices para relatórios
CREATE INDEX idx_transacoes_hub_tipo_vencimento ON transacoes(hubId, tipo, data_vencimento);
CREATE INDEX idx_transacoes_hub_forma_status ON transacoes(hubId, forma_pagamento, status_pagamento);

-- Índices adicionais para dashboard e relatórios avançados
CREATE INDEX idx_transacoes_hub_tipo_forma ON transacoes(hubId, tipo, forma_pagamento);
CREATE INDEX idx_transacoes_vencimento_tipo ON transacoes(data_vencimento, tipo);
CREATE INDEX idx_transacoes_forma_tipo ON transacoes(forma_pagamento, tipo);
```

### **Justificativa dos Índices**
- **`idx_transacoes_data_vencimento`**: Consultas por vencimento
- **`idx_transacoes_forma_pagamento`**: Filtros por forma de pagamento
- **`idx_transacoes_hub_vencimento`**: Consultas por Hub + vencimento
- **`idx_transacoes_hub_forma`**: Consultas por Hub + forma de pagamento
- **`idx_transacoes_vencimento_status`**: Relatórios de pendências
- **`idx_transacoes_hub_tipo_vencimento`**: Dashboard e relatórios
- **`idx_transacoes_hub_forma_status`**: Relatórios por forma de pagamento
- **`idx_transacoes_hub_tipo_forma`**: Dashboard por forma de pagamento
- **`idx_transacoes_vencimento_tipo`**: Relatórios de vencimento por tipo
- **`idx_transacoes_forma_tipo`**: Relatórios de forma de pagamento por tipo

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO

### **Fase 1: Migração do Banco**
1. Criar migration Prisma
2. Executar migration
3. Verificar índices criados

### **Fase 2: Schemas e Validações**
1. Atualizar schemas de validação de gastos
2. Atualizar schemas de validação de receitas
3. Adicionar funções de validação
4. Atualizar tipos TypeScript

### **Fase 3: Controllers**
1. Atualizar controller de criação de gastos
2. Atualizar controller de criação de receitas
3. Atualizar controller de listagem
4. Atualizar controller de atualização de gastos
5. Atualizar controller de atualização de receitas

### **Fase 4: Relatórios**
1. Atualizar schemas de relatórios
2. Atualizar controller de relatórios
3. Adicionar estatísticas de vencimento

### **Fase 5: Testes**
1. Testar criação com novos campos
2. Testar filtros de listagem
3. Testar atualização
4. Testar relatórios

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### **Compatibilidade**
- ✅ **Transações existentes**: Campos opcionais, não quebram funcionalidade
- ✅ **Parcelamento**: Mantém lógica existente
- ✅ **Pagamentos**: Sistema separado, não afetado
- ✅ **Multi-tenancy**: Isolamento por Hub mantido

### **Validações**
- **Data de vencimento**: Deve ser >= data_transacao (apenas para gastos)
- **Forma de pagamento**: Deve ser um dos valores válidos
- **Parcelamento**: Cada parcela herda vencimento + meses
- **Receitas**: Sem data de vencimento (já são pagas automaticamente)
- **Receitas**: Podem ter forma de pagamento (opcional)

### **Performance**
- **Índices otimizados**: Para consultas frequentes
- **Filtros eficientes**: Usando índices compostos
- **Paginação**: Mantida para grandes volumes

### **Futuras Funcionalidades**
- **Faturas de cartão**: Dependem de forma_pagamento = 'CREDITO'
- **Recorrência**: Pode usar data_vencimento como base
- **Notificações**: Baseadas em data_vencimento
- **Relatórios avançados**: Por forma de pagamento

---

## 🎯 PRÓXIMOS PASSOS

1. **Executar migração** do banco de dados
2. **Implementar schemas** de validação (gastos e receitas)
3. **Atualizar controllers** com nova lógica (gastos e receitas)
4. **Testar funcionalidades** básicas
5. **Implementar relatórios** atualizados
6. **Atualizar dashboard** com métricas de vencimento
7. **Preparar frontend** para novos campos

Este plano fornece uma base sólida para implementar as funcionalidades de data de vencimento e forma de pagamento, mantendo compatibilidade com o sistema existente e preparando para futuras expansões. 