import { PrismaClient } from '@prisma/client';
import { getLogger } from '../utils/logger';
import { MetricType, MetricData, SystemMetric } from '../types/god';

const logger = getLogger('MetricsService');

class MetricsService {
  private static instance: MetricsService;
  private prisma: PrismaClient;
  private metricsCache: Map<string, { value: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService(prisma);
    }
    return MetricsService.instance;
  }

  /**
   * Registra uma métrica no banco de dados
   */
  public async recordMetric(data: MetricData): Promise<void> {
    try {
      await this.prisma.system_metrics.create({
        data: {
          metric_name: data.metricName,
          metric_value: data.metricValue,
          metadata: data.metadata,
          timestamp: data.timestamp || new Date()
        }
      });

      // Atualiza cache
      this.metricsCache.set(data.metricName, {
        value: data.metricValue,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Erro ao registrar métrica:', error);
      throw error;
    }
  }

  /**
   * Incrementa uma métrica contadora
   */
  public async incrementMetric(metricName: MetricType, increment: number = 1, metadata?: any): Promise<void> {
    const currentValue = await this.getMetricValue(metricName);
    const newValue = currentValue + increment;
    
    await this.recordMetric({
      metricName,
      metricValue: newValue,
      metadata
    });
  }

  /**
   * Define uma métrica com valor absoluto
   */
  public async setMetric(metricName: MetricType, value: number, metadata?: any): Promise<void> {
    await this.recordMetric({
      metricName,
      metricValue: value,
      metadata
    });
  }

  /**
   * Busca métricas com filtros
   */
  public async getMetrics(filters: {
    metricName?: MetricType;
    startDate?: Date | null;
    endDate?: Date | null;
    limit?: number;
    offset?: number;
  }): Promise<SystemMetric[]> {
    try {
      const where: any = {};

      if (filters.metricName) where.metric_name = filters.metricName;
      
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const metrics = await this.prisma.system_metrics.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0
      });

      return metrics.map(metric => ({
        id: metric.id,
        timestamp: metric.timestamp,
        metricName: metric.metric_name as MetricType,
        metricValue: Number(metric.metric_value),
        metadata: metric.metadata
      }));
    } catch (error) {
      logger.error('Erro ao buscar métricas:', error);
      throw error;
    }
  }

  /**
   * Obtém o valor atual de uma métrica (com cache)
   */
  public async getMetricValue(metricName: MetricType): Promise<number> {
    // Verifica cache primeiro
    const cached = this.metricsCache.get(metricName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    try {
      const metric = await this.prisma.system_metrics.findFirst({
        where: { metric_name: metricName },
        orderBy: { timestamp: 'desc' }
      });

      const value = metric ? Number(metric.metric_value) : 0;
      
      // Atualiza cache
      this.metricsCache.set(metricName, {
        value,
        timestamp: Date.now()
      });

      return value;
    } catch (error) {
      logger.error('Erro ao obter valor da métrica:', error);
      return 0;
    }
  }

  /**
   * Obtém métricas de email
   */
  public async getEmailMetrics(): Promise<{
    sentToday: number;
    failedToday: number;
    successRate: number;
    queueSize: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Buscar métricas do dia atual
      const [sentToday, failedToday, queueSize] = await Promise.all([
        this.getMetricValue(MetricType.EMAILS_SENT_TODAY),
        this.getMetricValue(MetricType.EMAILS_FAILED_TODAY),
        this.getMetricValue(MetricType.EMAIL_QUEUE_SIZE)
      ]);

      const total = sentToday + failedToday;
      const successRate = total > 0 ? (sentToday / total) * 100 : 0;

      return {
        sentToday,
        failedToday,
        successRate: Math.round(successRate * 100) / 100,
        queueSize
      };
    } catch (error) {
      console.error('Erro ao obter métricas de email:', error);
      return {
        sentToday: 0,
        failedToday: 0,
        successRate: 0,
        queueSize: 0
      };
    }
  }

  /**
   * Obtém métricas de autenticação
   */
  public async getAuthMetrics(): Promise<{
    loginAttempts: number;
    failedLogins: number;
    activeUsers: number;
    tokenRefreshes: number;
  }> {
    const [loginAttempts, failedLogins, activeUsers, tokenRefreshes] = await Promise.all([
      this.getMetricValue(MetricType.LOGIN_ATTEMPTS),
      this.getMetricValue(MetricType.FAILED_LOGINS),
      this.getMetricValue(MetricType.ACTIVE_USERS),
      this.getMetricValue(MetricType.TOKEN_REFRESHES)
    ]);

    return {
      loginAttempts,
      failedLogins,
      activeUsers,
      tokenRefreshes
    };
  }

  /**
   * Obtém métricas do sistema
   */
  public async getSystemMetrics(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    uptime: number;
    databaseConnections: number;
  }> {
    const [memoryUsage, cpuUsage, diskUsage, uptime, databaseConnections] = await Promise.all([
      this.getMetricValue(MetricType.MEMORY_USAGE),
      this.getMetricValue(MetricType.CPU_USAGE),
      this.getMetricValue(MetricType.DISK_USAGE),
      this.getMetricValue(MetricType.UPTIME),
      this.getMetricValue(MetricType.DATABASE_CONNECTIONS)
    ]);

    return {
      memoryUsage,
      cpuUsage,
      diskUsage,
      uptime,
      databaseConnections
    };
  }

  /**
   * Obtém métricas de negócio
   */
  public async getBusinessMetrics(): Promise<{
    transactionsCreatedToday: number;
    paymentsProcessedToday: number;
    activeHubs: number;
    totalUsers: number;
  }> {
    const [transactionsCreatedToday, paymentsProcessedToday, activeHubs, totalUsers] = await Promise.all([
      this.getMetricValue(MetricType.TRANSACTIONS_CREATED_TODAY),
      this.getMetricValue(MetricType.PAYMENTS_PROCESSED_TODAY),
      this.getMetricValue(MetricType.ACTIVE_HUBS),
      this.getMetricValue(MetricType.TOTAL_USERS)
    ]);

    return {
      transactionsCreatedToday,
      paymentsProcessedToday,
      activeHubs,
      totalUsers
    };
  }

  /**
   * Reseta métricas diárias (chamado à meia-noite)
   */
  public async resetDailyMetrics(): Promise<void> {
    const dailyMetrics = [
      MetricType.EMAILS_SENT_TODAY,
      MetricType.EMAILS_FAILED_TODAY,
      MetricType.LOGIN_ATTEMPTS,
      MetricType.FAILED_LOGINS,
      MetricType.TRANSACTIONS_CREATED_TODAY,
      MetricType.PAYMENTS_PROCESSED_TODAY
    ];

    for (const metric of dailyMetrics) {
      await this.setMetric(metric, 0);
    }

    logger.info('Métricas diárias resetadas');
  }

  /**
   * Limpa métricas antigas (manutenção)
   */
  public async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await this.prisma.system_metrics.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Limpeza de métricas: ${result.count} registros removidos`);
      return result.count;
    } catch (error) {
      logger.error('Erro ao limpar métricas antigas:', error);
      throw error;
    }
  }

  /**
   * Atualiza métricas do sistema em tempo real
   */
  public async updateSystemMetrics(): Promise<void> {
    try {
      // Métricas de sistema (simuladas - em produção usar bibliotecas específicas)
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const uptime = process.uptime(); // segundos

      await Promise.all([
        this.setMetric(MetricType.MEMORY_USAGE, Math.round(memoryUsage * 100) / 100),
        this.setMetric(MetricType.UPTIME, Math.round(uptime)),
        this.setMetric(MetricType.CPU_USAGE, 0), // Implementar com biblioteca específica
        this.setMetric(MetricType.DISK_USAGE, 0), // Implementar com biblioteca específica
        this.setMetric(MetricType.DATABASE_CONNECTIONS, 1) // Implementar com pool de conexões
      ]);
    } catch (error) {
      logger.error('Erro ao atualizar métricas do sistema:', error);
    }
  }
}

export default MetricsService; 