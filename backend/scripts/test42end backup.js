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
    }
};

const state = {
    hubA: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    hubB: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    membroAId: null, // Membro convidado no Hub A
    transacaoParceladaId: null // primeira parcela criada no Hub A
};

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
        state.hubA.refreshToken = loginA.body.refreshToken;
        state.hubA.pessoaId = loginA.body.data.user.pessoaId;
        state.hubA.id = loginA.body.data.hubs[0].id;
        log.success('Login Hub A realizado.');
        await sleep(DELAY_MS);

        log.step(5, 'POST /auth/login - Login Hub B');
        const loginB = await api.post('/auth/login', { email: credentials.hubB.email, senha: credentials.hubB.senha });
        state.hubB.refreshToken = loginB.body.refreshToken;
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

        // --- CONCLUSÃO ---
        console.log(`\n\n${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}🎉  TESTE COMPLETO DOS 42 ENDPOINTS CONCLUÍDO COM SUCESSO 🎉${colors.reset}`);
        console.log(`${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}📊 RESUMO FINAL:${colors.reset}`);
        console.log(`${colors.green}   🔐 Autenticação: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   👥 Pessoas: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   🏷️ Tags: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   💰 Transações: ✅ 8 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   💳 Pagamentos: ✅ 8 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   📊 Relatórios: ✅ 6 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   ⚙️ Configurações: ✅ 4 endpoints testados${colors.reset}`);
        console.log(`${colors.green}   🧹 Limpeza: ✅ 5 operações de limpeza${colors.reset}`);
        console.log(`${colors.green}   📈 TOTAL: 49 operações realizadas com sucesso!${colors.reset}`);

    } catch (error) {
        log.failure('O teste completo foi interrompido por erro inesperado.', error);
    }
}

runCompleteTestFlow(); 