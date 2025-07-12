import { Request, Response } from 'express';
import { getExtendedPrismaClient } from '../utils/prisma';
import { 
  saldosQuerySchema,
  transacoesQuerySchema,
  pendenciasQuerySchema,
  dashboardQuerySchema,
  categoriasQuerySchema
} from '../schemas/relatorio';
import { 
  SaldosQueryInput,
  TransacoesQueryInput,
  PendenciasQueryInput,
  DashboardQueryInput,
  CategoriasQueryInput
} from '../schemas/relatorio';

// =============================================
// CONTROLLER DE RELATÓRIOS
// =============================================

/**
 * Relatório de saldos por pessoa
 * GET /api/relatorios/saldos
 */
export const getSaldos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar Prisma Client estendido com isolamento multi-tenant
    const prisma = getExtendedPrismaClient(req.auth!);
    
    // Validar e extrair parâmetros da query
    const queryData = saldosQuerySchema.parse(req.query);
    const {
      pessoa_id,
      apenas_ativos,
      data_inicio,
      data_fim,
      status_saldo,
      valor_minimo,
      ordenar_por,
      ordem,
      incluir_detalhes
    } = queryData;

    // Construir filtros de pessoas
    const wherePessoas: any = {};
    
    if (apenas_ativos) {
      wherePessoas.ativo = true;
    }
    
    if (pessoa_id) {
      wherePessoas.id = pessoa_id;
    }

    // Construir filtros de data para transações
    const whereTransacoes: any = {
      tipo: 'GASTO',
      confirmado: true
    };
    
    if (data_inicio || data_fim) {
      whereTransacoes.data_transacao = {};
      if (data_inicio) {
        whereTransacoes.data_transacao.gte = new Date(data_inicio);
      }
      if (data_fim) {
        whereTransacoes.data_transacao.lte = new Date(data_fim);
      }
    }

    // Buscar pessoas com participações
    const pessoas = await prisma.pessoas.findMany({
      where: wherePessoas,
      include: {
        transacao_participantes: {
          where: {
            transacoes: whereTransacoes
          },
          include: {
            transacoes: {
              select: {
                id: true,
                descricao: true,
                valor_total: true,
                data_transacao: true,
                status_pagamento: true
              }
            }
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    });

    // Calcular saldos
    const saldos = await Promise.all(
      pessoas.map(async (pessoa) => {
        // Calcular total devido
        const totalDeve = pessoa.transacao_participantes.reduce(
          (sum, participante) => sum + Number(participante.valor_devido || 0),
          0
        );

        // Calcular total pago
        const totalPago = pessoa.transacao_participantes.reduce(
          (sum, participante) => sum + Number(participante.valor_pago || 0),
          0
        );

        // Calcular saldo final
        const saldoFinal = totalPago - totalDeve;

        // Determinar status
        let status: 'DEVEDOR' | 'CREDOR' | 'QUITADO';
        if (Math.abs(saldoFinal) < 0.01) {
          status = 'QUITADO';
        } else if (saldoFinal < 0) {
          status = 'DEVEDOR';
        } else {
          status = 'CREDOR';
        }

        // Contar transações pendentes
        const transacoesPendentes = pessoa.transacao_participantes.filter(
          participante => Number(participante.valor_pago || 0) < Number(participante.valor_devido || 0)
        ).length;

        // Buscar última transação
        const ultimaTransacao = pessoa.transacao_participantes
          .sort((a, b) => new Date(b.transacoes.data_transacao).getTime() - new Date(a.transacoes.data_transacao).getTime())[0];

        // Preparar detalhes se solicitado
        let detalhes = undefined;
        if (incluir_detalhes) {
          detalhes = pessoa.transacao_participantes.map(participante => ({
            transacao_id: participante.transacoes.id,
            descricao: participante.transacoes.descricao,
            valor_devido: Number(participante.valor_devido || 0),
            valor_pago: Number(participante.valor_pago || 0),
            data_transacao: participante.transacoes.data_transacao.toISOString().split('T')[0]
          }));
        }

        return {
          pessoa_id: pessoa.id,
          pessoa_nome: pessoa.nome,
          pessoa_email: pessoa.email,
          total_deve: totalDeve,
          total_pago: totalPago,
          saldo_final: saldoFinal,
          status,
          transacoes_pendentes: transacoesPendentes,
          ultima_transacao: ultimaTransacao ? ultimaTransacao.transacoes.data_transacao.toISOString().split('T')[0] : undefined,
          detalhes
        };
      })
    );

    // Filtrar por status se especificado
    let saldosFiltrados = saldos;
    if (status_saldo !== 'TODOS') {
      saldosFiltrados = saldos.filter(saldo => saldo.status === status_saldo);
    }

    // Filtrar por valor mínimo se especificado
    if (valor_minimo !== undefined) {
      saldosFiltrados = saldosFiltrados.filter(saldo => Math.abs(saldo.saldo_final) >= valor_minimo);
    }

    // Ordenar resultados
    saldosFiltrados.sort((a, b) => {
      let comparison = 0;
      
      switch (ordenar_por) {
        case 'nome':
          comparison = a.pessoa_nome.localeCompare(b.pessoa_nome);
          break;
        case 'saldo':
          comparison = a.saldo_final - b.saldo_final;
          break;
        case 'total_deve':
          comparison = a.total_deve - b.total_deve;
          break;
        case 'total_pago':
          comparison = a.total_pago - b.total_pago;
          break;
      }
      
      return ordem === 'desc' ? -comparison : comparison;
    });

    // Calcular estatísticas
    const estatisticas = {
      total_pessoas: saldosFiltrados.length,
      total_devedores: saldosFiltrados.filter(s => s.status === 'DEVEDOR').length,
      total_credores: saldosFiltrados.filter(s => s.status === 'CREDOR').length,
      total_quitados: saldosFiltrados.filter(s => s.status === 'QUITADO').length,
      soma_dividas: saldosFiltrados.reduce((sum, s) => sum + (s.saldo_final < 0 ? Math.abs(s.saldo_final) : 0), 0),
      soma_creditos: saldosFiltrados.reduce((sum, s) => sum + (s.saldo_final > 0 ? s.saldo_final : 0), 0),
      saldo_geral: saldosFiltrados.reduce((sum, s) => sum + s.saldo_final, 0)
    };

    res.json({
      success: true,
      message: 'Relatório de saldos gerado com sucesso',
      data: {
        saldos: saldosFiltrados,
        estatisticas,
        filtros: {
          pessoa_id,
          apenas_ativos,
          data_inicio,
          data_fim,
          status_saldo,
          valor_minimo,
          ordenar_por,
          ordem,
          incluir_detalhes
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de saldos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar relatório de saldos',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Dashboard com métricas principais
 * GET /api/relatorios/dashboard
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // LOG: Contexto de autenticação recebido
    console.log('[BACKEND][DASHBOARD] req.auth:', req.auth);
    // LOG: Parâmetros recebidos na query
    console.log('[BACKEND][DASHBOARD] req.query:', req.query);
    // Usar Prisma Client estendido com isolamento multi-tenant
    const prisma = getExtendedPrismaClient(req.auth!);
    
    // Validar e extrair parâmetros da query
    const queryData = dashboardQuerySchema.parse(req.query);
    const {
      periodo,
      data_inicio,
      data_fim,
      incluir_graficos,
      incluir_comparativo,
      apenas_confirmadas
    } = queryData;

    // Calcular datas do período
    let dataInicio: Date;
    let dataFim: Date = new Date();
    
    if (periodo === 'personalizado' && data_inicio && data_fim) {
      dataInicio = new Date(data_inicio);
      dataFim = new Date(data_fim);
    } else {
      switch (periodo) {
        case '7_dias':
          dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 7);
          break;
        case '30_dias':
          dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 30);
          break;
        case '90_dias':
          dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 90);
          break;
        case '1_ano':
          dataInicio = new Date();
          dataInicio.setFullYear(dataInicio.getFullYear() - 1);
          break;
        default:
          dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 30);
      }
    }

    // Filtros base
    const whereBase: any = {
      data_transacao: {
        gte: dataInicio,
        lte: dataFim
      }
    };
    
    if (apenas_confirmadas) {
      whereBase.confirmado = true;
    }
    // LOG: Filtro base das queries
    console.log('[BACKEND][DASHBOARD] whereBase:', whereBase);

    // Buscar métricas principais
    console.log('[BACKEND][DASHBOARD] Query Gastos:', { ...whereBase, tipo: 'GASTO' });
    const [gastosStats, receitasStats, transacoesPendentes, pessoasComPendencias] = await Promise.all([
      // Gastos do período
      prisma.transacoes.aggregate({
        where: {
          ...whereBase,
          tipo: 'GASTO'
        },
        _sum: { valor_total: true },
        _count: { id: true }
      }),
      
      // Receitas do período
      prisma.transacoes.aggregate({
        where: {
          ...whereBase,
          tipo: 'RECEITA'
        },
        _sum: { valor_total: true },
        _count: { id: true }
      }),
      
      // Transações pendentes
      prisma.transacoes.count({
        where: {
          ...whereBase,
          tipo: 'GASTO',
          status_pagamento: {
            in: ['PENDENTE', 'PAGO_PARCIAL']
          }
        }
      }),
      
      // Pessoas com pendências
      prisma.transacao_participantes.findMany({
        where: {
          transacoes: {
            ...whereBase,
            tipo: 'GASTO',
            status_pagamento: {
              in: ['PENDENTE', 'PAGO_PARCIAL']
            }
          },
          OR: [
            {
              valor_pago: {
                lt: prisma.transacao_participantes.fields.valor_devido
              }
            },
            {
              valor_pago: null,
              valor_devido: {
                gt: 0
              }
            }
          ]
        },
        select: {
          pessoa_id: true
        },
        distinct: ['pessoa_id']
      })
    ]);

    // Preparar resumo
    const resumo = {
      total_gastos: Number(gastosStats._sum.valor_total || 0),
      total_receitas: Number(receitasStats._sum.valor_total || 0),
      saldo_periodo: Number(receitasStats._sum.valor_total || 0) - Number(gastosStats._sum.valor_total || 0),
      transacoes_pendentes: transacoesPendentes,
      pessoas_devedoras: pessoasComPendencias.length
    };

    // Preparar dados para resposta
    const responseData: any = {
      resumo,
      periodo: {
        tipo: periodo,
        data_inicio: dataInicio.toISOString().split('T')[0],
        data_fim: dataFim.toISOString().split('T')[0]
      }
    };

    // Buscar dados comparativos se solicitado
    if (incluir_comparativo) {
      const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
      const dataInicioAnterior = new Date(dataInicio);
      dataInicioAnterior.setDate(dataInicioAnterior.getDate() - diasPeriodo);
      const dataFimAnterior = new Date(dataInicio);
      dataFimAnterior.setDate(dataFimAnterior.getDate() - 1);

      const whereAnterior = {
        ...whereBase,
        data_transacao: {
          gte: dataInicioAnterior,
          lte: dataFimAnterior
        }
      };

      const [gastosAnteriores, receitasAnteriores, transacoesAnteriores] = await Promise.all([
        prisma.transacoes.aggregate({
          where: { ...whereAnterior, tipo: 'GASTO' },
          _sum: { valor_total: true }
        }),
        prisma.transacoes.aggregate({
          where: { ...whereAnterior, tipo: 'RECEITA' },
          _sum: { valor_total: true }
        }),
        prisma.transacoes.count({ where: whereAnterior })
      ]);

      const gastosAnteriorValor = Number(gastosAnteriores._sum.valor_total || 0);
      const receitasAnteriorValor = Number(receitasAnteriores._sum.valor_total || 0);

      responseData.comparativo = {
        gastos_variacao: gastosAnteriorValor > 0 
          ? ((resumo.total_gastos - gastosAnteriorValor) / gastosAnteriorValor) * 100 
          : 0,
        receitas_variacao: receitasAnteriorValor > 0 
          ? ((resumo.total_receitas - receitasAnteriorValor) / receitasAnteriorValor) * 100 
          : 0,
        transacoes_variacao: transacoesAnteriores > 0 
          ? (((gastosStats._count.id + receitasStats._count.id) - transacoesAnteriores) / transacoesAnteriores) * 100 
          : 0
      };
    }

    // Buscar dados para gráficos se solicitado
    if (incluir_graficos) {
      // Gastos por dia usando Prisma ORM
      const gastosTransacoes = await prisma.transacoes.findMany({
        where: {
          ...whereBase,
          tipo: 'GASTO'
        },
        select: {
          data_transacao: true,
          valor_total: true
        }
      });

       // Agrupar gastos por dia seguindo padrão do projeto
       const gastosPorDiaMap = new Map<number, number>();
       gastosTransacoes.forEach((transacao: any) => {
         const dataKey = transacao.data_transacao.getTime();
         const valorAtual = gastosPorDiaMap.get(dataKey) || 0;
         gastosPorDiaMap.set(dataKey, valorAtual + Number(transacao.valor_total));
       });

       const gastosPorDia = Array.from(gastosPorDiaMap.entries())
         .map(([timestamp, valor]) => ({ 
           data: new Date(timestamp).toISOString().split('T')[0], 
           valor 
         }))
         .sort((a, b) => a.data?.localeCompare(b.data || '') || 0);

      // Gastos por categoria usando Prisma ORM
      const gastosComTags = await prisma.transacoes.findMany({
        where: {
          ...whereBase,
          tipo: 'GASTO'
        },
        select: {
          valor_total: true,
          transacao_tags: {
            select: {
              tags: {
                select: {
                  nome: true,
                  cor: true
                }
              }
            }
          }
        }
      });

      // Agrupar gastos por categoria
      const gastosPorCategoriaMap = new Map<string, { valor: number, cor: string }>();
      
      gastosComTags.forEach((transacao: any) => {
        const valor = Number(transacao.valor_total);
        
        if (transacao.transacao_tags.length === 0) {
          // Sem categoria
          const atual = gastosPorCategoriaMap.get('Sem categoria') || { valor: 0, cor: '#6B7280' };
          gastosPorCategoriaMap.set('Sem categoria', { valor: atual.valor + valor, cor: atual.cor });
        } else {
          // Com tags
                     transacao.transacao_tags.forEach((tt: any) => {
             if (tt.tags) {
               const nomeTag = tt.tags.nome;
               const corTag = (tt.tags.cor as string) || '#6B7280';
               const atual = gastosPorCategoriaMap.get(nomeTag) || { valor: 0, cor: corTag };
               gastosPorCategoriaMap.set(nomeTag, { valor: atual.valor + valor, cor: atual.cor });
             }
           });
        }
      });

      const gastosPorCategoria = Array.from(gastosPorCategoriaMap.entries())
        .map(([categoria, dados]) => ({ categoria, valor: dados.valor, cor: dados.cor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      // Status de pagamentos usando Prisma ORM
      const statusPagamentos = await prisma.transacoes.groupBy({
        by: ['status_pagamento'],
        where: {
          ...whereBase,
          tipo: 'GASTO'
        },
        _count: { id: true }
      });

      responseData.graficos = {
        gastos_por_dia: gastosPorDia,
        gastos_por_categoria: gastosPorCategoria,
        status_pagamentos: statusPagamentos.reduce((acc: any, item) => {
          const status = item.status_pagamento?.toLowerCase().replace('_', '') || 'pendente';
          acc[status] = item._count.id;
          return acc;
        }, { pendente: 0, pagoparcial: 0, pagototal: 0 })
      };
    }

    // LOG: Resumo final retornado
    console.log('[BACKEND][DASHBOARD] Resumo final:', resumo);

    res.json({
      success: true,
      message: 'Dashboard gerado com sucesso',
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar dashboard',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Relatório de pendências
 * GET /api/relatorios/pendencias
 */
export const getPendencias = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar Prisma Client estendido com isolamento multi-tenant
    const prisma = getExtendedPrismaClient(req.auth!);
    
    // Validar e extrair parâmetros da query
    const queryData = pendenciasQuerySchema.parse(req.query);
    const {
      pessoa_id,
      apenas_ativos,
      valor_minimo,
      vencimento_ate,
      data_inicio,
      data_fim,
      urgencia,
      ordenar_por,
      ordem,
      agrupar_por,
      incluir_historico_pagamentos
    } = queryData;

    // Construir filtros
    const whereTransacoes: any = {
      tipo: 'GASTO',
      confirmado: true,
      status_pagamento: {
        in: ['PENDENTE', 'PAGO_PARCIAL']
      }
    };

    if (data_inicio || data_fim) {
      whereTransacoes.data_transacao = {};
      if (data_inicio) {
        whereTransacoes.data_transacao.gte = new Date(data_inicio);
      }
      if (data_fim) {
        whereTransacoes.data_transacao.lte = new Date(data_fim);
      }
    }

    if (vencimento_ate) {
      whereTransacoes.data_transacao = {
        ...whereTransacoes.data_transacao,
        lte: new Date(vencimento_ate)
      };
    }

    const wherePessoas: any = {};
    if (apenas_ativos) {
      wherePessoas.ativo = true;
    }
    if (pessoa_id) {
      wherePessoas.id = pessoa_id;
    }

    // Buscar participações com pendências
    const participacoes = await prisma.transacao_participantes.findMany({
      where: {
        transacoes: whereTransacoes,
        pessoas: wherePessoas,
        OR: [
          {
            valor_pago: {
              lt: prisma.transacao_participantes.fields.valor_devido
            }
          },
          {
            valor_pago: null,
            valor_devido: {
              gt: 0
            }
          }
        ]
      },
      include: {
        transacoes: {
          select: {
            id: true,
            descricao: true,
            valor_total: true,
            data_transacao: true,
            status_pagamento: true,
            local: true
          }
        },
        pessoas: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        }
      },
      orderBy: {
        transacoes: {
          data_transacao: 'asc'
        }
      }
    });

    // Processar pendências
    const pendencias = await Promise.all(
      participacoes.map(async (participante: any) => {
        const valorDevido = Number(participante.valor_devido || 0);
        const valorPago = Number(participante.valor_pago || 0);
        const valorPendente = valorDevido - valorPago;
        
        // Calcular dias de atraso
        const hoje = new Date();
        const dataTransacao = new Date(participante.transacoes.data_transacao);
        const diasAtraso = Math.floor((hoje.getTime() - dataTransacao.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determinar urgência
        let urgenciaCalculada: 'NORMAL' | 'ATRASADA' | 'VENCIDA';
        if (diasAtraso <= 0) {
          urgenciaCalculada = 'NORMAL';
        } else if (diasAtraso <= 30) {
          urgenciaCalculada = 'ATRASADA';
        } else {
          urgenciaCalculada = 'VENCIDA';
        }

        // Buscar histórico de pagamentos se solicitado
        let historicoPagamentos = undefined;
        if (incluir_historico_pagamentos) {
          historicoPagamentos = await prisma.pagamento_transacoes.findMany({
            where: {
              transacao_id: participante.transacoes.id,
              pagamentos: {
                pessoa_id: participante.pessoas.id
              }
            },
            include: {
              pagamentos: {
                select: {
                  id: true,
                  valor_total: true,
                  data_pagamento: true,
                  forma_pagamento: true,
                  observacoes: true
                }
              }
            },
            orderBy: {
              pagamentos: {
                data_pagamento: 'desc'
              }
            }
          });
        }

        return {
          transacao_id: participante.transacoes.id,
          pessoa_id: participante.pessoas.id,
          pessoa_nome: participante.pessoas.nome,
          pessoa_email: participante.pessoas.email,
          descricao: participante.transacoes.descricao,
          valor_devido: valorDevido,
          valor_pago: valorPago,
          valor_pendente: valorPendente,
          data_transacao: participante.transacoes.data_transacao.toISOString().split('T')[0],
          dias_atraso: diasAtraso,
          urgencia: urgenciaCalculada,
          local: participante.transacoes.local,
          historico_pagamentos: historicoPagamentos
        };
      })
    );

    // Filtrar por valor mínimo
    let pendenciasFiltradas = pendencias;
    if (valor_minimo !== undefined) {
      pendenciasFiltradas = pendencias.filter((pendencia: any) => pendencia.valor_pendente >= valor_minimo);
    }

    // Filtrar por urgência
    if (urgencia !== 'TODAS') {
      pendenciasFiltradas = pendenciasFiltradas.filter((pendencia: any) => pendencia.urgencia === urgencia);
    }

    // Ordenar resultados
    pendenciasFiltradas.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (ordenar_por) {
        case 'pessoa_nome':
          comparison = a.pessoa_nome.localeCompare(b.pessoa_nome);
          break;
        case 'valor_devido':
          comparison = a.valor_pendente - b.valor_pendente;
          break;
        case 'data_transacao':
          comparison = new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime();
          break;
        case 'dias_atraso':
          const urgenciaOrder: { [key: string]: number } = { 'VENCIDA': 3, 'ATRASADA': 2, 'NORMAL': 1 };
          comparison = (urgenciaOrder[a.urgencia] || 0) - (urgenciaOrder[b.urgencia] || 0);
          break;
      }
      
      return ordem === 'desc' ? -comparison : comparison;
    });

    // Agrupar resultados se solicitado
    let agrupamento = undefined;
    if (agrupar_por && agrupar_por !== 'nenhum') {
      const grupos = new Map();
      
      pendenciasFiltradas.forEach((pendencia: any) => {
        let chave: string;
        
        switch (agrupar_por) {
          case 'pessoa':
            chave = pendencia.pessoa_nome;
            break;
          case 'urgencia':
            chave = pendencia.urgencia;
            break;
          case 'tag':
            chave = 'Geral'; // Não implementado ainda
            break;
          default:
            chave = 'Geral';
        }
        
        if (!grupos.has(chave)) {
          grupos.set(chave, {
            chave,
            total_pendencias: 0,
            valor_total: 0,
            pendencias: []
          });
        }
        
        const grupo = grupos.get(chave);
        grupo.total_pendencias++;
        grupo.valor_total += pendencia.valor_pendente;
        grupo.pendencias.push(pendencia);
      });
      
      agrupamento = Array.from(grupos.values());
    }

    // Calcular estatísticas
    const estatisticas = {
      total_pendencias: pendenciasFiltradas.length,
      valor_total_pendente: pendenciasFiltradas.reduce((sum: number, p: any) => sum + p.valor_pendente, 0),
      pessoas_com_pendencias: new Set(pendenciasFiltradas.map((p: any) => p.pessoa_id)).size,
      pendencias_vencidas: pendenciasFiltradas.filter((p: any) => p.urgencia === 'VENCIDA').length,
      valor_vencido: pendenciasFiltradas.filter((p: any) => p.urgencia === 'VENCIDA').reduce((sum: number, p: any) => sum + p.valor_pendente, 0),
      media_dias_atraso: pendenciasFiltradas.length > 0 
        ? pendenciasFiltradas.reduce((sum: number, p: any) => sum + p.dias_atraso, 0) / pendenciasFiltradas.length 
        : 0
    };

    res.json({
      success: true,
      message: 'Relatório de pendências gerado com sucesso',
      data: {
        pendencias: pendenciasFiltradas,
        agrupamento,
        estatisticas,
        filtros: {
          pessoa_id,
          apenas_ativos,
          valor_minimo,
          vencimento_ate,
          data_inicio,
          data_fim,
          urgencia,
          ordenar_por,
          ordem,
          agrupar_por
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de pendências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar relatório de pendências',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Relatório completo de transações
 * GET /api/relatorios/transacoes
 */
export const getTransacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar Prisma Client estendido com isolamento multi-tenant
    const prisma = getExtendedPrismaClient(req.auth!);
    
    // Validar e extrair parâmetros da query
    const queryData = transacoesQuerySchema.parse(req.query);
    const {
      tipo,
      status_pagamento,
      data_inicio,
      data_fim,
      proprietario_id,
      participante_id,
      tag_id,
      valor_min,
      valor_max,
      eh_parcelado,
      grupo_parcela,
      page = 1,
      limit = 20,
      ordenar_por,
      ordem,
      agrupar_por,
      incluir_participantes,
      incluir_tags,
      incluir_pagamentos
    } = queryData;

    // Construir filtros
    const where: any = {
      confirmado: true
    };

    if (tipo !== 'TODOS') {
      where.tipo = tipo;
    }

    if (status_pagamento !== 'TODOS') {
      where.status_pagamento = status_pagamento;
    }

    if (data_inicio || data_fim) {
      where.data_transacao = {};
      if (data_inicio) {
        where.data_transacao.gte = new Date(data_inicio);
      }
      if (data_fim) {
        where.data_transacao.lte = new Date(data_fim);
      }
    }

    if (proprietario_id) {
      where.proprietario_id = proprietario_id;
    }

    if (participante_id) {
      where.transacao_participantes = {
        some: {
          pessoa_id: participante_id
        }
      };
    }

    if (tag_id) {
      where.transacao_tags = {
        some: {
          tag_id: tag_id
        }
      };
    }

    if (valor_min !== undefined) {
      where.valor_total = {
        ...where.valor_total,
        gte: valor_min
      };
    }

    if (valor_max !== undefined) {
      where.valor_total = {
        ...where.valor_total,
        lte: valor_max
      };
    }

    if (eh_parcelado !== undefined) {
      where.eh_parcelado = eh_parcelado;
    }

    if (grupo_parcela) {
      where.grupo_parcela = grupo_parcela;
    }

    // Calcular total para paginação
    const total = await prisma.transacoes.count({ where });

    // Buscar transações com paginação
    const transacoes = await prisma.transacoes.findMany({
      where,
      include: {
        pessoas_transacoes_proprietario_idTopessoas: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        transacao_participantes: incluir_participantes ? {
          include: {
            pessoas: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        } : false,
        transacao_tags: incluir_tags ? {
          include: {
            tags: {
              select: {
                id: true,
                nome: true,
                cor: true,
                icone: true
              }
            }
          }
        } : false,
        pagamento_transacoes: incluir_pagamentos ? {
          include: {
            pagamentos: {
              select: {
                id: true,
                valor_total: true,
                data_pagamento: true,
                forma_pagamento: true
              }
            }
          }
        } : false
      },
      orderBy: {
        [ordenar_por]: ordem
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Formatar transações
    const transacoesFormatadas = transacoes.map((transacao: any) => ({
      id: transacao.id,
      descricao: transacao.descricao,
      tipo: transacao.tipo,
      valor_total: Number(transacao.valor_total),
      data_transacao: transacao.data_transacao.toISOString().split('T')[0],
      status_pagamento: transacao.status_pagamento,
      local: transacao.local,
      observacoes: transacao.observacoes,
      eh_parcelado: transacao.eh_parcelado,
      total_parcelas: transacao.total_parcelas,
      grupo_parcela: transacao.grupo_parcela,
      proprietario: transacao.pessoas_transacoes_proprietario_idTopessoas,
      participantes: incluir_participantes ? transacao.transacao_participantes?.map((p: any) => ({
        pessoa_id: p.pessoas.id,
        pessoa_nome: p.pessoas.nome,
        pessoa_email: p.pessoas.email,
        valor_devido: Number(p.valor_devido || 0),
        valor_pago: Number(p.valor_pago || 0)
      })) : undefined,
      tags: incluir_tags ? transacao.transacao_tags?.map((tt: any) => ({
        id: tt.tags.id,
        nome: tt.tags.nome,
        cor: tt.tags.cor,
        icone: tt.tags.icone
      })) : undefined,
      pagamentos: incluir_pagamentos ? transacao.pagamento_transacoes?.map((pt: any) => ({
        id: pt.pagamentos.id,
        valor_total: Number(pt.pagamentos.valor_total),
        data_pagamento: pt.pagamentos.data_pagamento.toISOString().split('T')[0],
        forma_pagamento: pt.pagamentos.forma_pagamento
      })) : undefined
    }));

    // Processar agrupamento
    let agrupamento = undefined;
    if (agrupar_por && agrupar_por !== 'nenhum') {
      const grupos = new Map();
      
      transacoesFormatadas.forEach((transacao: any) => {
        let chave: string;
        
        switch (agrupar_por) {
          case 'tipo':
            chave = transacao.tipo;
            break;
          case 'pessoa':
            chave = transacao.proprietario?.nome || 'Sem proprietário';
            break;
          case 'tag':
            chave = transacao.tags?.[0]?.nome || 'Sem categoria';
            break;
          case 'mes':
            const data = new Date(transacao.data_transacao);
            chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            chave = 'Geral';
        }
        
        if (!grupos.has(chave)) {
          grupos.set(chave, {
            chave,
            total_transacoes: 0,
            valor_total: 0,
            transacoes: []
          });
        }
        
        const grupo = grupos.get(chave);
        grupo.total_transacoes++;
        grupo.valor_total += transacao.valor_total;
        grupo.transacoes.push(transacao);
      });
      
      agrupamento = Array.from(grupos.values());
    }

    // Calcular estatísticas
    const estatisticas = {
      total_transacoes: total,
      total_gastos: transacoes.filter((t: any) => t.tipo === 'GASTO').length,
      total_receitas: transacoes.filter((t: any) => t.tipo === 'RECEITA').length,
      valor_total_gastos: transacoes
        .filter((t: any) => t.tipo === 'GASTO')
        .reduce((sum: number, t: any) => sum + Number(t.valor_total), 0),
      valor_total_receitas: transacoes
        .filter((t: any) => t.tipo === 'RECEITA')
        .reduce((sum: number, t: any) => sum + Number(t.valor_total), 0),
      transacoes_pendentes: transacoes.filter((t: any) => t.status_pagamento === 'PENDENTE').length,
      transacoes_parceladas: transacoes.filter((t: any) => t.eh_parcelado).length
    };

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: `${transacoes.length} transação(ões) encontrada(s)`,
      data: {
        transacoes: transacoesFormatadas,
        agrupamento,
        estatisticas,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        },
        filtros: {
          tipo,
          status_pagamento,
          data_inicio,
          data_fim,
          proprietario_id,
          participante_id,
          tag_id,
          valor_min,
          valor_max,
          eh_parcelado,
          grupo_parcela,
          ordenar_por,
          ordem,
          agrupar_por
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar relatório de transações',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Relatório de análise por categorias/tags
 * GET /api/relatorios/categorias
 */
export const getCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar Prisma Client estendido com isolamento multi-tenant
    const prisma = getExtendedPrismaClient(req.auth!);
    
    // Validar e extrair parâmetros da query
    const queryData = categoriasQuerySchema.parse(req.query);
    const {
      data_inicio,
      data_fim,
      tipo,
      tag_ids,
      metrica,
      ordenar_por,
      ordem,
      limite,
      incluir_sem_categoria
    } = queryData;

    // Construir filtros base
    const whereTransacoes: any = {
      confirmado: true
    };

    // Filtros de tipo
    if (tipo !== 'TODOS') {
      whereTransacoes.tipo = tipo;
    }

    // Filtros de data
    if (data_inicio || data_fim) {
      whereTransacoes.data_transacao = {};
      if (data_inicio) {
        whereTransacoes.data_transacao.gte = new Date(data_inicio);
      }
      if (data_fim) {
        whereTransacoes.data_transacao.lte = new Date(data_fim);
      }
    }

    // Filtros de tags específicas
    if (tag_ids && tag_ids.length > 0) {
      whereTransacoes.transacao_tags = {
        some: {
          tag_id: {
            in: tag_ids
          }
        }
      };
    }

    // Buscar todas as transações com tags usando Prisma puro
    const transacoesComTags = await prisma.transacoes.findMany({
      where: whereTransacoes,
      include: {
        transacao_tags: {
          include: {
            tags: true
          }
        }
      }
    });

    // Mapear dados por categoria/tag usando JavaScript nativo
    const categoriaMap = new Map<number, {
      tag_id: number;
      categoria: string;
      cor: string;
      valores: number[];
      transacoes: any[];
    }>();

    transacoesComTags.forEach((transacao: any) => {
      const valor = Number(transacao.valor_total);
      
      if (transacao.transacao_tags.length === 0) {
        // Sem categoria
        if (incluir_sem_categoria) {
          const semCategoria = categoriaMap.get(-1) || {
            tag_id: -1,
            categoria: 'Sem categoria',
            cor: '#6B7280',
            valores: [] as number[],
            transacoes: [] as any[]
          };
          semCategoria.valores.push(valor);
          semCategoria.transacoes.push(transacao);
          categoriaMap.set(-1, semCategoria);
        }
      } else {
        // Com tags
        transacao.transacao_tags.forEach((tt: any) => {
          if (tt.tags) {
            const tagId = tt.tags.id;
            const categoria = categoriaMap.get(tagId) || {
              tag_id: tagId,
              categoria: tt.tags.nome,
              cor: (tt.tags.cor as string) || '#6B7280',
              valores: [] as number[],
              transacoes: [] as any[]
            };
            categoria.valores.push(valor);
            categoria.transacoes.push(transacao);
            categoriaMap.set(tagId, categoria);
          }
        });
      }
    });

    // Calcular métricas por categoria
    const categorias = Array.from(categoriaMap.values()).map(categoria => {
      const valores = categoria.valores;
      const valor_total = valores.reduce((sum, val) => sum + val, 0);
      const quantidade_transacoes = categoria.transacoes.length;
      const valor_medio = quantidade_transacoes > 0 ? valor_total / quantidade_transacoes : 0;

      return {
        tag_id: categoria.tag_id,
        categoria: categoria.categoria,
        cor: categoria.cor,
        valor_total,
        quantidade_transacoes,
        valor_medio,
        percentual_valor: 0, // Será calculado depois
        percentual_quantidade: 0 // Será calculado depois
      };
    });

    // Calcular totais para percentuais
    const totalValor = categorias.reduce((sum, cat) => sum + cat.valor_total, 0);
    const totalQuantidade = categorias.reduce((sum, cat) => sum + cat.quantidade_transacoes, 0);

    // Calcular percentuais
    categorias.forEach(categoria => {
      categoria.percentual_valor = totalValor > 0 ? (categoria.valor_total / totalValor) * 100 : 0;
      categoria.percentual_quantidade = totalQuantidade > 0 ? (categoria.quantidade_transacoes / totalQuantidade) * 100 : 0;
    });

    // Ordenar por métrica selecionada
    categorias.sort((a, b) => {
      let comparison = 0;
      
      switch (ordenar_por) {
        case 'valor':
          comparison = a.valor_total - b.valor_total;
          break;
        case 'quantidade':
          comparison = a.quantidade_transacoes - b.quantidade_transacoes;
          break;
        case 'nome_tag':
          comparison = a.categoria.localeCompare(b.categoria);
          break;
      }
      
      return ordem === 'desc' ? -comparison : comparison;
    });

    // Aplicar limite
    const categoriasLimitadas = categorias.slice(0, limite);

    // Calcular estatísticas
    const estatisticas = {
      total_categorias: categorias.length,
      categorias_analisadas: categoriasLimitadas.length,
      valor_total_analisado: categoriasLimitadas.reduce((sum, cat) => sum + cat.valor_total, 0),
      quantidade_total_analisada: categoriasLimitadas.reduce((sum, cat) => sum + cat.quantidade_transacoes, 0),
      valor_medio_geral: categoriasLimitadas.length > 0 
        ? categoriasLimitadas.reduce((sum, cat) => sum + cat.valor_total, 0) / categoriasLimitadas.length 
        : 0,
      categoria_maior_valor: categoriasLimitadas.length > 0 ? categoriasLimitadas[0] : null,
      categoria_mais_frequente: categoriasLimitadas.length > 0 
        ? categoriasLimitadas.reduce((max, cat) => cat.quantidade_transacoes > max.quantidade_transacoes ? cat : max)
        : null
    };

    // Preparar dados para gráficos
    const dadosGrafico = {
      pizza_valor: categoriasLimitadas.map(cat => ({
        categoria: cat.categoria,
        valor: cat.valor_total,
        percentual: cat.percentual_valor,
        cor: cat.cor
      })),
      pizza_quantidade: categoriasLimitadas.map(cat => ({
        categoria: cat.categoria,
        quantidade: cat.quantidade_transacoes,
        percentual: cat.percentual_quantidade,
        cor: cat.cor
      })),
      barras_comparativo: categoriasLimitadas.map(cat => ({
        categoria: cat.categoria,
        valor_total: cat.valor_total,
        quantidade: cat.quantidade_transacoes,
        valor_medio: cat.valor_medio,
        cor: cat.cor
      }))
    };

    res.json({
      success: true,
      message: `Análise de ${categoriasLimitadas.length} categoria(s) gerada com sucesso`,
      data: {
        categorias: categoriasLimitadas,
        estatisticas,
        graficos: dadosGrafico,
        filtros: {
          data_inicio,
          data_fim,
          tipo,
          tag_ids,
          metrica,
          ordenar_por,
          ordem,
          limite,
          incluir_sem_categoria
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar relatório de categorias',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Relatório de saldo histórico por pessoa
 * GET /api/relatorios/saldo-historico/:pessoa_id
 */
export const getSaldoHistoricoPessoa = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar Prisma Client estendido com isolamento multi-tenant
    const prisma = getExtendedPrismaClient(req.auth!);
    
    const pessoaIdParam = req.params.pessoa_id;
    if (!pessoaIdParam) {
      res.status(400).json({
        success: false,
        message: 'ID da pessoa é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const pessoaId = parseInt(pessoaIdParam);
    
    if (isNaN(pessoaId)) {
      res.status(400).json({
        success: false,
        message: 'ID da pessoa deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Buscar participações da pessoa
    const participacoes = await prisma.transacao_participantes.findMany({
      where: {
        pessoa_id: pessoaId,
        transacoes: {
          confirmado: true
        }
      },
      include: {
        transacoes: {
          select: {
            id: true,
            descricao: true,
            valor_total: true,
            data_transacao: true,
            tipo: true
          }
        }
      },
      orderBy: {
        transacoes: {
          data_transacao: 'asc'
        }
      }
    });

    // Buscar pagamentos da pessoa
    const pagamentos = await prisma.pagamentos.findMany({
      where: {
        pessoa_id: pessoaId
      },
      select: {
        id: true,
        valor_total: true,
        data_pagamento: true,
        forma_pagamento: true
      },
      orderBy: {
        data_pagamento: 'asc'
      }
    });

    // Buscar receitas da pessoa
    const receitas = await prisma.transacoes.findMany({
      where: {
        proprietario_id: pessoaId,
        tipo: 'RECEITA',
        confirmado: true
      },
      select: {
        id: true,
        descricao: true,
        valor_total: true,
        data_transacao: true
      },
      orderBy: {
        data_transacao: 'asc'
      }
    });

    // Calcular saldo histórico
    let saldoAtual = 0;
    const historico: any[] = [];

    // Processar participações em gastos
    participacoes.forEach((p: any) => {
      const valorDevido = Number(p.valor_devido || 0);
      const valorPago = Number(p.valor_pago || 0);
      const valorPendente = valorDevido - valorPago;
      
      saldoAtual -= valorPendente;
      
      historico.push({
        data: p.transacoes.data_transacao.toISOString().split('T')[0],
        tipo: 'GASTO',
        descricao: p.transacoes.descricao,
        valor: valorPendente,
        saldo_apos: saldoAtual
      });
    });

    // Processar pagamentos
    pagamentos.forEach((p: any) => {
      const valor = Number(p.valor_total);
      saldoAtual += valor;
      
      historico.push({
        data: p.data_pagamento.toISOString().split('T')[0],
        tipo: 'PAGAMENTO',
        descricao: `Pagamento - ${p.forma_pagamento}`,
        valor: valor,
        saldo_apos: saldoAtual
      });
    });

    // Processar receitas
    receitas.forEach((r: any) => {
      const valor = Number(r.valor_total);
      saldoAtual += valor;
      
      historico.push({
        data: r.data_transacao.toISOString().split('T')[0],
        tipo: 'RECEITA',
        descricao: r.descricao,
        valor: valor,
        saldo_apos: saldoAtual
      });
    });

    // Ordenar histórico por data
    historico.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    res.json({
      success: true,
      message: 'Histórico de saldo gerado com sucesso',
      data: {
        pessoa_id: pessoaId,
        saldo_atual: saldoAtual,
        historico: historico,
        estatisticas: {
          total_movimentacoes: historico.length,
          total_gastos: historico.filter(h => h.tipo === 'GASTO').length,
          total_pagamentos: historico.filter(h => h.tipo === 'PAGAMENTO').length,
          total_receitas: historico.filter(h => h.tipo === 'RECEITA').length,
          valor_total_gastos: historico.filter(h => h.tipo === 'GASTO').reduce((sum, h) => sum + h.valor, 0),
          valor_total_pagamentos: historico.filter(h => h.tipo === 'PAGAMENTO').reduce((sum, h) => sum + h.valor, 0),
          valor_total_receitas: historico.filter(h => h.tipo === 'RECEITA').reduce((sum, h) => sum + h.valor, 0)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar histórico de saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao gerar histórico de saldo',
      timestamp: new Date().toISOString()
    });
  }
}; 
