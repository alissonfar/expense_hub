const crypto = require('crypto');

console.log('🔍 VERIFICAÇÃO DE CONFIGURAÇÃO DE AMBIENTE');
console.log('=' .repeat(50));

// Verificar ambiente
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`📋 Ambiente: ${nodeEnv.toUpperCase()}`);

// Verificar FRONTEND_URL
const frontendUrl = process.env.FRONTEND_URL;
console.log(`🌐 FRONTEND_URL: ${frontendUrl || 'NÃO CONFIGURADO'}`);

if (!frontendUrl) {
  console.log('⚠️  AVISO: FRONTEND_URL não está configurado!');
  console.log('   Em desenvolvimento: http://localhost:3000');
  console.log('   Em produção: https://seu-dominio.com');
} else {
  if (nodeEnv === 'production') {
    if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
      console.log('❌ ERRO: FRONTEND_URL em produção não pode ser localhost!');
      console.log('   Configure uma URL de produção válida.');
    } else if (!frontendUrl.startsWith('https://')) {
      console.log('⚠️  AVISO: Em produção, é recomendado usar HTTPS');
    } else {
      console.log('✅ FRONTEND_URL configurado corretamente para produção');
    }
  } else {
    console.log('✅ FRONTEND_URL configurado para desenvolvimento');
  }
}

// Verificar outras variáveis importantes
console.log('\n📋 OUTRAS VARIÁVEIS IMPORTANTES:');
console.log('-'.repeat(30));

const importantVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'EMAIL_FROM_NAME'
];

importantVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mascarar valores sensíveis
    if (varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('URL')) {
      const masked = value.length > 8 ? value.substring(0, 4) + '***' + value.substring(value.length - 4) : '***';
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NÃO CONFIGURADO`);
  }
});

// Verificar URLs que serão geradas
console.log('\n🔗 URLs que serão geradas nos emails:');
console.log('-'.repeat(30));

const baseUrl = frontendUrl || 'http://localhost:3000';
const testToken = crypto.randomBytes(32).toString('hex');

const emailUrls = [
  `${baseUrl}/verify-email?token=${testToken}`,
  `${baseUrl}/reset-password?token=${testToken}`,
  `${baseUrl}/ativar-convite?token=${testToken}`,
  `${baseUrl}/login`
];

emailUrls.forEach((url, index) => {
  const urlType = ['Verificação', 'Reset Senha', 'Ativar Convite', 'Login'][index];
  console.log(`📧 ${urlType}: ${url}`);
});

// Recomendações
console.log('\n💡 RECOMENDAÇÕES:');
console.log('-'.repeat(30));

if (nodeEnv === 'production') {
  console.log('🚀 Para PRODUÇÃO:');
  console.log('   • Configure FRONTEND_URL com HTTPS');
  console.log('   • Use variáveis de ambiente seguras');
  console.log('   • Configure CORS adequadamente');
  console.log('   • Monitore logs de email');
} else {
  console.log('🛠️  Para DESENVOLVIMENTO:');
  console.log('   • FRONTEND_URL pode ser localhost');
  console.log('   • Configure .env baseado no env.example');
  console.log('   • Teste emails com domínios válidos');
}

console.log('\n🎉 Verificação concluída!');
console.log('=' .repeat(50)); 