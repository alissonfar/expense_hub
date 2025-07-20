import { PrismaClient } from '@prisma/client';
import { getLogger } from '../utils/logger';
import { LogLevel, LogCategory, LogData, SystemLog } from '../types/god';

const logger = getLogger('LoggingService');

class LoggingService {
  private static instance: LoggingService;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(prisma);
    }
    return LoggingService.instance;
  }

  /**
   * Loga uma mensagem no Winston e no banco de dados
   */
  public async log(data: LogData): Promise<void> {
    try {
      // Log no Winston (console/arquivo)
      const winstonLevel = this.mapLogLevelToWinston(data.level);
      logger.log(winstonLevel, data.message, {
        category: data.category,
        userId: data.userId,
        hubId: data.hubId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        details: data.details
      });

      // Log no banco de dados
      await this.logToDatabase(data);
    } catch (error) {
      // Fallback: apenas Winston se o banco falhar
      logger.error('Erro ao salvar log no banco:', error);
    }
  }

  /**
   * Loga apenas no Winston (para logs de sistema críticos)
   */
  public logWinstonOnly(level: LogLevel, message: string, meta?: any): void {
    const winstonLevel = this.mapLogLevelToWinston(level);
    logger.log(winstonLevel, message, meta);
  }

  /**
   * Busca logs do banco de dados com filtros
   */
  public async getLogs(filters: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: number | null;
    hubId?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    limit?: number;
    offset?: number;
  }): Promise<SystemLog[]> {
    try {
      const where: any = {};

      if (filters.level) where.level = filters.level;
      if (filters.category) where.category = filters.category;
      if (filters.userId) where.user_id = filters.userId;
      if (filters.hubId) where.hub_id = filters.hubId;

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const logs = await this.prisma.system_logs.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0
      });

      return logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as LogLevel,
        category: log.category as LogCategory,
        message: log.message,
        details: log.details,
        userId: log.user_id,
        hubId: log.hub_id,
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
    } catch (error) {
      logger.error('Erro ao buscar logs:', error);
      throw error;
    }
  }

  /**
   * Busca logs de erro recentes
   */
  public async getRecentErrors(limit: number = 50): Promise<SystemLog[]> {
    return this.getLogs({
      level: LogLevel.ERROR,
      limit,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
    });
  }

  /**
   * Conta logs por nível
   */
  public async getLogCounts(startDate?: Date, endDate?: Date): Promise<Record<LogLevel, number>> {
    try {
      const where: any = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      const counts = await this.prisma.system_logs.groupBy({
        by: ['level'],
        where,
        _count: { level: true }
      });

      const result: Record<LogLevel, number> = {
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.DEBUG]: 0
      };

      counts.forEach(count => {
        result[count.level as LogLevel] = count._count.level;
      });

      return result;
    } catch (error) {
      logger.error('Erro ao contar logs:', error);
      throw error;
    }
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  public async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await this.prisma.system_logs.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Limpeza de logs: ${result.count} registros removidos`);
      return result.count;
    } catch (error) {
      logger.error('Erro ao limpar logs antigos:', error);
      throw error;
    }
  }

  /**
   * Mapeia LogLevel para nível Winston
   */
  private mapLogLevelToWinston(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warn';
      case LogLevel.ERROR: return 'error';
      default: return 'info';
    }
  }

  /**
   * Salva log no banco de dados
   */
  private async logToDatabase(data: LogData): Promise<void> {
    await this.prisma.system_logs.create({
      data: {
        level: data.level,
        category: data.category,
        message: data.message,
        details: data.details,
        user_id: data.userId || null,
        hub_id: data.hubId || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null
      }
    });
  }
}

export default LoggingService; 