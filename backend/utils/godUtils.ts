import { Request } from 'express';
import { getLogger } from './logger';
import LoggingService from '../services/loggingService';
import MetricsService from '../services/metricsService';
import { LogLevel, LogCategory, MetricType } from '../types/god';

const logger = getLogger('GodUtils');

/**
 * Utilitários para integração do Modo Deus com serviços existentes
 */
export class GodModeIntegration {
  private loggingService: LoggingService;
  private metricsService: MetricsService;

  constructor(req: Request) {
    this.loggingService = LoggingService.getInstance(req.prisma);
    this.metricsService = MetricsService.getInstance(req.prisma);
  }

  /**
   * Loga eventos de autenticação
   */
  public async logAuthEvent(
    event: 'login' | 'logout' | 'token_refresh' | 'failed_login' | 'password_reset',
    userId?: number,
    details?: any,
    req?: Request
  ): Promise<void> {
    const messages = {
      login: 'Usuário fez login',
      logout: 'Usuário fez logout',
      token_refresh: 'Token renovado',
      failed_login: 'Tentativa de login falhou',
      password_reset: 'Senha redefinida'
    };

    const levels = {
      login: LogLevel.INFO,
      logout: LogLevel.INFO,
      token_refresh: LogLevel.DEBUG,
      failed_login: LogLevel.WARN,
      password_reset: LogLevel.INFO
    };

    await this.loggingService.log({
      level: levels[event],
      category: LogCategory.AUTH,
      message: messages[event],
      userId: userId || null,
      details: {
        event,
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
        ...details
      }
    });

    // Métricas de autenticação
    switch (event) {
      case 'login':
        await this.metricsService.incrementMetric(MetricType.LOGIN_ATTEMPTS);
        await this.metricsService.incrementMetric(MetricType.ACTIVE_USERS);
        break;
      case 'failed_login':
        await this.metricsService.incrementMetric(MetricType.LOGIN_ATTEMPTS);
        await this.metricsService.incrementMetric(MetricType.FAILED_LOGINS);
        break;
      case 'token_refresh':
        await this.metricsService.incrementMetric(MetricType.TOKEN_REFRESHES);
        break;
    }
  }

  /**
   * Loga eventos de email
   */
  public async logEmailEvent(
    event: 'sent' | 'failed' | 'queued',
    recipient: string,
    template?: string,
    details?: any
  ): Promise<void> {
    const messages = {
      sent: 'Email enviado com sucesso',
      failed: 'Falha ao enviar email',
      queued: 'Email adicionado à fila'
    };

    const levels = {
      sent: LogLevel.INFO,
      failed: LogLevel.ERROR,
      queued: LogLevel.DEBUG
    };

    await this.loggingService.log({
      level: levels[event],
      category: LogCategory.EMAIL,
      message: messages[event],
      details: {
        event,
        recipient,
        template,
        ...details
      }
    });

    // Métricas de email
    switch (event) {
      case 'sent':
        await this.metricsService.incrementMetric(MetricType.EMAILS_SENT_TODAY);
        break;
      case 'failed':
        await this.metricsService.incrementMetric(MetricType.EMAILS_FAILED_TODAY);
        break;
      case 'queued':
        await this.metricsService.incrementMetric(MetricType.EMAIL_QUEUE_SIZE);
        break;
    }
  }

  /**
   * Loga eventos de API
   */
  public async logApiEvent(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: number,
    hubId?: number,
    details?: any
  ): Promise<void> {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `${method} ${endpoint} - ${statusCode} (${responseTime}ms)`;

    await this.loggingService.log({
      level,
      category: LogCategory.API,
      message,
      userId: userId || null,
      hubId: hubId || null,
      details: {
        method,
        endpoint,
        statusCode,
        responseTime,
        ...details
      }
    });

    // Métricas de API
    if (statusCode >= 400) {
      await this.metricsService.incrementMetric(MetricType.API_ERROR_RATE);
    }
  }

  /**
   * Loga eventos de banco de dados
   */
  public async logDatabaseEvent(
    operation: 'query' | 'transaction' | 'connection' | 'error',
    table?: string,
    duration?: number,
    details?: any
  ): Promise<void> {
    const messages = {
      query: 'Query executada',
      transaction: 'Transação executada',
      connection: 'Conexão estabelecida',
      error: 'Erro no banco de dados'
    };

    const levels = {
      query: LogLevel.DEBUG,
      transaction: LogLevel.DEBUG,
      connection: LogLevel.INFO,
      error: LogLevel.ERROR
    };

    await this.loggingService.log({
      level: levels[operation],
      category: LogCategory.DATABASE,
      message: messages[operation],
      details: {
        operation,
        table,
        duration,
        ...details
      }
    });

    // Métricas de banco
    if (operation === 'error') {
      await this.metricsService.incrementMetric(MetricType.SLOW_QUERIES);
    }
  }

  /**
   * Loga eventos de negócio
   */
  public async logBusinessEvent(
    event: 'transaction_created' | 'payment_processed' | 'hub_created' | 'user_registered',
    userId?: number,
    hubId?: number,
    details?: any
  ): Promise<void> {
    const messages = {
      transaction_created: 'Transação criada',
      payment_processed: 'Pagamento processado',
      hub_created: 'Hub criado',
      user_registered: 'Usuário registrado'
    };

    await this.loggingService.log({
      level: LogLevel.INFO,
      category: LogCategory.TRANSACTION,
      message: messages[event],
      userId: userId || null,
      hubId: hubId || null,
      details: {
        event,
        ...details
      }
    });

    // Métricas de negócio
    switch (event) {
      case 'transaction_created':
        await this.metricsService.incrementMetric(MetricType.TRANSACTIONS_CREATED_TODAY);
        break;
      case 'payment_processed':
        await this.metricsService.incrementMetric(MetricType.PAYMENTS_PROCESSED_TODAY);
        break;
      case 'hub_created':
        await this.metricsService.incrementMetric(MetricType.ACTIVE_HUBS);
        break;
      case 'user_registered':
        await this.metricsService.incrementMetric(MetricType.TOTAL_USERS);
        break;
    }
  }

  /**
   * Loga eventos de segurança
   */
  public async logSecurityEvent(
    event: 'unauthorized_access' | 'suspicious_activity' | 'rate_limit_exceeded',
    userId?: number,
    ipAddress?: string,
    details?: any
  ): Promise<void> {
    const messages = {
      unauthorized_access: 'Tentativa de acesso não autorizado',
      suspicious_activity: 'Atividade suspeita detectada',
      rate_limit_exceeded: 'Limite de taxa excedido'
    };

    await this.loggingService.log({
      level: LogLevel.WARN,
      category: LogCategory.SECURITY,
      message: messages[event],
      userId: userId || null,
      details: {
        event,
        ipAddress,
        ...details
      }
    });
  }

  /**
   * Loga eventos do sistema
   */
  public async logSystemEvent(
    event: 'startup' | 'shutdown' | 'maintenance' | 'backup',
    details?: any
  ): Promise<void> {
    const messages = {
      startup: 'Sistema iniciado',
      shutdown: 'Sistema encerrado',
      maintenance: 'Manutenção iniciada',
      backup: 'Backup executado'
    };

    await this.loggingService.log({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: messages[event],
      details: {
        event,
        ...details
      }
    });
  }

  /**
   * Middleware para logging automático de requisições
   */
  public static createRequestLogger() {
    return (req: Request, res: any, next: any) => {
      const startTime = Date.now();
      const originalSend = res.send;

      res.send = function(data: any) {
        const responseTime = Date.now() - startTime;
        const integration = new GodModeIntegration(req);
        
        integration.logApiEvent(
          req.method,
          req.path,
          res.statusCode,
          responseTime,
          req.auth?.pessoaId,
          req.auth?.hubId,
          {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
          }
        );

        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Atualiza métricas do sistema periodicamente
   */
  public async updateSystemMetrics(): Promise<void> {
    try {
      await this.metricsService.updateSystemMetrics();
    } catch (error) {
      logger.error('Erro ao atualizar métricas do sistema:', error);
    }
  }
}

export default GodModeIntegration; 