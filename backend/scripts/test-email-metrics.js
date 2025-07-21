const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailMetrics() {
  console.log('📧 TESTANDO SISTEMA DE EMAIL E MÉTRICAS');
  console.log('=======================================');

  try {
    // 1. Verificar métricas antes do teste
    console.log('\n1. Verificando métricas antes do teste...');
    const beforeMetrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: {
          in: ['emails_sent_today', 'emails_failed_today']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 1
    });

    console.log('📊 Métricas antes:');
    beforeMetrics.forEach(metric => {
      console.log(`   - ${metric.metric_name}: ${metric.metric_value}`);
    });

    // 2. Simular envio de email (registrar métrica diretamente)
    console.log('\n2. Simulando envio de email...');
    
    await prisma.system_metrics.create({
      data: {
        metric_name: 'emails_sent_today',
        metric_value: 1,
        metadata: { 
          test: true, 
          email: 'teste@exemplo.com',
          timestamp: new Date() 
        }
      }
    });

    // 3. Verificar métricas após o teste
    console.log('\n3. Verificando métricas após o teste...');
    const afterMetrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: {
          in: ['emails_sent_today', 'emails_failed_today']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log('📊 Métricas após:');
    afterMetrics.forEach(metric => {
      console.log(`   - ${metric.metric_name}: ${metric.metric_value} (${metric.timestamp})`);
    });

    // 4. Verificar logs relacionados a email
    console.log('\n4. Verificando logs de email...');
    const emailLogs = await prisma.system_logs.findMany({
      where: {
        category: 'EMAIL'
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log(`📝 Logs de email encontrados: ${emailLogs.length}`);
    emailLogs.forEach(log => {
      console.log(`   - [${log.level}] ${log.message} (${log.timestamp})`);
    });

    // 5. Testar consulta agregada para dashboard
    console.log('\n5. Testando consulta para dashboard...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emailMetrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: {
          in: ['emails_sent_today', 'emails_failed_today', 'email_queue_size']
        },
        timestamp: {
          gte: today
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    console.log('📧 Métricas de email para hoje:');
    emailMetrics.forEach(metric => {
      console.log(`   - ${metric.metric_name}: ${metric.metric_value}`);
    });

    console.log('\n✅ TESTE DE EMAIL CONCLUÍDO!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testEmailMetrics(); 