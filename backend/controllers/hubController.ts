import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { verifyRefreshToken } from '../utils/jwt';

// Schema de validação para criação de hub
const createHubSchema = z.object({
  nome: z.string().min(3, 'O nome do Hub deve ter pelo menos 3 caracteres').max(50, 'O nome do Hub deve ter no máximo 50 caracteres'),
});

export const createHub = async (req: Request, res: Response): Promise<void> => {
  console.log(`[REQ] POST /hubs - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
  try {
    let pessoaId: number | null = null;
    let onboarding = false;
    // Se já autenticado (accessToken), use normalmente
    if (req.auth) {
      pessoaId = req.auth.pessoaId;
      onboarding = false;
    } else {
      // Tentar autenticar via refreshToken para onboarding inicial
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const refreshToken = authHeader.replace('Bearer ', '');
          const userIdentifier = verifyRefreshToken(refreshToken);
          pessoaId = userIdentifier.pessoaId;
          onboarding = true;
        } catch (e) {
          res.status(401).json({ error: 'TokenInvalido', message: (e as Error).message || 'Refresh token inválido.' });
          return void 0;
        }
      } else {
      }
    }
    if (!pessoaId) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return void 0;
    }
    const { nome } = createHubSchema.parse(req.body);
    const hubExistente = await prisma.hub.findFirst({
      where: {
        nome,
        membros: {
          some: { pessoaId }
        }
      }
    });
    if (hubExistente) {
      res.status(409).json({ error: 'NomeEmUso', message: 'Você já possui um Hub com este nome.' });
      return;
    }
    const novoHub = await prisma.hub.create({
      data: {
        nome,
        membros: {
          create: {
            pessoaId,
            role: 'PROPRIETARIO',
            ativo: true,
          },
        },
      },
      include: {
        membros: true,
      },
    });
    res.status(201).json({
      success: true,
      message: 'Hub criado com sucesso!',
      data: novoHub,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'DadosInvalidos', message: 'Verifique os campos e tente novamente.', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível criar o hub.' });
  }
}; 