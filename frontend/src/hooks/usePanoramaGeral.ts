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
function mapBackendToFrontend(backendData: Record<string, any>): PanoramaGeralData {
  return {
    resumo: {
      totalDividasPendentes: backendData.resumo.total_dividas_pendentes,
      totalDividasVencidas: backendData.resumo.total_dividas_vencidas,
      pessoasComDividas: backendData.resumo.pessoas_com_dividas,
      mediaDividaPorPessoa: backendData.resumo.media_divida_por_pessoa,
      totalTransacoesPendentes: backendData.resumo.total_transacoes_pendentes,
      valorMaiorDivida: backendData.resumo.valor_maior_divida,
      pessoaMaiorDevedora: backendData.resumo.pessoa_maior_devedora
    },
    devedores: backendData.devedores.map((devedor: Record<string, any>) => ({
      pessoaId: devedor.pessoa_id,
      nome: devedor.nome,
      totalDevido: devedor.total_devido,
      totalPago: devedor.total_pago,
      saldoDevido: devedor.saldo_devido,
      transacoesPendentes: devedor.transacoes_pendentes,
      transacoesVencidas: devedor.transacoes_vencidas,
      ultimoPagamento: devedor.ultimo_pagamento,
      diasSemPagamento: devedor.dias_sem_pagamento,
      detalhesTransacoes: devedor.detalhes_transacoes?.map((detalhe: Record<string, any>) => ({
        transacaoId: detalhe.transacao_id,
        descricao: detalhe.descricao,
        valorDevido: detalhe.valor_devido,
        valorPago: detalhe.valor_pago,
        dataTransacao: detalhe.data_transacao,
        dataVencimento: detalhe.data_vencimento,
        status: detalhe.status,
        diasAtraso: detalhe.dias_atraso
      }))
    })),
    analisePorStatus: {
      pendentes: backendData.analise_por_status.pendentes,
      vencidas: backendData.analise_por_status.vencidas,
      venceHoje: backendData.analise_por_status.vence_hoje,
      venceSemana: backendData.analise_por_status.vence_semana
    },
    filtrosAplicados: backendData.filtros_aplicados
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