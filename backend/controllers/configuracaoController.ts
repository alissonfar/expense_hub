import { Request, Response } from 'express';
import { 
  configuracaoInterfaceSchema,
  ConfiguracaoInterfaceInput,
  TEMAS_DISPONÍVEIS
} from '../schemas/configuracao';
import { z } from 'zod';

// =============================================
// CONTROLLER DE CONFIGURAÇÕES DO SISTEMA
// =============================================

/**
 * Busca configurações de interface (tema, etc.)
 * GET /api/configuracoes/interface
 */
export const getConfiguracaoInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[getConfiguracaoInterface] Buscando configurações de interface');

    const configuracoes = await req.prisma.configuracoes_sistema.findMany({
      where: {
        chave: {
          in: ['theme_interface']
        }
      }
    });

    const config = {
      theme_interface: configuracoes.find(c => c.chave === 'theme_interface')?.valor || 'light'
    };

    console.log('[getConfiguracaoInterface] Configurações obtidas:', config);

    res.json({
      success: true,
      message: 'Configurações de interface obtidas com sucesso',
      data: {
        ...config,
        temas_disponíveis: TEMAS_DISPONÍVEIS
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[getConfiguracaoInterface] Erro ao buscar configurações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as configurações de interface',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza configurações de interface (tema, etc.)
 * PUT /api/configuracoes/interface
 */
export const updateConfiguracaoInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[updateConfiguracaoInterface] Iniciando atualização', { 
      user_id: (req as any).user?.user_id,
      body: req.body 
    });

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
    const dadosValidados: ConfiguracaoInterfaceInput = configuracaoInterfaceSchema.parse(req.body);

    console.log('[updateConfiguracaoInterface] Dados validados:', dadosValidados);

    // Atualizar configurações
    await req.prisma.$transaction(async (prisma) => {
      const updates = [
        {
          chave: 'theme_interface',
          valor: dadosValidados.theme_interface,
          descricao: `Tema da interface do sistema (${TEMAS_DISPONÍVEIS[dadosValidados.theme_interface].nome})`
        }
      ];

      for (const update of updates) {
        await prisma.configuracoes_sistema.upsert({
          where: { chave: update.chave },
          update: { 
            valor: update.valor,
            descricao: update.descricao,
            atualizado_em: new Date()
          },
          create: {
            chave: update.chave,
            valor: update.valor,
            descricao: update.descricao
          }
        });
      }
    });

    console.log('[updateConfiguracaoInterface] Configurações atualizadas com sucesso');

    res.json({
      success: true,
      message: `Tema alterado para "${TEMAS_DISPONÍVEIS[dadosValidados.theme_interface].nome}" com sucesso!`,
      data: {
        ...dadosValidados,
        temas_disponíveis: TEMAS_DISPONÍVEIS
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[updateConfiguracaoInterface] Erro de validação:', error.errors);
      res.status(400).json({
        error: 'Dados inválidos',
        message: 'Tema selecionado não é válido',
        details: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        })),
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.error('[updateConfiguracaoInterface] Erro interno:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar as configurações de interface',
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================
// FUNÇÕES PREPARADAS PARA FUTURAS CONFIGURAÇÕES
// =============================================

/**
 * Template para futuras configurações de comportamento
 * GET /api/configuracoes/comportamento
 */
export const getConfiguracaoComportamento = async (req: Request, res: Response): Promise<void> => {
  // TODO: Implementar quando necessário
  res.status(501).json({
    error: 'Não implementado',
    message: 'Configurações de comportamento ainda não implementadas',
    timestamp: new Date().toISOString()
  });
};

/**
 * Template para futuras configurações de alertas
 * GET /api/configuracoes/alertas
 */
export const getConfiguracaoAlertas = async (req: Request, res: Response): Promise<void> => {
  // TODO: Implementar quando necessário
  res.status(501).json({
    error: 'Não implementado',
    message: 'Configurações de alertas ainda não implementadas',
    timestamp: new Date().toISOString()
  });
};

/**
 * Template para futuras configurações de relatórios
 * GET /api/configuracoes/relatorios
 */
export const getConfiguracaoRelatorios = async (req: Request, res: Response): Promise<void> => {
  // TODO: Implementar quando necessário
  res.status(501).json({
    error: 'Não implementado',
    message: 'Configurações de relatórios ainda não implementadas',
    timestamp: new Date().toISOString()
  });
}; 