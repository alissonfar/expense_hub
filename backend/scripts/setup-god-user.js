const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupGodUser() {
  try {
    console.log('🔧 Configurando usuário como Deus...');
    
    // Buscar o primeiro usuário administrador
    const adminUser = await prisma.pessoas.findFirst({
      where: {
        ehAdministrador: true,
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ehAdministrador: true,
        is_god: true
      }
    });

    if (!adminUser) {
      console.log('❌ Nenhum usuário administrador encontrado!');
      console.log('💡 Crie um usuário administrador primeiro.');
      return;
    }

    console.log(`👤 Usuário encontrado: ${adminUser.nome} (${adminUser.email})`);
    console.log(`🔑 Administrador: ${adminUser.ehAdministrador ? 'Sim' : 'Não'}`);
    console.log(`👑 Modo Deus: ${adminUser.is_god ? 'Sim' : 'Não'}`);

    if (adminUser.is_god) {
      console.log('✅ Usuário já tem privilégios de Deus!');
      return;
    }

    // Configurar como Deus
    await prisma.pessoas.update({
      where: { id: adminUser.id },
      data: { is_god: true }
    });

    console.log('✅ Usuário configurado como Deus com sucesso!');
    console.log(`🎯 Agora você pode acessar o Modo Deus com o usuário: ${adminUser.email}`);

  } catch (error) {
    console.error('❌ Erro ao configurar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupGodUser(); 