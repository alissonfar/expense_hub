const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdminAndGod() {
  try {
    console.log('🔧 Configurando usuário como Administrador e Deus...');
    
    // Buscar o primeiro usuário
    const user = await prisma.pessoas.findFirst({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        ehAdministrador: true,
        is_god: true
      }
    });

    if (!user) {
      console.log('❌ Nenhum usuário encontrado!');
      return;
    }

    console.log(`👤 Usuário encontrado: ${user.nome} (${user.email})`);
    console.log(`🔑 Administrador: ${user.ehAdministrador ? 'Sim' : 'Não'}`);
    console.log(`👑 Modo Deus: ${user.is_god ? 'Sim' : 'Não'}`);

    // Configurar como administrador e Deus
    await prisma.pessoas.update({
      where: { id: user.id },
      data: { 
        ehAdministrador: true,
        is_god: true 
      }
    });

    console.log('✅ Usuário configurado como Administrador e Deus com sucesso!');
    console.log(`🎯 Agora você pode acessar o Modo Deus com o usuário: ${user.email}`);

  } catch (error) {
    console.error('❌ Erro ao configurar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminAndGod(); 