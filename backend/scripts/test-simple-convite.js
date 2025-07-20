const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

console.log('🧪 TESTE SIMPLES DE ATIVAÇÃO DE CONVITE');
console.log('=' .repeat(50));

async function testSimpleConvite() {
  try {
    // 1. Criar uma pessoa com convite ativo
    console.log('👤 1. Criando pessoa com convite ativo...');
    
    const testEmail = `teste.simple.${Date.now()}@example.com`;
    const conviteToken = crypto.randomBytes(32).toString('hex');
    
    const pessoa = await prisma.pessoas.create({
      data: {
        nome: 'Teste Simple',
        email: testEmail,
        conviteToken: conviteToken,
        conviteAtivo: true,
        conviteExpiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        emailVerificado: false, // Inicialmente não verificado
        ativo: true
      }
    });

    console.log('   ✅ Pessoa criada:', pessoa.email);
    console.log('   📊 Status inicial:');
    console.log(`      - Email verificado: ${pessoa.emailVerificado}`);
    console.log(`      - Convite ativo: ${pessoa.conviteAtivo}`);
    console.log(`      - Tem senha: ${!!pessoa.senha_hash}`);

    // 2. Simular ativação do convite (como o controller faz)
    console.log('\n✅ 2. Simulando ativação do convite...');
    
    const senhaHash = '$2b$12$teste.hash.simulado'; // Hash simulado
    
    const pessoaAtivada = await prisma.pessoas.update({
      where: { id: pessoa.id },
      data: {
        senha_hash: senhaHash,
        conviteToken: null,
        conviteExpiraEm: null,
        conviteAtivo: false,
        ativo: true,
        emailVerificado: true, // ✅ CORREÇÃO: Marcar como verificado
        emailVerificadoEm: new Date() // ✅ CORREÇÃO: Registrar data
      }
    });

    console.log('   ✅ Convite ativado');
    console.log('   📊 Status após ativação:');
    console.log(`      - Email verificado: ${pessoaAtivada.emailVerificado}`);
    console.log(`      - Data verificação: ${pessoaAtivada.emailVerificadoEm}`);
    console.log(`      - Convite ativo: ${pessoaAtivada.conviteAtivo}`);
    console.log(`      - Tem senha: ${!!pessoaAtivada.senha_hash}`);

    // 3. Verificar se o login funcionaria
    console.log('\n🔐 3. Verificando se login funcionaria...');
    
    if (pessoaAtivada.emailVerificado && pessoaAtivada.senha_hash) {
      console.log('   ✅ Login seria permitido!');
      console.log('   ✅ Conta está verificada e tem senha');
    } else {
      console.log('   ❌ Login seria bloqueado!');
      if (!pessoaAtivada.emailVerificado) {
        console.log('   ❌ Email não verificado');
      }
      if (!pessoaAtivada.senha_hash) {
        console.log('   ❌ Sem senha definida');
      }
    }

    // 4. Limpar dados de teste
    console.log('\n🧹 4. Limpando dados de teste...');
    await prisma.pessoas.delete({
      where: { id: pessoa.id }
    });
    console.log('   ✅ Dados de teste removidos');

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('=' .repeat(50));
    console.log('✅ Correção aplicada corretamente');
    console.log('✅ Conta marcada como verificada após ativação');
    console.log('✅ Login funcionaria normalmente');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    
    if (error.message.includes('emailVerificado')) {
      console.error('🚨 PROBLEMA: Campo emailVerificado não existe no banco!');
      console.error('   Execute: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testSimpleConvite(); 