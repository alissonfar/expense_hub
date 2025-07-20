import { AuthContext } from './index';

// Contexto específico para Modo Deus
export interface GodModeContext extends AuthContext {
  isGod: boolean;
}

// Enums para logs e métricas
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum LogCategory {
  EMAIL = 'EMAIL',
  AUTH = 'AUTH',
  DATABASE = 'DATABASE',
  API = 'API',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  TRANSACTION = 'TRANSACTION',
  PAYMENT = 'PAYMENT',
  HUB = 'HUB'
}

export enum MetricType {
  // Email Metrics
  EMAILS_SENT_TODAY = 'emails_sent_today',
  EMAILS_FAILED_TODAY = 'emails_failed_today',
  EMAIL_SUCCESS_RATE = 'email_success_rate',
  EMAIL_QUEUE_SIZE = 'email_queue_size',
  
  // Auth Metrics
  LOGIN_ATTEMPTS = 'login_attempts',
  FAILED_LOGINS = 'failed_logins',
  ACTIVE_USERS = 'active_users',
  TOKEN_REFRESHES = 'token_refreshes',
  
  // API Metrics
  API_REQUESTS_PER_MINUTE = 'api_requests_per_minute',
  API_ERROR_RATE = 'api_error_rate',
  AVERAGE_RESPONSE_TIME = 'average_response_time',
  ENDPOINT_USAGE = 'endpoint_usage',
  
  // Database Metrics
  DATABASE_CONNECTIONS = 'database_connections',
  SLOW_QUERIES = 'slow_queries',
  QUERY_EXECUTION_TIME = 'query_execution_time',
  
  // System Metrics
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  DISK_USAGE = 'disk_usage',
  UPTIME = 'uptime',
  
  // Business Metrics
  TRANSACTIONS_CREATED_TODAY = 'transactions_created_today',
  PAYMENTS_PROCESSED_TODAY = 'payments_processed_today',
  ACTIVE_HUBS = 'active_hubs',
  TOTAL_USERS = 'total_users'
}

// Interfaces para logs
export interface LogData {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: number | null;
  hubId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface SystemLog {
  id: number;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: number | null;
  hubId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Interfaces para métricas
export interface MetricData {
  metricName: MetricType;
  metricValue: number;
  metadata?: any;
  timestamp?: Date;
}

export interface SystemMetric {
  id: number;
  timestamp: Date;
  metricName: MetricType;
  metricValue: number;
  metadata?: any;
}

// Interfaces para dashboard
export interface DashboardData {
  emailMetrics: EmailMetrics;
  authMetrics: AuthMetrics;
  systemMetrics: SystemMetrics;
  recentLogs: SystemLog[];
  errorCount: number;
  timestamp: string;
}

export interface EmailMetrics {
  sentToday: number;
  failedToday: number;
  successRate: number;
  queueSize: number;
}

export interface AuthMetrics {
  loginAttempts: number;
  failedLogins: number;
  activeUsers: number;
  tokenRefreshes: number;
}

export interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  uptime: number;
  databaseConnections: number;
}

// Interfaces para filtros
export interface LogFilters {
  level?: LogLevel;
  category?: LogCategory;
  userId?: number;
  hubId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface MetricFilters {
  metricName?: MetricType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} 