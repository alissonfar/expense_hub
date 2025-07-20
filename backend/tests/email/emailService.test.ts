import { EmailService } from '../../services/emailService';
import { EmailUtils } from '../../utils/emailUtils';
import { EmailTemplates } from '../../services/emailTemplates';

// Mock das variáveis de ambiente
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  
  // Configurar variáveis de teste
  process.env.GMAIL_USER = 'test@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'test-password';
  process.env.ENABLE_EMAILS = 'true';
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    // Reset singleton instance
    (EmailService as any).instance = null;
    emailService = EmailService.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('deve retornar a mesma instância', () => {
      const instance1 = EmailService.getInstance();
      const instance2 = EmailService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Validação de Credenciais', () => {
    test('deve validar credenciais corretas', () => {
      process.env.GMAIL_USER = 'valid@gmail.com';
      process.env.GMAIL_APP_PASSWORD = 'valid-password';
      
      expect(() => {
        emailService['validateCredentials']();
      }).not.toThrow();
    });

    test('deve falhar com GMAIL_USER ausente', () => {
      delete process.env.GMAIL_USER;
      
      expect(() => {
        emailService['validateCredentials']();
      }).toThrow('Credenciais Gmail não configuradas');
    });

    test('deve falhar com GMAIL_APP_PASSWORD ausente', () => {
      delete process.env.GMAIL_APP_PASSWORD;
      
      expect(() => {
        emailService['validateCredentials']();
      }).toThrow('Credenciais Gmail não configuradas');
    });

    test('deve falhar com email inválido', () => {
      process.env.GMAIL_USER = 'invalid-email';
      
      expect(() => {
        emailService['validateCredentials']();
      }).toThrow('GMAIL_USER deve ser um email válido');
    });
  });

  describe('Inicialização', () => {
    test('deve inicializar com configurações corretas', async () => {
      // Mock do transporter
      const mockTransporter = {
        verify: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(emailService as any, 'createTransporter').mockReturnValue(mockTransporter);
      
      await emailService.initialize();
      
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    test('deve pular inicialização se emails desabilitados', async () => {
      process.env.ENABLE_EMAILS = 'false';
      
      const mockTransporter = {
        verify: jest.fn()
      };
      
      jest.spyOn(emailService as any, 'createTransporter').mockReturnValue(mockTransporter);
      
      await emailService.initialize();
      
      expect(mockTransporter.verify).not.toHaveBeenCalled();
    });
  });

  describe('Envio de Emails', () => {
    const mockEmailData = {
      to: 'test@example.com',
      nome: 'Test User',
      hubNome: 'Test Hub',
      conviteToken: 'test-token-123',
      convidadorNome: 'Admin User'
    };

    beforeEach(() => {
      // Mock do transporter
      const mockTransporter = {
        verify: jest.fn().mockResolvedValue(true),
        sendMail: jest.fn()
      };
      
      jest.spyOn(emailService as any, 'createTransporter').mockReturnValue(mockTransporter);
      emailService['transporter'] = mockTransporter;
      emailService['isInitialized'] = true;
    });

    test('deve enviar email de convite com sucesso', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      emailService['transporter'].sendMail = jest.fn().mockResolvedValue(mockInfo);
      
      const result = await emailService.sendInviteEmail(mockEmailData);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(emailService['transporter'].sendMail).toHaveBeenCalled();
    });

    test('deve enviar email de reenvio com sucesso', async () => {
      const mockInfo = { messageId: 'test-message-id' };
      emailService['transporter'].sendMail = jest.fn().mockResolvedValue(mockInfo);
      
      const result = await emailService.sendReinviteEmail(mockEmailData);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(emailService['transporter'].sendMail).toHaveBeenCalled();
    });

    test('deve falhar com dados inválidos', async () => {
      const invalidData = {
        ...mockEmailData,
        to: 'invalid-email'
      };
      
      const result = await emailService.sendInviteEmail(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Dados inválidos');
    });

    test('deve implementar retry em caso de falha', async () => {
      const mockError = new Error('SMTP Error');
      emailService['transporter'].sendMail = jest.fn()
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValue({ messageId: 'success' });
      
      const result = await emailService.sendInviteEmail(mockEmailData);
      
      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(2);
      expect(emailService['transporter'].sendMail).toHaveBeenCalledTimes(3);
    });
  });

  describe('Monitoramento', () => {
    test('deve retornar dados de monitoramento', () => {
      const data = emailService.getMonitoringData();
      
      expect(data).toHaveProperty('emailCount');
      expect(data).toHaveProperty('dailyLimit');
      expect(data).toHaveProperty('hourlyLimit');
      expect(data).toHaveProperty('lastReset');
    });

    test('deve resetar contadores', () => {
      emailService.resetCounters();
      
      const data = emailService.getMonitoringData();
      expect(data.emailCount).toBe(0);
    });
  });
}); 