// Script para testar as chamadas da API do Modo Deus no frontend
// Execute no console do navegador na página do frontend

async function testGodModeFrontend() {
  console.log('🧪 Testando Modo Deus no frontend...\n');

  try {
    // 1. Verificar se o usuário está logado
    const usuarioStr = localStorage.getItem('@PersonalExpenseHub:usuario');
    const accessToken = localStorage.getItem('@PersonalExpenseHub:accessToken');
    
    if (!usuarioStr) {
      console.log('❌ Usuário não está logado');
      return;
    }

    const usuario = JSON.parse(usuarioStr);
    console.log('👤 Usuário logado:', usuario.nome);
    console.log('🔑 is_god:', usuario.is_god);
    console.log('🎫 Access Token:', accessToken ? '✅ Presente' : '❌ Ausente');

    if (!usuario.is_god) {
      console.log('❌ Usuário não tem privilégios de Deus');
      return;
    }

    if (!accessToken) {
      console.log('❌ Access Token não encontrado');
      return;
    }

    // 2. Testar chamadas da API
    const API_BASE = 'http://localhost:3001/api';
    const routes = [
      '/god/dashboard',
      '/god/status',
      '/god/metrics?limit=50',
      '/god/logs?limit=50',
      '/god/test'
    ];

    console.log('\n🔍 Testando rotas da API...');
    
    for (const route of routes) {
      try {
        console.log(`\n📡 Testando: ${route}`);
        
        const response = await fetch(`${API_BASE}${route}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Sucesso: ${route}`);
          if (route === '/god/test') {
            console.log('   📋 Resposta:', data);
          }
        } else {
          const errorData = await response.json();
          console.log(`   ❌ Erro: ${errorData.message || 'Erro desconhecido'}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro de rede: ${error.message}`);
      }
    }

    // 3. Verificar se o botão está sendo renderizado
    console.log('\n🎯 Verificando renderização do botão...');
    
    // Aguardar um pouco para o React renderizar
    setTimeout(() => {
      const godModeButton = document.querySelector('[href="/god"], [onclick*="god"]');
      if (godModeButton) {
        console.log('✅ Botão Modo Deus encontrado no DOM');
      } else {
        console.log('❌ Botão Modo Deus NÃO encontrado no DOM');
        
        // Verificar se o dropdown do usuário existe
        const userDropdown = document.querySelector('[role="menu"]');
        if (userDropdown) {
          console.log('✅ Dropdown do usuário encontrado');
          console.log('   Conteúdo do dropdown:', userDropdown.innerHTML);
        } else {
          console.log('❌ Dropdown do usuário NÃO encontrado');
        }
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testGodModeFrontend(); 