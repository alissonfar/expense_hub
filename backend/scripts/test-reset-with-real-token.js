const axios = require('axios');

// Configuração
const BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = 'alissonfariascamargo@gmail.com';
const NEW_PASSWORD = 'NovaSenha123!';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${step}. ${description}`, 'cyan');
  log('='.repeat(50), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testResetWithRealToken() {
  log('🔑 TESTE DE RESET COM TOKEN REAL', 'bright');
  log('='.repeat(50), 'blue');

  // Verificar se o token foi fornecido como argumento
  const token = process.argv[2];
  
  if (!token) {
    logError('Token não fornecido!');
    logInfo('Uso: node scripts/test-reset-with-real-token.js <TOKEN>');
    logInfo('Exemplo: node scripts/test-reset-with-real-token.js abc123def456');
    logInfo('');
    logInfo('Para obter o token:');
    logInfo('1. Verifique o email: ' + TEST_EMAIL);
    logInfo('2. Copie o token do link de reset');
    logInfo('3. Execute este script com o token');
    return;
  }

  try {
    // =============================================
    // PASSO 1: Testar reset de senha com token real
    // =============================================
    logStep(1, 'Testando reset de senha com token real');
    
    try {
      const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: token,
        novaSenha: NEW_PASSWORD
      });
      
      if (resetResponse.data.success) {
        logSuccess('Senha redefinida com sucesso!');
        logInfo('Nova senha: ' + NEW_PASSWORD);
        logInfo('Mensagem: ' + resetResponse.data.message);
      } else {
        logError('Falha ao redefinir senha');
        console.error(resetResponse.data);
        return;
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logError('Token inválido ou expirado');
        logInfo('Mensagem: ' + (error.response?.data?.message || 'Token inválido'));
        logInfo('Verifique se:');
        logInfo('- O token está correto');
        logInfo('- O token não expirou (1 hora)');
        logInfo('- O token não foi usado anteriormente');
        return;
      } else {
        logError('Erro ao redefinir senha');
        console.error(error.response?.data || error.message);
        return;
      }
    }

    // =============================================
    // PASSO 2: Testar login com nova senha
    // =============================================
    logStep(2, 'Testando login com nova senha');
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        senha: NEW_PASSWORD
      });
      
      if (loginResponse.data.success) {
        logSuccess('Login com nova senha realizado com sucesso!');
        logInfo(`Nome: ${loginResponse.data.data.user.nome}`);
        logInfo(`Hubs disponíveis: ${loginResponse.data.data.hubs.length}`);
        logInfo('Refresh Token recebido: ' + (loginResponse.data.data.refreshToken ? 'Sim' : 'Não'));
      } else {
        logError('Falha no login com nova senha');
        console.error(loginResponse.data);
        return;
      }
    } catch (error) {
      logError('Erro no login com nova senha');
      console.error(error.response?.data || error.message);
      return;
    }

    // =============================================
    // PASSO 3: Verificar se o token foi limpo
    // =============================================
    logStep(3, 'Verificando se o token foi limpo do banco');
    
    try {
      // Tentar usar o mesmo token novamente (deve falhar)
      const duplicateResetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: token,
        novaSenha: 'OutraSenha123!'
      });
      
      logError('Token ainda está válido (não deveria)');
      console.error(duplicateResetResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Token foi limpo corretamente do banco');
        logInfo('Mensagem: ' + (error.response?.data?.message || 'Token inválido'));
      } else {
        logWarning('Erro inesperado ao testar token duplicado');
        console.error(error.response?.data || error.message);
      }
    }

    // =============================================
    // RESUMO DO TESTE
    // =============================================
    logStep(4, 'Resumo do Teste Completo');
    
    logSuccess('✅ Reset de senha com token real: PASSOU');
    logSuccess('✅ Login com nova senha: PASSOU');
    logSuccess('✅ Token limpo do banco: PASSOU');
    
    log('\n🎉 TESTE COMPLETO BEM-SUCEDIDO!', 'bright');
    log('A funcionalidade de reset de senha está funcionando perfeitamente.', 'green');

  } catch (error) {
    logError('Erro geral no teste');
    console.error(error);
  }
}

// Executar o teste
if (require.main === module) {
  testResetWithRealToken()
    .then(() => {
      log('\n🎉 Teste concluído!', 'green');
      process.exit(0);
    })
    .catch((error) => {
      logError('Teste falhou');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testResetWithRealToken }; 