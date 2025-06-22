import { Request, Response } from 'express';
import { hashPassword, verifyPassword, validatePasswordStrength, isCommonPassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../schemas/auth';
import { AuthUser, AuthResponse } from '../types';

// =============================================
// CONTROLLER DE AUTENTICAÇÃO
// =============================================

/**
 * Registra um novo usuário
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, senha, telefone }: RegisterInput = req.body;

    // Verificar se senha não é comum
    if (isCommonPassword(senha)) {
      res.status(400).json({
        error: 'Senha muito comum',
        message: 'Escolha uma senha mais segura',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(senha);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: 'Senha não atende aos critérios',
        message: 'Senha deve ser mais forte',
        details: passwordValidation.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se email já existe
    const existingUser = await req.prisma.pessoas.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Este email já está sendo usado por outro usuário',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash da senha
    const hashedPassword = await hashPassword(senha);

    // Verificar se é o primeiro usuário (será proprietário)
    const userCount = await req.prisma.pessoas.count();
    const isFirstUser = userCount === 0;

    // Criar usuário
    const newUser = await req.prisma.pessoas.create({
      data: {
        nome,
        email,
        senha_hash: hashedPassword,
        telefone: telefone || null,
        eh_proprietario: isFirstUser,
        ativo: true,
        data_cadastro: new Date(),
        atualizado_em: new Date()
      }
    });

    // Preparar dados do usuário para token
    const userForToken: AuthUser = {
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.email,
      eh_proprietario: newUser.eh_proprietario || false
    };

    // Gerar tokens
    const token = generateToken(userForToken);
    const refreshToken = generateRefreshToken(userForToken);

    // Resposta
    const response: AuthResponse = {
      token,
      user: userForToken
    };

    res.status(201).json({
      success: true,
      message: isFirstUser ? 'Conta de proprietário criada com sucesso!' : 'Usuário registrado com sucesso!',
      data: response,
      refreshToken,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o usuário',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Faz login do usuário
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha }: LoginInput = req.body;

    // Buscar usuário por email
    const user = await req.prisma.pessoas.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se usuário está ativo
    if (!user.ativo) {
      res.status(401).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Entre em contato com o administrador.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(senha, user.senha_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Atualizar último login
    await req.prisma.pessoas.update({
      where: { id: user.id },
      data: { 
        atualizado_em: new Date()
      }
    });

    // Preparar dados do usuário para token
    const userForToken: AuthUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      eh_proprietario: user.eh_proprietario || false
    };

    // Gerar tokens
    const token = generateToken(userForToken);
    const refreshToken = generateRefreshToken(userForToken);

    // Resposta
    const response: AuthResponse = {
      token,
      user: userForToken
    };

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: response,
      refreshToken,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível fazer o login',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retorna dados do usuário logado
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Buscar dados atualizados do usuário
    const user = await req.prisma.pessoas.findUnique({
      where: { id: req.user.user_id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        eh_proprietario: true,
        ativo: true,
        data_cadastro: true,
        atualizado_em: true
      }
    });

    if (!user) {
      res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'Usuário não existe mais no sistema',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!user.ativo) {
      res.status(401).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar dados do usuário',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza perfil do usuário
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { nome, email, telefone }: UpdateProfileInput = req.body;

    // Se email está sendo alterado, verificar se não existe
    if (email) {
      const existingUser = await req.prisma.pessoas.findFirst({
        where: {
          email,
          id: { not: req.user.user_id }
        }
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Email já cadastrado',
          message: 'Este email já está sendo usado por outro usuário',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Atualizar dados
    const updatedUser = await req.prisma.pessoas.update({
      where: { id: req.user.user_id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        atualizado_em: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        eh_proprietario: true,
        ativo: true,
        atualizado_em: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: updatedUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o perfil',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Altera senha do usuário
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        message: 'Token de autenticação é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { senhaAtual, novaSenha }: ChangePasswordInput = req.body;

    // Buscar usuário atual
    const user = await req.prisma.pessoas.findUnique({
      where: { id: req.user.user_id }
    });

    if (!user) {
      res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'Usuário não existe mais no sistema',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await verifyPassword(senhaAtual, user.senha_hash);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        error: 'Senha atual incorreta',
        message: 'A senha atual fornecida está incorreta',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se nova senha não é comum
    if (isCommonPassword(novaSenha)) {
      res.status(400).json({
        error: 'Senha muito comum',
        message: 'Escolha uma senha mais segura',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validar força da nova senha
    const passwordValidation = validatePasswordStrength(novaSenha);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: 'Senha não atende aos critérios',
        message: 'Nova senha deve ser mais forte',
        details: passwordValidation.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash da nova senha
    const hashedNewPassword = await hashPassword(novaSenha);

    // Atualizar senha
    await req.prisma.pessoas.update({
      where: { id: req.user.user_id },
      data: {
        senha_hash: hashedNewPassword,
        atualizado_em: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível alterar a senha',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Logout (invalidar token - implementação básica)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Implementação básica - em produção seria interessante ter uma blacklist de tokens
  res.json({
    success: true,
    message: 'Logout realizado com sucesso!',
    timestamp: new Date().toISOString()
  });
}; 