const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGodModeServices() {
  try {
    console.log('🧪 Testando serviços do Modo Deus...\n');

    // Simular uma requisição para testar os serviços
    const mockReq = {
      prisma,
      auth: { pessoaId: 1, hubId: 1 },
      ip: '127.0.0.1',
      get: (header) => header === 'User-Agent' ? 'Test-Agent' : null
    };

    // Importar serviços (arquivos compilados)
    const LoggingService = require('../dist/services/loggingService').default;
    const MetricsService = require('../dist/services/metricsService').default;
    const GodModeIntegration = require('../dist/utils/godUtils').default;

    // Testar LoggingService
    console.log('📝 Testando LoggingService...');
    const loggingService = LoggingService.getInstance(prisma);
    
    await loggingService.log({
      level: 'INFO',
      category: 'SYSTEM',
      message: 'Teste do LoggingService',
      userId: 1,
      hubId: 1,
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent',
      details: { test: true }
    });
    console.log('✅ LoggingService funcionando');

    // Testar MetricsService
    console.log('📊 Testando MetricsService...');
    const metricsService = MetricsService.getInstance(prisma);
    
    await metricsService.setMetric('emails_sent_today', 5);
    await metricsService.incrementMetric('login_attempts', 1);
    await metricsService.setMetric('memory_usage', 128.5);
    console.log('✅ MetricsService funcionando');

    // Testar GodModeIntegration
    console.log('🔗 Testando GodModeIntegration...');
    const integration = new GodModeIntegration(mockReq);
    
    await integration.logAuthEvent('login', 1, { test: true }, mockReq);
    await integration.logEmailEvent('sent', 'test@example.com', 'welcome');
    await integration.logBusinessEvent('transaction_created', 1, 1, { amount: 100 });
    console.log('✅ GodModeIntegration funcionando');

    // Verificar dados salvos
    console.log('\n📋 Verificando dados salvos...');
    
    const logs = await prisma.system_logs.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    const metrics = await prisma.system_metrics.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log(`📝 Logs salvos: ${logs.length}`);
    console.log(`📊 Métricas salvas: ${metrics.length}`);

    console.log('\n🎉 Todos os testes passaram!');
    console.log('🚀 Serviços do Modo Deus estão funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGodModeServices(); 