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

// Mapeamento das propriedades do backend para frontend
function mapBackendToFrontend(backendData: Record<string, unknown>): PanoramaGeralData {
  const resumo = backendData.resumo as Record<string, unknown>;
  return {
    resumo: {
      totalDividasPendentes: resumo.total_dividas_pendentes as number,
      totalDividasVencidas: resumo.total_dividas_vencidas as number,
      pessoasComDividas: resumo.pessoas_com_dividas as number,
      mediaDividaPorPessoa: resumo.media_divida_por_pessoa as number,
      totalTransacoesPendentes: resumo.total_transacoes_pendentes as number,
      valorMaiorDivida: resumo.valor_maior_divida as number,
      pessoaMaiorDevedora: resumo.pessoa_maior_devedora as string
    },
    devedores: (backendData.devedores as Record<string, unknown>[]).map((devedor: Record<string, unknown>) => ({
      pessoaId: devedor.pessoa_id as number,
      nome: devedor.nome as string,
      totalDevido: devedor.total_devido as number,
      totalPago: devedor.total_pago as number,
      saldoDevido: devedor.saldo_devido as number,
      transacoesPendentes: devedor.transacoes_pendentes as number,
      transacoesVencidas: devedor.transacoes_vencidas as number,
      ultimoPagamento: devedor.ultimo_pagamento as string,
      diasSemPagamento: devedor.dias_sem_pagamento as number,
      detalhesTransacoes: (devedor.detalhes_transacoes as Record<string, unknown>[])?.map((detalhe: Record<string, unknown>) => ({
        transacaoId: detalhe.transacao_id as number,
        descricao: detalhe.descricao as string,
        valorDevido: detalhe.valor_devido as number,
        valorPago: detalhe.valor_pago as number,
        dataTransacao: detalhe.data_transacao as string,
        dataVencimento: detalhe.data_vencimento as string | undefined,
        status: detalhe.status as string,
        diasAtraso: detalhe.dias_atraso as number | undefined
      }))
    })),
    analisePorStatus: {
      pendentes: (backendData.analise_por_status as Record<string, unknown>).pendentes as { valor: number; quantidade: number },
      vencidas: (backendData.analise_por_status as Record<string, unknown>).vencidas as { valor: number; quantidade: number },
      venceHoje: (backendData.analise_por_status as Record<string, unknown>).vence_hoje as { valor: number; quantidade: number },
      venceSemana: (backendData.analise_por_status as Record<string, unknown>).vence_semana as { valor: number; quantidade: number }
    },
    filtrosAplicados: backendData.filtros_aplicados as PanoramaGeralParams
  };
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
      
      // Mapear resposta do backend para formato do frontend
      return mapBackendToFrontend(response.data.data);
    },
    enabled: !!accessToken && !!hubAtual?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // 30 segundos (tempo real)
  });
}