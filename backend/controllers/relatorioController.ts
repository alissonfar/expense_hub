import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

// =============================================
// CONTROLLER DE RELATÓRIOS
// =============================================

/**
 * Relatório de saldos por pessoa
 * GET /api/relatorios/saldos
 */
export const getSaldos = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Buscar métricas principais
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
       gastosTransacoes.forEach(transacao => {
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
      
      gastosComTags.forEach(transacao => {
        const valor = Number(transacao.valor_total);
        
        if (transacao.transacao_tags.length === 0) {
          // Sem categoria
          const atual = gastosPorCategoriaMap.get('Sem categoria') || { valor: 0, cor: '#6B7280' };
          gastosPorCategoriaMap.set('Sem categoria', { valor: atual.valor + valor, cor: atual.cor });
        } else {
          // Com tags
                     transacao.transacao_tags.forEach(tt => {
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

    // Buscar participações com pendências usando Prisma ORM puro
    const pendenciasRaw = await prisma.transacao_participantes.findMany({
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
              gte: valor_minimo
            }
          }
        ]
      },
      include: {
        pessoas: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        transacoes: {
          select: {
            id: true,
            descricao: true,
            local: true,
            valor_total: true,
            data_transacao: true,
            status_pagamento: true,
            observacoes: true
          }
        }
      }
    });

    // Processar dados seguindo padrão do projeto
    const pendencias = pendenciasRaw.map(participante => {
      const valorDevido = Number(participante.valor_devido || 0);
      const valorPago = Number(participante.valor_pago || 0);
      const valorPendente = valorDevido - valorPago;
      
      // Calcular dias de atraso
      const hoje = new Date();
      const dataTransacao = participante.transacoes.data_transacao;
      const diasAtraso = Math.floor((hoje.getTime() - dataTransacao.getTime()) / (1000 * 60 * 60 * 24));

      return {
        transacao_id: participante.transacao_id,
        pessoa_id: participante.pessoa_id,
        pessoa_nome: participante.pessoas.nome,
        pessoa_email: participante.pessoas.email,
        descricao: participante.transacoes.descricao,
        local: participante.transacoes.local,
        valor_total_transacao: Number(participante.transacoes.valor_total),
        valor_devido: valorDevido,
        valor_pago: valorPago,
        valor_pendente: valorPendente,
        data_transacao: participante.transacoes.data_transacao.toISOString().split('T')[0],
        status_pagamento: participante.transacoes.status_pagamento,
        observacoes: participante.transacoes.observacoes,
        dias_atraso: diasAtraso
      };
    }).filter(pendencia => pendencia.valor_pendente >= valor_minimo);

    // Processar pendências com urgência seguindo padrão do projeto
    const pendenciasProcessadas = pendencias.map(pendencia => {
      const diasAtraso = pendencia.dias_atraso;
      
      // Determinar urgência
      let urgenciaItem: string;
      if (diasAtraso > 0) {
        urgenciaItem = 'VENCIDA';
      } else if (diasAtraso === 0) {
        urgenciaItem = 'VENCE_HOJE';
      } else if (diasAtraso >= -7) {
        urgenciaItem = 'VENCE_SEMANA';
      } else if (diasAtraso >= -30) {
        urgenciaItem = 'VENCE_MES';
      } else {
        urgenciaItem = 'FUTURA';
      }

      return {
        ...pendencia,
        urgencia: urgenciaItem
      };
    });

    // Filtrar por urgência
    let pendenciasFiltradas = pendenciasProcessadas;
    if (urgencia !== 'TODAS') {
      pendenciasFiltradas = pendenciasProcessadas.filter(p => p.urgencia === urgencia);
    }

    // Processar agrupamento
    let agrupamento = undefined;
    if (agrupar_por !== 'nenhum') {
      const grupos = new Map();
      
      pendenciasFiltradas.forEach(pendencia => {
        let chaveGrupo: string;
        
        switch (agrupar_por) {
          case 'pessoa':
            chaveGrupo = `${pendencia.pessoa_id}-${pendencia.pessoa_nome}`;
            break;
          case 'urgencia':
            chaveGrupo = pendencia.urgencia;
            break;
          default:
            chaveGrupo = 'outros';
        }
        
        if (!grupos.has(chaveGrupo)) {
          grupos.set(chaveGrupo, {
            grupo: chaveGrupo,
            quantidade: 0,
            valor_total: 0,
            itens: []
          });
        }
        
        const grupo = grupos.get(chaveGrupo);
        grupo.quantidade++;
        grupo.valor_total += pendencia.valor_pendente;
        grupo.itens.push(pendencia);
      });
      
      agrupamento = Array.from(grupos.values());
    }

    // Calcular estatísticas
    const estatisticas = {
      total_pendencias: pendenciasFiltradas.length,
      valor_total_pendente: pendenciasFiltradas.reduce((sum, p) => sum + p.valor_pendente, 0),
      pessoas_com_pendencias: new Set(pendenciasFiltradas.map(p => p.pessoa_id)).size,
      pendencias_vencidas: pendenciasFiltradas.filter(p => p.urgencia === 'VENCIDA').length,
      valor_vencido: pendenciasFiltradas.filter(p => p.urgencia === 'VENCIDA').reduce((sum, p) => sum + p.valor_pendente, 0),
      media_dias_atraso: pendenciasFiltradas.length > 0 
        ? pendenciasFiltradas.reduce((sum, p) => sum + p.dias_atraso, 0) / pendenciasFiltradas.length 
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
      page,
      limit,
      ordenar_por,
      ordem,
      agrupar_por,
      incluir_participantes,
      incluir_tags,
      incluir_pagamentos
    } = queryData;

    // Construir filtros base
    const whereTransacoes: any = {
      confirmado: true
    };

    // Filtros de tipo
    if (tipo !== 'TODOS') {
      whereTransacoes.tipo = tipo;
    }

    // Filtros de status
    if (status_pagamento !== 'TODOS') {
      whereTransacoes.status_pagamento = status_pagamento;
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

    // Filtros de pessoa
    if (proprietario_id) {
      whereTransacoes.proprietario_id = proprietario_id;
    }

    if (participante_id) {
      whereTransacoes.transacao_participantes = {
        some: {
          pessoa_id: participante_id
        }
      };
    }

    // Filtros de tag
    if (tag_id) {
      whereTransacoes.transacao_tags = {
        some: {
          tag_id: tag_id
        }
      };
    }

    // Filtros de valor
    if (valor_min !== undefined || valor_max !== undefined) {
      whereTransacoes.valor_total = {};
      if (valor_min !== undefined) {
        whereTransacoes.valor_total.gte = valor_min;
      }
      if (valor_max !== undefined) {
        whereTransacoes.valor_total.lte = valor_max;
      }
    }

    // Filtros de parcelamento
    if (eh_parcelado !== undefined) {
      whereTransacoes.eh_parcelado = eh_parcelado;
    }

    if (grupo_parcela) {
      whereTransacoes.grupo_parcela = grupo_parcela;
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Definir ordenação
    const orderBy: any = {};
    orderBy[ordenar_por] = ordem;

    // Preparar include baseado nos parâmetros
    const include: any = {
      pessoas_transacoes_proprietario_idTopessoas: {
        select: {
          id: true,
          nome: true,
          email: true
        }
      }
    };

    if (incluir_participantes) {
      include.transacao_participantes = {
        include: {
          pessoas: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      };
    }

    if (incluir_tags) {
      include.transacao_tags = {
        include: {
          tags: {
            select: {
              id: true,
              nome: true,
              cor: true
            }
          }
        }
      };
    }

    if (incluir_pagamentos) {
      include.pagamento_transacoes = {
        include: {
          pagamentos: {
            select: {
              id: true,
              valor_total: true,
              data_pagamento: true,
              forma_pagamento: true,
              pessoas_pagamentos_pessoa_idTopessoas: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        }
      };
    }

    // Buscar transações
    const [transacoes, total] = await Promise.all([
      prisma.transacoes.findMany({
        where: whereTransacoes,
        include,
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.transacoes.count({ where: whereTransacoes })
    ]);

    // Processar agrupamento se solicitado
    let agrupamento = undefined;
    if (agrupar_por !== 'nenhum') {
      const grupos = new Map();
      
      transacoes.forEach(transacao => {
        let chaveGrupo: string;
        
        switch (agrupar_por) {
          case 'mes':
            const data = new Date(transacao.data_transacao);
            chaveGrupo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            break;
                     case 'tag':
             const primeiraTag = (transacao as any).transacao_tags?.[0]?.tags?.nome || 'Sem categoria';
             chaveGrupo = primeiraTag;
             break;
           case 'pessoa':
             chaveGrupo = (transacao as any).pessoas_transacoes_proprietario_idTopessoas.nome;
            break;
          case 'tipo':
            chaveGrupo = transacao.tipo;
            break;
          default:
            chaveGrupo = 'outros';
        }
        
        if (!grupos.has(chaveGrupo)) {
          grupos.set(chaveGrupo, {
            grupo: chaveGrupo,
            quantidade: 0,
            valor_total: 0,
            transacoes: []
          });
        }
        
        const grupo = grupos.get(chaveGrupo);
        grupo.quantidade++;
        grupo.valor_total += Number(transacao.valor_total);
        grupo.transacoes.push(transacao.id);
      });
      
      agrupamento = Array.from(grupos.values());
    }

         // Formatar transações
     const transacoesFormatadas = transacoes.map(transacao => {
       const tr = transacao as any;
       return {
         id: tr.id,
         tipo: tr.tipo,
         descricao: tr.descricao,
         local: tr.local,
         valor_total: Number(tr.valor_total),
         data_transacao: tr.data_transacao.toISOString().split('T')[0],
         status_pagamento: tr.status_pagamento,
         eh_parcelado: tr.eh_parcelado,
         parcela_atual: tr.parcela_atual,
         total_parcelas: tr.total_parcelas,
         valor_parcela: Number(tr.valor_parcela),
         grupo_parcela: tr.grupo_parcela,
         observacoes: tr.observacoes,
         confirmado: tr.confirmado,
         data_criacao: tr.data_criacao,
         proprietario: {
           id: tr.pessoas_transacoes_proprietario_idTopessoas?.id,
           nome: tr.pessoas_transacoes_proprietario_idTopessoas?.nome,
           email: tr.pessoas_transacoes_proprietario_idTopessoas?.email
         },
         participantes: incluir_participantes ? tr.transacao_participantes?.map((tp: any) => ({
           pessoa_id: tp.pessoa_id,
           nome: tp.pessoas?.nome,
           valor_devido: Number(tp.valor_devido || 0),
           valor_pago: Number(tp.valor_pago || 0),
           eh_proprietario: tp.eh_proprietario
         })) : undefined,
         tags: incluir_tags ? tr.transacao_tags?.map((tt: any) => ({
           id: tt.tags?.id,
           nome: tt.tags?.nome,
           cor: tt.tags?.cor
         })) : undefined,
         pagamentos: incluir_pagamentos ? tr.pagamento_transacoes?.map((pt: any) => ({
           pagamento_id: pt.pagamentos?.id,
           valor_aplicado: Number(pt.valor_aplicado),
           data_pagamento: pt.pagamentos?.data_pagamento.toISOString().split('T')[0],
           forma_pagamento: pt.pagamentos?.forma_pagamento,
           pessoa_pagadora: pt.pagamentos?.pessoas_pagamentos_pessoa_idTopessoas?.nome
         })) : undefined
       };
     });

    // Calcular estatísticas
    const estatisticas = {
      total_transacoes: total,
      total_gastos: transacoes.filter(t => t.tipo === 'GASTO').length,
      total_receitas: transacoes.filter(t => t.tipo === 'RECEITA').length,
      valor_total_gastos: transacoes
        .filter(t => t.tipo === 'GASTO')
        .reduce((sum, t) => sum + Number(t.valor_total), 0),
      valor_total_receitas: transacoes
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + Number(t.valor_total), 0),
      transacoes_pendentes: transacoes.filter(t => t.status_pagamento === 'PENDENTE').length,
      transacoes_parceladas: transacoes.filter(t => t.eh_parcelado).length
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

    // Processamento das transações
    transacoesComTags.forEach(transacao => {
      if (transacao.transacao_tags.length === 0) {
        // Transação sem categoria
        if (incluir_sem_categoria) {
          const semCategoriaKey = 0;
          if (!categoriaMap.has(semCategoriaKey)) {
            categoriaMap.set(semCategoriaKey, {
              tag_id: 0,
              categoria: 'Sem categoria',
              cor: '#6B7280',
              valores: [],
              transacoes: []
            });
          }
                     const categoria = categoriaMap.get(semCategoriaKey)!;
           categoria.valores.push(Number(transacao.valor_total));
           categoria.transacoes.push(transacao);
        }
      } else {
        // Transação com uma ou mais tags
        transacao.transacao_tags.forEach(transacaoTag => {
          const tag = transacaoTag.tags;
          if (tag) {
            if (!categoriaMap.has(tag.id)) {
              categoriaMap.set(tag.id, {
                tag_id: tag.id,
                categoria: tag.nome,
                cor: tag.cor || '#6B7280',
                valores: [],
                transacoes: []
              });
            }
                         const categoria = categoriaMap.get(tag.id)!;
             categoria.valores.push(Number(transacao.valor_total));
             categoria.transacoes.push(transacao);
          }
        });
      }
    });

    // Processar dados das categorias
    const categoriasProcessadas = Array.from(categoriaMap.values()).map(categoria => {
      const valores = categoria.valores;
      const quantidade_transacoes = valores.length;
      const valor_total = valores.reduce((sum, val) => sum + val, 0);
      const valor_medio = quantidade_transacoes > 0 ? valor_total / quantidade_transacoes : 0;
      const valor_minimo = quantidade_transacoes > 0 ? Math.min(...valores) : 0;
      const valor_maximo = quantidade_transacoes > 0 ? Math.max(...valores) : 0;
      
      const datasTransacoes = categoria.transacoes.map(t => t.data_transacao);
      const primeira_transacao = datasTransacoes.length > 0 ? new Date(Math.min(...datasTransacoes.map(d => d.getTime()))) : null;
      const ultima_transacao = datasTransacoes.length > 0 ? new Date(Math.max(...datasTransacoes.map(d => d.getTime()))) : null;

      return {
        tag_id: categoria.tag_id,
        categoria: categoria.categoria,
        cor: categoria.cor,
        quantidade_transacoes,
        valor_total,
        valor_medio,
        valor_minimo,
        valor_maximo,
        primeira_transacao: primeira_transacao ? primeira_transacao.toISOString().split('T')[0] : null,
        ultima_transacao: ultima_transacao ? ultima_transacao.toISOString().split('T')[0] : null,
        percentual_valor: 0, // Será calculado abaixo
        percentual_quantidade: 0 // Será calculado abaixo
      };
    });

    // Ordenar categorias
    categoriasProcessadas.sort((a, b) => {
      let valueA, valueB;
      if (ordenar_por === 'valor') {
        valueA = a.valor_total;
        valueB = b.valor_total;
      } else if (ordenar_por === 'quantidade') {
        valueA = a.quantidade_transacoes;
        valueB = b.quantidade_transacoes;
      } else {
        valueA = a.categoria.toLowerCase();
        valueB = b.categoria.toLowerCase();
        return ordem === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      return ordem === 'asc' ? valueA - valueB : valueB - valueA;
    });

    // Aplicar limite
    const categoriasLimitadas = categoriasProcessadas.slice(0, limite);

    // Calcular percentuais
    const totalValor = categoriasLimitadas.reduce((sum, cat) => sum + cat.valor_total, 0);
    const totalQuantidade = categoriasLimitadas.reduce((sum, cat) => sum + cat.quantidade_transacoes, 0);

    categoriasLimitadas.forEach(categoria => {
      categoria.percentual_valor = totalValor > 0 
        ? (categoria.valor_total / totalValor) * 100 
        : 0;
      categoria.percentual_quantidade = totalQuantidade > 0 
        ? (categoria.quantidade_transacoes / totalQuantidade) * 100 
        : 0;
    });

    // Calcular estatísticas gerais
    const estatisticas = {
      total_categorias: categoriasLimitadas.length,
      valor_total_geral: totalValor,
      quantidade_total_geral: totalQuantidade,
      valor_medio_geral: totalQuantidade > 0 ? totalValor / totalQuantidade : 0,
      categoria_maior_valor: categoriasLimitadas.length > 0 
        ? categoriasLimitadas.reduce((max, cat) => cat.valor_total > max.valor_total ? cat : max)
        : null,
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
