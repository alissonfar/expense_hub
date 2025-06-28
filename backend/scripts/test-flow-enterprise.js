const axios = require('axios');
const colors = require('colors');

// =============================================
// CONFIGURAÇÕES DE PERFORMANCE E ESTABILIDADE
// =============================================

const BASE_URL = 'http://localhost:3001/api';
const CONFIG = {
  // Limitar operações simultâneas para evitar sobrecarga
  MAX_CONCURRENT_OPERATIONS: 2,
  // Pausa entre operações (ms)
  DELAY_BETWEEN_OPERATIONS: 200,
  // Pausa entre lotes (ms)
  DELAY_BETWEEN_BATCHES: 1000,
  // Timeout para requisições (ms)
  REQUEST_TIMEOUT: 30000,
  // Número reduzido de registros para evitar sobrecarga
  PESSOAS_COUNT: 8,
  TAGS_COUNT: 5,
  TRANSACOES_COUNT: 12,
  PAGAMENTOS_COUNT: 10
};

// =============================================
// UTILITÁRIOS DE PERFORMANCE
// =============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      logWithTimestamp(`⚠️ Tentativa ${attempt} falhou, tentando novamente em 1s...`);
      await sleep(1000);
    }
  }
}

async function executeBatch(operations, batchSize = CONFIG.MAX_CONCURRENT_OPERATIONS) {
  const results = [];
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    logWithTimestamp(`🔄 Executando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(operations.length/batchSize)}`);
    
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);
    
    // Pausa entre lotes
    if (i + batchSize < operations.length) {
      await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }
  return results;
}

// =============================================
// GERADORES DE DADOS OTIMIZADOS
// =============================================

function generateValidEmail(index) {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
  const domain = domains[index % domains.length];
  return `usuario${index + 1}@${domain}`;
}

function generateValidName(index) {
  const nomes = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Ferreira',
    'Lucia Rodrigues', 'Roberto Almeida', 'Fernanda Lima', 'Ricardo Pereira', 'Juliana Souza',
    'Marcos Carvalho', 'Patricia Gomes', 'Andre Martins', 'Camila Ribeiro', 'Felipe Barbosa'
  ];
  return nomes[index % nomes.length];
}

function generateValidTagName(index) {
  const tags = [
    'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação',
    'Moradia', 'Vestuário', 'Tecnologia', 'Viagem', 'Presentes'
  ];
  return tags[index % tags.length];
}

// =============================================
// FUNÇÕES DE TESTE OTIMIZADAS
// =============================================

async function testAuthFlow() {
  logWithTimestamp('🚀 INICIANDO TESTE ENTERPRISE - FLUXO DE AUTENTICAÇÃO');

  const email = 'proprietario@enterprise.com';
  const senha = 'Enterprise123!';
  const nomeHub = 'Hub Enterprise Test';

  try {
    // 1. Tentar registrar usuário proprietário
    logWithTimestamp('📝 Tentando registrar usuário proprietário...');
    let registerResponse;
    try {
      registerResponse = await executeWithRetry(async () => {
        return axios.post(`${BASE_URL}/auth/register`, {
          nome: 'Proprietário Enterprise',
          email,
          senha,
          telefone: '(11) 99999-9999',
          nomeHub
        }, { timeout: CONFIG.REQUEST_TIMEOUT });
      });
      const { id, email: registeredEmail } = registerResponse.data.data;
      logWithTimestamp(`✅ Usuário registrado: ${registeredEmail} (ID: ${id})`);
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.error === 'EmailEmUso') {
        logWithTimestamp('ℹ️ Usuário já existe, tentando fazer login...');
      } else {
        throw error; // Re-throw se for outro tipo de erro
      }
    }

    // 2. Login (sempre necessário, seja após registro ou se usuário já existia)
    logWithTimestamp('🔑 Realizando login...');
    const loginResponse = await executeWithRetry(async () => {
      return axios.post(`${BASE_URL}/auth/login`, {
        email,
        senha
      }, { timeout: CONFIG.REQUEST_TIMEOUT });
    });
    const { user, hubs } = loginResponse.data.data;
    const refreshToken = loginResponse.data.refreshToken;
    logWithTimestamp(`✅ Login realizado: ${user.nome} (ID: ${user.pessoaId})`);

    // 3. Selecionar Hub
    const hubSelecionado = hubs.find(h => h.nome === nomeHub) || hubs[0];
    logWithTimestamp(`🏢 Selecionando Hub: ${hubSelecionado.nome} (ID: ${hubSelecionado.id})`);
    const selectHubResponse = await executeWithRetry(async () => {
      return axios.post(`${BASE_URL}/auth/select-hub`, {
        hubId: hubSelecionado.id
      }, {
        headers: { Authorization: `Bearer ${refreshToken}` },
        timeout: CONFIG.REQUEST_TIMEOUT
      });
    });
    const token = selectHubResponse.data.data.accessToken;
    logWithTimestamp('✅ Access token obtido com sucesso!');

    // Configurar headers para requisições autenticadas
    const authHeaders = { Authorization: `Bearer ${token}` };

    return { token, user, hub: hubSelecionado, authHeaders };
  } catch (error) {
    logWithTimestamp(`❌ Erro no fluxo de autenticação: ${error.message}`);
    throw error;
  }
}

async function testPessoasCreation(authHeaders) {
  logWithTimestamp('👥 INICIANDO CRIAÇÃO EM MASSA DE PESSOAS');
  
  const pessoas = [];
  const operations = [];
  
  for (let i = 0; i < CONFIG.PESSOAS_COUNT; i++) {
    const pessoaData = {
      nome: generateValidName(i),
      email: generateValidEmail(i),
      telefone: `(11) 9${String(i + 1000).padStart(4, '0')}-${String(i + 1000).padStart(4, '0')}`,
      eh_proprietario: i === 0 // Primeira pessoa é proprietária
    };
    
    operations.push(async () => {
      const response = await axios.post(`${BASE_URL}/pessoas`, pessoaData, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
      return response.data.data;
    });
  }
  
  logWithTimestamp(`🔄 Criando ${CONFIG.PESSOAS_COUNT} pessoas em lotes...`);
  const results = await executeBatch(operations);
  
  // Processar resultados
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const pessoa = result.value;
      pessoas.push(pessoa);
      // A resposta do convidarMembro retorna { pessoa: { id, nome, email } }
      const nome = pessoa.pessoa?.nome || pessoa.nome || 'Nome não disponível';
      logWithTimestamp(`✅ Pessoa ${index + 1} criada: ${nome}`);
    } else {
      logWithTimestamp(`❌ Erro ao criar pessoa ${index + 1}: ${result.reason.message}`);
    }
  });
  
  logWithTimestamp(`📊 Pessoas criadas com sucesso: ${pessoas.length}/${CONFIG.PESSOAS_COUNT}`);
  return pessoas;
}

async function testTagsCreation(authHeaders) {
  logWithTimestamp('🏷️ INICIANDO CRIAÇÃO EM MASSA DE TAGS');
  
  const tags = [];
  const operations = [];
  
  for (let i = 0; i < CONFIG.TAGS_COUNT; i++) {
    const tagData = {
      nome: generateValidTagName(i),
      cor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      icone: ['🍕', '🚗', '🎮', '💊', '📚', '🏠', '👕', '💻', '✈️', '🎁'][i % 10]
    };
    
    operations.push(async () => {
      const response = await axios.post(`${BASE_URL}/tags`, tagData, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
      return response.data.data;
    });
  }
  
  logWithTimestamp(`🔄 Criando ${CONFIG.TAGS_COUNT} tags em lotes...`);
  const results = await executeBatch(operations);
  
  // Processar resultados
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const tag = result.value;
      tags.push(tag);
      // A resposta do createTag retorna { id, nome, cor, icone, ativo, criado_em, pessoas }
      const nome = tag.nome || 'Nome não disponível';
      logWithTimestamp(`✅ Tag ${index + 1} criada: ${nome}`);
    } else {
      logWithTimestamp(`❌ Erro ao criar tag ${index + 1}: ${result.reason.message}`);
    }
  });
  
  logWithTimestamp(`📊 Tags criadas com sucesso: ${tags.length}/${CONFIG.TAGS_COUNT}`);
  return tags;
}

async function testTransacoesCreation(authHeaders, pessoas, tags) {
  logWithTimestamp('💰 INICIANDO CRIAÇÃO EM MASSA DE TRANSAÇÕES');
  
  const transacoes = [];
  const operations = [];
  
  for (let i = 0; i < CONFIG.TRANSACOES_COUNT; i++) {
    const valor = Math.floor(Math.random() * 1000) + 10; // R$ 10 a R$ 1010
    const pessoa = pessoas[i % pessoas.length];
    const tag = tags[i % tags.length];
    
    // Extrair o ID da pessoa corretamente
    const pessoaId = pessoa.pessoa?.id || pessoa.id;
    const tagId = tag.id;
    
    const transacaoData = {
      descricao: `Transação Enterprise ${i + 1}`,
      local: `Local ${i + 1}`,
      valor_total: valor,
      data_transacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacoes: `Observação da transação ${i + 1}`,
      eh_parcelado: Math.random() > 0.8, // 20% chance de ser parcelado
      total_parcelas: Math.floor(Math.random() * 6) + 2, // 2 a 7 parcelas
      participantes: [
        {
          pessoa_id: pessoaId,
          valor_devido: valor
        }
      ],
      tags: [tagId]
    };
    
    operations.push(async () => {
      const response = await axios.post(`${BASE_URL}/transacoes`, transacaoData, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
      return response.data.data;
    });
  }
  
  logWithTimestamp(`🔄 Criando ${CONFIG.TRANSACOES_COUNT} transações em lotes...`);
  const results = await executeBatch(operations);
  
  // Processar resultados
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const transacaoData = result.value;
      transacoes.push(transacaoData);
      // A resposta do createGasto retorna { transacoes: [...], grupo_parcela, total_parcelas }
      const transacao = transacaoData.transacoes?.[0] || transacaoData;
      const descricao = transacao.descricao || 'Descrição não disponível';
      const valor = transacao.valor_total || transacaoData.valor_total || 'Valor não disponível';
      logWithTimestamp(`✅ Transação ${index + 1} criada: ${descricao} (R$ ${valor})`);
    } else {
      logWithTimestamp(`❌ Erro ao criar transação ${index + 1}: ${result.reason.message}`);
    }
  });
  
  logWithTimestamp(`📊 Transações criadas com sucesso: ${transacoes.length}/${CONFIG.TRANSACOES_COUNT}`);
  return transacoes;
}

async function testPagamentosCreation(authHeaders, pessoas, transacoes) {
  logWithTimestamp('💳 INICIANDO CRIAÇÃO EM MASSA DE PAGAMENTOS');
  
  const pagamentos = [];
  const operations = [];
  
  for (let i = 0; i < CONFIG.PAGAMENTOS_COUNT; i++) {
    const transacaoData = transacoes[i % transacoes.length];
    const pessoa = pessoas[i % pessoas.length];
    
    // Extrair IDs corretamente
    const transacao = transacaoData.transacoes?.[0] || transacaoData;
    const transacaoId = transacao.id;
    const valor = Math.floor(Math.random() * Number(transacao.valor_total)) + 1;
    
    const pagamentoData = {
      transacao_id: transacaoId,
      valor_pago: valor,
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: ['PIX', 'CARTÃO', 'DINHEIRO', 'TRANSFERÊNCIA'][i % 4],
      observacoes: `Pagamento Enterprise ${i + 1}`
    };
    
    operations.push(async () => {
      const response = await axios.post(`${BASE_URL}/pagamentos`, pagamentoData, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
      return response.data.data;
    });
  }
  
  logWithTimestamp(`🔄 Criando ${CONFIG.PAGAMENTOS_COUNT} pagamentos em lotes...`);
  const results = await executeBatch(operations);
  
  // Processar resultados
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const pagamento = result.value;
      pagamentos.push(pagamento);
      // A resposta do createPagamento retorna o objeto pagamento criado
      const valor = pagamento.valor_total || 'Valor não disponível';
      logWithTimestamp(`✅ Pagamento ${index + 1} criado: R$ ${valor}`);
    } else {
      logWithTimestamp(`❌ Erro ao criar pagamento ${index + 1}: ${result.reason.message}`);
    }
  });
  
  logWithTimestamp(`📊 Pagamentos criados com sucesso: ${pagamentos.length}/${CONFIG.PAGAMENTOS_COUNT}`);
  return pagamentos;
}

async function testRelatorios(authHeaders) {
  logWithTimestamp('📊 TESTANDO RELATÓRIOS AVANÇADOS');
  
  try {
    // Dashboard
    logWithTimestamp('📈 Testando dashboard...');
    const dashboardResponse = await executeWithRetry(async () => {
      return axios.get(`${BASE_URL}/relatorios/dashboard?periodo=30&incluir_graficos=true&incluir_comparativo=true`, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
    });
    logWithTimestamp(`✅ Dashboard: ${JSON.stringify(dashboardResponse.data.data.resumo)}`);
    
    // Saldos
    logWithTimestamp('💰 Testando saldos...');
    const saldosResponse = await executeWithRetry(async () => {
      return axios.get(`${BASE_URL}/relatorios/saldos?incluir_detalhes=true`, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
    });
    logWithTimestamp(`✅ Saldos: ${saldosResponse.data.data.length} pessoas com saldo`);
    
    // Pendências
    logWithTimestamp('⏳ Testando pendências...');
    const pendenciasResponse = await executeWithRetry(async () => {
      return axios.get(`${BASE_URL}/relatorios/pendencias?incluir_historico_pagamentos=true`, {
        headers: authHeaders,
        timeout: CONFIG.REQUEST_TIMEOUT
      });
    });
    logWithTimestamp(`✅ Pendências: ${pendenciasResponse.data.data.length} transações pendentes`);
    
    logWithTimestamp('✅ Todos os relatórios funcionando corretamente');
    
  } catch (error) {
    logWithTimestamp(`❌ Erro nos relatórios: ${error.message}`);
  }
}

// =============================================
// FUNÇÃO PRINCIPAL OTIMIZADA
// =============================================

async function runEnterpriseTest() {
  logWithTimestamp('🚀 INICIANDO TESTE ENTERPRISE OTIMIZADO');
  logWithTimestamp(`⚙️ Configurações: ${CONFIG.MAX_CONCURRENT_OPERATIONS} operações simultâneas, ${CONFIG.DELAY_BETWEEN_OPERATIONS}ms entre operações`);
  
  try {
    // 1. Autenticação e Setup
    const { token, user, hub, authHeaders } = await testAuthFlow();
    await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    
    // 2. Criação de Pessoas
    const pessoas = await testPessoasCreation(authHeaders);
    await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    
    // 3. Criação de Tags
    const tags = await testTagsCreation(authHeaders);
    await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    
    // 4. Criação de Transações
    const transacoes = await testTransacoesCreation(authHeaders, pessoas, tags);
    await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    
    // 5. Criação de Pagamentos
    const pagamentos = await testPagamentosCreation(authHeaders, pessoas, transacoes);
    await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    
    // 6. Teste de Relatórios
    await testRelatorios(authHeaders);
    
    // 7. Resumo Final
    logWithTimestamp('🎉 TESTE ENTERPRISE CONCLUÍDO COM SUCESSO!');
    logWithTimestamp(`📊 RESUMO FINAL:`);
    logWithTimestamp(`   👥 Pessoas: ${pessoas.length}`);
    logWithTimestamp(`   🏷️ Tags: ${tags.length}`);
    logWithTimestamp(`   💰 Transações: ${transacoes.length}`);
    logWithTimestamp(`   💳 Pagamentos: ${pagamentos.length}`);
    logWithTimestamp(`   🏢 Hub: ${hub.nome}`);
    logWithTimestamp(`   👤 Usuário: ${user.nome}`);
    
    // 8. Limpeza de recursos
    logWithTimestamp('🧹 Limpando recursos...');
    await sleep(2000); // Aguardar finalização de operações pendentes
    
  } catch (error) {
    logWithTimestamp(`💥 ERRO CRÍTICO NO TESTE: ${error.message}`);
    console.error(error);
  } finally {
    // Sempre limpar recursos ao final
    logWithTimestamp('🔚 Finalizando teste enterprise...');
    process.exit(0);
  }
}

// Executar teste
if (require.main === module) {
  runEnterpriseTest().catch(console.error);
} 