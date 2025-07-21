const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGodModeMetrics() {
  console.log('🔍 TESTANDO SISTEMA DE MÉTRICAS DO GOD MODE');
  console.log('============================================');

  try {
    // 1. Verificar se há métricas no banco
    console.log('\n1. Verificando métricas existentes no banco...');
    const existingMetrics = await prisma.system_metrics.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    console.log(`📊 Métricas encontradas: ${existingMetrics.length}`);
    existingMetrics.forEach(metric => {
      console.log(`   - ${metric.metric_name}: ${metric.metric_value} (${metric.timestamp})`);
    });

    // 2. Testar registro direto de métricas
    console.log('\n2. Registrando métricas de teste diretamente...');
    
    await prisma.system_metrics.create({
      data: {
        metric_name: 'emails_sent_today',
        metric_value: 5,
        metadata: { test: true, timestamp: new Date() }
      }
    });

    await prisma.system_metrics.create({
      data: {
        metric_name: 'emails_failed_today',
        metric_value: 1,
        metadata: { test: true, timestamp: new Date() }
      }
    });

    await prisma.system_metrics.create({
      data: {
        metric_name: 'login_attempts',
        metric_value: 10,
        metadata: { test: true, timestamp: new Date() }
      }
    });

    // 3. Verificar métricas após inserção
    console.log('\n3. Verificando métricas após inserção...');
    const updatedMetrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: {
          in: ['emails_sent_today', 'emails_failed_today', 'login_attempts']
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    console.log('📊 Métricas atualizadas:');
    updatedMetrics.forEach(metric => {
      console.log(`   - ${metric.metric_name}: ${metric.metric_value} (${metric.timestamp})`);
    });

    // 4. Verificar logs do sistema
    console.log('\n4. Verificando logs do sistema...');
    const logs = await prisma.system_logs.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log(`📝 Logs encontrados: ${logs.length}`);
    logs.forEach(log => {
      console.log(`   - [${log.level}] ${log.category}: ${log.message}`);
    });

    // 5. Testar consultas agregadas
    console.log('\n5. Testando consultas agregadas...');
    
    const emailMetrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: {
          in: ['emails_sent_today', 'emails_failed_today', 'email_queue_size']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 1
    });

    console.log('📧 Email Metrics encontradas:', emailMetrics.length);

    const authMetrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: {
          in: ['login_attempts', 'failed_logins', 'active_users', 'token_refreshes']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 1
    });

    console.log('🔐 Auth Metrics encontradas:', authMetrics.length);

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testGodModeMetrics(); 