import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  createGastoSchema, 
  updateGastoSchema,
  createReceitaSchema,
  updateReceitaSchema
} from '../schemas/transacao';
import { CreateGastoInput, CreateReceitaInput, UpdateGastoInput, UpdateReceitaInput, TransacaoQueryInput } from '../schemas/transacao';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

// =============================================
// CONTROLLER DE TRANSAÇÕES (GASTOS)
// =============================================

/**
 * Lista todos os gastos (com filtros opcionais)
 * GET /api/transacoes
 */
export const listTransacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      tipo,
      status_pagamento,
      data_inicio,
      data_fim,
      pessoa_id,
      tag_id,
      eh_parcelado,
      grupo_parcela,
      page = 1,
      limit = 20 
    }: TransacaoQueryInput = req.query;

    // Construir filtros
    const where: any = {};
    
    // Aplicar filtro de tipo apenas se especificado
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (status_pagamento) {
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
    
    if (eh_parcelado !== undefined) {
      where.eh_parcelado = eh_parcelado;
    }
    
    if (grupo_parcela) {
      where.grupo_parcela = grupo_parcela;
    }
    
    if (pessoa_id) {
      where.transacao_participantes = {
        some: {
          pessoa_id: pessoa_id
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

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar transações com relacionamentos
    const [transacoes, total] = await Promise.all([
      prisma.transacoes.findMany({
        where,
        include: {
          pessoas_transacoes_proprietario_idTopessoas: {
            select: { id: true, nome: true, email: true }
          },
          pessoas_transacoes_criado_porTopessoas: {
            select: { id: true, nome: true }
          },
          transacao_participantes: {
            include: {
              pessoas: {
                select: { id: true, nome: true, email: true }
              }
            }
          },
          transacao_tags: {
            include: {
              tags: {
                select: { id: true, nome: true, cor: true, icone: true }
              }
            }
          }
        },
        orderBy: [
          { data_transacao: 'desc' },
          { id: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.transacoes.count({ where })
    ]);

    // Calcular estatísticas
    const stats = await prisma.transacoes.aggregate({
      where,
      _sum: {
        valor_total: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      message: 'Transações listadas com sucesso',
      data: {
        transacoes: transacoes.map((t: any) => ({
          ...t,
          valor_total: Number(t.valor_total), // Converter Decimal para Number
          valor_parcela: Number(t.valor_parcela), // Converter Decimal para Number
          transacao_participantes: t.transacao_participantes.map((p: any) => ({
            ...p,
            valor_devido: Number(p.valor_devido), // Converter Decimal para Number
            valor_recebido: Number(p.valor_recebido), // Converter Decimal para Number
            valor_pago: Number(p.valor_pago) // Converter Decimal para Number
          }))
        })),
        paginacao: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        estatisticas: {
          total_transacoes: stats._count.id || 0,
          valor_total: Number(stats._sum.valor_total || 0),
          valor_medio: total > 0 ? Number(stats._sum.valor_total || 0) / total : 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao listar transações',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cria um novo gasto
 * POST /api/transacoes
 */
export const createGasto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.user_id;
    const {
      descricao,
      local,
      valor_total,
      data_transacao,
      observacoes,
      eh_parcelado = false,
      total_parcelas = 1,
      participantes,
      tags = []
    }: CreateGastoInput = req.body;

    // Verificar se usuário logado é proprietário
    const usuarioLogado = await prisma.pessoas.findUnique({
      where: { id: userId },
      select: { eh_proprietario: true, ativo: true }
    });

    if (!usuarioLogado) {
      res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!usuarioLogado.ativo) {
      res.status(403).json({
        success: false,
        message: 'Usuário inativo não pode criar transações',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!usuarioLogado.eh_proprietario) {
      res.status(403).json({
        success: false,
        message: 'Apenas proprietários podem criar transações',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar se as pessoas existem
    const pessoasIds = participantes.map(p => p.pessoa_id);
    const pessoasExistentes = await prisma.pessoas.findMany({
      where: {
        id: { in: pessoasIds },
        ativo: true
      },
      select: { id: true, nome: true }
    });

    if (pessoasExistentes.length !== pessoasIds.length) {
      const idsEncontrados = pessoasExistentes.map((p: any) => p.id);
      const idsNaoEncontrados = pessoasIds.filter(id => !idsEncontrados.includes(id));
      res.status(400).json({
        success: false,
        message: `Pessoas não encontradas: ${idsNaoEncontrados.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar se as tags existem (se fornecidas)
    if (tags.length > 0) {
      const tagsExistentes = await prisma.tags.findMany({
        where: {
          id: { in: tags },
          ativo: true
        },
        select: { id: true }
      });

      if (tagsExistentes.length !== tags.length) {
        const idsEncontrados = tagsExistentes.map((t: any) => t.id);
        const idsNaoEncontrados = tags.filter(id => !idsEncontrados.includes(id));
        res.status(400).json({
          success: false,
          message: `Tags não encontradas: ${idsNaoEncontrados.join(', ')}`,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Proprietário é sempre o usuário logado (já validado como proprietário)
    const proprietario_id = userId;

    // Lógica de parcelamento - tipagem explícita
    interface ParcelaData {
      descricao: string;
      local: string | undefined;
      valor_total: number;
      valor_parcela: number;
      data_transacao: Date;
      observacoes: string | undefined;
      eh_parcelado: boolean;
      parcela_atual: number;
      total_parcelas: number;
      grupo_parcela: string;
      participantes: Array<{
        pessoa_id: number;
        valor_devido: number;
      }>;
    }
    
    const parcelas: ParcelaData[] = [];
    
    if (eh_parcelado && total_parcelas > 1) {
      // Gerar UUID do grupo
      const grupo_parcela = randomUUID();
      
      // Calcular valor base por parcela
      const valor_base = Math.floor((valor_total * 100) / total_parcelas) / 100;
      const resto_centavos = Math.round((valor_total - (valor_base * total_parcelas)) * 100);
      
      for (let i = 1; i <= total_parcelas; i++) {
        // Distribuir centavos restantes nas primeiras parcelas
        const valor_parcela = i <= resto_centavos ? valor_base + 0.01 : valor_base;
        
        // Calcular data da parcela
        const dataBase = new Date(data_transacao);
        const dataParcela = i === 1 
          ? new Date(data_transacao) // Primeira parcela mantém data original
          : new Date(dataBase.getFullYear(), dataBase.getMonth() + (i - 1), 1); // Demais no dia 1
        
        parcelas.push({
          descricao: `${descricao} (${i}/${total_parcelas})`,
          local: local || undefined,
          valor_total: valor_parcela,
          valor_parcela,
          data_transacao: dataParcela,
          observacoes: i === 1 ? (observacoes || undefined) : undefined,
          eh_parcelado: true,
          parcela_atual: i,
          total_parcelas,
          grupo_parcela,
          participantes: participantes.map(p => ({
            ...p,
            valor_devido: Math.round((p.valor_devido / total_parcelas) * 100) / 100
          }))
        });
      }
    } else {
      // Transação única
      parcelas.push({
        descricao,
        local: local || undefined,
        valor_total,
        valor_parcela: valor_total,
        data_transacao: new Date(data_transacao),
        observacoes: observacoes || undefined,
        eh_parcelado: false,
        parcela_atual: 1,
        total_parcelas: 1,
        grupo_parcela: randomUUID(),
        participantes
      });
    }

    // Criar transações em transação do banco
    const resultados = await prisma.$transaction(async (tx: any) => {
      const transacoesCriadas = [];

      for (const parcela of parcelas) {
        // Criar transação
        const transacao = await tx.transacoes.create({
          data: {
            tipo: 'GASTO',
            proprietario_id,
            descricao: parcela.descricao,
            local: parcela.local || null,
            valor_total: parcela.valor_total,
            data_transacao: parcela.data_transacao,
            observacoes: parcela.observacoes || null,
            eh_parcelado: parcela.eh_parcelado,
            parcela_atual: parcela.parcela_atual,
            total_parcelas: parcela.total_parcelas,
            valor_parcela: parcela.valor_parcela,
            grupo_parcela: parcela.grupo_parcela,
            criado_por: userId
          }
        });

        // Criar participantes
        for (const participante of parcela.participantes) {
          await tx.transacao_participantes.create({
            data: {
              transacao_id: transacao.id,
              pessoa_id: participante.pessoa_id,
              valor_devido: participante.valor_devido,
              eh_proprietario: participante.pessoa_id === proprietario_id
            }
          });
        }

        // Criar tags
        if (tags.length > 0) {
          for (const tag_id of tags) {
            await tx.transacao_tags.create({
              data: {
                transacao_id: transacao.id,
                tag_id
              }
            });
          }
        }

        transacoesCriadas.push(transacao);
      }

      return transacoesCriadas;
    });

    // Verificar se resultados não está vazio
    if (resultados.length === 0) {
      res.status(500).json({
        success: false,
        message: 'Erro interno: nenhuma transação foi criada',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: eh_parcelado 
        ? `Gasto parcelado criado com sucesso (${total_parcelas} parcelas)`
        : 'Gasto criado com sucesso',
      data: {
        transacoes: resultados,
        grupo_parcela: resultados[0]?.grupo_parcela,
        total_parcelas: resultados.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao criar gasto',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Busca detalhes de uma transação específica
 * GET /api/transacoes/:id
 */
export const getTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        success: false,
        message: 'ID da transação inválido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const transacao = await prisma.transacoes.findUnique({
      where: { id: parseInt(id) },
      include: {
        pessoas_transacoes_proprietario_idTopessoas: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        pessoas_transacoes_criado_porTopessoas: {
          select: { id: true, nome: true }
        },
        transacao_participantes: {
          include: {
            pessoas: {
              select: { id: true, nome: true, email: true }
            }
          },
          orderBy: { valor_devido: 'desc' }
        },
        transacao_tags: {
          include: {
            tags: {
              select: { id: true, nome: true, cor: true, icone: true }
            }
          }
        }
      }
    });

    if (!transacao) {
      res.status(404).json({
        success: false,
        message: 'Transação não encontrada',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Buscar outras parcelas do mesmo grupo (se parcelado)
    interface ParcelaRelacionada {
      id: number;
      descricao: string;
      valor_total: any; // Decimal do Prisma
      data_transacao: Date;
      parcela_atual: number | null;
      status_pagamento: string | null;
    }
    
    let parcelas_relacionadas: ParcelaRelacionada[] = [];
    if (transacao.eh_parcelado && transacao.grupo_parcela) {
      parcelas_relacionadas = await prisma.transacoes.findMany({
        where: {
          grupo_parcela: transacao.grupo_parcela,
          id: { not: transacao.id }
        },
        select: {
          id: true,
          descricao: true,
          valor_total: true,
          data_transacao: true,
          parcela_atual: true,
          status_pagamento: true
        },
        orderBy: { parcela_atual: 'asc' }
      });
    }

    // Calcular estatísticas da transação
    const total_devido = transacao.transacao_participantes
      .reduce((acc: number, p: any) => acc + Number(p.valor_devido), 0);
    
    const total_pago = transacao.transacao_participantes
      .reduce((acc: number, p: any) => acc + Number(p.valor_pago), 0);

    res.json({
      success: true,
      message: 'Transação encontrada com sucesso',
      data: {
        ...transacao,
        valor_total: Number(transacao.valor_total), // Converter Decimal para Number
        valor_parcela: Number(transacao.valor_parcela), // Converter Decimal para Number
        parcelas_relacionadas: parcelas_relacionadas.map(p => ({
          ...p,
          valor_total: Number(p.valor_total) // Converter Decimal para Number
        })),
        transacao_participantes: transacao.transacao_participantes.map((p: any) => ({
          ...p,
          valor_devido: Number(p.valor_devido), // Converter Decimal para Number
          valor_recebido: Number(p.valor_recebido), // Converter Decimal para Number
          valor_pago: Number(p.valor_pago) // Converter Decimal para Number
        })),
        estatisticas: {
          total_devido,
          total_pago,
          total_pendente: total_devido - total_pago,
          percentual_pago: total_devido > 0 ? (total_pago / total_devido) * 100 : 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao buscar transação',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza uma transação existente
 * PUT /api/transacoes/:id
 */
export const updateTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { descricao, local, observacoes, tags }: UpdateGastoInput = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        success: false,
        message: 'ID da transação inválido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se transação existe
    const transacaoExistente = await prisma.transacoes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transacaoExistente) {
      res.status(404).json({
        success: false,
        message: 'Transação não encontrada',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar tags (se fornecidas)
    if (tags && tags.length > 0) {
      const tagsExistentes = await prisma.tags.findMany({
        where: {
          id: { in: tags },
          ativo: true
        },
        select: { id: true }
      });

      if (tagsExistentes.length !== tags.length) {
        const idsEncontrados = tagsExistentes.map((t: any) => t.id);
        const idsNaoEncontrados = tags.filter(id => !idsEncontrados.includes(id));
        res.status(400).json({
          success: false,
          message: `Tags não encontradas: ${idsNaoEncontrados.join(', ')}`,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Atualizar em transação
    const transacaoAtualizada = await prisma.$transaction(async (tx: any) => {
      // Atualizar dados básicos da transação
      const dadosAtualizacao: any = {};
      
      if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
      if (local !== undefined) dadosAtualizacao.local = local || null;
      if (observacoes !== undefined) dadosAtualizacao.observacoes = observacoes || null;

      const transacao = await tx.transacoes.update({
        where: { id: parseInt(id) },
        data: dadosAtualizacao
      });

      // Atualizar tags (se fornecidas)
      if (tags !== undefined) {
        // Remover tags existentes
        await tx.transacao_tags.deleteMany({
          where: { transacao_id: parseInt(id) }
        });

        // Adicionar novas tags
        if (tags.length > 0) {
          for (const tag_id of tags) {
            await tx.transacao_tags.create({
              data: {
                transacao_id: parseInt(id),
                tag_id
              }
            });
          }
        }
      }

      return transacao;
    });

    res.json({
      success: true,
      message: 'Transação atualizada com sucesso',
      data: transacaoAtualizada,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao atualizar transação',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Remove uma transação (soft delete via status)
 * DELETE /api/transacoes/:id
 */
export const deleteTransacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({
        success: false,
        message: 'ID da transação inválido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se transação existe
    const transacao = await prisma.transacoes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transacao) {
      res.status(404).json({
        success: false,
        message: 'Transação não encontrada',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se há pagamentos registrados (busca direta por enquanto)
    const pagamentosVinculados = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pagamento_transacoes WHERE transacao_id = ${parseInt(id)}
    ` as any[];

    if (pagamentosVinculados[0]?.count > 0) {
      res.status(400).json({
        success: false,
        message: 'Não é possível excluir transação que possui pagamentos registrados',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Exclusão física (CASCADE remove participantes e tags automaticamente)
    await prisma.transacoes.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Transação excluída com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao excluir transação',
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================
// FUNÇÕES ESPECÍFICAS PARA RECEITAS
// =============================================

/**
 * 📈 CRIAR RECEITA (POST /api/transacao/receita)
 * Cria uma nova receita exclusiva do proprietário
 */
export const createReceita = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    // Validação dos dados
    const dadosValidados = createReceitaSchema.parse(req.body);
    
    // Verificar se todas as tags existem e pertencem ao usuário
    if (dadosValidados.tags && dadosValidados.tags.length > 0) {
      const tagsExistentes = await prisma.tags.findMany({
        where: {
          id: { in: dadosValidados.tags },
          criado_por: userId
        }
      });

      if (tagsExistentes.length !== dadosValidados.tags.length) {
        res.status(400).json({ 
          error: 'Uma ou mais tags não existem ou não pertencem ao usuário' 
        });
        return;
      }
    }

    // Executar transação no banco
    const resultado = await prisma.$transaction(async (prisma: any) => {
      // 1. Criar a transação principal
      const transacao = await prisma.transacoes.create({
        data: {
          tipo: 'RECEITA',
          descricao: dadosValidados.descricao,
          local: dadosValidados.local || '',
          valor_total: dadosValidados.valor_recebido,
          data_transacao: new Date(dadosValidados.data_transacao),
          observacoes: dadosValidados.observacoes || '',
          proprietario_id: userId,
          valor_parcela: dadosValidados.valor_recebido, // Valor da parcela
          status_pagamento: 'PAGO_TOTAL',
          criado_por: userId
        }
      });

      // 2. O participante é criado automaticamente pelo trigger 'garantir_proprietario_receita'
      // Não precisamos criar manualmente - o trigger já faz isso!

      // 3. Associar tags se fornecidas
      if (dadosValidados.tags && dadosValidados.tags.length > 0) {
        const tagsData = dadosValidados.tags.map(tagId => ({
          transacao_id: transacao.id,
          tag_id: tagId
        }));

        await prisma.transacao_tags.createMany({
          data: tagsData
        });
      }

      return transacao;
    });

    res.status(201).json({
      message: 'Receita criada com sucesso',
      receita: {
        id: resultado.id,
        tipo: resultado.tipo,
        descricao: resultado.descricao,
        fonte: resultado.local, // Retornando como 'fonte' para compatibilidade da API
        valor_recebido: resultado.valor_total,
        data_transacao: resultado.data_transacao.toISOString().split('T')[0],
        observacoes: resultado.observacoes,
        status: resultado.status_pagamento,
        criado_em: resultado.data_criacao
      }
    });

  } catch (error) {
    console.error('Erro ao criar receita:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        detalhes: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        }))
      });
      return;
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * 📝 ATUALIZAR RECEITA (PUT /api/transacao/receita/:id)
 * Atualiza uma receita existente (apenas proprietário)
 */
export const updateReceita = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!id || isNaN(parseInt(id))) {
      res.status(400).json({ error: 'ID da receita inválido' });
      return;
    }

    // Validação dos dados
    const dadosValidados = updateReceitaSchema.parse(req.body);
    
    // Verificar se a transação existe e é uma receita
    const transacaoExistente = await prisma.transacoes.findFirst({
      where: {
        id: parseInt(id),
        tipo: 'RECEITA',
        proprietario_id: userId
      },
      include: {
        transacao_participantes: true,
        transacao_tags: true
      }
    });

    if (!transacaoExistente) {
      res.status(404).json({ 
        error: 'Receita não encontrada ou você não tem permissão para editá-la' 
      });
      return;
    }

    // Verificar tags se fornecidas
    if (dadosValidados.tags && dadosValidados.tags.length > 0) {
      const tagsExistentes = await prisma.tags.findMany({
        where: {
          id: { in: dadosValidados.tags },
          criado_por: userId
        }
      });

      if (tagsExistentes.length !== dadosValidados.tags.length) {
        res.status(400).json({ 
          error: 'Uma ou mais tags não existem ou não pertencem ao usuário' 
        });
        return;
      }
    }

    // Executar atualização em transação
    const resultado = await prisma.$transaction(async (prisma: any) => {
      // Preparar dados para atualização
      const dadosAtualizacao: any = {};
      
      if (dadosValidados.descricao !== undefined) {
        dadosAtualizacao.descricao = dadosValidados.descricao;
      }
      
      if (dadosValidados.local !== undefined) {
        dadosAtualizacao.local = dadosValidados.local;
      }
      
      if (dadosValidados.valor_recebido !== undefined) {
        dadosAtualizacao.valor_total = dadosValidados.valor_recebido;
        dadosAtualizacao.valor_parcela = dadosValidados.valor_recebido;
      }
      
      if (dadosValidados.data_transacao !== undefined) {
        dadosAtualizacao.data_transacao = new Date(dadosValidados.data_transacao);
      }
      
      if (dadosValidados.observacoes !== undefined) {
        dadosAtualizacao.observacoes = dadosValidados.observacoes;
      }

      // 1. Atualizar transação principal
      const transacaoAtualizada = await prisma.transacoes.update({
        where: { id: parseInt(id) },
        data: dadosAtualizacao
      });

      // 2. Atualizar participante se valor mudou
      if (dadosValidados.valor_recebido !== undefined) {
        await prisma.transacao_participantes.updateMany({
          where: {
            transacao_id: parseInt(id),
            pessoa_id: userId
          },
          data: {
            valor_recebido: dadosValidados.valor_recebido
          }
        });
      }

      // 3. Atualizar tags se fornecidas
      if (dadosValidados.tags !== undefined) {
        // Remover tags antigas
        await prisma.transacao_tags.deleteMany({
          where: { transacao_id: parseInt(id) }
        });

        // Adicionar novas tags
        if (dadosValidados.tags.length > 0) {
          const tagsData = dadosValidados.tags.map(tagId => ({
            transacao_id: parseInt(id),
            tag_id: tagId
          }));

          await prisma.transacao_tags.createMany({
            data: tagsData
          });
        }
      }

      return transacaoAtualizada;
    });

    res.json({
      message: 'Receita atualizada com sucesso',
      receita: {
        id: resultado.id,
        tipo: resultado.tipo,
        descricao: resultado.descricao,
        fonte: resultado.local, // Retornando como 'fonte' para compatibilidade da API
        valor_recebido: resultado.valor_total,
        data_transacao: resultado.data_transacao.toISOString().split('T')[0],
        observacoes: resultado.observacoes,
        status: resultado.status_pagamento,
        atualizado_em: resultado.atualizado_em
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        detalhes: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        }))
      });
      return;
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 