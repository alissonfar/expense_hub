const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../dist/utils/password');

const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    console.log('🔧 Redefinindo senha do usuário...\n');

    const newPassword = '123456';
    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await prisma.pessoas.update({
      where: { email: 'alissonfariascamargo@gmail.com' },
      data: {
        senha_hash: hashedPassword
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        ehAdministrador: true,
        is_god: true
      }
    });

    console.log('✅ Senha redefinida com sucesso!');
    console.log('👤 Usuário atualizado:');
    console.log(`   Nome: ${updatedUser.nome}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Ativo: ${updatedUser.ativo ? 'Sim' : 'Não'}`);
    console.log(`   Admin: ${updatedUser.ehAdministrador ? 'Sim' : 'Não'}`);
    console.log(`   Deus: ${updatedUser.is_god ? 'Sim' : 'Não'}`);
    console.log(`\n🔐 Nova senha: ${newPassword}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword(); 