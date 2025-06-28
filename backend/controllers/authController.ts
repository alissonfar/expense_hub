import { Request, Response } from 'express';
import { hashPassword, verifyPassword, validatePasswordStrength, isCommonPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput, SelectHubInput } from '../schemas/auth';
import { UserIdentifier, AuthResponse, HubInfo } from '../types';

// Prisma Client global usado SOMENTE para operações que não dependem de um Hub específico,
// como login e busca de usuário. Para operações de negócio, SEMPRE use req.prisma.
import { prisma } from '../utils/prisma'; 

// =============================================
// CONTROLLER DE AUTENTICAÇÃO MULTI-TENANT
// =============================================

/**
 * Registra um novo usuário e cria seu primeiro Hub.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, senha, telefone, nomeHub }: RegisterInput = req.body;

    if (isCommonPassword(senha)) {
      res.status(400).json({ error: 'SenhaFraca', message: 'Escolha uma senha mais segura.' });
      return;
    }

    const passwordValidation = validatePasswordStrength(senha);
    if (!passwordValidation.isValid) {
      res.status(400).json({ error: 'SenhaInvalida', message: passwordValidation.errors.join(' ') });
      return;
    }

    const existingUser = await prisma.pessoas.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'EmailEmUso', message: 'Este email já está cadastrado.' });
      return;
    }

    const hashedPassword = await hashPassword(senha);
    
    // Usar uma transação Prisma para garantir que a criação do usuário, do hub e do membro seja atômica.
    const newUser = await prisma.$transaction(async (tx: any) => {
      const pessoa = await tx.pessoas.create({
        data: {
          nome,
          email,
          senha_hash: hashedPassword,
          telefone: telefone || null,
          ehAdministrador: false, // O primeiro usuário não é admin do sistema por padrão
        },
      });

      const hub = await tx.hub.create({
        data: {
          nome: nomeHub,
          membros: {
            create: {
              pessoaId: pessoa.id,
              role: 'PROPRIETARIO',
              ativo: true,
            },
          },
        },
      });

      return pessoa;
    });

    res.status(201).json({
      success: true,
      message: 'Usuário e Hub criados com sucesso! Faça login para continuar.',
      data: { id: newUser.id, email: newUser.email },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível criar o usuário.' });
  }
};

/**
 * Autentica um usuário e retorna a lista de Hubs que ele pode acessar.
 * Não retorna um token de acesso ainda.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha }: LoginInput = req.body;

    const user = await prisma.pessoas.findUnique({
      where: { email },
      include: {
        hubs: {
          where: { ativo: true },
          select: {
            hub: {
              select: {
                id: true,
                nome: true,
              }
            },
            role: true,
          }
        }
      }
    });

    if (!user || !user.ativo) {
      res.status(401).json({ error: 'CredenciaisInvalidas', message: 'Email ou senha incorretos ou conta inativa.' });
      return;
    }

    // Verificar se o usuário tem senha definida
    if (!user.senha_hash) {
      if (user.conviteAtivo) {
        res.status(401).json({ 
          error: 'ConvitePendente', 
          message: 'Você possui um convite pendente. Verifique seu email ou solicite um novo convite.' 
        });
      } else {
        res.status(401).json({ error: 'CredenciaisInvalidas', message: 'Email ou senha incorretos.' });
      }
      return;
    }

    const isPasswordValid = await verifyPassword(senha, user.senha_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'CredenciaisInvalidas', message: 'Email ou senha incorretos.' });
      return;
    }
    
    const userIdentifier: UserIdentifier = {
      pessoaId: user.id,
      nome: user.nome,
      email: user.email,
      ehAdministrador: user.ehAdministrador,
    };

    const refreshToken = generateRefreshToken(userIdentifier);
    
    const hubs: HubInfo[] = user.hubs.map((membro: any) => ({
      id: membro.hub.id,
      nome: membro.hub.nome,
      role: membro.role,
    }));

    res.json({
      success: true,
      message: 'Login bem-sucedido. Selecione um Hub para continuar.',
      data: {
        user: userIdentifier,
        hubs,
      },
      refreshToken, // O refresh token é geral e pode ser usado para obter novos access tokens
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível fazer o login.' });
  }
};

/**
 * Gera um Access Token para um Hub específico.
 * Requer um Refresh Token válido.
 */
export const selectHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubId }: SelectHubInput = req.body;
    const { authorization } = req.headers;
    const refreshToken = extractTokenFromHeader(authorization);

    if (!refreshToken) {
        res.status(401).json({ error: 'TokenInvalido', message: 'Refresh token é obrigatório.' });
        return;
    }

    const userIdentifier = verifyRefreshToken(refreshToken);

    // Verificar se o usuário realmente pertence ao Hub solicitado
    const membership = await prisma.membros_hub.findUnique({
      where: {
        hubId_pessoaId: {
          hubId,
          pessoaId: userIdentifier.pessoaId,
        },
        ativo: true,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'AcessoNegado', message: 'Você não é membro deste Hub ou sua participação está inativa.' });
      return;
    }

    const authContext = {
      pessoaId: userIdentifier.pessoaId,
      hubId: membership.hubId,
      role: membership.role,
      dataAccessPolicy: membership.dataAccessPolicy,
      ehAdministrador: userIdentifier.ehAdministrador,
    };
    
    const accessToken = generateAccessToken(authContext);

    res.json({
      success: true,
      message: `Acesso ao Hub concedido.`,
      data: {
        accessToken
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro ao selecionar Hub:', error);
    res.status(401).json({ error: 'TokenInvalido', message: 'Refresh token inválido ou expirado.' });
  }
};

const extractTokenFromHeader = (header: string | undefined): string | null => {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.split(' ')[1] || null;
};


/**
 * Retorna dados do usuário logado, baseado no contexto do token.
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Token de acesso é obrigatório.' });
      return;
    }

    const user = await prisma.pessoas.findUnique({
      where: { id: req.auth.pessoaId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        ehAdministrador: true,
        ativo: true,
        data_cadastro: true,
        atualizado_em: true,
        hubs: {
          select: {
            role: true,
            hub: {
              select: { id: true, nome: true }
            }
          }
        }
      }
    });

    if (!user || !user.ativo) {
      res.status(404).json({ error: 'UsuarioNaoEncontrado', message: 'Usuário não encontrado ou inativo.' });
      return;
    }

    res.json({ success: true, data: user, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível buscar o perfil.' });
  }
};

/**
 * Atualiza o perfil do usuário logado.
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Token de acesso é obrigatório.' });
      return;
    }

    const { nome, telefone }: UpdateProfileInput = req.body;

    const dataToUpdate: any = {};
    if (nome !== undefined) dataToUpdate.nome = nome;
    if (telefone !== undefined) dataToUpdate.telefone = telefone;

    const updatedUser = await prisma.pessoas.update({
      where: { id: req.auth.pessoaId },
      data: dataToUpdate,
      select: { id: true, nome: true, email: true, telefone: true, atualizado_em: true }
    });

    res.json({ success: true, message: 'Perfil atualizado com sucesso.', data: updatedUser, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível atualizar o perfil.' });
  }
};

/**
 * Altera a senha do usuário logado.
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Token de acesso é obrigatório.' });
      return;
    }

    const { senhaAtual, novaSenha }: ChangePasswordInput = req.body;

    const user = await prisma.pessoas.findUnique({ where: { id: req.auth.pessoaId } });

    if (!user) {
      res.status(404).json({ error: 'UsuarioNaoEncontrado', message: 'Usuário não encontrado.' });
      return;
    }

    // Verificar se o usuário tem senha definida
    if (!user.senha_hash) {
      res.status(400).json({ error: 'SenhaNaoDefinida', message: 'Usuário não possui senha definida. Use o sistema de convite para ativar sua conta.' });
      return;
    }

    const isPasswordValid = await verifyPassword(senhaAtual, user.senha_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'SenhaInvalida', message: 'A senha atual está incorreta.' });
      return;
    }

    const passwordValidation = validatePasswordStrength(novaSenha);
    if (!passwordValidation.isValid) {
        res.status(400).json({ error: 'SenhaInvalida', message: passwordValidation.errors.join(' ') });
        return;
    }
    
    const newHashedPassword = await hashPassword(novaSenha);

    await prisma.pessoas.update({
      where: { id: req.auth.pessoaId },
      data: { senha_hash: newHashedPassword }
    });

    res.json({ success: true, message: 'Senha alterada com sucesso.', timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível alterar a senha.' });
  }
};

/**
 * Invalida tokens (lógica a ser implementada, ex: blocklist).
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // A invalidação de JWT do lado do servidor pode ser feita com uma blocklist em Redis/DB.
  // Para uma implementação stateless, o cliente simplesmente descarta o token.
  res.json({ success: true, message: 'Logout realizado. O token deve ser descartado no cliente.', timestamp: new Date().toISOString() });
}; 