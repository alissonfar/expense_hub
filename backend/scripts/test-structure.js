// Script para testar a estrutura base do backend (Seção 3.1)
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method, path, data = null, expectStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${method} ${path} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'TIMEOUT';
    const message = error.response?.data?.error || error.message;
    console.log(`❌ ${method} ${path} - Status: ${status} - ${message}`);
    return null;
  }
}

async function runTests() {
  console.log('🧪 ================================');
  console.log('🔧 TESTE DA ESTRUTURA BASE (3.1)');
  console.log('🧪 ================================\n');

  console.log('📡 1. Endpoints básicos:');
  await testEndpoint('GET', '/');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api');
  
  console.log('\n🔗 2. Conexão com banco:');
  await testEndpoint('GET', '/api/test-db');
  
  console.log('\n❌ 3. Tratamento de erros:');
  await testEndpoint('GET', '/rota-inexistente');
  await testEndpoint('POST', '/api/endpoint-inexistente');
  
  console.log('\n⚡ 4. Rate limiting (várias requisições):');
  for (let i = 1; i <= 5; i++) {
    await testEndpoint('GET', '/api');
  }
  
  console.log('\n🧪 ================================');
  console.log('✅ TESTES DA ESTRUTURA CONCLUÍDOS');
  console.log('🧪 ================================');
}

// Aguardar um pouco para o servidor iniciar e executar testes
setTimeout(runTests, 3000); 