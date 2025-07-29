import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface RelatorioPessoaParams {
  pessoaId: number;
  periodo?: 'mes_atual' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
  incluirDetalhes?: boolean;
}

export interface TransacaoPessoa {
  id: number;
  descricao: string;
  valorTotal: number;
  valorDevido: number;
  valorPago: number;
  dataTransacao: string;
  statusPagamento: string;
  categoria?: string;
  tags?: string[];
}

export interface SaldoPessoa {
  pessoaId: number;
  pessoaNome: string;
  pessoaEmail: string;
  totalDeve: number;
  totalPago: number;
  saldoFinal: number;
  status: 'DEVEDOR' | 'CREDOR' | 'QUITADO';
  transacoesPendentes: number;
  ultimaTransacao?: string;
  detalhes?: TransacaoPessoa[];
}

export interface RelatorioPessoaData {
  saldo: SaldoPessoa;
  resumo: {
    totalTransacoes: number;
    transacoesPendentes: number;
    transacoesPagas: number;
    valorMedioTransacao: number;
    maiorTransacao: number;
    menorTransacao: number;
  };
  transacoes: TransacaoPessoa[];
  filtrosAplicados: RelatorioPessoaParams;
}

// Mapeamento das propriedades do backend para frontend
function mapBackendToFrontend(backendData: Record<string, unknown>): RelatorioPessoaData {
  const saldo = (backendData.saldos as Record<string, unknown>[])[0]; // Pegar apenas a pessoa específica
  
  return {
    saldo: {
      pessoaId: saldo.pessoa_id as number,
      pessoaNome: saldo.pessoa_nome as string,
      pessoaEmail: saldo.pessoa_email as string,
      totalDeve: saldo.total_deve as number,
      totalPago: saldo.total_pago as number,
      saldoFinal: saldo.saldo_final as number,
      status: saldo.status as 'DEVEDOR' | 'CREDOR' | 'QUITADO',
      transacoesPendentes: saldo.transacoes_pendentes as number,
      ultimaTransacao: saldo.ultima_transacao as string,
      detalhes: (saldo.detalhes as Record<string, unknown>[])?.map((detalhe: Record<string, unknown>) => ({
        id: detalhe.transacao_id as number,
        descricao: detalhe.descricao as string,
        valorTotal: detalhe.valor_total as number,
        valorDevido: detalhe.valor_devido as number,
        valorPago: detalhe.valor_pago as number,
        dataTransacao: detalhe.data_transacao as string,
        statusPagamento: detalhe.status_pagamento as string,
        categoria: detalhe.categoria as string,
        tags: detalhe.tags as string[]
      }))
    },
    resumo: {
      totalTransacoes: (saldo.detalhes as Record<string, unknown>[])?.length || 0,
      transacoesPendentes: (saldo.detalhes as Record<string, unknown>[])?.filter((t: Record<string, unknown>) => t.status_pagamento === 'PENDENTE').length || 0,
      transacoesPagas: (saldo.detalhes as Record<string, unknown>[])?.filter((t: Record<string, unknown>) => t.status_pagamento === 'PAGO').length || 0,
      valorMedioTransacao: (saldo.detalhes as Record<string, unknown>[])?.length > 0 ? 
        (saldo.detalhes as Record<string, unknown>[]).reduce((sum: number, t: Record<string, unknown>) => sum + (t.valor_total as number), 0) / (saldo.detalhes as Record<string, unknown>[]).length : 0,
      maiorTransacao: Math.max(...((saldo.detalhes as Record<string, unknown>[])?.map((t: Record<string, unknown>) => t.valor_total as number) || [0])),
      menorTransacao: Math.min(...((saldo.detalhes as Record<string, unknown>[])?.map((t: Record<string, unknown>) => t.valor_total as number) || [0]))
    },
    transacoes: (saldo.detalhes as Record<string, unknown>[])?.map((detalhe: Record<string, unknown>) => ({
      id: detalhe.transacao_id as number,
      descricao: detalhe.descricao as string,
      valorTotal: detalhe.valor_total as number,
      valorDevido: detalhe.valor_devido as number,
      valorPago: detalhe.valor_pago as number,
      dataTransacao: detalhe.data_transacao as string,
      statusPagamento: detalhe.status_pagamento as string,
      categoria: detalhe.categoria as string,
      tags: detalhe.tags as string[]
    })) || [],
    filtrosAplicados: backendData.filtros_aplicados as RelatorioPessoaParams
  };
}

/**
 * Hook para dados de relatório de pessoa específica
 */
export function useRelatorioPessoa(params: RelatorioPessoaParams) {
  const { accessToken, hubAtual } = useAuth();

  const defaultParams: RelatorioPessoaParams = {
    periodo: 'mes_atual',
    incluirDetalhes: true,
    ...params,
  };

  return useQuery<RelatorioPessoaData>({
    queryKey: ['relatorio-pessoa', hubAtual?.id, defaultParams],
    queryFn: async () => {
      const response = await api.get('/relatorios/saldos', {
        params: {
          pessoa_id: defaultParams.pessoaId,
          data_inicio: defaultParams.dataInicio,
          data_fim: defaultParams.dataFim,
          incluir_detalhes: defaultParams.incluirDetalhes,
        },
      });
      
      // Mapear resposta do backend para formato do frontend
      return mapBackendToFrontend(response.data.data);
    },
    enabled: !!accessToken && !!hubAtual?.id && !!defaultParams.pessoaId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // 30 segundos (tempo real)
  });
}