import nodemailer from 'nodemailer';
import { EmailData, EmailResult, EmailConfig } from '../types/email';
import { EmailUtils } from '../utils/emailUtils';
import { EmailTemplates } from './emailTemplates';
import { EmailMonitoring } from './emailMonitoring';

export class EmailService {
  private static instance: EmailService;
  private transporter!: nodemailer.Transporter;
  private monitoring: EmailMonitoring;
  private isInitialized = false;
  private retryAttempts: number;
  private retryDelay: number;

  private constructor() {
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
      rateLimit: 10
    };

    return nodemailer.createTransport(config);
  }

  /**
   * Inicializa o serviço de email
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Verificar se emails estão habilitados
    if (process.env.ENABLE_EMAILS !== 'true') {
      console.log('📧 Sistema de email desabilitado (ENABLE_EMAILS=false)');
      return;
    }

    try {
      this.transporter = this.createTransporter();
      await this.transporter.verify();
      console.log('✅ Serviço de email inicializado com sucesso');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de email:', error);
      throw error;
    }
  }

  /**
   * Envia email de convite para novo membro
   */
  async sendInviteEmail(data: EmailData): Promise<EmailResult> {
    try {
      await this.initialize();

      // Validar dados
      const validation = EmailUtils.validateEmailData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Dados inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Verificar limites
      const limitsCheck = this.monitoring.checkLimits();
      if (!limitsCheck.canSend) {
        return {
          success: false,
          error: `Limite de emails atingido: ${limitsCheck.reason}`
        };
      }

      // Gerar templates
      const htmlContent = EmailTemplates.generateInviteHtml(data);
      const textContent = EmailTemplates.generateInviteText(data);

      // Configurar email
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Expense Hub'}" <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `Convite para o Hub ${data.hubNome} - Expense Hub`,
        html: htmlContent,
        text: textContent
      };

      // Enviar email com retry
      const result = await this.sendWithRetry(mailOptions);
      
      if (result.success) {
        this.monitoring.incrementCount();
        this.monitoring.logUsage();
      }

      return result;

    } catch (error) {
      console.error('Erro ao enviar email de convite:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia email de reenvio de convite
   */
  async sendReinviteEmail(data: EmailData): Promise<EmailResult> {
    try {
      await this.initialize();

      // Validar dados
      const validation = EmailUtils.validateEmailData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Dados inválidos: ${validation.errors.join(', ')}`
        };
      }

      // Verificar limites
      const limitsCheck = this.monitoring.checkLimits();
      if (!limitsCheck.canSend) {
        return {
          success: false,
          error: `Limite de emails atingido: ${limitsCheck.reason}`
        };
      }

      // Gerar templates
      const htmlContent = EmailTemplates.generateReinviteHtml(data);
      const textContent = EmailTemplates.generateReinviteText(data);

      // Configurar email
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Expense Hub'}" <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: `Novo Convite para o Hub ${data.hubNome} - Expense Hub`,
        html: htmlContent,
        text: textContent
      };

      // Enviar email com retry
      const result = await this.sendWithRetry(mailOptions);
      
      if (result.success) {
        this.monitoring.incrementCount();
        this.monitoring.logUsage();
      }

      return result;

    } catch (error) {
      console.error('Erro ao enviar email de reenvio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia email com lógica de retry
   */
  private async sendWithRetry(mailOptions: nodemailer.SendMailOptions): Promise<EmailResult> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        
        console.log(`📧 Email enviado com sucesso (tentativa ${attempt}/${this.retryAttempts})`);
        console.log(`📧 Message ID: ${info.messageId}`);
        
        return {
          success: true,
          messageId: info.messageId,
          retryCount: attempt - 1
        };

      } catch (error) {
        console.error(`❌ Erro ao enviar email (tentativa ${attempt}/${this.retryAttempts}):`, error);
        
        if (attempt === this.retryAttempts) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            retryCount: attempt
          };
        }

        // Aguardar antes da próxima tentativa (backoff exponencial)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: 'Número máximo de tentativas excedido',
      retryCount: this.retryAttempts
    };
  }

  /**
   * Testa conexão com Gmail
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
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
  resetCounters() {
    this.monitoring.resetCounters();
  }
}

// Convenience function for getting the singleton instance
export const getEmailService = () => EmailService.getInstance(); 