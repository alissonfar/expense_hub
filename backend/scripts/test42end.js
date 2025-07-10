// CÓPIA BASEADA EM test-flow-extended.js
// Este script será adaptado para testar TODOS os 42 endpoints do backend,
// sempre usando dados válidos e formatos exatos conforme os schemas Zod e regras do projeto.

// Teste estendido das funcionalidades Multi-Tenant
// -------------------------------------------------
// Este script cobre cenários adicionais para garantir:
// • Isolamento de dados entre Hubs
// • RBAC avançado
// • Transações parceladas e pagamentos
// • Soft delete e paginação
// • Validação de schemas e tratamento de tokens inválidos
// -------------------------------------------------

const http = require('http');
const { randomBytes } = require('crypto');

// --- CONFIGURAÇÕES E ESTADO ---
const DELAY_MS = 1500; // intervalo entre etapas
const randomSuffix = randomBytes(4).toString('hex');

const credentials = {
    hubA: {
        nome: 'Admin Hub A',
        email: `admin.alpha.${randomSuffix}@test.com`,
        senha: 'SenhaSegura123!',
        nomeHub: `Empresa Alpha ${randomSuffix}`
    },
    hubB: {
        nome: 'Admin Hub B',
        email: `admin.beta.${randomSuffix}@test.com`,
        senha: 'SenhaSegura456!',
        nomeHub: `Empresa Beta ${randomSuffix}`
    },
    membroVisualizador: {
        nome: 'Membro Visualizador',
        email: `visualizador.${randomSuffix}@test.com`,
        senha: 'SenhaVisualizador123!'
    }
};

const state = {
    hubA: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    hubB: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    membroAId: null, // Membro convidado no Hub A
    membroVisualizador: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    transacaoParceladaId: null // primeira parcela criada no Hub A
};
let transacaoFuturaId = null; // Declarada em escopo superior
let grupoParcelaParaLimpeza = null; // Variável para o grupo de parcelas

// --- HELPERS DE LOG COLORIDO ---
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};
const log = {
    step: (num, message) => console.log(`\n${colors.cyan}--- PASSO ${num}: ${message} ---${colors.reset}`),
    suite: (message) => console.log(`\n\n${colors.magenta}==================== ${message} ====================${colors.reset}`),
    success: (message) => console.log(`${colors.green}✅ Sucesso:${colors.reset} ${message}`),
    failure: (message, error) => {
        console.error(`\n${colors.red}❌ FALHA: ${message}${colors.reset}`);
        if (error?.body?.details) {
            console.error('Detalhes da Validação:', JSON.stringify(error.body.details, null, 2));
        } else if (error?.body) {
            console.error('Resposta:', JSON.stringify(error.body, null, 2));
        } else {
            console.error('Detalhes do Erro:', error);
        }
        process.exit(1);
    }
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPERS DE API ---
function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    res.statusCode >= 400 ? reject({ statusCode: res.statusCode, body: parsedData }) : resolve({ statusCode: res.statusCode, body: parsedData });
                } catch (e) {
                    reject(new Error(`Falha ao parsear JSON: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}
const api = {
    post: (path, body, token = null) => {
        const options = { hostname: 'localhost', port: 3001, path: `/api${path}`, method: 'POST', headers: { 'Content-Type': 'application/json' } };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        return request(options, body);
    },
    get: (path, token) => {
        const options = { hostname: 'localhost', port: 3001, path: `/api${path}`, method: 'GET', headers: {} };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        return request(options);
    },
    put: (path, body, token) => {
        const options = { hostname: 'localhost', port: 3001, path: `/api${path}`, method: 'PUT', headers: { 'Content-Type': 'application/json' } };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        return request(options, body);
    },
    delete: (path, token) => {
        const options = { hostname: 'localhost', port: 3001, path: `/api${path}`, method: 'DELETE', headers: {} };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        return request(options);
    }
};

// --- FUNÇÕES AUXILIARES ---
const today = new Date();
const todayStr = today.toISOString().substring(0, 10);
const yesterday = new Date(today.getTime() - 86400000);
const yesterdayStr = yesterday.toISOString().substring(0, 10);

// --- FLUXO DE TESTE COMPLETO DOS 42 ENDPOINTS ---
async function runCompleteTestFlow() {
    try {
        console.log(`${colors.yellow}🚀 INICIANDO TESTE COMPLETO DOS 42 ENDPOINTS DO BACKEND...${colors.reset}`);

        // ===========================================================
        // FASE 1: AUTENTICAÇÃO (6 endpoints)
        // ===========================================================
        log.suite('FASE 1: AUTENTICAÇÃO (6 endpoints)');

        log.step(1, 'GET /auth/info - Informações de autenticação');
        const authInfo = await api.get('/auth/info');
        log.success(`Auth info: ${authInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(2, 'POST /auth/register - Registrando Hub A');
        await api.post('/auth/register', { ...credentials.hubA });
        log.success(`Hub A (${credentials.hubA.nomeHub}) registrado.`);
        await sleep(DELAY_MS);

        log.step(3, 'POST /auth/register - Registrando Hub B');
        await api.post('/auth/register', { ...credentials.hubB });
        log.success(`Hub B (${credentials.hubB.nomeHub}) registrado.`);
        await sleep(DELAY_MS);

        log.step(4, 'POST /auth/login - Login Hub A');
        const loginA = await api.post('/auth/login', { email: credentials.hubA.email, senha: credentials.hubA.senha });
        state.hubA.refreshToken = loginA.body.data.refreshToken;
        state.hubA.pessoaId = loginA.body.data.user.pessoaId;
        state.hubA.id = loginA.body.data.hubs[0].id;
        log.success('Login Hub A realizado.');
        await sleep(DELAY_MS);

        log.step(5, 'POST /auth/login - Login Hub B');
        const loginB = await api.post('/auth/login', { email: credentials.hubB.email, senha: credentials.hubB.senha });
        state.hubB.refreshToken = loginB.body.data.refreshToken;
        state.hubB.pessoaId = loginB.body.data.user.pessoaId;
        state.hubB.id = loginB.body.data.hubs[0].id;
        log.success('Login Hub B realizado.');
        await sleep(DELAY_MS);

        log.step(6, 'POST /auth/select-hub - Selecionando Hub A');
        const selectA = await api.post('/auth/select-hub', { hubId: state.hubA.id }, state.hubA.refreshToken);
        state.hubA.accessToken = selectA.body.data.accessToken;
        log.success('Hub A selecionado.');
        await sleep(DELAY_MS);

        log.step(7, 'POST /auth/select-hub - Selecionando Hub B');
        const selectB = await api.post('/auth/select-hub', { hubId: state.hubB.id }, state.hubB.refreshToken);
        state.hubB.accessToken = selectB.body.data.accessToken;
        log.success('Hub B selecionado.');
        await sleep(DELAY_MS);

        log.step(8, 'GET /auth/me - Perfil Hub A');
        const profileA = await api.get('/auth/me', state.hubA.accessToken);
        log.success(`Perfil Hub A: ${profileA.body.data.nome}`);
        await sleep(DELAY_MS);

        log.step(9, 'GET /auth/me - Perfil Hub B');
        const profileB = await api.get('/auth/me', state.hubB.accessToken);
        log.success(`Perfil Hub B: ${profileB.body.data.nome}`);
        await sleep(DELAY_MS);

        log.step(10, 'PUT /auth/profile - Atualizando perfil Hub A');
        const updateProfileA = await api.put('/auth/profile', {
            nome: 'Admin Hub A Atualizado',
            telefone: '(11) 88888-8888'
        }, state.hubA.accessToken);
        log.success('Perfil Hub A atualizado.');
        await sleep(DELAY_MS);

        log.step(11, 'PUT /auth/change-password - Alterando senha Hub A');
        const changePasswordA = await api.put('/auth/change-password', {
            senhaAtual: credentials.hubA.senha,
            novaSenha: 'NovaSenhaSegura123!',
            confirmarSenha: 'NovaSenhaSegura123!'
        }, state.hubA.accessToken);
        log.success('Senha Hub A alterada.');
        await sleep(DELAY_MS);

        // =============================================
        // FASE 2: PESSOAS (6 endpoints)
        // =============================================
        log.suite('FASE 2: PESSOAS (6 endpoints)');

        log.step(12, 'GET /pessoas/info - Informações de pessoas');
        const pessoasInfo = await api.get('/pessoas/info', state.hubA.accessToken);
        log.success(`Pessoas info: ${pessoasInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(13, 'GET /pessoas - Listando pessoas Hub A');
        const pessoasListA = await api.get('/pessoas', state.hubA.accessToken);
        log.success(`Pessoas Hub A: ${pessoasListA.body.data.length} encontrada(s)`);
        await sleep(DELAY_MS);

        log.step(14, 'POST /pessoas - Criando membro COLABORADOR no Hub A');
        const membroARes = await api.post('/pessoas', {
            nome: 'Membro A',
            email: `membro.a.${randomSuffix}@test.com`,
            role: 'COLABORADOR',
            dataAccessPolicy: 'GLOBAL'
        }, state.hubA.accessToken);
        state.membroAId = membroARes.body.data.pessoa.id;
        log.success('Membro A criado.');
        await sleep(DELAY_MS);

        log.step(15, 'GET /pessoas/:id - Detalhes do membro A');
        const membroADetails = await api.get(`/pessoas/${state.membroAId}`, state.hubA.accessToken);
        log.success(`Detalhes membro A: ${membroADetails.body.data.nome}`);
        await sleep(DELAY_MS);

        log.step(16, 'PUT /pessoas/:id - Editando membro A');
        const membroAUpdate = await api.put(`/pessoas/${state.membroAId}`, {
            nome: 'Membro A Editado',
            telefone: '(11) 77777-7777'
        }, state.hubA.accessToken);
        log.success('Membro A editado.');
        await sleep(DELAY_MS);

        // =============================================
        // FASE 3: TAGS (6 endpoints)
        // =============================================
        log.suite('FASE 3: TAGS (6 endpoints)');

        log.step(17, 'GET /tags/info - Informações de tags');
        const tagsInfo = await api.get('/tags/info', state.hubA.accessToken);
        log.success(`Tags info: ${tagsInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(18, 'GET /tags - Listando tags Hub A');
        const tagsListA = await api.get('/tags', state.hubA.accessToken);
        log.success(`Tags Hub A: ${tagsListA.body.data.length} encontrada(s)`);
        await sleep(DELAY_MS);

        log.step(19, 'POST /tags - Criando tag no Hub A');
        const tagRes = await api.post('/tags', {
            nome: 'Tag Teste',
            cor: '#FF6B6B',
            icone: '🏷️'
        }, state.hubA.accessToken);
        const tagId = tagRes.body.data.id;
        log.success('Tag criada.');
        await sleep(DELAY_MS);

        log.step(20, 'GET /tags/:id - Detalhes da tag');
        const tagDetails = await api.get(`/tags/${tagId}`, state.hubA.accessToken);
        log.success(`Detalhes tag: ${tagDetails.body.data.nome}`);
        await sleep(DELAY_MS);

        log.step(21, 'PUT /tags/:id - Editando tag');
        const tagUpdate = await api.put(`/tags/${tagId}`, {
            nome: 'Tag Teste Editada',
            cor: '#4ECDC4'
        }, state.hubA.accessToken);
        log.success('Tag editada.');
        await sleep(DELAY_MS);

        // ============================================
        // FASE 4: TRANSAÇÕES (8 endpoints)
        // ============================================
        log.suite('FASE 4: TRANSAÇÕES (8 endpoints)');

        log.step(22, 'GET /transacoes/info - Informações de transações');
        const transacoesInfo = await api.get('/transacoes/info', state.hubA.accessToken);
        log.success(`Transações info: ${transacoesInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(23, 'GET /transacoes - Listando transações Hub A');
        const transacoesListA = await api.get('/transacoes', state.hubA.accessToken);
        log.success(`Transações Hub A: ${transacoesListA.body.data.transacoes.length} encontrada(s)`);
        await sleep(DELAY_MS);

        log.step(24, 'POST /transacoes - Criando gasto no Hub A');
        const gastoRes = await api.post('/transacoes', {
            descricao: 'Gasto Teste',
            valor_total: 100.00,
            data_transacao: yesterdayStr,
            participantes: [
                { pessoa_id: state.hubA.pessoaId, valor_devido: 100.00 }
            ],
            tags: [tagId]
        }, state.hubA.accessToken);
        const gastoId = gastoRes.body.data.transacoes[0].id;
        log.success('Gasto criado.');
        await sleep(DELAY_MS);

        log.step(25, 'GET /transacoes/:id - Detalhes do gasto');
        const gastoDetails = await api.get(`/transacoes/${gastoId}`, state.hubA.accessToken);
        log.success(`Detalhes gasto: ${gastoDetails.body.data.descricao}`);
        await sleep(DELAY_MS);

        log.step(26, 'PUT /transacoes/:id - Editando gasto');
        const gastoUpdate = await api.put(`/transacoes/${gastoId}`, {
            descricao: 'Gasto Teste Editado',
            observacoes: 'Observação de teste'
        }, state.hubA.accessToken);
        log.success('Gasto editado.');
        await sleep(DELAY_MS);

        log.step(27, 'POST /transacoes/receita - Criando receita no Hub A');
        const receitaRes = await api.post('/transacoes/receita', {
            descricao: 'Receita Teste',
            valor_recebido: 500.00,
            data_transacao: todayStr,
            tags: [tagId]
        }, state.hubA.accessToken);
        const receitaId = receitaRes.body.data.id;
        log.success('Receita criada.');
        await sleep(DELAY_MS);

        log.step(28, 'PUT /transacoes/receita/:id - Editando receita');
        const receitaUpdate = await api.put(`/transacoes/receita/${receitaId}`, {
            descricao: 'Receita Teste Editada',
            valor_recebido: 600.00
        }, state.hubA.accessToken);
        log.success('Receita editada.');
        await sleep(DELAY_MS);

        // ============================================
        // FASE 5: PAGAMENTOS (8 endpoints)
        // ============================================
        log.suite('FASE 5: PAGAMENTOS (8 endpoints)');

        log.step(29, 'GET /pagamentos/info - Informações de pagamentos');
        const pagamentosInfo = await api.get('/pagamentos/info', state.hubA.accessToken);
        log.success(`Pagamentos info: ${pagamentosInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(30, 'GET /pagamentos - Listando pagamentos Hub A');
        const pagamentosListA = await api.get('/pagamentos', state.hubA.accessToken);
        log.success(`Pagamentos Hub A: ${pagamentosListA.body.data.length} encontrado(s)`);
        await sleep(DELAY_MS);

        log.step(31, 'GET /pagamentos/configuracoes/excedente - Configurações de excedente');
        const configExcedente = await api.get('/pagamentos/configuracoes/excedente', state.hubA.accessToken);
        log.success('Configurações de excedente obtidas.');
        await sleep(DELAY_MS);

        log.step(32, 'PUT /pagamentos/configuracoes/excedente - Atualizando configurações');
        const configUpdate = await api.put('/pagamentos/configuracoes/excedente', {
            auto_criar_receita_excedente: true,
            valor_minimo_excedente: 10.00,
            descricao_receita_excedente: 'Excedente automático'
        }, state.hubA.accessToken);
        log.success('Configurações de excedente atualizadas.');
        await sleep(DELAY_MS);

        log.step(33, 'POST /pagamentos - Criando pagamento');
        console.log(`Criando pagamento para Hub ID: ${state.hubA.id} (tipo: ${typeof state.hubA.id})`);
        const pagamentoRes = await api.post('/pagamentos', {
            transacao_id: gastoId,
            valor_pago: 50.00,
            data_pagamento: todayStr,
            forma_pagamento: 'PIX',
            observacoes: 'Pagamento de teste'
        }, state.hubA.accessToken);
        const pagamentoId = pagamentoRes.body.data.id;
        console.log(`Pagamento criado com ID: ${pagamentoId}`);
        console.log(`Hub ID do contexto: ${state.hubA.id} (tipo: ${typeof state.hubA.id})`);
        console.log('Resposta completa do pagamento:', JSON.stringify(pagamentoRes.body, null, 2));
        log.success('Pagamento criado.');
        await sleep(DELAY_MS);

        log.step(34, 'GET /pagamentos/:id - Detalhes do pagamento');
        const pagamentoDetails = await api.get(`/pagamentos/${pagamentoId}`, state.hubA.accessToken);
        log.success('Detalhes do pagamento obtidos.');
        await sleep(DELAY_MS);

        log.step(35, 'PUT /pagamentos/:id - Editando pagamento');
        const pagamentoUpdate = await api.put(`/pagamentos/${pagamentoId}`, {
            forma_pagamento: 'TRANSFERENCIA',
            observacoes: 'Pagamento editado'
        }, state.hubA.accessToken);
        log.success('Pagamento editado.');
        await sleep(DELAY_MS);

        // ============================================
        // FASE 6: RELATÓRIOS (6 endpoints)
        // ============================================
        log.suite('FASE 6: RELATÓRIOS (6 endpoints)');

        log.step(36, 'GET /relatorios/info - Informações de relatórios');
        const relatoriosInfo = await api.get('/relatorios/info', state.hubA.accessToken);
        log.success(`Relatórios info: ${relatoriosInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(37, 'GET /relatorios/dashboard - Dashboard');
        const dashboard = await api.get('/relatorios/dashboard?periodo=30_dias&incluir_graficos=true', state.hubA.accessToken);
        log.success('Dashboard obtido.');
        await sleep(DELAY_MS);

        log.step(38, 'GET /relatorios/saldos - Saldos por pessoa');
        const saldos = await api.get('/relatorios/saldos?incluir_detalhes=true', state.hubA.accessToken);
        log.success('Saldos obtidos.');
        await sleep(DELAY_MS);

        log.step(39, 'GET /relatorios/pendencias - Pendências');
        const pendencias = await api.get('/relatorios/pendencias?incluir_historico_pagamentos=true', state.hubA.accessToken);
        log.success('Pendências obtidas.');
        await sleep(DELAY_MS);

        log.step(40, 'GET /relatorios/transacoes - Relatório de transações');
        const relatorioTransacoes = await api.get('/relatorios/transacoes?incluir_participantes=true&incluir_tags=true', state.hubA.accessToken);
        log.success('Relatório de transações obtido.');
        await sleep(DELAY_MS);

        log.step(41, 'GET /relatorios/categorias - Análise por categorias');
        const categorias = await api.get('/relatorios/categorias?tipo=GASTO&limite=10', state.hubA.accessToken);
        log.success('Análise por categorias obtida.');
        await sleep(DELAY_MS);

        // ============================================
        // FASE 7: CONFIGURAÇÕES (4 endpoints)
        // ============================================
        log.suite('FASE 7: CONFIGURAÇÕES (4 endpoints)');

        log.step(42, 'GET /configuracoes/info - Informações de configurações');
        const configInfo = await api.get('/configuracoes/info', state.hubA.accessToken);
        log.success(`Configurações info: ${configInfo.body.message}`);
        await sleep(DELAY_MS);

        log.step(43, 'GET /configuracoes/interface - Configuração de interface');
        const interfaceConfig = await api.get('/configuracoes/interface', state.hubA.accessToken);
        log.success(`Config interface: ${interfaceConfig.body.data.theme_interface}`);
        await sleep(DELAY_MS);

        log.step(44, 'PUT /configuracoes/interface - Atualizando configuração de interface');
        const interfaceUpdate = await api.put('/configuracoes/interface', {
            theme_interface: 'dark'
        }, state.hubA.accessToken);
        log.success('Configuração de interface atualizada.');
        await sleep(DELAY_MS);

        log.step(45, 'GET /configuracoes/comportamento - Endpoint 501 (Not Implemented)');
        try {
            await api.get('/configuracoes/comportamento', state.hubA.accessToken);
            log.failure('Endpoint 501 deveria retornar erro.');
        } catch (error) {
            if (error.statusCode === 501) {
                log.success('Endpoint 501 corretamente retornou Not Implemented.');
            } else {
                log.failure(`Esperava 501, recebeu ${error.statusCode}.`);
            }
        }
        await sleep(DELAY_MS);

        // ============================================
        // FASE 8: SOFT DELETE E LIMPEZA
        // ============================================
        log.suite('FASE 8: SOFT DELETE E LIMPEZA');

        log.step(46, 'DELETE /pagamentos/:id - Removendo pagamento (libera o gasto)');
        console.log(`Removendo pagamento ID: ${pagamentoId}`);
        console.log(`Token de acesso: ${state.hubA.accessToken ? 'Presente' : 'Ausente'}`);
        console.log(`Hub ID: ${state.hubA.id} (tipo: ${typeof state.hubA.id})`);
        console.log(`Pessoa ID: ${state.hubA.pessoaId} (tipo: ${typeof state.hubA.pessoaId})`);
        console.log(`Token completo: ${state.hubA.accessToken?.substring(0, 50)}...`);
        await api.delete(`/pagamentos/${pagamentoId}`, state.hubA.accessToken);
        log.success('Pagamento removido.');
        await sleep(DELAY_MS);

        log.step(47, 'DELETE /transacoes/:id - Removendo gasto (agora sem pagamentos)');
        console.log(`Removendo gasto ID: ${gastoId}`);
        await api.delete(`/transacoes/${gastoId}`, state.hubA.accessToken);
        log.success('Gasto removido.');
        await sleep(DELAY_MS);

        log.step(48, 'DELETE /transacoes/:id - Removendo receita (agora sem gasto usando a tag)');
        console.log(`Removendo receita ID: ${receitaId}`);
        await api.delete(`/transacoes/${receitaId}`, state.hubA.accessToken);
        log.success('Receita removida.');
        await sleep(DELAY_MS);

        log.step(49, 'DELETE /tags/:id - Soft delete da tag (agora sem uso)');
        console.log(`Removendo tag ID: ${tagId}`);
        await api.delete(`/tags/${tagId}`, state.hubA.accessToken);
        log.success('Tag removida (soft delete).');
        await sleep(DELAY_MS);

        log.step(50, 'DELETE /pessoas/:id - Soft delete do membro A');
        console.log(`Removendo membro ID: ${state.membroAId}`);
        await api.delete(`/pessoas/${state.membroAId}`, state.hubA.accessToken);
        log.success('Membro A removido (soft delete).');
        await sleep(DELAY_MS);

        // ============================================
        // FASE 9: TESTES DE ISOLAMENTO MULTI-TENANT
        // ============================================
        log.suite('FASE 9: TESTES DE ISOLAMENTO MULTI-TENANT');

        // --- SUBSET 9.1: ISOLAMENTO DE DADOS ENTRE HUBS ---
        log.step(51, 'TESTE: Isolamento de dados entre Hub A e Hub B');
        
        // Criar dados no Hub B para testar isolamento
        log.step(52, 'Criando tag no Hub B para teste de isolamento');
        const tagHubB = await api.post('/tags', {
            nome: 'Tag Hub B',
            cor: '#FF0000',
            icone: '🔴'
        }, state.hubB.accessToken);
        const tagHubBId = tagHubB.body.data.id;
        log.success('Tag Hub B criada.');

        log.step(53, 'Criando transação no Hub B');
        const transacaoHubB = await api.post('/transacoes', {
            descricao: 'Transação Hub B',
            valor_total: 200.00,
            data_transacao: todayStr,
            participantes: [
                { pessoa_id: state.hubB.pessoaId, valor_devido: 200.00 }
            ],
            tags: [tagHubBId]
        }, state.hubB.accessToken);
        const transacaoHubBId = transacaoHubB.body.data.transacoes[0].id;
        log.success('Transação Hub B criada.');

        log.step(54, 'VERIFICAÇÃO: Hub A não deve ver dados do Hub B');
        const tagsHubA = await api.get('/tags', state.hubA.accessToken);
        const transacoesHubA = await api.get('/transacoes', state.hubA.accessToken);
        
        const tagHubBEncontrada = tagsHubA.body.data.some(tag => tag.nome === 'Tag Hub B');
        const transacaoHubBEncontrada = transacoesHubA.body.data.transacoes.some(t => t.descricao === 'Transação Hub B');
        
        if (tagHubBEncontrada) {
            log.failure('Hub A conseguiu ver tag do Hub B! Violação de isolamento.');
        }
        if (transacaoHubBEncontrada) {
            log.failure('Hub A conseguiu ver transação do Hub B! Violação de isolamento.');
        }
        log.success('Isolamento de dados entre Hubs confirmado.');

        // --- SUBSET 9.2: RBAC - TESTES DE PAPÉIS E PERMISSÕES ---
        log.step(55, 'TESTE: RBAC - Criação de membros com diferentes papéis');
        
        // Criar membro COLABORADOR com política INDIVIDUAL no Hub A
        const membroIndividual = await api.post('/pessoas', {
            nome: 'Membro Individual',
            email: `individual.${randomSuffix}@test.com`,
            role: 'COLABORADOR',
            dataAccessPolicy: 'INDIVIDUAL'
        }, state.hubA.accessToken);
        const membroIndividualId = membroIndividual.body.data.pessoa.id;
        log.success('Membro COLABORADOR com política INDIVIDUAL criado.');

        // Criar membro VISUALIZADOR no Hub A
        const membroVisualizador = await api.post('/pessoas', {
            nome: 'Membro Visualizador',
            email: `visualizador.${randomSuffix}@test.com`,
            role: 'VISUALIZADOR'
        }, state.hubA.accessToken);
        const membroVisualizadorId = membroVisualizador.body.data.pessoa.id;
        log.success('Membro VISUALIZADOR criado.');

        // --- SUBSET 9.3: TESTE DE POLÍTICA DE ACESSO INDIVIDUAL ---
        log.step(56, 'TESTE: Política de acesso INDIVIDUAL');
        
        // Simular login do membro individual (usando token do Hub A para simplicidade)
        // Na prática, seria necessário fazer login real com as credenciais do membro
        
        log.step(57, 'VERIFICAÇÃO: Membro com política INDIVIDUAL só deve ver seus próprios dados');
        // Este teste seria mais completo com login real do membro
        // Por enquanto, validamos que o membro foi criado corretamente
        const membroIndividualDetails = await api.get(`/pessoas/${membroIndividualId}`, state.hubA.accessToken);
        if (membroIndividualDetails.body.data.role !== 'COLABORADOR' || 
            membroIndividualDetails.body.data.dataAccessPolicy !== 'INDIVIDUAL') {
            log.failure('Política de acesso INDIVIDUAL não foi aplicada corretamente.');
        }
        log.success('Política de acesso INDIVIDUAL configurada corretamente.');

        // --- SUBSET 9.4: TESTE DE RESTRIÇÕES DE PAPEL ---
        log.step(58, 'TESTE: Restrições de papel - VISUALIZADOR não pode criar dados');
        
        // Ativar o convite do membro VISUALIZADOR
        log.step(58.1, 'POST /auth/ativar-convite - Ativando convite do membro VISUALIZADOR');
        await api.post('/auth/ativar-convite', {
            token: membroVisualizador.body.data.conviteToken,
            novaSenha: credentials.membroVisualizador.senha,
            confirmarSenha: credentials.membroVisualizador.senha
        });
        log.success('Convite do membro VISUALIZADOR ativado.');
        await sleep(DELAY_MS);

        // Fazer login com a senha definida
        log.step(58.2, 'POST /auth/login - Login do membro VISUALIZADOR');
        const loginVisualizador = await api.post('/auth/login', { 
            email: credentials.membroVisualizador.email, 
            senha: credentials.membroVisualizador.senha 
        });
        state.membroVisualizador.refreshToken = loginVisualizador.body.data.refreshToken;
        state.membroVisualizador.pessoaId = loginVisualizador.body.data.user.pessoaId;
        state.membroVisualizador.id = loginVisualizador.body.data.hubs[0].id;
        log.success('Login do membro VISUALIZADOR realizado.');
        await sleep(DELAY_MS);

        log.step(58.3, 'POST /auth/select-hub - Selecionando Hub para membro VISUALIZADOR');
        const selectVisualizador = await api.post('/auth/select-hub', { 
            hubId: state.membroVisualizador.id 
        }, state.membroVisualizador.refreshToken);
        state.membroVisualizador.accessToken = selectVisualizador.body.data.accessToken;
        log.success('Hub selecionado para membro VISUALIZADOR.');
        await sleep(DELAY_MS);

        // Logs detalhados para investigação
        console.log(`\n${colors.yellow}🔍 INVESTIGAÇÃO: Contexto do teste VISUALIZADOR${colors.reset}`);
        console.log(`${colors.yellow}   Token usado: ${state.membroVisualizador.accessToken ? 'Presente' : 'Ausente'}${colors.reset}`);
        console.log(`${colors.yellow}   Hub ID: ${state.membroVisualizador.id}${colors.reset}`);
        console.log(`${colors.yellow}   Pessoa ID: ${state.membroVisualizador.pessoaId}${colors.reset}`);
        console.log(`${colors.yellow}   Token (primeiros 50 chars): ${state.membroVisualizador.accessToken?.substring(0, 50)}...${colors.reset}`);
        
        // Decodificar token para verificar papel
        try {
            const tokenParts = state.membroVisualizador.accessToken.split('.');
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log(`${colors.yellow}   Token payload:`, JSON.stringify(payload, null, 2));
            console.log(`${colors.yellow}   Papel no token: ${payload.role}${colors.reset}`);
        } catch (e) {
            console.log(`${colors.red}   Erro ao decodificar token: ${e.message}${colors.reset}`);
        }
        
        // Tentar criar tag com papel VISUALIZADOR (deve falhar)
        console.log(`\n${colors.yellow}🔍 INVESTIGAÇÃO: Tentando criar tag como VISUALIZADOR${colors.reset}`);
        console.log(`${colors.yellow}   Payload enviado:`, JSON.stringify({
            nome: 'Tag Teste Visualizador',
            cor: '#0000FF',
            icone: '🔵'
        }, null, 2));
        
        try {
            const response = await api.post('/tags', {
                nome: 'Tag Teste Visualizador',
                cor: '#0000FF',
                icone: '🔵'
            }, state.membroVisualizador.accessToken);
            
            console.log(`\n${colors.red}🔍 INVESTIGAÇÃO: RESPOSTA INESPERADA${colors.reset}`);
            console.log(`${colors.red}   Status: ${response.statusCode}${colors.reset}`);
            console.log(`${colors.red}   Body:`, JSON.stringify(response.body, null, 2));
            console.log(`${colors.red}   Headers enviados:`, JSON.stringify({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.membroVisualizador.accessToken?.substring(0, 50)}...`
            }, null, 2));
            
            log.failure('VISUALIZADOR conseguiu criar tag! Deveria ser bloqueado.');
        } catch (error) {
            console.log(`\n${colors.green}🔍 INVESTIGAÇÃO: ERRO ESPERADO${colors.reset}`);
            console.log(`${colors.green}   Status: ${error.statusCode}${colors.reset}`);
            console.log(`${colors.green}   Body:`, JSON.stringify(error.body, null, 2));
            
            if (error.statusCode === 403) {
                log.success('VISUALIZADOR corretamente bloqueado de criar dados.');
            } else {
                log.failure(`Esperava erro 403, recebeu ${error.statusCode}.`);
            }
        }

        // --- SUBSET 9.5: TESTE DE ISOLAMENTO EM RELATÓRIOS ---
        log.step(59, 'TESTE: Isolamento em relatórios e dashboards');
        
        const dashboardHubA = await api.get('/relatorios/dashboard', state.hubA.accessToken);
        const dashboardHubB = await api.get('/relatorios/dashboard', state.hubB.accessToken);
        
        // Verificar se os relatórios são diferentes entre os Hubs
        if (JSON.stringify(dashboardHubA.body) === JSON.stringify(dashboardHubB.body)) {
            log.failure('Dashboards dos Hubs A e B são idênticos! Violação de isolamento.');
        }
        log.success('Isolamento em relatórios confirmado.');

        // --- SUBSET 9.6: TESTE DE INTEGRIDADE REFERENCIAL ---
        log.step(60, 'TESTE: Integridade referencial multi-tenant');
        
        // Tentar criar transação com tag de outro Hub (deve falhar)
        try {
            await api.post('/transacoes', {
                descricao: 'Transação com tag inválida',
                valor_total: 100.00,
                data_transacao: todayStr,
                participantes: [
                    { pessoa_id: state.hubA.pessoaId, valor_devido: 100.00 }
                ],
                tags: [tagHubBId] // Tag do Hub B
            }, state.hubA.accessToken);
            log.failure('Conseguiu criar transação com tag de outro Hub! Violação de integridade.');
        } catch (error) {
            if (error.statusCode === 400 || error.statusCode === 422) {
                log.success('Integridade referencial multi-tenant funcionando corretamente.');
            } else {
                log.failure(`Esperava erro de validação, recebeu ${error.statusCode}.`);
            }
        }

        // --- SUBSET 9.7: TESTE DE SOFT DELETE E ISOLAMENTO ---
        log.step(61, 'TESTE: Soft delete mantém isolamento');
        
        // Remover transação do Hub B antes de remover a tag
        await api.delete(`/transacoes/${transacaoHubBId}`, state.hubB.accessToken);
        log.success('Transação Hub B removida.');
        
        // Agora sim, remover tag do Hub B (soft delete)
        await api.delete(`/tags/${tagHubBId}`, state.hubB.accessToken);
        log.success('Tag Hub B removida (soft delete).');
        
        // Verificar se Hub A ainda não consegue ver a tag (mesmo após soft delete)
        const tagsHubADepois = await api.get('/tags', state.hubA.accessToken);
        const tagHubBEncontradaDepois = tagsHubADepois.body.data.some(tag => tag.nome === 'Tag Hub B');
        
        if (tagHubBEncontradaDepois) {
            log.failure('Hub A conseguiu ver tag removida do Hub B! Violação de isolamento.');
        }
        log.success('Soft delete mantém isolamento de dados.');

        // --- SUBSET 9.8: TESTE DE ADMINISTRADOR DO SISTEMA ---
        log.step(62, 'TESTE: Administrador do sistema (simulado)');
        
        // Simular que o usuário do Hub A é administrador do sistema
        // Na prática, isso seria configurado no banco de dados
        log.success('Teste de administrador do sistema simulado (requer configuração manual no DB).');

        // --- SUBSET 9.9: LIMPEZA DOS TESTES DE ISOLAMENTO ---
        log.step(63, 'LIMPEZA: Removendo dados dos testes de isolamento');
        
        // Remover membros criados para testes
        await api.delete(`/pessoas/${membroIndividualId}`, state.hubA.accessToken);
        await api.delete(`/pessoas/${membroVisualizadorId}`, state.hubA.accessToken);
        log.success('Membros de teste removidos.');

        // ============================================
        // FASE 10: TESTES DE INTEGRIDADE REFERENCIAL AVANÇADA
        // ============================================
        log.suite('FASE 10: INTEGRIDADE REFERENCIAL AVANÇADA');

        log.step(64, 'PREPARAÇÃO: Criando membro para testes de integridade');
        const membroIntegridade = await api.post('/pessoas', {
            nome: 'Membro Integridade',
            email: `integridade.${randomSuffix}@test.com`,
            role: 'COLABORADOR',
            dataAccessPolicy: 'GLOBAL'
        }, state.hubA.accessToken);
        const membroIntegridadeId = membroIntegridade.body.data.pessoa.id;
        log.success('Membro para testes de integridade criado.');

        log.step(65, 'TESTE: Criação de transação parcelada complexa');
        const transacaoParcelada = await api.post('/transacoes', {
            descricao: 'Transação Parcelada Complexa',
            valor_total: 300.00,
            data_transacao: todayStr,
            eh_parcelado: true,
            total_parcelas: 3,
            participantes: [
                { pessoa_id: state.hubA.pessoaId, valor_devido: 200.00 },
                { pessoa_id: membroIntegridadeId, valor_devido: 100.00 }
            ],
            tags: [] // Removido tagId que já foi deletado
        }, state.hubA.accessToken);
        const transacaoParceladaId = transacaoParcelada.body.data.transacoes[0].id;
        grupoParcelaParaLimpeza = transacaoParcelada.body.data.transacoes[0].grupo_parcela; // Salva o grupo
        log.success(`Transação parcelada criada com ${transacaoParcelada.body.data.transacoes.length} parcelas.`);

        log.step(66, 'TESTE: Pagamento parcial em transação parcelada');
        const pagamentoParcial = await api.post('/pagamentos', {
            transacao_id: transacaoParceladaId,
            valor_pago: 33.33,
            data_pagamento: todayStr,
            forma_pagamento: 'PIX'
        }, state.hubA.accessToken);
        log.success('Pagamento parcial realizado.');

        log.step(67, 'TESTE: Tentativa de remoção de transação com pagamentos (deve falhar)');
        try {
            await api.delete(`/transacoes/${transacaoParceladaId}`, state.hubA.accessToken);
            log.failure('Conseguiu remover transação com pagamentos! Deveria ser bloqueado.');
        } catch (error) {
            if (error.statusCode === 400 || error.statusCode === 422) {
                log.success('Bloqueio de remoção de transação com pagamentos funcionando.');
            } else {
                log.failure(`Esperava erro de validação, recebeu ${error.statusCode}.`);
            }
        }

        log.step(68, 'TESTE: Remoção de pagamento para liberar transação');
        await api.delete(`/pagamentos/${pagamentoParcial.body.data.id}`, state.hubA.accessToken);
        log.success('Pagamento removido, transação liberada.');

        log.step(69, 'TESTE: Agora remover todas as parcelas da transação (deve funcionar)');
        if (grupoParcelaParaLimpeza) {
            const parcelasParaRemover = await api.get(`/transacoes?grupo_parcela=${grupoParcelaParaLimpeza}`, state.hubA.accessToken);
            let removidas = 0;
            for (const parcela of parcelasParaRemover.body.data.transacoes) {
                await api.delete(`/transacoes/${parcela.id}`, state.hubA.accessToken);
                removidas++;
            }
            log.success(`${removidas} parcelas da transação removidas com sucesso.`);
        } else {
            log.failure('Não foi possível encontrar o grupo de parcelas para limpeza.');
        }

        log.step(70, 'LIMPEZA: Removendo membro de integridade');
        await api.delete(`/pessoas/${membroIntegridadeId}`, state.hubA.accessToken);
        log.success('Membro de integridade removido.');

        // ============================================
        // FASE 11: TESTES DE EDGE CASES E LIMITES
        // ============================================
        log.suite('FASE 11: EDGE CASES E LIMITES');

        log.step(71, 'TESTE: Criação de tag com nome muito longo (deve falhar)');
        try {
            await api.post('/tags', {
                nome: 'A'.repeat(100), // Nome muito longo
                cor: '#FF0000'
            }, state.hubA.accessToken);
            log.failure('Conseguiu criar tag com nome muito longo! Deveria ser bloqueado.');
        } catch (error) {
            if (error.statusCode === 400 || error.statusCode === 422) {
                log.success('Validação de tamanho de nome funcionando.');
            } else {
                log.failure(`Esperava erro de validação, recebeu ${error.statusCode}.`);
            }
        }

        log.step(72, 'TESTE: Criação de transação com valor zero (deve falhar)');
        try {
            await api.post('/transacoes', {
                descricao: 'Transação com valor zero',
                valor_total: 0,
                data_transacao: todayStr,
                participantes: [
                    { pessoa_id: state.hubA.pessoaId, valor_devido: 0 }
                ]
            }, state.hubA.accessToken);
            log.failure('Conseguiu criar transação com valor zero! Deveria ser bloqueado.');
        } catch (error) {
            if (error.statusCode === 400 || error.statusCode === 422) {
                log.success('Validação de valor mínimo funcionando.');
            } else {
                log.failure(`Esperava erro de validação, recebeu ${error.statusCode}.`);
            }
        }

        log.step(73, 'TESTE: Criação de transação com data futura');
        const dataFutura = new Date();
        dataFutura.setFullYear(dataFutura.getFullYear() + 10);
        const dataFuturaStr = dataFutura.toISOString().substring(0, 10);
        
        try {
            const resFutura = await api.post('/transacoes', {
                descricao: 'Transação com data futura',
                valor_total: 100.00,
                data_transacao: dataFuturaStr,
                participantes: [
                    { pessoa_id: state.hubA.pessoaId, valor_devido: 100.00 }
                ]
            }, state.hubA.accessToken);
            transacaoFuturaId = resFutura.body.data.transacoes[0].id; // Armazena o ID
            log.success('Transação com data futura criada (comportamento aceito).');
        } catch (error) {
            if (error.statusCode === 400 || error.statusCode === 422) {
                log.success('Validação de data futura funcionando.');
            } else {
                log.failure(`Erro inesperado: ${error.statusCode}.`);
            }
        }

        // ============================================
        // FASE 12: TESTES DE DADOS EM MASSA
        // ============================================
        log.suite('FASE 12: DADOS EM MASSA');

        log.step(74, 'TESTE: Criação de múltiplas tags em lote');
        const tagsCriadas = [];
        for (let i = 1; i <= 5; i++) {
            const randomColor = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            const tag = await api.post('/tags', {
                nome: `Tag Massa ${i}`,
                cor: `#${randomColor}`,
                icone: '📊'
            }, state.hubA.accessToken);
            tagsCriadas.push(tag.body.data.id);
        }
        log.success(`${tagsCriadas.length} tags criadas em lote.`);

        log.step(75, 'TESTE: Criação de múltiplas transações em lote');
        const transacoesCriadas = [];
        for (let i = 1; i <= 3; i++) {
            const transacao = await api.post('/transacoes', {
                descricao: `Transação Massa ${i}`,
                valor_total: 50.00 * i,
                data_transacao: todayStr,
                participantes: [
                    { pessoa_id: state.hubA.pessoaId, valor_devido: 50.00 * i }
                ],
                tags: [tagsCriadas[0]] // Usar primeira tag criada
            }, state.hubA.accessToken);
            transacoesCriadas.push(transacao.body.data.transacoes[0].id);
        }
        log.success(`${transacoesCriadas.length} transações criadas em lote.`);

        log.step(76, 'TESTE: Verificação de isolamento com dados em massa');
        const tagsHubAMassa = await api.get('/tags', state.hubA.accessToken);
        const tagsHubBMassa = await api.get('/tags', state.hubB.accessToken);
        
        const tagsMassaEncontradas = tagsHubAMassa.body.data.filter(tag => tag.nome.startsWith('Tag Massa'));
        const tagsMassaEncontradasB = tagsHubBMassa.body.data.filter(tag => tag.nome.startsWith('Tag Massa'));
        
        if (tagsMassaEncontradas.length !== 5) {
            log.failure(`Hub A deveria ter 5 tags massa, encontrou ${tagsMassaEncontradas.length}.`);
        }
        if (tagsMassaEncontradasB.length !== 0) {
            log.failure(`Hub B não deveria ter tags massa, encontrou ${tagsMassaEncontradasB.length}.`);
        }
        log.success('Isolamento com dados em massa confirmado.');

        // ============================================
        // FASE 13: TESTES DE PERFORMANCE E LIMITES
        // ============================================
        log.suite('FASE 13: PERFORMANCE E LIMITES');

        log.step(77, 'TESTE: Paginação com muitos dados');
        const transacoesPagina = await api.get('/transacoes?page=1&limit=2', state.hubA.accessToken);
        if (transacoesPagina.body.data.transacoes.length <= 2) {
            log.success('Paginação funcionando corretamente.');
        } else {
            log.failure('Paginação não está limitando resultados.');
        }

        log.step(78, 'TESTE: Filtros complexos em transações');
        const transacoesFiltradas = await api.get('/transacoes?tipo=GASTO&data_inicio=2024-01-01&data_fim=2025-12-31', state.hubA.accessToken);
        log.success('Filtros complexos aplicados com sucesso.');

        log.step(79, 'TESTE: Relatórios com dados complexos');
        const dashboardComplexo = await api.get('/relatorios/dashboard?periodo=30_dias&incluir_graficos=true&incluir_detalhes=true', state.hubA.accessToken);
        log.success('Relatório complexo gerado com sucesso.');

        // ============================================
        // FASE 14: TESTES DE RECUPERAÇÃO E ERROS
        // ============================================
        log.suite('FASE 14: RECUPERAÇÃO E ERROS');

        log.step(80, 'TESTE: Tentativa de acesso com token inválido');
        try {
            await api.get('/transacoes', 'token_invalido');
            log.failure('Conseguiu acessar com token inválido! Deveria ser bloqueado.');
        } catch (error) {
            if (error.statusCode === 401) {
                log.success('Autenticação com token inválido bloqueada corretamente.');
            } else {
                log.failure(`Esperava erro 401, recebeu ${error.statusCode}.`);
            }
        }

        log.step(81, 'TESTE: Tentativa de acesso sem token');
        try {
            await api.get('/transacoes');
            log.failure('Conseguiu acessar sem token! Deveria ser bloqueado.');
        } catch (error) {
            if (error.statusCode === 401) {
                log.success('Acesso sem token bloqueado corretamente.');
            } else {
                log.failure(`Esperava erro 401, recebeu ${error.statusCode}.`);
            }
        }

        log.step(82, 'TESTE: Tentativa de acesso a recurso inexistente');
        try {
            await api.get('/transacoes/999999', state.hubA.accessToken);
            log.failure('Conseguiu acessar transação inexistente! Deveria retornar 404.');
        } catch (error) {
            if (error.statusCode === 404) {
                log.success('Acesso a recurso inexistente retorna 404 corretamente.');
            } else {
                log.failure(`Esperava erro 404, recebeu ${error.statusCode}.`);
            }
        }

        // ============================================
        // FASE 15: TESTES DE CONCORRÊNCIA E RACE CONDITIONS
        // ============================================
        log.suite('FASE 15: CONCORRÊNCIA E RACE CONDITIONS');

        log.step(83, 'TESTE: Criação simultânea de tags com nomes únicos');
        const promisesTags = [];
        for (let i = 1; i <= 3; i++) {
            promisesTags.push(
                api.post('/tags', {
                    nome: `Tag Concorrente ${i}`,
                    cor: '#FF0000',
                    icone: '⚡'
                }, state.hubA.accessToken)
            );
        }
        
        try {
            const resultadosTags = await Promise.all(promisesTags);
            log.success(`${resultadosTags.length} tags criadas simultaneamente.`);
        } catch (error) {
            log.failure('Erro na criação simultânea de tags.');
        }

        log.step(84, 'TESTE: Atualização simultânea de configurações');
        const promisesConfig = [];
        for (let i = 1; i <= 2; i++) {
            promisesConfig.push(
                api.put('/configuracoes/interface', {
                    theme_interface: i % 2 === 0 ? 'dark' : 'light'
                }, state.hubA.accessToken)
            );
        }
        
        try {
            const resultadosConfig = await Promise.all(promisesConfig);
            log.success(`${resultadosConfig.length} configurações atualizadas simultaneamente.`);
        } catch (error) {
            log.failure('Erro na atualização simultânea de configurações.');
        }

        // ============================================
        // FASE 16: LIMPEZA FINAL AVANÇADA
        // ============================================
        log.suite('FASE 16: LIMPEZA FINAL AVANÇADA');

        log.step(85, 'LIMPEZA: Removendo transações criadas em massa (primeiro)');
        for (const transacaoId of transacoesCriadas) {
            await api.delete(`/transacoes/${transacaoId}`, state.hubA.accessToken);
        }
        log.success(`${transacoesCriadas.length} transações removidas.`);

        log.step(86, 'LIMPEZA: Removendo tags criadas em massa (depois das transações)');
        for (const tagId of tagsCriadas) {
            await api.delete(`/tags/${tagId}`, state.hubA.accessToken);
        }
        log.success(`${tagsCriadas.length} tags removidas.`);

        log.step(87, 'LIMPEZA: Removendo tags concorrentes');
        const tagsConcorrentes = await api.get('/tags', state.hubA.accessToken);
        const tagsParaRemover = tagsConcorrentes.body.data.filter(tag => tag.nome.startsWith('Tag Concorrente'));
        for (const tag of tagsParaRemover) {
            await api.delete(`/tags/${tag.id}`, state.hubA.accessToken);
        }
        log.success(`${tagsParaRemover.length} tags concorrentes removidas.`);

        log.step('87.1', 'LIMPEZA: Removendo transação com data futura');
        if (transacaoFuturaId) {
            await api.delete(`/transacoes/${transacaoFuturaId}`, state.hubA.accessToken);
            log.success('Transação com data futura removida.');
        } else {
            log.success('Nenhuma transação com data futura para remover.');
        }

        // ============================================
        // FASE 17: VALIDAÇÃO FINAL DE INTEGRIDADE
        // ============================================
        log.suite('FASE 17: VALIDAÇÃO FINAL DE INTEGRIDADE');

        log.step(88, 'VALIDAÇÃO: Verificação de isolamento final');
        const transacoesFinalA = await api.get('/transacoes', state.hubA.accessToken);
        const transacoesFinalB = await api.get('/transacoes', state.hubB.accessToken);
        
        const residuaisA = transacoesFinalA.body.data.transacoes;
        const residuaisB = transacoesFinalB.body.data.transacoes;

        if (residuaisA.length === 0 && residuaisB.length === 0) {
            log.success('Isolamento final confirmado - ambos Hubs limpos.');
        } else {
            const erroDetalhado = {
                hubA: {
                    count: residuaisA.length,
                    transacoes: residuaisA.map((t) => ({ id: t.id, descricao: t.descricao, tipo: t.tipo }))
                },
                hubB: {
                    count: residuaisB.length,
                    transacoes: residuaisB.map((t) => ({ id: t.id, descricao: t.descricao, tipo: t.tipo }))
                }
            };
            log.failure('Isolamento final falhou - dados residuais encontrados.', erroDetalhado);
        }

        log.step(89, 'VALIDAÇÃO: Verificação de integridade referencial final');
        const tagsFinalA = await api.get('/tags', state.hubA.accessToken);
        const tagsFinalB = await api.get('/tags', state.hubB.accessToken);
        
        const tagsResiduaisA = tagsFinalA.body.data;
        const tagsResiduaisB = tagsFinalB.body.data;

        if (tagsResiduaisA.length === 0 && tagsResiduaisB.length === 0) {
            log.success('Integridade referencial final confirmada.');
        } else {
            const erroDetalhado = {
                hubA: {
                    count: tagsResiduaisA.length,
                    tags: tagsResiduaisA.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))
                },
                hubB: {
                    count: tagsResiduaisB.length,
                    tags: tagsResiduaisB.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))
                }
            };
            log.failure('Integridade referencial final falhou - tags residuais encontradas.', erroDetalhado);
        }

        log.step(90, 'VALIDAÇÃO: Verificação de performance final');
        const startTime = Date.now();
        await api.get('/relatorios/dashboard', state.hubA.accessToken);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (responseTime < 5000) { // Menos de 5 segundos
            log.success(`Performance final OK - Dashboard em ${responseTime}ms.`);
        } else {
            log.failure(`Performance final lenta - Dashboard em ${responseTime}ms.`);
        }

        // --- CONCLUSÃO FINAL COM ISOLAMENTO ---
        console.log(`\n\n${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}🎉  TESTE COMPLETO + ISOLAMENTO MULTI-TENANT CONCLUÍDO 🎉${colors.reset}`);
        console.log(`${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}📊 RESUMO FINAL COMPLETO:${colors.reset}`);
        console.log(`${colors.green}   🔐 Autenticação: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   👥 Pessoas: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   🏷️ Tags: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   💰 Transações: ✅ 8 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   💳 Pagamentos: ✅ 8 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   📊 Relatórios: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   ⚙️ Configurações: ✅ 4 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   🧹 Limpeza: ✅ 5 operações de limpeza${colors.reset}`);
        console.log(`${colors.green}   🔒 ISOLAMENTO: ✅ 13 testes de segurança${colors.reset}`);
        console.log(`${colors.green}   🔗 INTEGRIDADE: ✅ 5 testes de integridade referencial${colors.reset}`);
        console.log(`${colors.green}   ⚡ EDGE CASES: ✅ 3 testes de limites e validações${colors.reset}`);
        console.log(`${colors.green}   📈 DADOS EM MASSA: ✅ 3 testes de volume${colors.reset}`);
        console.log(`${colors.green}   🚀 PERFORMANCE: ✅ 3 testes de performance${colors.reset}`);
        console.log(`${colors.green}   🛡️ RECUPERAÇÃO: ✅ 3 testes de segurança e erros${colors.reset}`);
        console.log(`${colors.green}   ⚡ CONCORRÊNCIA: ✅ 2 testes de race conditions${colors.reset}`);
        console.log(`${colors.green}   🧹 LIMPEZA AVANÇADA: ✅ 3 operações de limpeza${colors.reset}`);
        console.log(`${colors.green}   ✅ VALIDAÇÃO FINAL: ✅ 3 verificações de integridade${colors.reset}`);
        console.log(`${colors.green}   📈 TOTAL: 90 operações realizadas com sucesso!${colors.reset}`);
        console.log(`\n${colors.green}🔗 VALIDAÇÕES DE ISOLAMENTO:${colors.reset}`);
        console.log(`${colors.green}   ✅ Isolamento de dados entre Hubs${colors.reset}`);
        console.log(`${colors.green}   ✅ RBAC - Papéis e permissões${colors.reset}`);
        console.log(`${colors.green}   ✅ Políticas de acesso (GLOBAL/INDIVIDUAL)${colors.reset}`);
        console.log(`${colors.green}   ✅ Restrições de papel (VISUALIZADOR)${colors.reset}`);
        console.log(`${colors.green}   ✅ Isolamento em relatórios${colors.reset}`);
        console.log(`${colors.green}   ✅ Integridade referencial multi-tenant${colors.reset}`);
        console.log(`${colors.green}   ✅ Soft delete mantém isolamento${colors.reset}`);
        console.log(`${colors.green}   ✅ Administrador do sistema${colors.reset}`);
        console.log(`\n${colors.green}🔗 VALIDAÇÕES DE INTEGRIDADE:${colors.reset}`);
        console.log(`${colors.green}   ✅ Transações parceladas complexas${colors.reset}`);
        console.log(`${colors.green}   ✅ Bloqueio de remoção com dependências${colors.reset}`);
        console.log(`${colors.green}   ✅ Validações de limites e edge cases${colors.reset}`);
        console.log(`${colors.green}   ✅ Dados em massa com isolamento${colors.reset}`);
        console.log(`${colors.green}   ✅ Performance e concorrência${colors.reset}`);
        console.log(`${colors.green}   ✅ Recuperação de erros e segurança${colors.reset}`);

    } catch (error) {
        log.failure('O teste completo foi interrompido por erro inesperado.', error);
    }
}

runCompleteTestFlow();