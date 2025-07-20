import dotenv from 'dotenv';
import { getEmailService } from '../services/emailService';

// Carregar variáveis de ambiente dinamicamente
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

async function showEmailStats() {
  console.log('📊 Estatísticas do Sistema de Email\n');

  try {
    const emailService = getEmailService();
    const monitoringData = emailService.getMonitoringData();

    console.log('📈 Dados de Monitoramento:');
    console.log(`   📧 Emails enviados hoje: ${monitoringData.emailCount}/${monitoringData.dailyLimit}`);
    console.log(`   📧 Limite diário: ${monitoringData.dailyLimit}`);
    console.log(`   📧 Limite horário: ${monitoringData.hourlyLimit}`);
    console.log(`   📅 Último reset: ${monitoringData.lastReset.toLocaleString('pt-BR')}`);
    
    // Calcular percentuais
    const dailyPercentage = (monitoringData.emailCount / monitoringData.dailyLimit) * 100;
    const hourlyPercentage = (monitoringData.emailCount / monitoringData.hourlyLimit) * 100;
    
    console.log(`   📊 Uso diário: ${dailyPercentage.toFixed(1)}%`);
    console.log(`   📊 Uso horário: ${hourlyPercentage.toFixed(1)}%`);

    // Alertas
    if (dailyPercentage > 80) {
      console.log('\n⚠️  ALERTA: Limite diário próximo de ser atingido!');
    }
    
    if (dailyPercentage > 90) {
      console.log('🚨 CRÍTICO: Limite diário quase atingido!');
    }

    // Status do sistema
    console.log('\n🔧 Status do Sistema:');
    console.log(`   ✅ Gmail configurado: ${process.env.GMAIL_USER ? 'Sim' : 'Não'}`);
    console.log(`   ✅ App Password configurado: ${process.env.GMAIL_APP_PASSWORD ? 'Sim' : 'Não'}`);
    console.log(`   ✅ Emails habilitados: ${process.env.ENABLE_EMAILS === 'true' ? 'Sim' : 'Não'}`);
    console.log(`   ✅ Frontend URL: ${process.env.FRONTEND_URL || 'Não configurado'}`);

    // Configurações
    console.log('\n⚙️  Configurações:');
    console.log(`   🔄 Tentativas de retry: ${process.env.EMAIL_RETRY_ATTEMPTS || '3'}`);
    console.log(`   ⏱️  Delay entre tentativas: ${process.env.EMAIL_RETRY_DELAY || '1000'}ms`);
    console.log(`   📧 Nome do remetente: ${process.env.EMAIL_FROM_NAME || 'Expense Hub'}`);

    // Recomendações
    console.log('\n💡 Recomendações:');
    
    if (dailyPercentage > 70) {
      console.log('   • Considere aumentar o limite diário ou otimizar o uso');
    }
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('   • Configure as credenciais do Gmail para habilitar o envio');
    }
    
    if (process.env.ENABLE_EMAILS !== 'true') {
      console.log('   • Habilite o sistema de email definindo ENABLE_EMAILS=true');
    }

    // Teste de conexão
    console.log('\n🧪 Testando conexão...');
    const connectionResult = await emailService.testConnection();
    
    if (connectionResult.success) {
      console.log('✅ Conexão com Gmail funcionando corretamente');
    } else {
      console.log('❌ Problema na conexão com Gmail:', connectionResult.error);
    }

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
  }
}

// Executar estatísticas
showEmailStats()
  .then(() => {
    console.log('\n🏁 Estatísticas concluídas.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }); 