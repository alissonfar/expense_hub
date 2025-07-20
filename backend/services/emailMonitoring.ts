import { EmailMonitoringData } from '../types/email';

export class EmailMonitoring {
  private emailCount = 0;
  private lastReset = new Date();
  private dailyLimit: number;
  private hourlyLimit: number;
  private hourlyCount = 0;
  private lastHourReset = new Date();

  constructor() {
    this.dailyLimit = parseInt(process.env.EMAIL_DAILY_LIMIT || '450');
    this.hourlyLimit = parseInt(process.env.EMAIL_HOURLY_LIMIT || '90');
  }

  /**
   * Verifica se pode enviar mais emails
   */
  checkLimits(): { canSend: boolean; reason?: string } {
    const now = new Date();
    
    // Reset contador diário
    if (now.getDate() !== this.lastReset.getDate() || 
        now.getMonth() !== this.lastReset.getMonth() || 
        now.getFullYear() !== this.lastReset.getFullYear()) {
      this.emailCount = 0;
      this.lastReset = now;
    }

    // Reset contador horário
    if (now.getHours() !== this.lastHourReset.getHours() || 
        now.getDate() !== this.lastHourReset.getDate()) {
      this.hourlyCount = 0;
      this.lastHourReset = now;
    }

    // Verificar limite diário
    if (this.emailCount >= this.dailyLimit) {
      return { 
        canSend: false, 
        reason: `Limite diário atingido (${this.emailCount}/${this.dailyLimit})` 
      };
    }

    // Verificar limite horário
    if (this.hourlyCount >= this.hourlyLimit) {
      return { 
        canSend: false, 
        reason: `Limite horário atingido (${this.hourlyCount}/${this.hourlyLimit})` 
      };
    }

    return { canSend: true };
  }

  /**
   * Incrementa contadores após envio
   */
  incrementCount(): void {
    this.emailCount++;
    this.hourlyCount++;
  }

  /**
   * Retorna dados de monitoramento
   */
  getMonitoringData(): EmailMonitoringData {
    return {
      emailCount: this.emailCount,
      lastReset: this.lastReset,
      dailyLimit: this.dailyLimit,
      hourlyLimit: this.hourlyLimit
    };
  }

  /**
   * Log de uso para monitoramento
   */
  logUsage(): void {
    const data = this.getMonitoringData();
    console.log(`📧 Emails enviados hoje: ${data.emailCount}/${data.dailyLimit}`);
    console.log(`📧 Emails enviados nesta hora: ${this.hourlyCount}/${data.hourlyLimit}`);
    
    if (data.emailCount > this.dailyLimit * 0.8) {
      console.warn('⚠️ ATENÇÃO: Limite diário próximo de ser atingido');
    }
    
    if (this.hourlyCount > this.hourlyLimit * 0.8) {
      console.warn('⚠️ ATENÇÃO: Limite horário próximo de ser atingido');
    }
  }

  /**
   * Reseta contadores (para testes)
   */
  resetCounters(): void {
    this.emailCount = 0;
    this.hourlyCount = 0;
    this.lastReset = new Date();
    this.lastHourReset = new Date();
  }
} 