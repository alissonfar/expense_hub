import dotenv from 'dotenv';
import { getEmailService } from '../services/emailService';

// Carregar variáveis de ambiente dinamicamente
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

async function testEmailConnection() {
  console.log('🧪 Testando conexão com Gmail SMTP...\n');

  try {
    // Testar conexão
    const emailService = getEmailService();
    const connectionResult = await emailService.testConnection();
    
    if (connectionResult.success) {
      console.log('✅ Conexão com Gmail SMTP estabelecida com sucesso!');
      
      // Testar envio de email de teste
      console.log('\n📧 Testando envio de email...');
      
      const testEmailResult = await emailService.sendInviteEmail({
        to: process.env.TEST_EMAIL || 'test@example.com',
        nome: 'Usuário Teste',
        hubNome: 'Hub Teste',
        conviteToken: 'test-token-123456789',
        convidadorNome: 'Administrador Teste'
      });

      if (testEmailResult.success) {
        console.log('✅ Email de teste enviado com sucesso!');
        console.log(`📧 Message ID: ${testEmailResult.messageId}`);
      } else {
        console.log('❌ Erro ao enviar email de teste:', testEmailResult.error);
      }

      // Mostrar dados de monitoramento
      const monitoringData = emailService.getMonitoringData();
      console.log('\n📊 Dados de Monitoramento:');
      console.log(`📧 Emails enviados hoje: ${monitoringData.emailCount}/${monitoringData.dailyLimit}`);
      console.log(`📧 Limite diário: ${monitoringData.dailyLimit}`);
      console.log(`📧 Limite horário: ${monitoringData.hourlyLimit}`);
      console.log(`📧 Último reset: ${monitoringData.lastReset.toLocaleString('pt-BR')}`);

    } else {
      console.log('❌ Erro na conexão:', connectionResult.error);
      console.log('\n🔧 Verifique:');
      console.log('1. Se as variáveis GMAIL_USER e GMAIL_APP_PASSWORD estão configuradas');
      console.log('2. Se a senha de aplicativo do Gmail está correta');
      console.log('3. Se a verificação em duas etapas está habilitada');
      console.log('4. Se o Gmail permite acesso a apps menos seguros');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testEmailConnection()
  .then(() => {
    console.log('\n🏁 Teste concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }); 