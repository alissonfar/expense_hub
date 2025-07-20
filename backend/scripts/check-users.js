const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco...');
    
    const users = await prisma.pessoas.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        ehAdministrador: true,
        is_god: true,
        ativo: true
      },
      orderBy: { id: 'asc' }
    });

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco!');
      return;
    }

    console.log(`📊 Total de usuários: ${users.length}`);
    console.log('\n👥 Lista de usuários:');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.email})`);
      console.log(`   ID: ${user.id} | Ativo: ${user.ativo ? 'Sim' : 'Não'} | Admin: ${user.ehAdministrador ? 'Sim' : 'Não'} | Deus: ${user.is_god ? 'Sim' : 'Não'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 