const { PrismaClient } = require('@prisma/client');

// Substitua pela sua string real do Supabase
const DATABASE_URL = "postgresql://postgres.pkeopqoghsvjfmlvlfig:f5$TTiNc!7tPemb@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco funcionando!');
    
    // Teste uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query funcionando:', result);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();