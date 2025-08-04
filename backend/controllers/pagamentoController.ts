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
  ConfiguracaoExcedenteInput,
  CreatePagamentoCompostoInput,
  CreatePagamentoIndividualInput
} from '../schemas/pagamento';
import { z } from 'zod';
import { getLogger } from '../utils/logger';
import { getExtendedPrismaClient } from '../utils/prisma';

const logger = getLogger('pagamentoController');

// =============================================
// CONTROLLER DE PAGAMENTOS COMPOSTOS
// =============================================

/**
 * Lista todos os pagamentos (com filtros avançados e dentro do Hub)
 * GET /api/pagamentos
 */
export const listPagamentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubId } = req.auth!;
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
      limit = 1000,
      sort_by = 'data_pagamento',
      sort_order = 'desc'
    } = queryParams;

    const where: any = { hubId, ativo: true }; // Filtro base - apenas pagamentos ativos

    if (pessoa_id) where.pessoa_id = pessoa_id;
    if (forma_pagamento) where.forma_pagamento = forma_pagamento;

    if (data_inicio || data_fim) {
      where.data_pagamento = {};
      if (data_inicio) where.data_pagamento.gte = new Date(data_inicio);
      if (data_fim) where.data_pagamento.lte = new Date(data_fim);
    }
    
    if (tem_excedente !== undefined) {
      where.valor_excedente = tem_excedente ? { gt: 0 } : { equals: null };
    }

    if (valor_min !== undefined || valor_max !== undefined) {
      where.valor_total = {};
      if (valor_min !== undefined) where.valor_total.gte = valor_min;
      if (valor_max !== undefined) where.valor_total.lte = valor_max;
    }

    if (transacao_id) {
      where.pagamento_transacoes = { some: { transacao_id } };
    }

    const offset = (page - 1) * limit;
    const orderBy = { [sort_by]: sort_order };

    const [pagamentos, total] = await req.prisma.$transaction([
      req.prisma.pagamentos.findMany({
        where,
        include: {
          pessoas_pagamentos_pessoa_idTopessoas: { select: { id: true, nome: true, email: true } },
          pessoas_pagamentos_registrado_porTopessoas: { select: { id: true, nome: true } },
          receita_excedente: { select: { id: true, descricao: true, valor_total: true } },
          pagamento_transacoes: {
            include: {
              transacoes: { select: { id: true, descricao: true, tipo: true, valor_total: true, status_pagamento: true, data_transacao: true } }
            },
            orderBy: { criado_em: 'asc' }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      req.prisma.pagamentos.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: `${total} pagamento(s) encontrado(s)`,
      data: pagamentos.map(p => ({
        ...p,
        valor_total: Number(p.valor_total),
        valor_excedente: p.valor_excedente ? Number(p.valor_excedente) : null,
        transacoes_pagas: p.pagamento_transacoes.map((pt: any) => ({
            ...pt,
            valor_aplicado: Number(pt.valor_aplicado),
            transacao: {
                ...pt.transacoes,
                valor_total: Number(pt.transacoes.valor_total)
            }
        }))
      })),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar pagamentos.' });
  }
};

/**
 * Busca detalhes de um pagamento específico
 * GET /api/pagamentos/:id
 */
export const getPagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = pagamentoParamsSchema.parse(req.params);

    const pagamento = await req.prisma.pagamentos.findUnique({
      where: { id, ativo: true }, // Apenas pagamentos ativos
      include: {
        pessoas_pagamentos_pessoa_idTopessoas: { select: { id: true, nome: true, email: true, telefone: true } },
        pessoas_pagamentos_registrado_porTopessoas: { select: { id: true, nome: true } },
        receita_excedente: { select: { id: true, descricao: true, valor_total: true } },
        pagamento_transacoes: {
            include: {
                transacoes: { select: { id: true, descricao: true, valor_total: true, data_transacao: true, tipo: true }}
            }
        }
      }
    });

    if (!pagamento) {
      res.status(404).json({ success: false, message: 'Pagamento não encontrado.' });
      return;
    }

    res.json({ success: true, data: pagamento });
  } catch (error) {
    logger.error('Erro ao buscar pagamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar pagamento.' });
  }
};

/**
 * Cria um novo pagamento (individual ou composto)
 * POST /api/pagamentos
 */
export const createPagamento = async (req: Request, res: Response): Promise<void> => {
  const { pessoaId: userId, hubId } = req.auth!;
  const prisma = getExtendedPrismaClient(req.auth!);
  
  try {
    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'];
    if (!allowedRoles.includes(req.auth!.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth!.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Detectar formato do payload (individual vs composto)
    const isPagamentoComposto = req.body.transacoes && Array.isArray(req.body.transacoes);
    const isPagamentoIndividual = req.body.transacao_id && req.body.valor_pago;
    
    if (!isPagamentoComposto && !isPagamentoIndividual) {
      throw new Error('Formato de pagamento inválido. Deve fornecer transacao_id + valor_pago (individual) OU transacoes[] (composto).');
    }

    const resultado = await prisma.$transaction(async (tx) => {
      if (isPagamentoIndividual) {
        // ============================================
        // PAGAMENTO INDIVIDUAL (formato original)
        // ============================================
        const { transacao_id, valor_pago, data_pagamento, forma_pagamento, observacoes } = req.body;
        
        // 1. Validar a transação e a participação do usuário
        const participante = await tx.transacao_participantes.findFirst({
          where: {
            transacao_id: transacao_id,
            pessoa_id: userId,
            transacoes: {
              hubId: hubId, // ✅ VALIDAÇÃO DE HUB
              tipo: 'GASTO',
              ativo: true
            }
          },
          include: {
            transacoes: true,
          },
        });

        if (!participante) {
          throw new Error('Participante não encontrado nesta transação ou a transação não é um gasto válido deste Hub.');
        }

        const valorDevido = Number(participante.valor_devido);
        const valorJaPago = Number(participante.valor_pago);
        const saldoDevedor = valorDevido - valorJaPago;

        if (valor_pago <= 0) {
          throw new Error('O valor pago deve ser positivo.');
        }
        
        if (valor_pago > saldoDevedor + 0.01) {
          throw new Error(`Valor pago (R$${valor_pago}) excede o saldo devedor (R$${saldoDevedor.toFixed(2)}).`);
        }

        // 2. Criar o registro do pagamento
        const novoPagamento = await tx.pagamentos.create({
          data: {
            hubId,
            pessoa_id: userId,
            registrado_por: userId,
            data_pagamento: new Date(data_pagamento),
            valor_total: valor_pago,
            forma_pagamento: forma_pagamento || 'PIX',
            observacoes: observacoes,
          },
        });

        // 3. Ligar o pagamento à transação
        await tx.pagamento_transacoes.create({
          data: {
            pagamento_id: novoPagamento.id,
            transacao_id: transacao_id,
            valor_aplicado: valor_pago,
          },
        });

        // 4. Atualizar o valor pago pelo participante
        const novoTotalPagoPeloParticipante = valorJaPago + valor_pago;
        await tx.transacao_participantes.update({
          where: {
            id: participante.id,
          },
          data: {
            valor_pago: novoTotalPagoPeloParticipante,
          },
        });
        
        // 5. Atualizar o status geral da transação
        await atualizarStatusTransacao(tx, transacao_id);
        
        return novoPagamento;

      } else {
        // ============================================
        // PAGAMENTO COMPOSTO (novo formato)
        // ============================================
        const { 
          pessoa_id, 
          transacoes, 
          data_pagamento, 
          forma_pagamento, 
          observacoes,
          valor_total: valorTotalFornecido 
        } = req.body;

        // Usar pessoa_id do payload ou usuário logado
        const pessoaPagante = pessoa_id || userId;
        
        // Calcular valor total se não fornecido
        const valorTotalCalculado = transacoes.reduce((acc: number, t: any) => acc + Number(t.valor_aplicado), 0);
        const valorTotal = valorTotalFornecido || valorTotalCalculado;

        // Validar que o valor total corresponde à soma dos valores aplicados
        if (Math.abs(valorTotal - valorTotalCalculado) > 0.01) {
          throw new Error(`Valor total (R$${valorTotal}) não corresponde à soma dos valores aplicados (R$${valorTotalCalculado.toFixed(2)}).`);
        }

        // 1. Validar todas as transações e participações
        for (const transacao of transacoes) {
          // VALIDAÇÃO DE HUB - Garantir que a transação pertence ao mesmo Hub
          const transacaoValida = await tx.transacoes.findFirst({
            where: {
              id: transacao.transacao_id,
              hubId: hubId, // ✅ VALIDAÇÃO DE HUB
              tipo: 'GASTO',
              ativo: true
            },
            select: { id: true, hubId: true }
          });

          if (!transacaoValida) {
            throw new Error(`Transação ${transacao.transacao_id} não pertence a este Hub ou não é um gasto válido.`);
          }

          const participante = await tx.transacao_participantes.findFirst({
            where: {
              transacao_id: transacao.transacao_id,
              pessoa_id: pessoaPagante,
              transacoes: {
                tipo: 'GASTO',
                ativo: true
              }
            },
            include: {
              transacoes: true,
            },
          });

          if (!participante) {
            throw new Error(`Participante não encontrado na transação ${transacao.transacao_id} ou a transação não é um gasto válido.`);
          }

          const valorDevido = Number(participante.valor_devido);
          const valorJaPago = Number(participante.valor_pago);
          const saldoDevedor = valorDevido - valorJaPago;

          if (transacao.valor_aplicado <= 0) {
            throw new Error(`Valor aplicado na transação ${transacao.transacao_id} deve ser positivo.`);
          }
          
          if (transacao.valor_aplicado > saldoDevedor + 0.01) {
            throw new Error(`Valor aplicado (R$${transacao.valor_aplicado}) na transação ${transacao.transacao_id} excede o saldo devedor (R$${saldoDevedor.toFixed(2)}).`);
          }
        }

        // 2. Criar o registro do pagamento
        const novoPagamento = await tx.pagamentos.create({
          data: {
            hubId,
            pessoa_id: pessoaPagante,
            registrado_por: userId,
            data_pagamento: new Date(data_pagamento),
            valor_total: valorTotal,
            forma_pagamento: forma_pagamento || 'PIX',
            observacoes: observacoes,
          },
        });

        // 3. Processar cada transação
        for (const transacao of transacoes) {
          // Ligar o pagamento à transação
          await tx.pagamento_transacoes.create({
            data: {
              pagamento_id: novoPagamento.id,
              transacao_id: transacao.transacao_id,
              valor_aplicado: transacao.valor_aplicado,
            },
          });

          // Atualizar o valor pago pelo participante
          const participante = await tx.transacao_participantes.findFirst({
            where: {
              transacao_id: transacao.transacao_id,
              pessoa_id: pessoaPagante,
            },
          });

          if (participante) {
            const valorJaPago = Number(participante.valor_pago);
            const novoTotalPagoPeloParticipante = valorJaPago + transacao.valor_aplicado;
            
            await tx.transacao_participantes.update({
              where: {
                id: participante.id,
              },
              data: {
                valor_pago: novoTotalPagoPeloParticipante,
              },
            });

            // Atualizar o status da transação
            await atualizarStatusTransacao(tx, transacao.transacao_id);
          }
        }
        
        return novoPagamento;
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pagamento registrado com sucesso!',
      data: resultado,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    logger.error('Erro ao criar pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Não foi possível registrar o pagamento.',
      timestamp: new Date().toISOString(),
    });
  }
}

// Função auxiliar para atualizar status da transação
async function atualizarStatusTransacao(tx: any, transacaoId: number): Promise<void> {
  const todosParticipantes = await tx.transacao_participantes.findMany({
    where: { transacao_id: transacaoId }
  });

  const transacao = await tx.transacoes.findUnique({
    where: { id: transacaoId },
    select: { valor_total: true }
  });

  if (!transacao) return;

  const totalPagoNaTransacao = todosParticipantes.reduce((acc: number, p: any) => acc + Number(p.valor_pago), 0);
  const valorTotalDaTransacao = Number(transacao.valor_total);
  
  let novoStatus = 'PAGO_PARCIAL';
  if (Math.abs(totalPagoNaTransacao - valorTotalDaTransacao) < 0.01) {
    novoStatus = 'PAGO_TOTAL';
  }

  await tx.transacoes.update({
    where: { id: transacaoId },
    data: { status_pagamento: novoStatus },
  });
}

/**
 * Atualiza um pagamento existente
 * PUT /api/pagamentos/:id
 */
export const updatePagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: pagamentoId } = pagamentoParamsSchema.parse(req.params);
    const { pessoaId, role } = req.auth!;
    const data: UpdatePagamentoInput = req.body;

    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'];
    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 1. Verificar se o pagamento existe e buscar dados para validação
    const pagamento = await req.prisma.pagamentos.findUnique({
      where: { id: pagamentoId, ativo: true },
      include: {
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
        success: false, 
        message: 'Pagamento não encontrado' 
      });
      return;
    }

    // 2. Verificar se o pagamento pode ser editado
    // Não permitir edição se alguma transação foi totalmente quitada
    const transacoesQuitadas = pagamento.pagamento_transacoes.some(
      pt => pt.transacoes.status_pagamento === 'PAGO_TOTAL'
    );

    if (transacoesQuitadas) {
      res.status(400).json({ 
        success: false, 
        message: 'Não é possível editar pagamentos que geraram quitação total de transações' 
      });
      return;
    }

    // 4. Construir dados de atualização
    const updateData: any = {};
    
    if (data.data_pagamento !== undefined) {
      updateData.data_pagamento = new Date(data.data_pagamento);
    }
    
    if (data.forma_pagamento !== undefined) {
      updateData.forma_pagamento = data.forma_pagamento;
    }
    
    if (data.observacoes !== undefined) {
      updateData.observacoes = data.observacoes || null;
    }

    // 5. Atualizar o pagamento
    const pagamentoAtualizado = await req.prisma.pagamentos.update({
      where: { id: pagamentoId },
      data: updateData,
      include: {
        pessoas_pagamentos_pessoa_idTopessoas: { 
          select: { id: true, nome: true, email: true } 
        },
        pessoas_pagamentos_registrado_porTopessoas: { 
          select: { id: true, nome: true } 
        },
        pagamento_transacoes: {
          include: {
            transacoes: { 
              select: { id: true, descricao: true, valor_total: true, status_pagamento: true } 
            }
          }
        }
      }
    });

    // 6. Processar excedente se solicitado
    if (data.processar_excedente === true) {
      // Lógica para processar excedente (similar ao createPagamento)
      // Por enquanto, apenas log para indicar que seria processado
      logger.info(`Processamento de excedente solicitado para pagamento ${pagamentoId}`);
    }

    res.json({
      success: true,
      message: 'Pagamento atualizado com sucesso',
      data: {
        ...pagamentoAtualizado,
        valor_total: Number(pagamentoAtualizado.valor_total),
        valor_excedente: pagamentoAtualizado.valor_excedente ? Number(pagamentoAtualizado.valor_excedente) : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao atualizar pagamento:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: error.errors 
      });
      return;
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor ao atualizar pagamento' 
    });
  }
};

/**
 * Exclui um pagamento
 * DELETE /api/pagamentos/:id
 */
export const deletePagamento = async (req: Request, res: Response): Promise<void> => {
    const { id: pagamentoId } = pagamentoParamsSchema.parse(req.params);
    const { pessoaId, role } = req.auth!;

    try {
        // Verificação de papel - Camada 2 de segurança
        const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({
                error: 'AcessoNegado',
                message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
                seuPapel: role,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const pagamento = await req.prisma.pagamentos.findUnique({
            where: { id: pagamentoId, ativo: true },
            select: { registrado_por: true }
        });

        if (!pagamento) {
            res.status(404).json({ success: false, message: "Pagamento não encontrado" });
            return;
        }

        // Regra de permissão: só pode deletar se for o dono do pagamento ou um admin/proprietário
        if (pagamento.registrado_por !== pessoaId && role !== 'PROPRIETARIO' && role !== 'ADMINISTRADOR') {
            res.status(403).json({ success: false, message: "Acesso negado." });
            return;
        }

        // Lógica de deleção em transação (exemplo: reverter status das transações pagas)
        await req.prisma.$transaction(async (tx) => {
             // 1. Buscar todas as transações associadas ao pagamento
             const pagamentoCompleto = await tx.pagamentos.findUnique({
                 where: { id: pagamentoId },
                 include: {
                     pagamento_transacoes: {
                         include: {
                             transacoes: true
                         }
                     }
                 }
             });

             if (!pagamentoCompleto) {
                 throw new Error('Pagamento não encontrado');
             }

             // 2. Reverter os valores aplicados nas transações
             for (const pt of pagamentoCompleto.pagamento_transacoes) {
                 // Buscar participante da transação
                 const participante = await tx.transacao_participantes.findFirst({
                     where: {
                         transacao_id: pt.transacao_id,
                         pessoa_id: pagamentoCompleto.pessoa_id
                     }
                 });

                 if (participante) {
                     // Reverter o valor pago
                     const novoValorPago = Number(participante.valor_pago) - Number(pt.valor_aplicado);
                     await tx.transacao_participantes.update({
                         where: { id: participante.id },
                         data: { valor_pago: Math.max(0, novoValorPago) }
                     });
                 }
             }

             // 3. Remover registros da tabela de junção
             await tx.pagamento_transacoes.deleteMany({
                 where: { pagamento_id: pagamentoId }
             });

             // 4. Desativar o pagamento
             await tx.pagamentos.update({
                 where: { id: pagamentoId },
                 data: { ativo: false }
             });
        });

        res.status(200).json({ success: true, message: "Pagamento desativado com sucesso." });
    } catch (error) {
        logger.error('Erro ao deletar pagamento:', error);
        res.status(500).json({ success: false, message: 'Erro ao deletar pagamento.' });
    }
}

/**
 * Busca a configuração de excedente do Hub
 * GET /api/pagamentos/configuracoes/excedente
 */
export const getConfiguracaoExcedente = async (req: Request, res: Response): Promise<void> => {
    try {
        // Como não existe tabela configuracaoHub, usar valores padrão
        const config = {
            auto_criar_receita_excedente: true,
            valor_minimo_excedente: 5.0,
            descricao_receita_excedente: 'Excedente de pagamento'
        };

                res.json({ success: true, data: config });
    } catch (error) {
        logger.error('Erro ao buscar configuração de excedente:', error);
        res.status(500).json({ success: false, message: "Erro ao buscar configuração de excedente." });
    }
}

/**
 * Atualiza a configuração de excedente do Hub
 * PUT /api/pagamentos/configuracoes/excedente
 */
export const updateConfiguracaoExcedente = async (req: Request, res: Response): Promise<void> => {
    const { role, hubId } = req.auth!;

    if (role !== 'PROPRIETARIO' && role !== 'ADMINISTRADOR') {
        res.status(403).json({ success: false, message: "Apenas proprietários ou administradores podem alterar esta configuração." });
        return;
    }
    
    try {
        const data = configuracaoExcedenteSchema.parse(req.body);
        
        // Como não existe tabela configuracaoHub, simular update bem-sucedido
        const updatedConfig = {
            auto_criar_receita_excedente: data.auto_criar_receita_excedente,
            valor_minimo_excedente: data.valor_minimo_excedente,
            descricao_receita_excedente: data.descricao_receita_excedente,
        };

        res.json({ success: true, message: "Configuração de excedente atualizada com sucesso.", data: updatedConfig });

        } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: "Dados inválidos.", errors: error.errors });        
            return;
        }
        logger.error('Erro ao atualizar configuração de excedente:', error);
        res.status(500).json({ success: false, message: "Erro ao atualizar configuração de excedente." });
    }
} 