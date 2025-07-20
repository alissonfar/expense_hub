export interface EmailData {
  to: string;
  nome: string;
  hubNome: string;
  conviteToken: string;
  convidadorNome: string;
}

export interface WelcomeEmailData {
  to: string;
  nome: string;
  nomeHub: string;
}

export interface PasswordResetEmailData {
  to: string;
  nome: string;
  resetToken: string;
}

export interface EmailVerificationData {
  to: string;
  nome: string;
  verificacaoToken: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  pool: boolean;
  maxConnections: number;
  maxMessages: number;
  rateLimit: number;
}

export interface EmailMonitoringData {
  emailCount: number;
  lastReset: Date;
  dailyLimit: number;
  hourlyLimit: number;
} 