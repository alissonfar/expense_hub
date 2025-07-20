const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const timestamp = Date.now();
const TEST_EMAIL = `teste.simples.${timestamp}@example.com`;
const TEST_PASSWORD = 'Teste123!@#';
const TEST_NAME = 'Usuário Teste Simples';
const TEST_HUB_NAME = 'Hub de Teste Simples';

console.log('🧪 TESTE SIMPLES DE REGISTRO');
console.log('=' .repeat(40));
console.log('📧 Email:', TEST_EMAIL);

async function testSimpleRegister() {
  try {
    console.log('\n📋 Registrando usuário...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      nome: TEST_NAME,
      email: TEST_EMAIL,
      senha: TEST_PASSWORD,
      nomeHub: TEST_HUB_NAME
    });
    
    console.log('✅ Sucesso!');
    console.log('📊 Resposta:', {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Dados:', error.response.data);
    }
  }
}

testSimpleRegister(); 