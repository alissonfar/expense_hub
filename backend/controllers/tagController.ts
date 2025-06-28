import { Request, Response } from 'express';
import { CreateTagInput, UpdateTagInput, TagQueryInput } from '../schemas/tag';

// =============================================
// CONTROLLER DE TAGS
// =============================================

/**
 * Lista todas as tags (com filtros opcionais)
 * GET /api/tags
 */
export const listTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ativo, criado_por, page = 1, limit = 20 }: TagQueryInput = req.query;

    // Construir filtros
    const where: any = {};
    
    if (ativo !== undefined) {
      where.ativo = ativo;
    }
    
    if (criado_por !== undefined) {
      where.criado_por = criado_por;
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar tags com paginação
    const [tags, total] = await Promise.all([
      req.prisma.tags.findMany({
        where,
        select: {
          id: true,
          nome: true,
          cor: true,
          icone: true,
          ativo: true,
          criado_em: true,
          pessoas: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: [
          { ativo: 'desc' }, // Tags ativas primeiro
          { nome: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      req.prisma.tags.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: `${tags.length} tag(s) encontrada(s)`,
      data: tags,
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
    console.error('Erro ao listar tags:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar as tags',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cria uma nova tag (apenas proprietário)
 * POST /api/tags
 */
export const createTag = async (req: Request, res: Response): Promise<void> => {
  console.log(`\n🔍 [createTag] INÍCIO - Criação de tag`);
  console.log(`   Rota: ${req.method} ${req.path}`);
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  
  try {
    if (!req.auth) {
      console.log(`   ❌ [createTag] FALHA - req.auth não encontrado`);
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`   👤 [createTag] Usuário autenticado:`);
    console.log(`      - Papel: ${req.auth.role}`);
    console.log(`      - Hub ID: ${req.auth.hubId}`);
    console.log(`      - Pessoa ID: ${req.auth.pessoaId}`);
    console.log(`      - Eh Administrador: ${req.auth.ehAdministrador}`);
    console.log(`      - Política de Acesso: ${req.auth.dataAccessPolicy || 'N/A'}`);

    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'];
    console.log(`   🔒 [createTag] Verificação de papel:`);
    console.log(`      - Papéis permitidos: [${allowedRoles.join(', ')}]`);
    console.log(`      - Papel do usuário: ${req.auth.role}`);
    console.log(`      - Usuário tem permissão? ${allowedRoles.includes(req.auth.role)}`);
    
    if (!allowedRoles.includes(req.auth.role)) {
      console.log(`   ❌ [createTag] ACESSO NEGADO - Papel não permitido`);
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`   ✅ [createTag] ACESSO PERMITIDO - Prosseguindo com criação`);

    const { nome, cor, icone }: CreateTagInput = req.body;
    console.log(`   📝 [createTag] Dados recebidos:`, { nome, cor, icone });

    // Verificar se nome já existe (deve usar busca por hubId e nome)
    const existingTag = await req.prisma.tags.findFirst({
      where: { 
        hubId: req.auth.hubId,
        nome 
      }
    });

    if (existingTag) {
      res.status(409).json({
        error: 'Nome já cadastrado',
        message: 'Já existe uma tag com este nome',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Criar tag
    const novaTag = await req.prisma.tags.create({
      data: {
        nome,
        cor: cor || '#6B7280',
        icone: icone || null,
        ativo: true,
        criado_por: req.auth.pessoaId,
        criado_em: new Date(),
        hubId: req.auth.hubId
      },
      select: {
        id: true,
        nome: true,
        cor: true,
        icone: true,
        ativo: true,
        criado_em: true,
        pessoas: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tag criada com sucesso!',
      data: novaTag,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar tag:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar a tag',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Busca detalhes de uma tag específica
 * GET /api/tags/:id
 */
export const getTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({
        error: 'ID não fornecido',
        message: 'ID da tag é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'ID deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const tag = await req.prisma.tags.findUnique({
      where: { id },
      include: {
        pessoas: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!tag) {
      res.status(404).json({
        error: 'Tag não encontrada',
        message: 'A tag solicitada não existe ou foi removida',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Buscar estatísticas da tag (transações relacionadas)
    const [totalTransacoes, totalGastos, totalReceitas] = await Promise.all([
      req.prisma.transacao_tags.count({
        where: { tag_id: id }
      }),
      req.prisma.transacao_tags.count({
        where: { 
          tag_id: id,
          transacoes: { tipo: 'GASTO' }
        }
      }),
      req.prisma.transacao_tags.count({
        where: { 
          tag_id: id,
          transacoes: { tipo: 'RECEITA' }
        }
      })
    ]);

    const estatisticas = {
      total_transacoes: totalTransacoes,
      total_gastos: totalGastos,
      total_receitas: totalReceitas,
      porcentagem_gastos: totalTransacoes > 0 ? Math.round((totalGastos / totalTransacoes) * 100) : 0
    };

    res.json({
      success: true,
      message: 'Tag encontrada com sucesso',
      data: {
        ...tag,
        estatisticas
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar tag:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os dados da tag',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza dados de uma tag
 * PUT /api/tags/:id
 */
export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'];
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({
        error: 'ID não fornecido',
        message: 'ID da tag é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'ID deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { nome, cor, icone }: UpdateTagInput = req.body;

    // Verificar se tag existe
    const tagExistente = await req.prisma.tags.findUnique({
      where: { id }
    });

    if (!tagExistente) {
      res.status(404).json({
        error: 'Tag não encontrada',
        message: 'A tag que você está tentando editar não existe',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Se nome está sendo alterado, verificar se não existe
    if (nome && nome !== tagExistente.nome) {
      const existingTag = await req.prisma.tags.findFirst({
        where: {
          nome,
          id: { not: id }
        }
      });

      if (existingTag) {
        res.status(409).json({
          error: 'Nome já cadastrado',
          message: 'Já existe uma tag com este nome',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {};

    if (nome) dataToUpdate.nome = nome;
    if (cor !== undefined) dataToUpdate.cor = cor;
    if (icone !== undefined) dataToUpdate.icone = icone || null;

    // Atualizar dados
    const tagAtualizada = await req.prisma.tags.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nome: true,
        cor: true,
        icone: true,
        ativo: true,
        criado_em: true,
        pessoas: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Tag atualizada com sucesso!',
      data: tagAtualizada,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar tag:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar os dados da tag',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Desativa uma tag (soft delete)
 * DELETE /api/tags/:id
 */
export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR'];
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({
        error: 'ID não fornecido',
        message: 'ID da tag é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'ID deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se tag existe
    const tag = await req.prisma.tags.findUnique({
      where: { id }
    });

    if (!tag) {
      res.status(404).json({
        error: 'Tag não encontrada',
        message: 'A tag que você está tentando remover não existe',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se tag está sendo usada em transações ATIVAS
    const transacoesUsando = await req.prisma.transacao_tags.findFirst({
      where: { 
        tag_id: id,
        transacoes: {
          ativo: true
        }
      }
    });

    if (transacoesUsando) {
      res.status(400).json({
        error: 'Tag em uso',
        message: 'Não é possível desativar tag que está sendo usada em transações. Remova das transações primeiro.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Desativar tag (soft delete)
    const tagDesativada = await req.prisma.tags.update({
      where: { id },
      data: {
        ativo: false
      },
      select: {
        id: true,
        nome: true,
        cor: true,
        ativo: true
      }
    });

    res.json({
      success: true,
      message: 'Tag desativada com sucesso!',
      data: tagDesativada,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao desativar tag:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível desativar a tag',
      timestamp: new Date().toISOString()
    });
  }
}; 