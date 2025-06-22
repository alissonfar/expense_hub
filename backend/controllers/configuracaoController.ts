import { Request, Response } from 'express';
import { 
  configuracaoInterfaceSchema,
  ConfiguracaoInterfaceInput
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

    res.json({
      success: true,
      message: 'Configurações de interface obtidas com sucesso',
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar configurações de interface:', error);
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

    // Atualizar configurações
    await req.prisma.$transaction(async (prisma) => {
      const updates = [
        {
          chave: 'theme_interface',
          valor: dadosValidados.theme_interface,
          descricao: 'Tema da interface do sistema (light, dark, auto)'
        }
      ];

      for (const update of updates) {
        await prisma.configuracoes_sistema.upsert({
          where: { chave: update.chave },
          update: { 
            valor: update.valor,
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

    res.json({
      success: true,
      message: 'Configurações de interface atualizadas com sucesso!',
      data: dadosValidados,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações de interface:', error);
    
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