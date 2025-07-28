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
function mapBackendToFrontend(backendData: any): RelatorioPessoaData {
  const saldo = backendData.saldos[0]; // Pegar apenas a pessoa específica
  
  return {
    saldo: {
      pessoaId: saldo.pessoa_id,
      pessoaNome: saldo.pessoa_nome,
      pessoaEmail: saldo.pessoa_email,
      totalDeve: saldo.total_deve,
      totalPago: saldo.total_pago,
      saldoFinal: saldo.saldo_final,
      status: saldo.status,
      transacoesPendentes: saldo.transacoes_pendentes,
      ultimaTransacao: saldo.ultima_transacao,
      detalhes: saldo.detalhes?.map((detalhe: any) => ({
        id: detalhe.transacao_id,
        descricao: detalhe.descricao,
        valorTotal: detalhe.valor_total,
        valorDevido: detalhe.valor_devido,
        valorPago: detalhe.valor_pago,
        dataTransacao: detalhe.data_transacao,
        statusPagamento: detalhe.status_pagamento,
        categoria: detalhe.categoria,
        tags: detalhe.tags
      }))
    },
    resumo: {
      totalTransacoes: saldo.detalhes?.length || 0,
      transacoesPendentes: saldo.detalhes?.filter((t: any) => t.status_pagamento === 'PENDENTE').length || 0,
      transacoesPagas: saldo.detalhes?.filter((t: any) => t.status_pagamento === 'PAGO').length || 0,
      valorMedioTransacao: saldo.detalhes?.length > 0 ? 
        saldo.detalhes.reduce((sum: number, t: any) => sum + t.valor_total, 0) / saldo.detalhes.length : 0,
      maiorTransacao: Math.max(...(saldo.detalhes?.map((t: any) => t.valor_total) || [0])),
      menorTransacao: Math.min(...(saldo.detalhes?.map((t: any) => t.valor_total) || [0]))
    },
    transacoes: saldo.detalhes?.map((detalhe: any) => ({
      id: detalhe.transacao_id,
      descricao: detalhe.descricao,
      valorTotal: detalhe.valor_total,
      valorDevido: detalhe.valor_devido,
      valorPago: detalhe.valor_pago,
      dataTransacao: detalhe.data_transacao,
      statusPagamento: detalhe.status_pagamento,
      categoria: detalhe.categoria,
      tags: detalhe.tags
    })) || [],
    filtrosAplicados: backendData.filtros_aplicados
  };
}

/**
 * Hook para dados de relatório de pessoa específica
 */
export function useRelatorioPessoa(params: RelatorioPessoaParams) {
  const { accessToken, hubAtual } = useAuth();

  const defaultParams: RelatorioPessoaParams = {
    pessoaId: params.pessoaId,
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