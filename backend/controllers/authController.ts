import { Request, Response } from 'express';
import { hashPassword, verifyPassword, validatePasswordStrength, isCommonPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput, SelectHubInput } from '../schemas/auth';
import { UserIdentifier, AuthResponse, HubInfo } from '../types';
import { getEmailService } from '../services/emailService';
import crypto from 'crypto';

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
    
    // Gerar token de verificação
    const verificacaoToken = crypto.randomBytes(32).toString('hex');
    const verificacaoTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    // Usar uma transação Prisma para garantir que a criação do usuário, do hub e do membro seja atômica.
    const newUser = await prisma.$transaction(async (tx: any) => {
      const pessoa = await tx.pessoas.create({
        data: {
          nome,
          email,
          senha_hash: hashedPassword,
          telefone: telefone || null,
          ehAdministrador: false, // O primeiro usuário não é admin do sistema por padrão
          emailVerificado: false, // Conta criada como não verificada
          verificacaoToken,
          verificacaoTokenExpiry
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

      return { pessoa, hub };
    });

    // Enviar email de verificação
    try {
      const emailService = getEmailService();
      const emailResult = await emailService.sendEmailVerification({
        to: newUser.pessoa.email,
        nome: newUser.pessoa.nome,
        verificacaoToken
      });
      
      if (!emailResult.success) {
        console.error('Erro ao enviar email de verificação:', emailResult.error);
      } else {
        console.log('Email de verificação enviado com sucesso');
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de verificação:', emailError);
      // Não falhar o registro se o email falhar
    }

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.',
      data: { 
        id: newUser.pessoa.id, 
        email: newUser.pessoa.email,
        emailVerificado: false
      },
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
    console.log('\x1b[44m[BACKEND][LOGIN] INÍCIO\x1b[0m', {
      headers: req.headers,
      payload: req.body
    });
    const { email, senha }: LoginInput = req.body;

    const user = await prisma.pessoas.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha_hash: true,
        ativo: true,
        ehAdministrador: true,
        is_god: true,
        conviteAtivo: true,
        emailVerificado: true,
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

    // Verificar se o email foi verificado
    if (!user.emailVerificado) {
      res.status(401).json({ 
        error: 'EmailNaoVerificado', 
        message: 'Sua conta ainda não foi verificada. Verifique seu email e clique no link de ativação.' 
      });
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
      is_god: user.is_god || false,
    };

    const refreshToken = generateRefreshToken(userIdentifier);
    console.log('[LOGIN] refreshToken gerado:', refreshToken);
    
    const hubs: HubInfo[] = user.hubs.map((membro: any) => ({
      id: membro.hub.id,
      nome: membro.hub.nome,
      role: membro.role,
    }));

    const resposta = {
      success: true,
      message: 'Login bem-sucedido. Selecione um Hub para continuar.',
      data: {
        user: userIdentifier,
        hubs,
        refreshToken,
      },
      timestamp: new Date().toISOString(),
    };
    console.log('\x1b[42m[BACKEND][LOGIN] RESPOSTA ENVIADA\x1b[0m', resposta);
    res.json(resposta);

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
    console.log('\x1b[44m[BACKEND][SELECT_HUB] INÍCIO\x1b[0m', {
      headers: req.headers,
      payload: req.body
    });
    const { hubId }: SelectHubInput = req.body;
    const { authorization } = req.headers;
    const refreshToken = extractTokenFromHeader(authorization);
    console.log('[SELECT_HUB] refreshToken recebido:', refreshToken);

    if (!refreshToken) {
        res.status(401).json({ error: 'TokenInvalido', message: 'Refresh token é obrigatório.' });
        return;
    }

    let userIdentifier;
    try {
      userIdentifier = verifyRefreshToken(refreshToken);
      console.log('[BACKEND][SELECT_HUB] userIdentifier extraído do refreshToken:', userIdentifier);
    } catch (e) {
      console.error('[BACKEND][SELECT_HUB] Erro ao verificar refreshToken:', refreshToken, e);
      throw e;
    }

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
      is_god: userIdentifier.is_god || false,
    };
    
    const hubContext = {
      id: membership.hubId,
      nome: (await prisma.hub.findUnique({ where: { id: membership.hubId } }))?.nome || '',
      role: membership.role,
      dataAccessPolicy: membership.dataAccessPolicy,
      ehAdministrador: userIdentifier.ehAdministrador,
    };
    
    const accessToken = generateAccessToken(authContext);
    console.log('[BACKEND][SELECT_HUB] accessToken gerado:', accessToken);

    const resposta = {
      success: true,
      message: `Acesso ao Hub concedido.`,
      data: {
        accessToken,
        hubContext
      },
      timestamp: new Date().toISOString(),
    };
    console.log('\x1b[42m[BACKEND][SELECT_HUB] RESPOSTA ENVIADA\x1b[0m', resposta);
    res.json(resposta);

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

/**
 * Solicita reset de senha enviando email com token.
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'EmailObrigatorio', message: 'Email é obrigatório.' });
      return;
    }

    const user = await prisma.pessoas.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true }
    });

    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      res.json({ 
        success: true, 
        message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Gerar token único e seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco
    await prisma.pessoas.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Enviar email
    try {
      const emailService = getEmailService();
      const emailResult = await emailService.sendPasswordResetEmail({
        to: user.email,
        nome: user.nome,
        resetToken
      });

      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Email de redefinição de senha enviado com sucesso.',
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Erro ao enviar email:', emailResult.error);
        res.status(500).json({
          error: 'ErroEmail',
          message: 'Não foi possível enviar o email de redefinição.'
        });
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de reset:', emailError);
      res.status(500).json({
        error: 'ErroEmail',
        message: 'Não foi possível enviar o email de redefinição.'
      });
    }

  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível processar a solicitação.' });
  }
};

/**
 * Redefine a senha usando o token enviado por email.
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      res.status(400).json({ error: 'DadosObrigatorios', message: 'Token e nova senha são obrigatórios.' });
      return;
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(novaSenha);
    if (!passwordValidation.isValid) {
      res.status(400).json({ error: 'SenhaInvalida', message: passwordValidation.errors.join(' ') });
      return;
    }

    // Buscar usuário pelo token
    const user = await prisma.pessoas.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({ error: 'TokenInvalido', message: 'Token inválido ou expirado.' });
      return;
    }

    // Hash da nova senha
    const newHashedPassword = await hashPassword(novaSenha);

    // Atualizar senha e limpar token
    await prisma.pessoas.update({
      where: { id: user.id },
      data: {
        senha_hash: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível redefinir a senha.' });
  }
};

/**
 * Verifica o email da conta usando o token enviado por email.
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'TokenObrigatorio', message: 'Token é obrigatório.' });
      return;
    }

    // Buscar usuário pelo token de verificação
    const user = await prisma.pessoas.findFirst({
      where: {
        verificacaoToken: token,
        verificacaoTokenExpiry: {
          gt: new Date()
        },
        emailVerificado: false
      }
    });

    if (!user) {
      res.status(400).json({ error: 'TokenInvalido', message: 'Token inválido, expirado ou email já verificado.' });
      return;
    }

    // Verificar email e limpar token
    await prisma.pessoas.update({
      where: { id: user.id },
      data: {
        emailVerificado: true,
        emailVerificadoEm: new Date(),
        verificacaoToken: null,
        verificacaoTokenExpiry: null
      }
    });

    // Enviar email de boas-vindas
    try {
      const emailService = getEmailService();
      await emailService.sendWelcomeEmail({
        to: user.email,
        nome: user.nome,
        nomeHub: 'Seu Hub' // Será atualizado quando implementarmos busca do hub
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não falhar a verificação se o email falhar
    }

    res.json({
      success: true,
      message: 'Email verificado com sucesso! Sua conta foi ativada.',
      data: {
        id: user.id,
        email: user.email,
        emailVerificado: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao verificar email:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível verificar o email.' });
  }
}; 

/**
 * Reenvia email de verificação para um usuário
 */
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'EmailObrigatorio', message: 'Email é obrigatório.' });
      return;
    }

    // Buscar usuário pelo email
    const user = await prisma.pessoas.findUnique({
      where: { email }
    });

    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um novo email de verificação.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se o email já foi verificado
    if (user.emailVerificado) {
      res.json({
        success: true,
        message: 'Este email já foi verificado. Você pode fazer login normalmente.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Gerar novo token de verificação
    const verificacaoToken = crypto.randomBytes(32).toString('hex');
    const verificacaoTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Atualizar token no banco
    await prisma.pessoas.update({
      where: { id: user.id },
      data: {
        verificacaoToken,
        verificacaoTokenExpiry
      }
    });

    // Enviar novo email de verificação
    try {
      const emailService = getEmailService();
      const emailResult = await emailService.sendEmailVerification({
        to: user.email,
        nome: user.nome,
        verificacaoToken
      });
      
      if (!emailResult.success) {
        console.error('Erro ao reenviar email de verificação:', emailResult.error);
        res.status(500).json({ 
          error: 'ErroEmail', 
          message: 'Erro ao enviar email. Tente novamente em alguns minutos.' 
        });
        return;
      }
    } catch (emailError) {
      console.error('Erro ao reenviar email de verificação:', emailError);
      res.status(500).json({ 
        error: 'ErroEmail', 
        message: 'Erro ao enviar email. Tente novamente em alguns minutos.' 
      });
      return;
    }

    res.json({
      success: true,
      message: 'Email de verificação reenviado com sucesso!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao reenviar email de verificação:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível reenviar o email.' });
  }
}; 