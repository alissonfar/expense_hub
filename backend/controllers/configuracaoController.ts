import { Request, Response } from 'express';
import { 
  configuracaoInterfaceSchema,
  ConfiguracaoInterfaceInput,
  TEMAS_DISPONÍVEIS
} from '../schemas/configuracao';
import { z } from 'zod';

// =============================================
// CONTROLLER DE CONFIGURAÇÕES DO HUB
// =============================================

/**
 * Busca configurações de interface (tema, etc.) do Hub
 * GET /api/configuracoes/interface
 */
export const getConfiguracaoInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubId } = req.auth!;

    const configHub = await req.prisma.configuracoes_sistema.findFirst({
      where: { chave: `hub_${hubId}_theme_interface` },
      select: { valor: true }
    });

    const theme = configHub?.valor || 'light';

    res.json({
      success: true,
      message: 'Configurações de interface obtidas com sucesso',
      data: {
        theme_interface: theme,
        temas_disponiveis: TEMAS_DISPONÍVEIS
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[getConfiguracaoInterface] Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Não foi possível buscar as configurações de interface',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza configurações de interface (tema, etc.) do Hub
 * PUT /api/configuracoes/interface
 */
export const updateConfiguracaoInterface = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubId, role } = req.auth!;

    if (role !== 'PROPRIETARIO' && role !== 'ADMINISTRADOR') {
      res.status(403).json({
        success: false,
        message: 'Apenas proprietários ou administradores podem alterar configurações do sistema.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { theme_interface } = configuracaoInterfaceSchema.parse(req.body);

    const updatedConfig = await req.prisma.configuracoes_sistema.upsert({
        where: { chave: `hub_${hubId}_theme_interface` },
        update: { valor: theme_interface },
        create: { 
          chave: `hub_${hubId}_theme_interface`, 
          valor: theme_interface,
          descricao: 'Tema de interface do Hub'
        }
    });

    res.json({
      success: true,
      message: `Tema alterado para "${TEMAS_DISPONÍVEIS[theme_interface].nome}" com sucesso!`,
      data: {
        theme_interface: updatedConfig.valor,
        temas_disponiveis: TEMAS_DISPONÍVEIS
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Tema selecionado não é válido',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.error('[updateConfiguracaoInterface] Erro interno:', error);
    res.status(500).json({
      success: false,
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