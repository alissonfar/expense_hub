import { EmailData } from '../types/email';

export class EmailUtils {
  /**
   * Valida se um email é válido
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitiza dados para evitar XSS em templates
   */
  static sanitizeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Gera link de ativação
   */
  static generateActivationLink(token: string, frontendUrl: string): string {
    return `${frontendUrl}/ativar-convite?token=${encodeURIComponent(token)}`;
  }

  /**
   * Formata data para exibição
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Valida dados de email antes do envio
   */
  static validateEmailData(data: EmailData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateEmail(data.to)) {
      errors.push('Email inválido');
    }

    if (!data.nome || data.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!data.hubNome || data.hubNome.trim().length < 2) {
      errors.push('Nome do Hub deve ter pelo menos 2 caracteres');
    }

    if (!data.conviteToken || data.conviteToken.trim().length < 10) {
      errors.push('Token de convite inválido');
    }

    if (!data.convidadorNome || data.convidadorNome.trim().length < 2) {
      errors.push('Nome do convidador deve ter pelo menos 2 caracteres');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 