const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testGodModeLogin() {
  try {
    console.log('🧪 Testando login com usuário Deus...\n');

    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'alissonfariascamargo@gmail.com',
      senha: '123456'
    });

    console.log('✅ Login bem-sucedido!');
    console.log('📋 Dados do usuário retornados:');
    console.log(JSON.stringify(loginResponse.data.data.user, null, 2));

    // Verificar se o campo is_god está presente
    const user = loginResponse.data.data.user;
    if (user.is_god !== undefined) {
      console.log(`\n🎯 Campo is_god encontrado: ${user.is_god}`);
      if (user.is_god) {
        console.log('✅ Usuário tem privilégios de Deus!');
      } else {
        console.log('❌ Usuário NÃO tem privilégios de Deus');
      }
    } else {
      console.log('❌ Campo is_god NÃO encontrado na resposta!');
    }

    // 2. Selecionar hub
    console.log('\n2️⃣ Selecionando hub...');
    const refreshToken = loginResponse.data.data.refreshToken;
    const selectHubResponse = await axios.post(`${API_BASE}/auth/select-hub`, {
      hubId: 1 // Substitua pelo ID do hub correto
    }, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    console.log('✅ Hub selecionado!');
    console.log('📋 Contexto do hub retornado:');
    console.log(JSON.stringify(selectHubResponse.data.data.hubContext, null, 2));

    // 3. Testar acesso ao Modo Deus
    console.log('\n3️⃣ Testando acesso ao Modo Deus...');
    const accessToken = selectHubResponse.data.data.accessToken;
    
    try {
      const godResponse = await axios.get(`${API_BASE}/god/dashboard`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('✅ Acesso ao Modo Deus concedido!');
      console.log('📋 Dashboard retornado:');
      console.log(JSON.stringify(godResponse.data, null, 2));
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Acesso negado ao Modo Deus');
        console.log('📋 Erro:', error.response.data);
      } else {
        console.log('❌ Erro ao acessar Modo Deus:', error.message);
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
testGodModeLogin(); 