// Script para verificar o estado de autenticação no frontend
// Execute no console do navegador na página do frontend

console.log('🔍 Verificando estado de autenticação...\n');

// Verificar localStorage
const storageKeys = {
  ACCESS_TOKEN: '@PersonalExpenseHub:accessToken',
  REFRESH_TOKEN: '@PersonalExpenseHub:refreshToken',
  USUARIO: '@PersonalExpenseHub:usuario',
  HUB_ATUAL: '@PersonalExpenseHub:hubAtual',
  HUBS_DISPONIVEIS: '@PersonalExpenseHub:hubsDisponiveis'
};

console.log('📦 Dados no localStorage:');
for (const [key, storageKey] of Object.entries(storageKeys)) {
  const value = localStorage.getItem(storageKey);
  console.log(`${key}:`, value ? '✅ Presente' : '❌ Ausente');
  if (value) {
    try {
      const parsed = JSON.parse(value);
      console.log(`   Conteúdo:`, parsed);
    } catch {
      console.log(`   Conteúdo:`, value);
    }
  }
}

// Verificar cookies
console.log('\n🍪 Cookies:');
const cookies = document.cookie.split(';').map(c => c.trim());
cookies.forEach(cookie => {
  if (cookie.includes('PersonalExpenseHub')) {
    console.log(`   ${cookie}`);
  }
});

// Verificar se o React está renderizando o componente
console.log('\n⚛️ Estado do React:');
if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
  console.log('   Next.js detectado');
}

// Verificar se há erros no console
console.log('\n🚨 Verificar console para erros de JavaScript');

// Verificar se o usuário tem is_god
const usuarioStr = localStorage.getItem('@PersonalExpenseHub:usuario');
if (usuarioStr) {
  try {
    const usuario = JSON.parse(usuarioStr);
    console.log('\n👤 Usuário carregado:');
    console.log('   Nome:', usuario.nome);
    console.log('   Email:', usuario.email);
    console.log('   is_god:', usuario.is_god);
    console.log('   ehAdministrador:', usuario.ehAdministrador);
    
    if (usuario.is_god) {
      console.log('✅ Usuário tem privilégios de Deus!');
    } else {
      console.log('❌ Usuário NÃO tem privilégios de Deus');
    }
  } catch (error) {
    console.log('❌ Erro ao parsear usuário:', error);
  }
} else {
  console.log('❌ Usuário não encontrado no localStorage');
} 