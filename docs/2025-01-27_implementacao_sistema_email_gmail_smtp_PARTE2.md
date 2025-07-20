# 📧 DOCUMENTAÇÃO TÉCNICA: IMPLEMENTAÇÃO DO SISTEMA DE EMAIL COM GMAIL SMTP - PARTE 2

**Continuação da Parte 1**

---

## 3.2.1 Novos Arquivos a Criar (Continuação)

**4. `backend/services/emailTemplates.ts`**
```typescript
import { EmailUtils } from '../utils/emailUtils';

export class EmailTemplate {
  /**
   * Template para convite inicial
   */
  static getInviteTemplate(data: {
    nome: string;
    hubNome: string;
    conviteToken: string;
    convidadorNome: string;
    frontendUrl: string;
  }): string {
    const activationLink = EmailUtils.generateActivationLink(data.conviteToken, data.frontendUrl);
    const currentDate = EmailUtils.formatDate(new Date());
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para o Hub ${EmailUtils.sanitizeHtml(data.hubNome)}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Convite para o Expense Hub</h1>
            <p>Você foi convidado para participar do hub <strong>${EmailUtils.sanitizeHtml(data.hubNome)}</strong></p>
        </div>
        
        <div class="content">
            <h2>Olá, ${EmailUtils.sanitizeHtml(data.nome)}!</h2>
            
            <p>Você foi convidado por <strong>${EmailUtils.sanitizeHtml(data.convidadorNome)}</strong> para participar do hub <strong>${EmailUtils.sanitizeHtml(data.hubNome)}</strong> no Expense Hub.</p>
            
            <p>O Expense Hub é uma plataforma para gerenciar despesas compartilhadas de forma simples e eficiente.</p>
            
            <div style="text-align: center;">
                <a href="${activationLink}" class="button">Ativar Minha Conta</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Este convite expira em 24 horas</li>
                    <li>Clique no botão acima para ativar sua conta</li>
                    <li>Você precisará definir uma senha segura</li>
                </ul>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px; font-size: 12px;">
                ${activationLink}
            </p>
            
            <p>Se você não esperava este convite, pode ignorar este email com segurança.</p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo Expense Hub</p>
            <p>Data: ${currentDate}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template para reenvio de convite
   */
  static getReinviteTemplate(data: {
    nome: string;
    hubNome: string;
    conviteToken: string;
    convidadorNome: string;
    frontendUrl: string;
  }): string {
    const activationLink = EmailUtils.generateActivationLink(data.conviteToken, data.frontendUrl);
    const currentDate = EmailUtils.formatDate(new Date());
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Convite para o Hub ${EmailUtils.sanitizeHtml(data.hubNome)}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Novo Convite para o Expense Hub</h1>
            <p>Seu convite foi renovado para o hub <strong>${EmailUtils.sanitizeHtml(data.hubNome)}</strong></p>
        </div>
        
        <div class="content">
            <h2>Olá, ${EmailUtils.sanitizeHtml(data.nome)}!</h2>
            
            <p>Seu convite anterior expirou, mas <strong>${EmailUtils.sanitizeHtml(data.convidadorNome)}</strong> enviou um novo convite para você participar do hub <strong>${EmailUtils.sanitizeHtml(data.hubNome)}</strong>.</p>
            
            <p>Este é um novo link de ativação válido por mais 24 horas.</p>
            
            <div style="text-align: center;">
                <a href="${activationLink}" class="button">Ativar Minha Conta</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Lembre-se:</strong>
                <ul>
                    <li>Este novo convite expira em 24 horas</li>
                    <li>Use o botão acima para ativar sua conta</li>
                    <li>Defina uma senha segura durante a ativação</li>
                </ul>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px; font-size: 12px;">
                ${activationLink}
            </p>
            
            <p>Se você não esperava este convite, pode ignorar este email com segurança.</p>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo Expense Hub</p>
            <p>Data: ${currentDate}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template de texto simples (fallback)
   */
  static getPlainTextTemplate(data: {
    nome: string;
    hubNome: string;
    conviteToken: string;
    convidadorNome: string;
    frontendUrl: string;
    isReinvite?: boolean;
  }): string {
    const activationLink = EmailUtils.generateActivationLink(data.conviteToken, data.frontendUrl);
    const title = data.isReinvite ? 'Novo Convite para o Expense Hub' : 'Convite para o Expense Hub';
    
    return `
${title}

Olá, ${data.nome}!

Você foi convidado por ${data.convidadorNome} para participar do hub ${data.hubNome} no Expense Hub.

Para ativar sua conta, acesse o link:
${activationLink}

IMPORTANTE:
- Este convite expira em 24 horas
- Você precisará definir uma senha segura
- Se não esperava este convite, pode ignorar este email

Data: ${EmailUtils.formatDate(new Date())}
`;
  }
}
```

**5. `backend/services/emailService.ts`**
```typescript
import nodemailer from 'nodemailer';
import { EmailTemplate } from './emailTemplates';
import { EmailMonitoring } from './emailMonitoring';
import { EmailUtils } from '../utils/emailUtils';
import { EmailData, EmailResult, EmailConfig } from '../types/email';

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  private monitoring: EmailMonitoring;
  private retryAttempts: number;
  private retryDelay: number;

  private constructor() {
    this.transporter = this.createTransporter();
    this.monitoring = new EmailMonitoring();
    this.retryAttempts = parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.EMAIL_RETRY_DELAY || '1000');
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Cria o transporter do Nodemailer
   */
  private createTransporter(): nodemailer.Transporter {
    this.validateCredentials();

    const config: EmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 100
    };

    return nodemailer.createTransporter(config);
  }

  /**
   * Valida credenciais de email
   */
  private validateCredentials(): void {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Credenciais Gmail não configuradas. Configure GMAIL_USER e GMAIL_APP_PASSWORD');
    }

    if (!EmailUtils.validateEmail(process.env.GMAIL_USER)) {
      throw new Error('GMAIL_USER deve ser um email válido');
    }
  }

  /**
   * Testa conexão com Gmail
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Conexão Gmail verificada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Falha na conexão Gmail:', error);
      return false;
    }
  }

  /**
   * Envia email de convite
   */
  async sendInviteEmail(data: EmailData): Promise<EmailResult> {
    return this.sendEmail(data, false);
  }

  /**
   * Envia email de reenvio de convite
   */
  async sendReinviteEmail(data: EmailData): Promise<EmailResult> {
    return this.sendEmail(data, true);
  }

  /**
   * Método principal de envio de email com retry
   */
  private async sendEmail(data: EmailData, isReinvite: boolean = false): Promise<EmailResult> {
    // Verificar se emails estão habilitados
    if (process.env.ENABLE_EMAILS === 'false') {
      console.log('📧 Emails desabilitados, pulando envio');
      return { success: true, messageId: 'disabled' };
    }

    // Validar dados de entrada
    const validation = EmailUtils.validateEmailData(data);
    if (!validation.isValid) {
      const error = `Dados de email inválidos: ${validation.errors.join(', ')}`;
      console.error('❌', error);
      return { success: false, error };
    }

    // Verificar limites
    const limitCheck = this.monitoring.checkLimits();
    if (!limitCheck.canSend) {
      const error = `Limite de emails atingido: ${limitCheck.reason}`;
      console.error('❌', error);
      return { success: false, error };
    }

    // Preparar dados do email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const emailData = {
      nome: EmailUtils.sanitizeHtml(data.nome),
      hubNome: EmailUtils.sanitizeHtml(data.hubNome),
      conviteToken: data.conviteToken,
      convidadorNome: EmailUtils.sanitizeHtml(data.convidadorNome),
      frontendUrl
    };

    // Gerar templates
    const htmlContent = isReinvite 
      ? EmailTemplate.getReinviteTemplate(emailData)
      : EmailTemplate.getInviteTemplate(emailData);
    
    const textContent = EmailTemplate.getPlainTextTemplate({
      ...emailData,
      isReinvite
    });

    // Configurar email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Expense Hub'}" <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: isReinvite 
        ? `Novo Convite - ${emailData.hubNome} - Expense Hub`
        : `Convite - ${emailData.hubNome} - Expense Hub`,
      html: htmlContent,
      text: textContent,
      priority: 'high'
    };

    // Tentar enviar com retry
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Delay entre tentativas (exceto primeira)
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }

        const result = await this.transporter.sendMail(mailOptions);
        
        // Incrementar contadores
        this.monitoring.incrementCount();
        this.monitoring.logUsage();

        console.log(`✅ Email enviado com sucesso (tentativa ${attempt}/${this.retryAttempts}):`, {
          to: data.to,
          messageId: result.messageId,
          subject: mailOptions.subject
        });

        return {
          success: true,
          messageId: result.messageId,
          retryCount: attempt
        };

      } catch (error) {
        console.error(`❌ Falha no envio de email (tentativa ${attempt}/${this.retryAttempts}):`, {
          to: data.to,
          error: error instanceof Error ? error.message : String(error)
        });

        // Se é a última tentativa, retornar erro
        if (attempt === this.retryAttempts) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            retryCount: attempt
          };
        }
      }
    }

    return {
      success: false,
      error: 'Número máximo de tentativas excedido',
      retryCount: this.retryAttempts
    };
  }

  /**
   * Retorna dados de monitoramento
   */
  getMonitoringData() {
    return this.monitoring.getMonitoringData();
  }

  /**
   * Reseta contadores (para testes)
   */
  resetMonitoring() {
    this.monitoring.resetCounters();
  }
}
```

#### 3.2.2 Arquivos a Modificar

**1. `backend/controllers/pessoaController.ts`**
```typescript
// Adicionar no início do arquivo:
import { EmailService } from '../services/emailService';

// Modificar função convidarMembro:
export const convidarMembro = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    
    const { email, nome, role, dataAccessPolicy }: CreateMembroInput = req.body;
    const { hubId } = req.auth;

    const membroExistente = await req.prisma.membros_hub.findFirst({
      where: { hubId, pessoa: { email } }
    });

    if (membroExistente) {
      res.status(409).json({ error: 'MembroJaExiste', message: 'Uma pessoa com este email já é membro deste Hub.' });
      return;
    }
    
    const novoMembro = await globalPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Gerar token de convite seguro
      const conviteToken = generateInviteToken();
      const conviteExpiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      const pessoa = await tx.pessoas.upsert({
        where: { email },
        update: {
          conviteToken,
          conviteExpiraEm,
          conviteAtivo: true,
          senha_hash: null,
          ...(nome && { nome })
        },
        create: {
          email,
          nome,
          senha_hash: null,
          conviteToken,
          conviteExpiraEm,
          conviteAtivo: true
        }
      });

      return tx.membros_hub.create({
        data: {
          hubId,
          pessoaId: pessoa.id,
          role,
          ativo: true,
          dataAccessPolicy: (role === 'COLABORADOR' ? dataAccessPolicy : null) as any,
        },
        include: {
          pessoa: { select: { id: true, nome: true, email: true, conviteToken: true }},
          hub: { select: { nome: true }}
        }
      });
    });

    // ENVIAR EMAIL DE CONVITE
    try {
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendInviteEmail({
        to: email,
        nome: nome,
        hubNome: novoMembro.hub.nome,
        conviteToken: novoMembro.pessoa.conviteToken!,
        convidadorNome: req.auth.nome || 'Administrador'
      });

      if (!emailResult.success) {
        console.error('❌ Falha no envio de email de convite:', emailResult.error);
        // Não falhar a operação se o email falhar, apenas logar
      }
    } catch (emailError) {
      console.error('❌ Erro inesperado no envio de email:', emailError);
      // Não falhar a operação se o email falhar
    }

    res.status(201).json({
      success: true,
      message: 'Membro convidado com sucesso para o Hub. Um convite foi enviado para o email.',
      data: {
        ...novoMembro,
        conviteToken: novoMembro.pessoa.conviteToken // Incluir token para testes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao convidar membro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível convidar o membro.' });
  }
};

// Modificar função reenviarConvite:
export const reenviarConvite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    
    const { email }: ReenviarConviteInput = req.body;
    const { hubId } = req.auth;

    // Verificar se o usuário é membro do Hub
    const membro = await req.prisma.membros_hub.findFirst({
      where: { hubId, pessoa: { email } },
      include: { 
        pessoa: true,
        hub: { select: { nome: true }}
      }
    });

    if (!membro) {
      res.status(404).json({ error: 'MembroNaoEncontrado', message: 'Membro não encontrado neste Hub.' });
      return;
    }

    // Verificar se tem convite ativo
    if (!membro.pessoa.conviteAtivo) {
      res.status(400).json({ error: 'ConviteInativo', message: 'Este membro não possui convite ativo.' });
      return;
    }

    // Verificar se o membro já foi ativado (tem senha_hash)
    if (membro.pessoa.senha_hash) {
      res.status(400).json({ error: 'MembroJaAtivado', message: 'Este membro já foi ativado e não precisa de novo convite.' });
      return;
    }

    // Gerar novo token e data de expiração
    const novoToken = generateInviteToken();
    const novaExpiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Atualizar convite
    await globalPrisma.pessoas.update({
      where: { id: membro.pessoa.id },
      data: {
        conviteToken: novoToken,
        conviteExpiraEm: novaExpiraEm,
        conviteAtivo: true
      }
    });

    // ENVIAR EMAIL DE REENVIO
    try {
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendReinviteEmail({
        to: email,
        nome: membro.pessoa.nome,
        hubNome: membro.hub.nome,
        conviteToken: novoToken,
        convidadorNome: req.auth.nome || 'Administrador'
      });

      if (!emailResult.success) {
        console.error('❌ Falha no envio de email de reenvio:', emailResult.error);
        // Não falhar a operação se o email falhar, apenas logar
      }
    } catch (emailError) {
      console.error('❌ Erro inesperado no envio de email:', emailError);
      // Não falhar a operação se o email falhar
    }

    res.json({
      success: true,
      message: 'Convite reenviado com sucesso.',
      data: {
        conviteToken: novoToken // Incluir token para testes
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível reenviar o convite.' });
  }
};
```

**2. `backend/controllers/authController.ts`**
```typescript
// Adicionar no início do arquivo:
import { EmailService } from '../services/emailService';

// Modificar função ativarConvite (após ativação bem-sucedida):
export const ativarConvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, novaSenha }: AtivarConviteInput = req.body;

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(novaSenha);
    if (!passwordValidation.isValid) {
      res.status(400).json({ error: 'SenhaInvalida', message: passwordValidation.errors.join(' ') });
      return;
    }

    // Buscar pessoa com o token
    const pessoa = await globalPrisma.pessoas.findUnique({
      where: { conviteToken: token },
      include: {
        hubs: {
          include: {
            hub: { select: { nome: true }}
          }
        }
      }
    });

    if (!pessoa) {
      res.status(404).json({ error: 'ConviteInvalido', message: 'Token de convite inválido ou não encontrado.' });
      return;
    }

    if (!pessoa.conviteAtivo) {
      res.status(400).json({ error: 'ConviteInativo', message: 'Este convite já foi utilizado ou está inativo.' });
      return;
    }

    if (pessoa.conviteExpiraEm && pessoa.conviteExpiraEm < new Date()) {
      res.status(400).json({ error: 'ConviteExpirado', message: 'Este convite expirou. Solicite um novo convite.' });
      return;
    }

    // Gerar hash da nova senha
    const senhaHash = await hashPassword(novaSenha);

    // Ativar a conta e limpar dados do convite
    await globalPrisma.pessoas.update({
      where: { id: pessoa.id },
      data: {
        senha_hash: senhaHash,
        conviteToken: null,
        conviteExpiraEm: null,
        conviteAtivo: false,
        ativo: true
      }
    });

    // ENVIAR EMAIL DE CONFIRMAÇÃO DE ATIVAÇÃO (OPCIONAL)
    if (process.env.ENABLE_EMAILS !== 'false' && pessoa.hubs.length > 0) {
      try {
        const emailService = EmailService.getInstance();
        const hubNome = pessoa.hubs[0].hub.nome;
        
        // Enviar email de confirmação (implementar se necessário)
        console.log(`✅ Conta ativada para ${pessoa.email} no hub ${hubNome}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de confirmação:', emailError);
        // Não falhar a operação se o email falhar
      }
    }

    res.json({
      success: true,
      message: 'Conta ativada com sucesso! Você já pode fazer login.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao ativar convite:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível ativar o convite.' });
  }
};
```

**3. `backend/package.json` (adicionar ao existente)**
```json
{
  "dependencies": {
    "nodemailer": "^6.9.7",
    "@types/nodemailer": "^6.4.14"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8"
  },
  "scripts": {
    "test:email": "jest --testPathPattern=email",
    "test:email:watch": "jest --testPathPattern=email --watch",
    "email:test-connection": "ts-node -e \"import('./services/emailService').then(s => s.EmailService.getInstance().testConnection())\""
  }
}
```

**4. `backend/.env` (adicionar ao existente)**
```env
# Email Configuration
GMAIL_USER=seu-email@gmail.com
GMAIL_APP_PASSWORD=sua-senha-de-aplicativo
EMAIL_FROM_NAME=Expense Hub
FRONTEND_URL=http://localhost:3000
ENABLE_EMAILS=true
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=1000
EMAIL_DAILY_LIMIT=450
EMAIL_HOURLY_LIMIT=90
```

---

**CONTINUA NA PARTE 3...** 