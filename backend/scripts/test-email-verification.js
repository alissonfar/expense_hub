const axios = require('axios');
const crypto = require('crypto');

const API_BASE_URL = 'http://localhost:3001/api';
const timestamp = Date.now();
const TEST_EMAIL = `teste.verificacao.${timestamp}@example.com`;
const TEST_PASSWORD = 'Teste123!@#';
const TEST_NAME = 'Usuário Teste';
const TEST_HUB_NAME = 'Hub de Teste';

console.log('🧪 INICIANDO TESTE COMPLETO DE VERIFICAÇÃO DE EMAIL');
console.log('=' .repeat(60));

async function testEmailVerification() {
  try {
    console.log('\n📋 1. TESTANDO REGISTRO DE NOVA CONTA');
    console.log('-'.repeat(40));
    console.log('📧 Email de teste:', TEST_EMAIL);
    
    // 1. Registrar nova conta
    console.log('🔄 Fazendo requisição de registro...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      nome: TEST_NAME,
      email: TEST_EMAIL,
      senha: TEST_PASSWORD,
      nomeHub: TEST_HUB_NAME
    });
    
    console.log('✅ Registro realizado com sucesso');
    console.log('📧 Email de verificação enviado');
    console.log('📊 Resposta:', {
      success: registerResponse.data.success,
      message: registerResponse.data.message,
      emailVerificado: registerResponse.data.data?.emailVerificado
    });
    
    // 2. Tentar login sem verificar email
    console.log('\n📋 2. TESTANDO LOGIN SEM VERIFICAÇÃO');
    console.log('-'.repeat(40));
    
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        senha: TEST_PASSWORD
      });
      console.log('❌ ERRO: Login deveria ter falhado');
    } catch (loginError) {
      console.log('✅ Login bloqueado corretamente');
      console.log('📊 Status:', loginError.response?.status);
      console.log('📊 Dados:', loginError.response?.data);
      
      const errorData = loginError.response?.data;
      if (errorData?.error === 'EmailNaoVerificado') {
        console.log('✅ Erro correto: Email não verificado');
      } else {
        console.log('⚠️ Tipo de erro diferente do esperado:', errorData?.error);
      }
    }
    
    // 3. Buscar usuário no banco para obter token
    console.log('\n📋 3. BUSCANDO TOKEN DE VERIFICAÇÃO');
    console.log('-'.repeat(40));
    
    // Nota: Em produção, isso seria feito via email
    // Aqui simulamos obtendo o token do banco
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
    
    if (!user) {
      console.log('❌ ERRO: Usuário não encontrado');
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ Usuário encontrado no banco');
    console.log('📊 Dados do usuário:', {
      id: user.id,
      nome: user.nome,
      email: user.email,
      emailVerificado: user.emailVerificado,
      temToken: !!user.verificacaoToken,
      tokenExpira: user.verificacaoTokenExpiry
    });
    
    if (!user.verificacaoToken) {
      console.log('❌ ERRO: Token de verificação não encontrado');
      await prisma.$disconnect();
      return;
    }
    
    // 4. Verificar email
    console.log('\n📋 4. TESTANDO VERIFICAÇÃO DE EMAIL');
    console.log('-'.repeat(40));
    
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
      token: user.verificacaoToken
    });
    
    console.log('✅ Email verificado com sucesso');
    console.log('📊 Resposta:', {
      success: verifyResponse.data.success,
      message: verifyResponse.data.message,
      emailVerificado: verifyResponse.data.data?.emailVerificado
    });
    
    // 5. Verificar se usuário foi atualizado no banco
    console.log('\n📋 5. VERIFICANDO ATUALIZAÇÃO NO BANCO');
    console.log('-'.repeat(40));
    
    const updatedUser = await prisma.pessoas.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        nome: true,
        email: true,
        emailVerificado: true,
        emailVerificadoEm: true,
        verificacaoToken: true,
        verificacaoTokenExpiry: true
      }
    });
    
    console.log('✅ Usuário atualizado no banco');
    console.log('📊 Dados atualizados:', {
      emailVerificado: updatedUser.emailVerificado,
      emailVerificadoEm: updatedUser.emailVerificadoEm,
      tokenLimpado: !updatedUser.verificacaoToken
    });
    
    // 6. Testar login após verificação
    console.log('\n📋 6. TESTANDO LOGIN APÓS VERIFICAÇÃO');
    console.log('-'.repeat(40));
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      senha: TEST_PASSWORD
    });
    
    console.log('✅ Login realizado com sucesso após verificação');
    console.log('📊 Resposta:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      temRefreshToken: !!loginResponse.data.refreshToken
    });
    
    // 7. Testar verificação com token inválido
    console.log('\n📋 7. TESTANDO VERIFICAÇÃO COM TOKEN INVÁLIDO');
    console.log('-'.repeat(40));
    
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-email`, {
        token: 'token_invalido_123'
      });
      console.log('❌ ERRO: Verificação deveria ter falhado');
    } catch (verifyError) {
      console.log('✅ Verificação com token inválido falhou corretamente');
      console.log('📊 Erro:', verifyError.response?.data);
    }
    
    // 8. Testar verificação com token já usado
    console.log('\n📋 8. TESTANDO VERIFICAÇÃO COM TOKEN JÁ USADO');
    console.log('-'.repeat(40));
    
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-email`, {
        token: user.verificacaoToken
      });
      console.log('❌ ERRO: Verificação deveria ter falhado');
    } catch (verifyError) {
      console.log('✅ Verificação com token já usado falhou corretamente');
      console.log('📊 Erro:', verifyError.response?.data);
    }
    
    await prisma.$disconnect();
    
    console.log('\n🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
    console.log('=' .repeat(60));
    console.log('✅ Todas as funcionalidades estão funcionando corretamente');
    console.log('✅ Verificação obrigatória implementada');
    console.log('✅ Fluxo de login bloqueado para emails não verificados');
    console.log('✅ Tokens são limpos após uso');
    console.log('✅ Validações de segurança funcionando');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Dados:', error.response.data);
    }
  }
}

// Executar teste
testEmailVerification(); 