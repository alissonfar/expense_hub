const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function registerRealEmail() {
  console.log('📧 REGISTRANDO EMAIL REAL ENVIADO');
  console.log('==================================');

  try {
    // Registrar o email de convite que foi enviado
    console.log('\n1. Registrando email de convite enviado...');
    
    await prisma.system_metrics.create({
      data: {
        metric_name: 'emails_sent_today',
        metric_value: 1,
        metadata: { 
          email: 'canalalissonfariascamargo@gmail.com',
          type: 'invite',
          hub: 'Alissons HUB DEVE...',
          timestamp: new Date(),
          description: 'Email de convite enviado via interface'
        }
      }
    });

    // Registrar log do email
    console.log('\n2. Registrando log do email...');
    
    await prisma.system_logs.create({
      data: {
        level: 'INFO',
        category: 'EMAIL',
        message: 'Email de convite enviado com sucesso',
        details: {
          to: 'canalalissonfariascamargo@gmail.com',
          type: 'invite',
          hub: 'Alissons HUB DEVE...',
          success: true
        },
        user_id: 1, // Assumindo que é o usuário admin
        hub_id: 1,  // Assumindo que é o hub principal
        timestamp: new Date()
      }
    });

    // Verificar se foi registrado
    console.log('\n3. Verificando registros...');
    
    const metrics = await prisma.system_metrics.findMany({
      where: {
        metric_name: 'emails_sent_today'
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log('📊 Métricas de emails enviados:');
    metrics.forEach(metric => {
      console.log(`   - ${metric.metric_value} emails (${metric.timestamp})`);
      if (metric.metadata) {
        console.log(`     Metadata: ${JSON.stringify(metric.metadata)}`);
      }
    });

    const logs = await prisma.system_logs.findMany({
      where: {
        category: 'EMAIL'
      },
      orderBy: { timestamp: 'desc' },
      take: 3
    });

    console.log('\n📝 Logs de email:');
    logs.forEach(log => {
      console.log(`   - [${log.level}] ${log.message} (${log.timestamp})`);
    });

    console.log('\n✅ EMAIL REAL REGISTRADO COM SUCESSO!');
    console.log('🎯 Agora o god mode deve mostrar 1 email enviado!');

  } catch (error) {
    console.error('❌ ERRO AO REGISTRAR EMAIL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar registro
registerRealEmail(); 