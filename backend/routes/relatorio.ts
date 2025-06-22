import { Router } from 'express';
import {
  getSaldos,
  getDashboard,
  getPendencias,
  getTransacoes,
  getCategorias
} from '../controllers/relatorioController';
import {
  saldosQuerySchema,
  dashboardQuerySchema,
  pendenciasQuerySchema,
  transacoesQuerySchema,
  categoriasQuerySchema
} from '../schemas/relatorio';
import {
  requireAuth,
  validateQuery
} from '../middleware/auth';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE RELATÓRIOS
// =============================================

const router = Router();

// =============================================
// ROTA DE INFORMAÇÕES (DEVE VIR ANTES DE /:id)
// =============================================

/**
 * GET /api/relatorios/info
 * Retorna informações sobre as rotas de relatórios
 */
router.get('/info', (req, res) => {
  res.json({
    message: '📊 Sistema de Relatórios - Personal Expense Hub',
    description: 'Sistema completo de relatórios para análise de gastos, saldos e tendências financeiras',
    version: '1.0.0',
    status: 'Operacional',
    baseUrl: '/api/relatorios',
    features: [
      '📈 Dashboard com métricas principais',
      '💰 Relatórios de saldos por pessoa',
      '⚠️ Análise de pendências e vencimentos',
      '📋 Relatórios completos de transações',
      '🏷️ Análise por categorias/tags',
      '📊 Dados preparados para gráficos',
      '🔍 Filtros avançados e agrupamentos',
      '📑 Paginação e ordenação flexível'
    ],
    businessRules: [
      'Apenas usuários autenticados podem acessar relatórios',
      'Todos os relatórios incluem apenas transações confirmadas',
      'Datas são filtradas no formato YYYY-MM-DD',
      'Valores monetários são retornados com 2 casas decimais',
      'Estatísticas são calculadas em tempo real'
    ],
    endpoints: {
      dashboard: {
        method: 'GET',
        path: '/api/relatorios/dashboard',
        description: 'Dashboard com resumo executivo e métricas principais',
        auth: 'Requerida',
        query: {
          periodo: '7_dias|30_dias|90_dias|1_ano|personalizado (padrão: 30_dias)',
          data_inicio: 'YYYY-MM-DD (obrigatório se período = personalizado)',
          data_fim: 'YYYY-MM-DD (obrigatório se período = personalizado)',
          incluir_graficos: 'boolean (padrão: true) - Dados para gráficos',
          incluir_comparativo: 'boolean (padrão: true) - Comparativo com período anterior',
          apenas_confirmadas: 'boolean (padrão: true) - Apenas transações confirmadas'
        },
        response: {
          resumo: 'Métricas principais (gastos, receitas, saldo, pendências)',
          comparativo: 'Variações percentuais vs período anterior (opcional)',
          graficos: 'Dados formatados para gráficos (opcional)',
          periodo: 'Informações do período analisado'
        }
      },
      saldos: {
        method: 'GET',
        path: '/api/relatorios/saldos',
        description: 'Relatório detalhado de saldos por pessoa',
        auth: 'Requerida',
        query: {
          pessoa_id: 'number (opcional) - Filtrar por pessoa específica',
          apenas_ativos: 'boolean (padrão: true) - Apenas pessoas ativas',
          data_inicio: 'YYYY-MM-DD (opcional) - Período inicial',
          data_fim: 'YYYY-MM-DD (opcional) - Período final',
          status_saldo: 'DEVEDOR|CREDOR|QUITADO|TODOS (padrão: TODOS)',
          valor_minimo: 'number (opcional) - Valor mínimo do saldo',
          ordenar_por: 'nome|saldo|total_deve|total_pago (padrão: nome)',
          ordem: 'asc|desc (padrão: asc)',
          incluir_detalhes: 'boolean (padrão: false) - Detalhes das transações'
        },
        response: {
          saldos: 'Array com saldo de cada pessoa',
          estatisticas: 'Resumo geral dos saldos',
          filtros: 'Filtros aplicados na consulta'
        }
      },
      pendencias: {
        method: 'GET',
        path: '/api/relatorios/pendencias',
        description: 'Relatório de pendências e vencimentos',
        auth: 'Requerida',
        query: {
          pessoa_id: 'number (opcional) - Filtrar por pessoa',
          apenas_ativos: 'boolean (padrão: true) - Apenas pessoas ativas',
          valor_minimo: 'number (padrão: 0.01) - Valor mínimo da pendência',
          vencimento_ate: 'YYYY-MM-DD (opcional) - Vencimentos até esta data',
          data_inicio: 'YYYY-MM-DD (opcional) - Período inicial',
          data_fim: 'YYYY-MM-DD (opcional) - Período final',
          urgencia: 'VENCIDA|VENCE_HOJE|VENCE_SEMANA|VENCE_MES|TODAS (padrão: TODAS)',
          ordenar_por: 'valor_devido|data_transacao|pessoa_nome|dias_atraso (padrão: valor_devido)',
          ordem: 'asc|desc (padrão: desc)',
          agrupar_por: 'pessoa|urgencia|tag|nenhum (padrão: pessoa)',
          incluir_historico_pagamentos: 'boolean (padrão: false)'
        },
        response: {
          pendencias: 'Array com pendências detalhadas',
          agrupamento: 'Dados agrupados conforme solicitado (opcional)',
          estatisticas: 'Resumo das pendências',
          filtros: 'Filtros aplicados'
        }
      },
      transacoes: {
        method: 'GET',
        path: '/api/relatorios/transacoes',
        description: 'Relatório completo de transações com filtros avançados',
        auth: 'Requerida',
        query: {
          tipo: 'GASTO|RECEITA|TODOS (padrão: TODOS)',
          status_pagamento: 'PENDENTE|PAGO_PARCIAL|PAGO_TOTAL|TODOS (padrão: TODOS)',
          data_inicio: 'YYYY-MM-DD (opcional)',
          data_fim: 'YYYY-MM-DD (opcional)',
          proprietario_id: 'number (opcional) - Filtrar por proprietário',
          participante_id: 'number (opcional) - Filtrar por participante',
          tag_id: 'number (opcional) - Filtrar por tag',
          valor_min: 'number (opcional) - Valor mínimo',
          valor_max: 'number (opcional) - Valor máximo',
          eh_parcelado: 'boolean (opcional) - Apenas parceladas',
          grupo_parcela: 'UUID (opcional) - Grupo específico de parcelas',
          page: 'number (padrão: 1) - Página',
          limit: 'number (padrão: 20, máx: 100) - Itens por página',
          ordenar_por: 'data_transacao|valor_total|descricao|criado_em (padrão: data_transacao)',
          ordem: 'asc|desc (padrão: desc)',
          agrupar_por: 'mes|tag|pessoa|tipo|nenhum (padrão: nenhum)',
          incluir_participantes: 'boolean (padrão: true)',
          incluir_tags: 'boolean (padrão: true)',
          incluir_pagamentos: 'boolean (padrão: false)'
        },
        response: {
          transacoes: 'Array de transações formatadas',
          agrupamento: 'Dados agrupados (opcional)',
          estatisticas: 'Métricas das transações',
          pagination: 'Informações de paginação',
          filtros: 'Filtros aplicados'
        }
      },
      categorias: {
        method: 'GET',
        path: '/api/relatorios/categorias',
        description: 'Análise detalhada por categorias/tags',
        auth: 'Requerida',
        query: {
          data_inicio: 'YYYY-MM-DD (opcional)',
          data_fim: 'YYYY-MM-DD (opcional)',
          tipo: 'GASTO|RECEITA|TODOS (padrão: GASTO)',
          tag_ids: 'string (opcional) - IDs separados por vírgula',
          metrica: 'valor_total|quantidade|valor_medio (padrão: valor_total)',
          ordenar_por: 'valor|quantidade|nome_tag (padrão: valor)',
          ordem: 'asc|desc (padrão: desc)',
          limite: 'number (padrão: 10, máx: 50) - Número de categorias',
          incluir_sem_categoria: 'boolean (padrão: true)'
        },
        response: {
          categorias: 'Array com análise por categoria',
          estatisticas: 'Resumo geral das categorias',
          graficos: 'Dados preparados para gráficos',
          filtros: 'Filtros aplicados'
        }
      }
    },
    examples: {
      dashboard_30_dias: '/api/relatorios/dashboard?periodo=30_dias&incluir_graficos=true',
      saldos_devedores: '/api/relatorios/saldos?status_saldo=DEVEDOR&ordenar_por=saldo&ordem=desc',
      pendencias_vencidas: '/api/relatorios/pendencias?urgencia=VENCIDA&agrupar_por=pessoa',
      transacoes_janeiro: '/api/relatorios/transacoes?data_inicio=2024-01-01&data_fim=2024-01-31&tipo=GASTO',
      categorias_top10: '/api/relatorios/categorias?limite=10&tipo=GASTO&ordenar_por=valor'
    }
  });
});

// =============================================
// RELATÓRIOS PRINCIPAIS
// =============================================

/**
 * GET /api/relatorios/dashboard
 * Dashboard com métricas principais do sistema
 */
router.get('/dashboard', 
  requireAuth,
  validateQuery(dashboardQuerySchema),
  getDashboard
);

/**
 * GET /api/relatorios/saldos
 * Relatório de saldos por pessoa
 */
router.get('/saldos',
  requireAuth,
  validateQuery(saldosQuerySchema),
  getSaldos
);

/**
 * GET /api/relatorios/pendencias
 * Relatório de pendências e vencimentos
 */
router.get('/pendencias',
  requireAuth,
  validateQuery(pendenciasQuerySchema),
  getPendencias
);

/**
 * GET /api/relatorios/transacoes
 * Relatório completo de transações
 */
router.get('/transacoes',
  requireAuth,
  validateQuery(transacoesQuerySchema),
  getTransacoes
);

/**
 * GET /api/relatorios/categorias
 * Análise por categorias/tags
 */
router.get('/categorias',
  requireAuth,
  validateQuery(categoriasQuerySchema),
  getCategorias
);

export default router; 