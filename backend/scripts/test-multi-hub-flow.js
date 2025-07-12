// Script automatizado para testar o fluxo multi-hub
// Execute com: node scripts/test-multi-hub-flow.js

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const EMAIL = 'alissonfariascamargo@gmail.com'; // ajuste se necessário
const SENHA = '@Alisson10'; // ajuste se necessário

function logStep(msg) {
  console.log(`\n\x1b[36m[PASSO]\x1b[0m ${msg}`);
}
function logSuccess(msg) {
  console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
}
function logWarn(msg) {
  console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`);
}
function logError(msg) {
  console.error(`\x1b[31m❌ ${msg}\x1b[0m`);
}

async function main() {
  console.log('--- TESTE AUTOMATIZADO: FLUXO MULTI-HUB (PADRÃO test42end.js) ---');

  // 1. Login
  logStep('1. Realizando login...');
  let loginResp;
  try {
    loginResp = await axios.post(`${API_URL}/auth/login`, { email: EMAIL, senha: SENHA }, {
      headers: { 'Content-Type': 'application/json' }
    });
    logSuccess('Login realizado com sucesso!');
  } catch (err) {
    logError('Erro ao fazer login: ' + (err.response?.data?.message || err.message));
    return;
  }
  const { user, hubs, refreshToken } = loginResp.data.data;
  console.log('Usuário:', user.nome, '| Hubs existentes:', hubs.map(h => h.nome).join(', '));

  // 2. Selecionar cada hub existente para obter accessToken
  const hubTokens = {};
  for (const hub of hubs) {
    logStep(`2. Selecionando hub existente: ${hub.nome} (ID: ${hub.id})...`);
    try {
      const resp = await axios.post(
        `${API_URL}/auth/select-hub`,
        { hubId: hub.id },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`
          }
        }
      );
      const accessToken = resp.data.data.accessToken;
      hubTokens[hub.id] = accessToken;
      logSuccess(`AccessToken obtido para o hub: ${hub.nome}`);
    } catch (err) {
      logError('Erro ao selecionar hub: ' + (err.response?.data?.message || err.message));
    }
  }

  // 3. Criar múltiplos hubs usando accessToken do primeiro hub
  // IMPORTANTE: O backend retorna o novo hub em resp.data.data
  const hubsParaCriar = ['Hub Teste 1', 'Hub Teste 2', 'Hub Teste 3'];
  const hubsCriados = [];
  const primeiroAccessToken = hubTokens[hubs[0]?.id];
  for (const nome of hubsParaCriar) {
    logStep(`3. Criando hub: ${nome}...`);
    try {
      const resp = await axios.post(
        `${API_URL}/hubs`,
        { nome },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${primeiroAccessToken}`
          }
        }
      );
      // Corrigido: acessar resp.data.data
      hubsCriados.push(resp.data.data);
      logSuccess('Hub criado com sucesso: ' + resp.data.data.nome + ' | ID: ' + resp.data.data.id);
    } catch (err) {
      if (err.response?.status === 409) {
        logWarn('Já existe um hub com esse nome: ' + nome);
      } else {
        logError('Erro ao criar hub: ' + (err.response?.data?.message || err.message));
      }
    }
  }

  // 4. Selecionar cada hub criado para obter accessToken
  for (const hub of hubsCriados) {
    logStep(`4. Selecionando hub criado: ${hub.nome} (ID: ${hub.id})...`);
    try {
      const resp = await axios.post(
        `${API_URL}/auth/select-hub`,
        { hubId: hub.id },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`
          }
        }
      );
      const accessToken = resp.data.data.accessToken;
      logSuccess('Seleção de hub bem-sucedida! AccessToken recebido: ' + (accessToken ? 'Sim' : 'Não'));
    } catch (err) {
      logError('Erro ao selecionar hub: ' + (err.response?.data?.message || err.message));
    }
  }

  // 5. Testar erro de nome duplicado
  logStep('5. Testando criação de hub com nome duplicado...');
  try {
    await axios.post(
      `${API_URL}/hubs`,
      { nome: hubsParaCriar[0] },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${primeiroAccessToken}`
        }
      }
    );
    logError('ERRO: Hub duplicado foi criado, mas não deveria!');
  } catch (err) {
    if (err.response?.status === 409) {
      logSuccess('Erro esperado recebido (nome duplicado): ' + err.response.data.message);
    } else {
      logError('Erro inesperado: ' + (err.response?.data?.message || err.message));
    }
  }

  // 6. Testar seleção de hub com token inválido
  logStep('6. Testando seleção de hub com token inválido...');
  try {
    await axios.post(
      `${API_URL}/auth/select-hub`,
      { hubId: hubsCriados[0]?.id || hubs[0]?.id },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer token_invalido`
        }
      }
    );
    logError('ERRO: Seleção de hub com token inválido não deveria funcionar!');
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      logSuccess('Erro esperado recebido (token inválido): ' + err.response.data.message);
    } else {
      logError('Erro inesperado: ' + (err.response?.data?.message || err.message));
    }
  }

  console.log('\n--- FIM DO TESTE AUTOMATIZADO ---');
}

main(); 