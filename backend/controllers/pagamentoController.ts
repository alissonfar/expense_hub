import { Request, Response } from 'express';
import { 
  createPagamentoSchema,
  createPagamentoIndividualSchema,
  createPagamentoCompostoSchema,
  updatePagamentoSchema,
  pagamentoParamsSchema,
  pagamentoQuerySchema,
  configuracaoExcedenteSchema,
  CreatePagamentoInput,
  UpdatePagamentoInput,
  PagamentoParamsInput,
  PagamentoQueryInput,
  ConfiguracaoExcedenteInput
} from '../schemas/pagamento';
import { z } from 'zod';

// =============================================
// CONTROLLER DE PAGAMENTOS COMPOSTOS
// =============================================

/**
 * Lista todos os pagamentos (com filtros avançados)
 * GET /api/pagamentos
 */
export const listPagamentos = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse e validação da query com valores padrão
    const queryParams = pagamentoQuerySchema.parse(req.query);
    const {
      pessoa_id,
      transacao_id,
      data_inicio,
      data_fim,
      forma_pagamento,
      tem_excedente,
      valor_min,
      valor_max,
      page = 1,
      limit = 20,
      sort_by = 'data_pagamento',
      sort_order = 'desc'
    } = queryParams;

    // Construir filtros WHERE
    const where: any = {};

    if (pessoa_id) {
      where.pessoa_id = pessoa_id;
    }

    if (data_inicio || data_fim) {
      where.data_pagamento = {};
      if (data_inicio) {
        where.data_pagamento.gte = new Date(data_inicio);
      }
      if (data_fim) {
        where.data_pagamento.lte = new Date(data_fim);
      }
    }

    if (forma_pagamento) {
      where.forma_pagamento = forma_pagamento;
    }

    if (tem_excedente !== undefined) {
      if (tem_excedente) {
        where.valor_excedente = { gt: 0 };
      } else {
        where.OR = [
          { valor_excedente: null },
          { valor_excedente: 0 }
        ];
      }
    }

    if (valor_min !== undefined || valor_max !== undefined) {
      where.valor_total = {};
      if (valor_min !== undefined) {
        where.valor_total.gte = valor_min;
      }
      if (valor_max !== undefined) {
        where.valor_total.lte = valor_max;
      }
    }

    // Filtro específico para transação (buscar em pagamento_transacoes)
    if (transacao_id) {
      where.pagamento_transacoes = {
        some: {
          transacao_id: transacao_id
        }
      };
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Definir ordenação
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // Buscar pagamentos com relacionamentos
    const [pagamentos, total] = await Promise.all([
      req.prisma.pagamentos.findMany({
        where,
        include: {
          pessoas_pagamentos_pessoa_idTopessoas: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          pessoas_pagamentos_registrado_porTopessoas: {
            select: {
              id: true,
              nome: true
            }
          },
          receita_excedente: {
            select: {
              id: true,
              descricao: true,
              valor_total: true,
              tipo: true
            }
          },
          pagamento_transacoes: {
            include: {
              transacoes: {
                select: {
                  id: true,
                  descricao: true,
                  tipo: true,
                  valor_total: true,
                  status_pagamento: true,
                  data_transacao: true
                }
              }
            },
            orderBy: {
              criado_em: 'asc'
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      req.prisma.pagamentos.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // Formatar resposta
    const pagamentosFormatados = pagamentos.map(pagamento => ({
      id: pagamento.id,
      pessoa: {
        id: pagamento.pessoas_pagamentos_pessoa_idTopessoas.id,
        nome: pagamento.pessoas_pagamentos_pessoa_idTopessoas.nome,
        email: pagamento.pessoas_pagamentos_pessoa_idTopessoas.email
      },
      valor_total: Number(pagamento.valor_total),
      valor_excedente: pagamento.valor_excedente ? Number(pagamento.valor_excedente) : null,
      data_pagamento: pagamento.data_pagamento.toISOString().split('T')[0],
      forma_pagamento: pagamento.forma_pagamento,
      observacoes: pagamento.observacoes,
      processar_excedente: pagamento.processar_excedente,
      criado_em: pagamento.criado_em,
      registrado_por: {
        id: pagamento.pessoas_pagamentos_registrado_porTopessoas.id,
        nome: pagamento.pessoas_pagamentos_registrado_porTopessoas.nome
      },
      receita_excedente: pagamento.receita_excedente ? {
        id: pagamento.receita_excedente.id,
        descricao: pagamento.receita_excedente.descricao,
        valor_total: Number(pagamento.receita_excedente.valor_total)
      } : null,
      transacoes_pagas: pagamento.pagamento_transacoes.map(pt => ({
        transacao_id: pt.transacao_id,
        valor_aplicado: Number(pt.valor_aplicado),
        transacao: {
          id: pt.transacoes.id,
          descricao: pt.transacoes.descricao,
          tipo: pt.transacoes.tipo,
          valor_total: Number(pt.transacoes.valor_total),
          status_pagamento: pt.transacoes.status_pagamento,
          data_transacao: pt.transacoes.data_transacao.toISOString().split('T')[0]
        }
      }))
    }));

    res.json({
      success: true,
      message: `${pagamentos.length} pagamento(s) encontrado(s)`,
      data: pagamentosFormatados,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar os pagamentos',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Busca detalhes de um pagamento específico
 * GET /api/pagamentos/:id
 */
export const getPagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parâmetro ID
    const { id }: PagamentoParamsInput = pagamentoParamsSchema.parse(req.params);

    const pagamento = await req.prisma.pagamentos.findUnique({
      where: { id },
      include: {
        pessoas_pagamentos_pessoa_idTopessoas: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        pessoas_pagamentos_registrado_porTopessoas: {
          select: {
            id: true,
            nome: true
          }
        },
        receita_excedente: {
          select: {
            id: true,
            descricao: true,
            valor_total: true,
            tipo: true,
            data_transacao: true
          }
        },
        pagamento_transacoes: {
          include: {
            transacoes: {
              include: {
                transacao_participantes: {
                  where: {
                    pessoa_id: id // Buscar participação específica da pessoa que pagou
                  },
                  select: {
                    valor_devido: true,
                    valor_pago: true
                  }
                }
              }
            }
          },
          orderBy: {
            criado_em: 'asc'
          }
        }
      }
    });

    if (!pagamento) {
      res.status(404).json({
        error: 'Pagamento não encontrado',
        message: 'O pagamento solicitado não existe ou foi removido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Calcular estatísticas do pagamento
    const totalTransacoes = pagamento.pagamento_transacoes.length;
    const valorTotalOriginal = pagamento.pagamento_transacoes.reduce(
      (acc, pt) => acc + Number(pt.valor_aplicado), 
      0
    );

    // Formatar resposta detalhada
    const pagamentoDetalhado = {
      id: pagamento.id,
      pessoa: {
        id: pagamento.pessoas_pagamentos_pessoa_idTopessoas.id,
        nome: pagamento.pessoas_pagamentos_pessoa_idTopessoas.nome,
        email: pagamento.pessoas_pagamentos_pessoa_idTopessoas.email,
        telefone: pagamento.pessoas_pagamentos_pessoa_idTopessoas.telefone
      },
      valor_total: Number(pagamento.valor_total),
      valor_excedente: pagamento.valor_excedente ? Number(pagamento.valor_excedente) : null,
      data_pagamento: pagamento.data_pagamento.toISOString().split('T')[0],
      forma_pagamento: pagamento.forma_pagamento,
      observacoes: pagamento.observacoes,
      processar_excedente: pagamento.processar_excedente,
      criado_em: pagamento.criado_em,
      atualizado_em: pagamento.atualizado_em,
      registrado_por: {
        id: pagamento.pessoas_pagamentos_registrado_porTopessoas.id,
        nome: pagamento.pessoas_pagamentos_registrado_porTopessoas.nome
      },
      receita_excedente: pagamento.receita_excedente ? {
        id: pagamento.receita_excedente.id,
        descricao: pagamento.receita_excedente.descricao,
        valor_total: Number(pagamento.receita_excedente.valor_total),
        tipo: pagamento.receita_excedente.tipo,
        data_transacao: pagamento.receita_excedente.data_transacao.toISOString().split('T')[0]
      } : null,
      transacoes_pagas: pagamento.pagamento_transacoes.map(pt => ({
        transacao_id: pt.transacao_id,
        valor_aplicado: Number(pt.valor_aplicado),
        transacao: {
          id: pt.transacoes.id,
          descricao: pt.transacoes.descricao,
          tipo: pt.transacoes.tipo,
          valor_total: Number(pt.transacoes.valor_total),
          status_pagamento: pt.transacoes.status_pagamento,
          data_transacao: pt.transacoes.data_transacao.toISOString().split('T')[0],
          participacao: pt.transacoes.transacao_participantes[0] ? {
            valor_devido: Number(pt.transacoes.transacao_participantes[0].valor_devido),
            valor_pago: Number(pt.transacoes.transacao_participantes[0].valor_pago)
          } : null
        }
      })),
      estatisticas: {
        total_transacoes: totalTransacoes,
        valor_original: valorTotalOriginal,
        tem_excedente: Number(pagamento.valor_excedente || 0) > 0,
        excedente_processado: !!pagamento.receita_excedente_id
      }
    };

    res.json({
      success: true,
      message: 'Pagamento encontrado com sucesso',
      data: pagamentoDetalhado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        message: 'ID do pagamento deve ser um número válido',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o pagamento',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cria um novo pagamento (individual ou composto)
 * POST /api/pagamentos
 */
export const createPagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar dados de entrada (schema unificado)
    const dadosValidados: CreatePagamentoInput = createPagamentoSchema.parse(req.body);

    // Determinar tipo de pagamento
    const ehPagamentoComposto = 'transacoes' in dadosValidados && dadosValidados.transacoes;
    
    // Executar transação no banco
    const resultado = await req.prisma.$transaction(async (prisma) => {
      
      if (ehPagamentoComposto) {
        // ====================================
        // PAGAMENTO COMPOSTO (MÚLTIPLAS TRANSAÇÕES)
        // ====================================
        const dadosCompostos = dadosValidados as any; // Cast necessário devido ao union type
        
        // 1. Validar se todas as transações existem e pessoa participa
        const transacoesIds = dadosCompostos.transacoes.map((t: any) => t.transacao_id);
        const transacoesExistentes = await prisma.transacoes.findMany({
          where: {
            id: { in: transacoesIds },
            tipo: 'GASTO' // Só pode pagar gastos
          },
          include: {
            transacao_participantes: {
              where: {
                pessoa_id: dadosCompostos.pessoa_id || userId // Usar pessoa do body ou usuário logado
              }
            }
          }
        });

        if (transacoesExistentes.length !== transacoesIds.length) {
          throw new Error('Uma ou mais transações não foram encontradas ou não são gastos');
        }

        // Verificar se pessoa participa de todas as transações
        const transacoesSemParticipacao = transacoesExistentes.filter(
          t => t.transacao_participantes.length === 0
        );

        if (transacoesSemParticipacao.length > 0) {
          const idsNaoParticipa = transacoesSemParticipacao.map(t => t.id);
          throw new Error(`Pessoa não participa das transações: ${idsNaoParticipa.join(', ')}`);
        }

        // 2. Validar valores aplicados vs. valores devidos
        for (const detalhe of dadosCompostos.transacoes) {
          const transacao = transacoesExistentes.find(t => t.id === detalhe.transacao_id);
          if (!transacao) {
            throw new Error(`Transação ${detalhe.transacao_id} não encontrada`);
          }
          
          const participacao = transacao.transacao_participantes[0];
          if (!participacao) {
            throw new Error(`Participação não encontrada para transação ${detalhe.transacao_id}`);
          }
          
          const valorDevido = Number(participacao.valor_devido || 0);
          const valorJaPago = Number(participacao.valor_pago || 0);
          const valorRestante = valorDevido - valorJaPago;
          
          if (detalhe.valor_aplicado > valorRestante) {
            throw new Error(
              `Valor aplicado R$ ${detalhe.valor_aplicado.toFixed(2)} é maior que o restante devido R$ ${valorRestante.toFixed(2)} na transação ${detalhe.transacao_id}`
            );
          }
        }

        // 3. Calcular totais
        const valorTotalAplicado = dadosCompostos.transacoes.reduce(
          (acc: number, t: any) => acc + t.valor_aplicado, 
          0
        );
        
        const valorTotalPago = Number(dadosCompostos.valor_total || valorTotalAplicado);
        const valorExcedente = Math.max(0, valorTotalPago - valorTotalAplicado);

        // 4. Criar pagamento principal
        const pagamento = await prisma.pagamentos.create({
          data: {
            pessoa_id: dadosCompostos.pessoa_id || userId,
            valor_total: valorTotalPago,
            valor_excedente: valorExcedente > 0 ? valorExcedente : null,
            data_pagamento: new Date(dadosCompostos.data_pagamento),
            forma_pagamento: dadosCompostos.forma_pagamento,
            observacoes: dadosCompostos.observacoes || null,
            processar_excedente: dadosCompostos.processar_excedente,
            registrado_por: userId
          }
        });

        // 5. Criar detalhes do pagamento (pagamento_transacoes)
        const detalhesData = dadosCompostos.transacoes.map((t: any) => ({
          pagamento_id: pagamento.id,
          transacao_id: t.transacao_id,
          valor_aplicado: t.valor_aplicado
        }));

        await prisma.pagamento_transacoes.createMany({
          data: detalhesData
        });

        // 6. Triggers do banco processarão excedente automaticamente
        // Trigger 'processar_excedente_pagamento' será executado após inserção

        return { pagamento, receitaExcedente: null, detalhes: detalhesData };
        
      } else {
        // ====================================
        // PAGAMENTO INDIVIDUAL (COMPATIBILIDADE)
        // ====================================
        const dadosIndividuais = dadosValidados as any; // Cast necessário devido ao union type
        
        // 1. Validar se transação existe e pessoa participa
        const transacao = await prisma.transacoes.findFirst({
          where: {
            id: dadosIndividuais.transacao_id,
            tipo: 'GASTO'
          },
          include: {
            transacao_participantes: {
              where: {
                pessoa_id: dadosIndividuais.pessoa_id || userId
              }
            }
          }
        });

        if (!transacao) {
          throw new Error('Transação não encontrada ou não é um gasto');
        }

        if (transacao.transacao_participantes.length === 0) {
          throw new Error('Pessoa não participa desta transação');
        }

        const participacao = transacao.transacao_participantes[0];
        if (!participacao) {
          throw new Error('Participação não encontrada para esta transação');
        }
        
        const valorDevido = Number(participacao.valor_devido || 0);
        const valorJaPago = Number(participacao.valor_pago || 0);
        const valorRestante = valorDevido - valorJaPago;

        // 2. Permitir excedente - será processado pelos triggers do banco
        const valorExcedente = Math.max(0, dadosIndividuais.valor_pago - valorRestante);

        // 3. Criar pagamento
        const pagamento = await prisma.pagamentos.create({
          data: {
            pessoa_id: dadosIndividuais.pessoa_id || userId,
            valor_total: dadosIndividuais.valor_pago,
            valor_excedente: valorExcedente > 0 ? valorExcedente : null,
            data_pagamento: new Date(dadosIndividuais.data_pagamento),
            forma_pagamento: dadosIndividuais.forma_pagamento,
            observacoes: dadosIndividuais.observacoes || null,
            processar_excedente: true, // Padrão para individual
            registrado_por: userId
          }
        });

        // 4. Criar detalhe do pagamento
        // O trigger 'processar_excedente_pagamento' será executado automaticamente
        const detalhe = await prisma.pagamento_transacoes.create({
          data: {
            pagamento_id: pagamento.id,
            transacao_id: dadosIndividuais.transacao_id,
            valor_aplicado: Math.min(dadosIndividuais.valor_pago, valorRestante)
          }
        });

        return { pagamento, receitaExcedente: null, detalhes: [detalhe] };
      }
    });

    // Buscar dados completos do pagamento criado
    const pagamentoCriado = await req.prisma.pagamentos.findUnique({
      where: { id: resultado.pagamento.id },
      include: {
        pessoas_pagamentos_pessoa_idTopessoas: {
          select: { id: true, nome: true, email: true }
        },
        receita_excedente: {
          select: { id: true, descricao: true, valor_total: true }
        },
        pagamento_transacoes: {
          include: {
            transacoes: {
              select: { id: true, descricao: true, valor_total: true }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: ehPagamentoComposto 
        ? 'Pagamento composto criado com sucesso!' 
        : 'Pagamento individual criado com sucesso!',
      data: {
        id: pagamentoCriado!.id,
        pessoa: pagamentoCriado!.pessoas_pagamentos_pessoa_idTopessoas,
        valor_total: Number(pagamentoCriado!.valor_total),
        valor_excedente: pagamentoCriado!.valor_excedente ? Number(pagamentoCriado!.valor_excedente) : null,
        data_pagamento: pagamentoCriado!.data_pagamento.toISOString().split('T')[0],
        forma_pagamento: pagamentoCriado!.forma_pagamento,
        observacoes: pagamentoCriado!.observacoes,
        transacoes_pagas: pagamentoCriado!.pagamento_transacoes.length,
        receita_excedente: pagamentoCriado!.receita_excedente ? {
          id: pagamentoCriado!.receita_excedente.id,
          descricao: pagamentoCriado!.receita_excedente.descricao,
          valor_total: Number(pagamentoCriado!.receita_excedente.valor_total)
        } : null,
        criado_em: pagamentoCriado!.criado_em
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        message: 'Verifique os dados fornecidos',
        details: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        })),
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        error: 'Erro de validação',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o pagamento',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza um pagamento existente
 * PUT /api/pagamentos/:id
 */
export const updatePagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar parâmetro ID
    const { id }: PagamentoParamsInput = pagamentoParamsSchema.parse(req.params);
    
    // Validar dados de entrada
    const dadosValidados: UpdatePagamentoInput = updatePagamentoSchema.parse(req.body);

    // Verificar se pagamento existe
    const pagamentoExistente = await req.prisma.pagamentos.findUnique({
      where: { id },
      include: {
        pagamento_transacoes: true,
        receita_excedente: true
      }
    });

    if (!pagamentoExistente) {
      res.status(404).json({
        error: 'Pagamento não encontrado',
        message: 'O pagamento que você está tentando editar não existe',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar permissão (apenas quem criou ou proprietário)
    const usuarioLogado = await req.prisma.pessoas.findUnique({
      where: { id: userId },
      select: { eh_proprietario: true }
    });

    if (pagamentoExistente.registrado_por !== userId && !usuarioLogado?.eh_proprietario) {
      res.status(403).json({
        error: 'Sem permissão',
        message: 'Você só pode editar pagamentos que você mesmo registrou',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {
      atualizado_em: new Date()
    };

    if (dadosValidados.data_pagamento) {
      dataToUpdate.data_pagamento = new Date(dadosValidados.data_pagamento);
    }
    
    if (dadosValidados.forma_pagamento) {
      dataToUpdate.forma_pagamento = dadosValidados.forma_pagamento;
    }
    
    if (dadosValidados.observacoes !== undefined) {
      dataToUpdate.observacoes = dadosValidados.observacoes || null;
    }
    
    if (dadosValidados.processar_excedente !== undefined) {
      dataToUpdate.processar_excedente = dadosValidados.processar_excedente;
    }

    // Atualizar pagamento
    const pagamentoAtualizado = await req.prisma.pagamentos.update({
      where: { id },
      data: dataToUpdate,
      include: {
        pessoas_pagamentos_pessoa_idTopessoas: {
          select: { id: true, nome: true, email: true }
        },
        receita_excedente: {
          select: { id: true, descricao: true, valor_total: true }
        },
        pagamento_transacoes: {
          include: {
            transacoes: {
              select: { id: true, descricao: true, valor_total: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Pagamento atualizado com sucesso!',
      data: {
        id: pagamentoAtualizado.id,
        pessoa: pagamentoAtualizado.pessoas_pagamentos_pessoa_idTopessoas,
        valor_total: Number(pagamentoAtualizado.valor_total),
        valor_excedente: pagamentoAtualizado.valor_excedente ? Number(pagamentoAtualizado.valor_excedente) : null,
        data_pagamento: pagamentoAtualizado.data_pagamento.toISOString().split('T')[0],
        forma_pagamento: pagamentoAtualizado.forma_pagamento,
        observacoes: pagamentoAtualizado.observacoes,
        processar_excedente: pagamentoAtualizado.processar_excedente,
        transacoes_pagas: pagamentoAtualizado.pagamento_transacoes.length,
        receita_excedente: pagamentoAtualizado.receita_excedente ? {
          id: pagamentoAtualizado.receita_excedente.id,
          descricao: pagamentoAtualizado.receita_excedente.descricao,
          valor_total: Number(pagamentoAtualizado.receita_excedente.valor_total)
        } : null,
        atualizado_em: pagamentoAtualizado.atualizado_em
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        message: 'Verifique os dados fornecidos',
        details: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        })),
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o pagamento',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Remove um pagamento (soft delete)
 * DELETE /api/pagamentos/:id
 */
export const deletePagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar parâmetro ID
    const { id }: PagamentoParamsInput = pagamentoParamsSchema.parse(req.params);

    // Verificar se pagamento existe
    const pagamento = await req.prisma.pagamentos.findUnique({
      where: { id },
      include: {
        receita_excedente: true,
        pagamento_transacoes: {
          include: {
            transacoes: {
              select: { status_pagamento: true }
            }
          }
        }
      }
    });

    if (!pagamento) {
      res.status(404).json({
        error: 'Pagamento não encontrado',
        message: 'O pagamento que você está tentando remover não existe',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar permissão (apenas quem criou ou proprietário)
    const usuarioLogado = await req.prisma.pessoas.findUnique({
      where: { id: userId },
      select: { eh_proprietario: true }
    });

    if (pagamento.registrado_por !== userId && !usuarioLogado?.eh_proprietario) {
      res.status(403).json({
        error: 'Sem permissão',
        message: 'Você só pode remover pagamentos que você mesmo registrou',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se pode ser removido (regras de negócio)
    const temTransacoesPagasCompletas = pagamento.pagamento_transacoes.some(
      pt => pt.transacoes.status_pagamento === 'PAGO_TOTAL'
    );

    if (temTransacoesPagasCompletas) {
      res.status(400).json({
        error: 'Pagamento não pode ser removido',
        message: 'Este pagamento gerou quitação completa de transações e não pode ser removido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Executar remoção em transação
    await req.prisma.$transaction(async (prisma) => {
      // 1. Remover receita de excedente (se existir)
      if (pagamento.receita_excedente_id) {
        await prisma.transacoes.delete({
          where: { id: pagamento.receita_excedente_id }
        });
      }

      // 2. Remover detalhes do pagamento (pagamento_transacoes)
      await prisma.pagamento_transacoes.deleteMany({
        where: { pagamento_id: id }
      });

      // 3. Remover pagamento principal
      await prisma.pagamentos.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Pagamento removido com sucesso!',
      data: {
        id: pagamento.id,
        valor_total: Number(pagamento.valor_total),
        transacoes_afetadas: pagamento.pagamento_transacoes.length,
        receita_excedente_removida: !!pagamento.receita_excedente_id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao remover pagamento:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Parâmetros inválidos',
        message: 'ID do pagamento deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível remover o pagamento',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Busca configurações de processamento de excedente
 * GET /api/pagamentos/configuracoes/excedente
 */
export const getConfiguracaoExcedente = async (req: Request, res: Response): Promise<void> => {
  try {
    const configuracoes = await req.prisma.configuracoes_sistema.findMany({
      where: {
        chave: {
          in: ['auto_criar_receita_excedente', 'valor_minimo_excedente', 'descricao_receita_excedente']
        }
      }
    });

    const config = {
      auto_criar_receita_excedente: configuracoes.find(c => c.chave === 'auto_criar_receita_excedente')?.valor === 'true' || true,
      valor_minimo_excedente: parseFloat(configuracoes.find(c => c.chave === 'valor_minimo_excedente')?.valor || '5.00'),
      descricao_receita_excedente: configuracoes.find(c => c.chave === 'descricao_receita_excedente')?.valor || 'Excedente de pagamento'
    };

    res.json({
      success: true,
      message: 'Configurações de excedente obtidas com sucesso',
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as configurações',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza configurações de processamento de excedente
 * PUT /api/pagamentos/configuracoes/excedente
 */
export const updateConfiguracaoExcedente = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se é proprietário
    const usuario = await req.prisma.pessoas.findUnique({
      where: { id: userId },
      select: { eh_proprietario: true }
    });

    if (!usuario?.eh_proprietario) {
      res.status(403).json({
        error: 'Sem permissão',
        message: 'Apenas proprietários podem alterar configurações do sistema',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar dados
    const dadosValidados: ConfiguracaoExcedenteInput = configuracaoExcedenteSchema.parse(req.body);

    // Atualizar configurações
    await req.prisma.$transaction(async (prisma) => {
      const updates = [
        {
          chave: 'auto_criar_receita_excedente',
          valor: dadosValidados.auto_criar_receita_excedente.toString(),
          descricao: 'Se deve criar receita automaticamente quando há excedente'
        },
        {
          chave: 'valor_minimo_excedente',
          valor: dadosValidados.valor_minimo_excedente.toString(),
          descricao: 'Valor mínimo de excedente para processamento automático'
        },
        {
          chave: 'descricao_receita_excedente',
          valor: dadosValidados.descricao_receita_excedente,
          descricao: 'Descrição padrão para receitas de excedente'
        }
      ];

      for (const update of updates) {
        await prisma.configuracoes_sistema.upsert({
          where: { chave: update.chave },
          update: { valor: update.valor },
          create: {
            chave: update.chave,
            valor: update.valor,
            descricao: update.descricao
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Configurações de excedente atualizadas com sucesso!',
      data: dadosValidados,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        message: 'Verifique os dados fornecidos',
        details: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        })),
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar as configurações',
      timestamp: new Date().toISOString()
    });
  }
}; 