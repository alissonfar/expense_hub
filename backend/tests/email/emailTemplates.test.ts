import { EmailTemplates } from '../../services/emailTemplates';
import { EmailUtils } from '../../utils/emailUtils';

// Mock das variáveis de ambiente
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EmailTemplates', () => {
  const mockEmailData = {
    to: 'test@example.com',
    nome: 'João Silva',
    hubNome: 'Hub Família',
    conviteToken: 'test-token-123456789',
    convidadorNome: 'Maria Santos'
  };

  describe('generateInviteHtml', () => {
    test('deve gerar template HTML válido', () => {
      const html = EmailTemplates.generateInviteHtml(mockEmailData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="pt-BR">');
      expect(html).toContain('Expense Hub');
      expect(html).toContain('João Silva');
      expect(html).toContain('Hub Família');
      expect(html).toContain('Maria Santos');
    });

    test('deve incluir link de ativação', () => {
      const html = EmailTemplates.generateInviteHtml(mockEmailData);
      const expectedLink = `${process.env.FRONTEND_URL}/ativar-convite?token=${encodeURIComponent(mockEmailData.conviteToken)}`;
      
      expect(html).toContain(expectedLink);
    });

    test('deve sanitizar dados para evitar XSS', () => {
      const maliciousData = {
        ...mockEmailData,
        nome: '<script>alert("xss")</script>João',
        hubNome: 'Hub<script>alert("xss")</script>Família'
      };
      
      const html = EmailTemplates.generateInviteHtml(maliciousData);
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('deve incluir estilos CSS responsivos', () => {
      const html = EmailTemplates.generateInviteHtml(mockEmailData);
      
      expect(html).toContain('@media (max-width: 600px)');
      expect(html).toContain('linear-gradient');
      expect(html).toContain('border-radius');
    });

    test('deve incluir seção de features', () => {
      const html = EmailTemplates.generateInviteHtml(mockEmailData);
      
      expect(html).toContain('💰');
      expect(html).toContain('📊');
      expect(html).toContain('👥');
      expect(html).toContain('🔒');
      expect(html).toContain('Controle de Gastos');
      expect(html).toContain('Relatórios');
      expect(html).toContain('Colaboração');
      expect(html).toContain('Segurança');
    });
  });

  describe('generateInviteText', () => {
    test('deve gerar template de texto válido', () => {
      const text = EmailTemplates.generateInviteText(mockEmailData);
      
      expect(text).toContain('Expense Hub - Convite para Participar do Hub');
      expect(text).toContain('João Silva');
      expect(text).toContain('Hub Família');
      expect(text).toContain('Maria Santos');
    });

    test('deve incluir link de ativação', () => {
      const text = EmailTemplates.generateInviteText(mockEmailData);
      const expectedLink = `${process.env.FRONTEND_URL}/ativar-convite?token=${encodeURIComponent(mockEmailData.conviteToken)}`;
      
      expect(text).toContain(expectedLink);
    });

    test('deve incluir informações de expiração', () => {
      const text = EmailTemplates.generateInviteText(mockEmailData);
      
      expect(text).toContain('IMPORTANTE: Este convite expira em');
      expect(text).toContain('Após esse prazo, será necessário solicitar um novo convite');
    });
  });

  describe('generateReinviteHtml', () => {
    test('deve gerar template HTML de reenvio válido', () => {
      const html = EmailTemplates.generateReinviteHtml(mockEmailData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Novo Convite para o Hub');
      expect(html).toContain('🔄 Novo Convite Gerado');
    });

    test('deve incluir mensagem específica de reenvio', () => {
      const html = EmailTemplates.generateReinviteHtml(mockEmailData);
      
      expect(html).toContain('Seu convite anterior expirou ou foi invalidado');
      expect(html).toContain('Este é um novo convite válido por 24 horas');
    });
  });

  describe('generateReinviteText', () => {
    test('deve gerar template de texto de reenvio válido', () => {
      const text = EmailTemplates.generateReinviteText(mockEmailData);
      
      expect(text).toContain('Expense Hub - Novo Convite para o Hub');
      expect(text).toContain('🔄 Novo Convite Gerado');
    });

    test('deve incluir mensagem específica de reenvio', () => {
      const text = EmailTemplates.generateReinviteText(mockEmailData);
      
      expect(text).toContain('Seu convite anterior expirou ou foi invalidado');
      expect(text).toContain('Este é um novo convite válido por 24 horas');
    });
  });

  describe('Validação de Dados', () => {
    test('deve lidar com nomes com caracteres especiais', () => {
      const specialData = {
        ...mockEmailData,
        nome: 'João & Maria',
        hubNome: 'Hub "Especial"',
        convidadorNome: 'Admin <Test>'
      };
      
      const html = EmailTemplates.generateInviteHtml(specialData);
      
      expect(html).toContain('João &amp; Maria');
      expect(html).toContain('Hub &quot;Especial&quot;');
      expect(html).toContain('Admin &lt;Test&gt;');
    });

    test('deve lidar com tokens longos', () => {
      const longTokenData = {
        ...mockEmailData,
        conviteToken: 'a'.repeat(100)
      };
      
      const html = EmailTemplates.generateInviteHtml(longTokenData);
      const text = EmailTemplates.generateInviteText(longTokenData);
      
      expect(html).toContain('a'.repeat(100));
      expect(text).toContain('a'.repeat(100));
    });
  });

  describe('Responsividade', () => {
    test('deve incluir media queries para mobile', () => {
      const html = EmailTemplates.generateInviteHtml(mockEmailData);
      
      expect(html).toContain('@media (max-width: 600px)');
      expect(html).toContain('.container {');
      expect(html).toContain('.header {');
      expect(html).toContain('.title {');
      expect(html).toContain('.greeting {');
    });
  });

  describe('Acessibilidade', () => {
    test('deve incluir atributos de acessibilidade', () => {
      const html = EmailTemplates.generateInviteHtml(mockEmailData);
      
      expect(html).toContain('lang="pt-BR"');
      expect(html).toContain('charset="UTF-8"');
      expect(html).toContain('viewport');
    });
  });
}); 