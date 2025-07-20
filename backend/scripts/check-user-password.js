const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword } = require('../dist/utils/password');

const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    console.log('🔍 Verificando senha do usuário...\n');

    const user = await prisma.pessoas.findUnique({
      where: { email: 'alissonfariascamargo@gmail.com' },
      select: {
        id: true,
        nome: true,
        email: true,
        senha_hash: true,
        ativo: true,
        ehAdministrador: true,
        is_god: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('👤 Usuário encontrado:');
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
    console.log(`   Admin: ${user.ehAdministrador ? 'Sim' : 'Não'}`);
    console.log(`   Deus: ${user.is_god ? 'Sim' : 'Não'}`);
    console.log(`   Senha hash: ${user.senha_hash ? 'Definida' : 'Não definida'}`);

    if (user.senha_hash) {
      // Testar algumas senhas comuns
      const testPasswords = ['123456', 'password', 'admin', '123456789'];
      
      console.log('\n🔐 Testando senhas...');
      for (const password of testPasswords) {
        const isValid = await verifyPassword(password, user.senha_hash);
        console.log(`   "${password}": ${isValid ? '✅ VÁLIDA' : '❌ Inválida'}`);
      }
    } else {
      console.log('\n⚠️  Usuário não tem senha definida!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPassword(); 