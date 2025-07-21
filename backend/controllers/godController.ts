import { Request, Response } from 'express';
import { getLogger } from '../utils/logger';
import LoggingService from '../services/loggingService';
import MetricsService from '../services/metricsService';
import { LogLevel, LogCategory, MetricType } from '../types/god';

const logger = getLogger('GodController');

class GodController {
  private loggingService: LoggingService;
  private metricsService: MetricsService;

  constructor(req: Request) {
    this.loggingService = LoggingService.getInstance(req.prisma);
    this.metricsService = MetricsService.getInstance(req.prisma);
  }

  /**
   * Dashboard principal do Modo Deus
   */
  public async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Dashboard do Modo Deus acessado', { userId: req.auth?.pessoaId });

      // Buscar dados em paralelo com fallbacks
      const [emailMetrics, authMetrics, systemMetrics, recentLogs, errorCount] = await Promise.allSettled([
        this.metricsService.getEmailMetrics(),
        this.metricsService.getAuthMetrics(),
        this.metricsService.getSystemMetrics(),
        this.loggingService.getLogs({ limit: 10 }),
        this.loggingService.getLogs({ 
          level: LogLevel.ERROR, 
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          limit: 1 
        }).then(logs => logs.length)
      ]);

      // Dados padrão caso algum serviço falhe
      const defaultEmailMetrics = {
        sentToday: 0,
        failedToday: 0,
        successRate: 0,
        queueSize: 0
      };

      const defaultAuthMetrics = {
        loginAttempts: 0,
        failedLogins: 0,
        activeUsers: 0,
        tokenRefreshes: 0
      };

      const defaultSystemMetrics = {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        uptime: 0,
        databaseConnections: 0
      };

      const dashboardData = {
        emailMetrics: emailMetrics.status === 'fulfilled' ? emailMetrics.value : defaultEmailMetrics,
        authMetrics: authMetrics.status === 'fulfilled' ? authMetrics.value : defaultAuthMetrics,
        systemMetrics: systemMetrics.status === 'fulfilled' ? systemMetrics.value : defaultSystemMetrics,
        recentLogs: recentLogs.status === 'fulfilled' ? recentLogs.value : [],
        errorCount: errorCount.status === 'fulfilled' ? errorCount.value : 0,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Erro ao obter dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro ao carregar dashboard do Modo Deus.'
      });
    }
  }

  /**
   * Buscar logs com filtros
   */
  public async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        level,
        category,
        userId,
        hubId,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = req.query;

      const filters = {
        level: level as LogLevel,
        category: category as LogCategory,
        userId: userId ? parseInt(userId as string) : null,
        hubId: hubId ? parseInt(hubId as string) : null,
        startDate: startDate ? new Date(startDate as string) : null,
        endDate: endDate ? new Date(endDate as string) : null,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const logs = await this.loggingService.getLogs(filters).catch(() => []);

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: logs.length
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar logs:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro ao buscar logs.'
      });
    }
  }

  /**
   * Buscar métricas com filtros
   */
  public async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const {
        metricName,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = req.query;

      const filters = {
        metricName: metricName as MetricType,
        startDate: startDate ? new Date(startDate as string) : null,
        endDate: endDate ? new Date(endDate as string) : null,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const metrics = await this.metricsService.getMetrics(filters).catch(() => []);

      res.json({
        success: true,
        data: metrics,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: metrics.length
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar métricas:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro ao buscar métricas.'
      });
    }
  }

  /**
   * Status do sistema
   */
  public async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const [emailMetrics, authMetrics, systemMetrics, recentErrors] = await Promise.all([
        this.metricsService.getEmailMetrics(),
        this.metricsService.getAuthMetrics(),
        this.metricsService.getSystemMetrics(),
        this.loggingService.getRecentErrors(5)
      ]);

      // Determinar status geral
      const hasErrors = recentErrors.length > 0;
      const emailHealth = emailMetrics.successRate > 90;
      const authHealth = authMetrics.failedLogins / Math.max(authMetrics.loginAttempts, 1) < 0.1;

      const status = {
        overall: hasErrors ? 'warning' : 'healthy',
        email: emailHealth ? 'healthy' : 'warning',
        auth: authHealth ? 'healthy' : 'warning',
        database: 'healthy', // Implementar verificação real
        metrics: {
          email: emailMetrics,
          auth: authMetrics,
          system: systemMetrics
        },
        recentErrors,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Erro ao obter status do sistema:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro ao obter status do sistema.'
      });
    }
  }

  /**
   * Exportar logs
   */
  public async exportLogs(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json', startDate, endDate } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Última semana
        endDate: endDate ? new Date(endDate as string) : new Date(),
        limit: 10000 // Limite para exportação
      };

      const logs = await this.loggingService.getLogs(filters);

      if (format === 'csv') {
        // Gerar CSV
        const csvHeaders = 'ID,Timestamp,Level,Category,Message,UserID,HubID,IPAddress\n';
        const csvData = logs.map(log => 
          `${log.id},"${log.timestamp.toISOString()}","${log.level}","${log.category}","${log.message.replace(/"/g, '""')}",${log.userId || ''},${log.hubId || ''},"${log.ipAddress || ''}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeaders + csvData);
      } else {
        // JSON (padrão)
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          exportDate: new Date().toISOString(),
          filters,
          totalRecords: logs.length,
          data: logs
        });
      }
    } catch (error) {
      logger.error('Erro ao exportar logs:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro ao exportar logs.'
      });
    }
  }

  /**
   * Exportar métricas
   */
  public async exportMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json', startDate, endDate } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
        limit: 10000
      };

      const metrics = await this.metricsService.getMetrics(filters);

      if (format === 'csv') {
        // Gerar CSV
        const csvHeaders = 'ID,Timestamp,MetricName,MetricValue,Metadata\n';
        const csvData = metrics.map(metric => 
          `${metric.id},"${metric.timestamp.toISOString()}","${metric.metricName}",${metric.metricValue},"${JSON.stringify(metric.metadata || {}).replace(/"/g, '""')}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="metrics_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvHeaders + csvData);
      } else {
        // JSON (padrão)
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="metrics_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          exportDate: new Date().toISOString(),
          filters,
          totalRecords: metrics.length,
          data: metrics
        });
      }
    } catch (error) {
      logger.error('Erro ao exportar métricas:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro ao exportar métricas.'
      });
    }
  }

  /**
   * Manutenção do sistema
   */
  public async maintenance(req: Request, res: Response): Promise<void> {
    try {
      const { action } = req.body;

      switch (action) {
        case 'cleanup_logs':
          const logsRemoved = await this.loggingService.cleanupOldLogs(90);
          res.json({
            success: true,
            message: `${logsRemoved} logs antigos removidos`,
            data: { logsRemoved }
          });
          break;

        case 'cleanup_metrics':
          const metricsRemoved = await this.metricsService.cleanupOldMetrics(30);
          res.json({
            success: true,
            message: `${metricsRemoved} métricas antigas removidas`,
            data: { metricsRemoved }
          });
          break;

        case 'reset_daily_metrics':
          await this.metricsService.resetDailyMetrics();
          res.json({
            success: true,
            message: 'Métricas diárias resetadas'
          });
          break;

        case 'update_system_metrics':
          await this.metricsService.updateSystemMetrics();
          res.json({
            success: true,
            message: 'Métricas do sistema atualizadas'
          });
          break;

        default:
          res.status(400).json({
            success: false,
            error: 'AcaoInvalida',
            message: 'Ação de manutenção inválida'
          });
      }
    } catch (error) {
      logger.error('Erro na manutenção:', error);
      res.status(500).json({
        success: false,
        error: 'ErroInterno',
        message: 'Erro durante manutenção do sistema.'
      });
    }
  }
}

export default GodController; 