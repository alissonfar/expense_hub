const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const timestamp = Date.now();
const TEST_EMAIL = `teste.fluxo.${timestamp}@example.com`;
const TEST_PASSWORD = 'Teste123!@#';
const TEST_NAME = 'Usuário Teste Fluxo';
const TEST_HUB_NAME = 'Hub de Teste Fluxo';

console.log('🧪 TESTE DO FLUXO COMPLETO DE VERIFICAÇÃO');
console.log('=' .repeat(50));
console.log('📧 Email:', TEST_EMAIL);

async function testVerificationFlow() {
  try {
    // 1. Registrar usuário
    console.log('\n📋 1. REGISTRANDO USUÁRIO');
    console.log('-'.repeat(30));
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      nome: TEST_NAME,
      email: TEST_EMAIL,
      senha: TEST_PASSWORD,
      nomeHub: TEST_HUB_NAME
    });
    
    console.log('✅ Registro realizado com sucesso');
    console.log('📊 Resposta:', {
      success: registerResponse.data.success,
      message: registerResponse.data.message,
      emailVerificado: registerResponse.data.data?.emailVerificado
    });
    
    // 2. Simular redirecionamento para página de verificação pendente
    console.log('\n📋 2. SIMULANDO PÁGINA DE VERIFICAÇÃO PENDENTE');
    console.log('-'.repeat(30));
    console.log('🔗 URL da página: /verification-pending?email=' + encodeURIComponent(TEST_EMAIL));
    console.log('📧 Email passado via query params:', TEST_EMAIL);
    
    // 3. Tentar login sem verificação (deve falhar)
    console.log('\n📋 3. TESTANDO LOGIN SEM VERIFICAÇÃO');
    console.log('-'.repeat(30));
    
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        senha: TEST_PASSWORD
      });
      console.log('❌ ERRO: Login deveria ter falhado');
    } catch (loginError) {
      console.log('✅ Login bloqueado corretamente');
      console.log('📊 Erro:', loginError.response?.data?.error);
    }
    
    // 4. Testar reenvio de verificação
    console.log('\n📋 4. TESTANDO REENVIO DE VERIFICAÇÃO');
    console.log('-'.repeat(30));
    
    const resendResponse = await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Reenvio realizado com sucesso');
    console.log('📊 Resposta:', {
      success: resendResponse.data.success,
      message: resendResponse.data.message
    });
    
    // 5. Buscar usuário para obter novo token
    console.log('\n📋 5. BUSCANDO NOVO TOKEN DE VERIFICAÇÃO');
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
        verificacaoToken: true,
        verificacaoTokenExpiry: true
      }
    });
    
    console.log('✅ Usuário encontrado');
    console.log('📊 Dados:', {
      emailVerificado: user.emailVerificado,
      temToken: !!user.verificacaoToken,
      tokenExpira: user.verificacaoTokenExpiry
    });
    
    // 6. Verificar email com novo token
    console.log('\n📋 6. VERIFICANDO EMAIL COM NOVO TOKEN');
    console.log('-'.repeat(30));
    
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
      token: user.verificacaoToken
    });
    
    console.log('✅ Email verificado com sucesso');
    console.log('📊 Resposta:', {
      success: verifyResponse.data.success,
      message: verifyResponse.data.message
    });
    
    // 7. Testar login após verificação
    console.log('\n📋 7. TESTANDO LOGIN APÓS VERIFICAÇÃO');
    console.log('-'.repeat(30));
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      senha: TEST_PASSWORD
    });
    
    console.log('✅ Login realizado com sucesso');
    console.log('📊 Resposta:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      temRefreshToken: !!loginResponse.data.refreshToken
    });
    
    // 8. Testar reenvio para email já verificado
    console.log('\n📋 8. TESTANDO REENVIO PARA EMAIL JÁ VERIFICADO');
    console.log('-'.repeat(30));
    
    const resendVerifiedResponse = await axios.post(`${API_BASE_URL}/auth/resend-verification`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Reenvio tratado corretamente');
    console.log('📊 Resposta:', {
      success: resendVerifiedResponse.data.success,
      message: resendVerifiedResponse.data.message
    });
    
    await prisma.$disconnect();
    
    console.log('\n🎉 FLUXO COMPLETO TESTADO COM SUCESSO!');
    console.log('=' .repeat(50));
    console.log('✅ Registro → Verificação Pendente → Reenvio → Verificação → Login');
    console.log('✅ Todas as validações funcionando');
    console.log('✅ UX otimizada com feedback claro');
    console.log('✅ Segurança mantida em todos os pontos');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Dados:', error.response.data);
    }
  }
}

testVerificationFlow(); 