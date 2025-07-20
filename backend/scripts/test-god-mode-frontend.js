const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testGodModeFrontend() {
  try {
    console.log('🧪 Testando rotas do Modo Deus...\n');

    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'alissonfariascamargo@gmail.com',
      senha: '123456'
    });

    console.log('✅ Login bem-sucedido!');
    const refreshToken = loginResponse.data.data.refreshToken;

    // 2. Selecionar hub
    console.log('\n2️⃣ Selecionando hub...');
    const selectHubResponse = await axios.post(`${API_BASE}/auth/select-hub`, {
      hubId: 1
    }, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    console.log('✅ Hub selecionado!');
    const accessToken = selectHubResponse.data.data.accessToken;

    // 3. Testar rotas do Modo Deus
    console.log('\n3️⃣ Testando rotas do Modo Deus...');
    
    const routes = [
      '/god/dashboard',
      '/god/status', 
      '/god/metrics?limit=50',
      '/god/logs?limit=50',
      '/god/test'
    ];

    for (const route of routes) {
      try {
        console.log(`\n🔍 Testando: ${route}`);
        const response = await axios.get(`${API_BASE}${route}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log(`✅ ${route} - Status: ${response.status}`);
        if (route === '/god/test') {
          console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
        }
      } catch (error) {
        console.log(`❌ ${route} - Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📋 Resposta do servidor:', error.response.data);
    }
  }
}

// Executar o teste
testGodModeFrontend(); 