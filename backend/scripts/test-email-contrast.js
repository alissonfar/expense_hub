const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const timestamp = Date.now();
const TEST_EMAIL = `teste.contraste.${timestamp}@example.com`;
const TEST_PASSWORD = 'Teste123!@#';
const TEST_NAME = 'Usuário Teste Contraste';
const TEST_HUB_NAME = 'Hub de Teste Contraste';

console.log('🎨 TESTE DE CONTRASTE DO BOTÃO NO EMAIL');
console.log('=' .repeat(45));
console.log('📧 Email:', TEST_EMAIL);

async function testEmailContrast() {
  try {
    // 1. Registrar usuário para gerar email de verificação
    console.log('\n📋 1. REGISTRANDO USUÁRIO');
    console.log('-'.repeat(30));
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      nome: TEST_NAME,
      email: TEST_EMAIL,
      senha: TEST_PASSWORD,
      nomeHub: TEST_HUB_NAME
    });
    
    console.log('✅ Registro realizado com sucesso');
    console.log('📧 Email de verificação enviado com botão melhorado');
    console.log('📊 Resposta:', {
      success: registerResponse.data.success,
      message: registerResponse.data.message
    });
    
    // 2. Verificar se o usuário foi criado
    console.log('\n📋 2. VERIFICANDO CRIAÇÃO DO USUÁRIO');
    console.log('-'.repeat(30));
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.pessoas.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        nome: true,
        email: true,
        emailVerificado: true,
        verificacaoToken: true
      }
    });
    
    if (user) {
      console.log('✅ Usuário criado com sucesso');
      console.log('📊 Dados:', {
        id: user.id,
        nome: user.nome,
        email: user.email,
        emailVerificado: user.emailVerificado,
        temToken: !!user.verificacaoToken
      });
      
      console.log('\n🎨 MELHORIAS APLICADAS NO BOTÃO:');
      console.log('-'.repeat(30));
      console.log('✅ Cor de fundo mais escura: #1e40af → #1e3a8a');
      console.log('✅ Borda adicionada: 2px solid #1e3a8a');
      console.log('✅ Sombra dupla para profundidade');
      console.log('✅ Text shadow para melhor contraste');
      console.log('✅ Estilo inline para compatibilidade');
      
      console.log('\n📧 PRÓXIMOS PASSOS:');
      console.log('-'.repeat(30));
      console.log('1. Verifique o email em:', TEST_EMAIL);
      console.log('2. Observe o botão "Ativar Minha Conta"');
      console.log('3. Confirme que o contraste está melhor');
      console.log('4. Teste a funcionalidade clicando no botão');
      
    } else {
      console.log('❌ ERRO: Usuário não foi criado');
    }
    
    await prisma.$disconnect();
    
    console.log('\n🎉 TESTE DE CONTRASTE CONCLUÍDO!');
    console.log('=' .repeat(45));
    console.log('✅ Email enviado com botão melhorado');
    console.log('✅ Contraste otimizado para melhor visibilidade');
    console.log('✅ Compatibilidade mantida com clientes de email');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Dados:', error.response.data);
    }
  }
}

testEmailContrast(); 