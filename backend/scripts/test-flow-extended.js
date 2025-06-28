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

// --- FLUXO DE TESTE EXTENDIDO ---
async function runExtendedTestFlow() {
    try {
        console.log(`${colors.yellow}🚀 INICIANDO SUÍTE DE TESTES EXTENDIDA PARA A API MULTI-TENANT...${colors.reset}`);

        // ===========================================================
        // SUÍTE 1: REGISTRO, LOGIN e SELECT-HUB (reuso do fluxo base)
        // ===========================================================
        log.suite('SUÍTE 1: REGISTRO E AUTENTICAÇÃO');

        log.step(1, 'Registrando Hub A');
        await api.post('/auth/register', { ...credentials.hubA });
        log.success(`Hub A (${credentials.hubA.nomeHub}) registrado.`);
        await sleep(DELAY_MS);

        log.step(2, 'Registrando Hub B');
        await api.post('/auth/register', { ...credentials.hubB });
        log.success(`Hub B (${credentials.hubB.nomeHub}) registrado.`);
        await sleep(DELAY_MS);

        log.step(3, 'Autenticando Hub A (2 Passos)');
        const loginA = await api.post('/auth/login', { email: credentials.hubA.email, senha: credentials.hubA.senha });
        state.hubA.refreshToken = loginA.body.refreshToken;
        state.hubA.pessoaId = loginA.body.data.user.pessoaId;
        state.hubA.id = loginA.body.data.hubs[0].id;
        const selectA = await api.post('/auth/select-hub', { hubId: state.hubA.id }, state.hubA.refreshToken);
        state.hubA.accessToken = selectA.body.data.accessToken;
        log.success('Tokens do Hub A obtidos.');
        await sleep(DELAY_MS);

        log.step(4, 'Autenticando Hub B (2 Passos)');
        const loginB = await api.post('/auth/login', { email: credentials.hubB.email, senha: credentials.hubB.senha });
        state.hubB.refreshToken = loginB.body.refreshToken;
        state.hubB.pessoaId = loginB.body.data.user.pessoaId;
        state.hubB.id = loginB.body.data.hubs[0].id;
        const selectB = await api.post('/auth/select-hub', { hubId: state.hubB.id }, state.hubB.refreshToken);
        state.hubB.accessToken = selectB.body.data.accessToken;
        log.success('Tokens do Hub B obtidos.');

        // =============================================
        // SUÍTE 2: ISOLAMENTO + RBAC BÁSICO (fluxo base)
        // =============================================
        log.suite('SUÍTE 2: ISOLAMENTO DE DADOS & RBAC BÁSICO');
        log.step(5, 'Criando membro COLABORADOR no Hub A');
        const membroARes = await api.post('/pessoas', {
            nome: 'Membro A',
            email: `membro.a.${randomSuffix}@test.com`,
            role: 'COLABORADOR',
            dataAccessPolicy: 'GLOBAL'
        }, state.hubA.accessToken);
        state.membroAId = membroARes.body.data.pessoa.id;
        log.success('Membro A criado.');

        log.step(6, 'Criando membro COLABORADOR no Hub B');
        await api.post('/pessoas', {
            nome: 'Membro B',
            email: `membro.b.${randomSuffix}@test.com`,
            role: 'COLABORADOR',
            dataAccessPolicy: 'GLOBAL'
        }, state.hubB.accessToken);
        log.success('Membro B criado.');

        // Verificação rápida de isolamento
        const pessoasA = (await api.get('/pessoas', state.hubA.accessToken)).body.data.map(p => p.pessoa.nome || p.nome);
        if (pessoasA.some(n => n.includes('Membro B'))) {
            log.failure('Hub A conseguiu ver pessoa do Hub B!');
        }
        log.success('Isolamento de Pessoas confirmado.');

        // ============================================
        // SUÍTE 3: TRANSAÇÕES PARCELADAS & PAGAMENTOS
        // ============================================
        log.suite('SUÍTE 3: TRANSAÇÕES & PAGAMENTOS');
        log.step(7, 'Criando transação parcelada e COMPARTILHADA (3x) no Hub A');
        const transacaoRes = await api.post('/transacoes', {
            descricao: 'Compra Parcelada e Compartilhada Teste',
            valor_total: 300.00,
            data_transacao: yesterdayStr, // data válida não futura
            eh_parcelado: true,
            total_parcelas: 3,
            participantes: [
                { pessoa_id: state.hubA.pessoaId, valor_devido: 150.00 },
                { pessoa_id: state.membroAId, valor_devido: 150.00 }
            ]
        }, state.hubA.accessToken);
        state.transacaoParceladaId = transacaoRes.body.data.transacoes[0].id;
        log.success(`Transação compartilhada criada. ID da 1ª parcela: ${state.transacaoParceladaId}`);
        await sleep(DELAY_MS);

        log.step(8, 'Realizando pagamento parcial da parte do Admin (R$50)');
        await api.post('/pagamentos', {
            pessoa_id: state.hubA.pessoaId, // Especificando quem está pagando
            transacoes: [{ // Usando formato de pagamento composto para clareza
                transacao_id: state.transacaoParceladaId,
                valor_aplicado: 50.00
            }],
            data_pagamento: todayStr
        }, state.hubA.accessToken);
        log.success('Pagamento registrado com sucesso.');
        await sleep(DELAY_MS);

        log.step(9, 'Verificando estatísticas da transação');
        const transacaoDetalhe = await api.get(`/transacoes/${state.transacaoParceladaId}`, state.hubA.accessToken);
        const totalPago = parseFloat(transacaoDetalhe.body.data.estatisticas.total_pago);
        if (totalPago !== 50.00) log.failure(`Pagamento não refletiu corretamente. Esperado: 50.00, Recebido: ${totalPago}.`);
        log.success(`Total pago agora é R$${totalPago}, conforme esperado.`);

        // =======================================
        // SUÍTE 4: SOFT-DELETE & CONSISTÊNCIA
        // =======================================
        log.suite('SUÍTE 4: SOFT-DELETE');
        log.step(10, 'Removendo (soft delete) Membro A');
        await api.delete(`/pessoas/${state.membroAId}`, state.hubA.accessToken);
        log.success('Membro A removido (soft delete).');
        await sleep(DELAY_MS);

        log.step(11, 'Confirmando que Membro A não aparece na listagem');
        const pessoasAposDelete = (await api.get('/pessoas', state.hubA.accessToken)).body.data.map(p => p.pessoa?.nome || p.nome);
        if (pessoasAposDelete.some(n => n === 'Membro A')) log.failure('Soft delete falhou – Membro A ainda listado.');
        log.success('Soft delete confirmado.');

        // =======================================
        // SUÍTE 5: PAGINAÇÃO DE TAGS
        // =======================================
        log.suite('SUÍTE 5: PAGINAÇÃO');
        log.step(12, 'Criando 25 tags no Hub A');
        for (let i = 1; i <= 25; i++) {
            await api.post('/tags', { nome: `Tag ${i} ${randomSuffix}` }, state.hubA.accessToken);
        }
        log.success('25 tags criadas.');
        await sleep(DELAY_MS);

        log.step(13, 'Buscando página 2 (limit 10)');
        const tagsPage2 = await api.get('/tags?page=2&limit=10', state.hubA.accessToken);
        const pageData = tagsPage2.body;
        if (pageData.data.length !== 10 || pageData.pagination.page !== 2) {
            log.failure('Paginação retornou dados incorretos.');
        }
        log.success('Paginação de tags validada (10 itens na página 2).');

        // =======================================
        // SUÍTE 6: TOKENS INVÁLIDOS
        // =======================================
        log.suite('SUÍTE 6: TOKENS INVÁLIDOS');
        log.step(14, 'Tentando acessar recurso com Access Token inválido');
        try {
            await api.get('/pessoas', 'token_invalido');
            log.failure('Requisição com token inválido não deveria ter sido aceita.');
        } catch (error) {
            if (![401, 403].includes(error.statusCode)) log.failure('Esperava 401 ou 403, recebeu código diferente.', error);
            log.success('Servidor corretamente rejeitou token inválido.');
        }

        log.step(15, 'Tentando usar Refresh Token adulterado');
        try {
            await api.post('/auth/select-hub', { hubId: state.hubA.id }, state.hubA.refreshToken + 'abc');
            log.failure('Refresh token adulterado não deveria funcionar.');
        } catch (error) {
            if (![401, 403].includes(error.statusCode)) log.failure('Esperava 401/403 para refresh token inválido.', error);
            log.success('Refresh token inválido corretamente rejeitado.');
        }

        // =======================================
        // SUÍTE 7: VALIDAÇÃO DE SCHEMAS
        // =======================================
        log.suite('SUÍTE 7: VALIDAÇÕES ZOD');
        log.step(16, 'Enviando payload inválido (POST /pessoas sem email)');
        try {
            await api.post('/pessoas', { nome: 'Sem Email', role: 'COLABORADOR', dataAccessPolicy: 'GLOBAL' }, state.hubA.accessToken);
            log.failure('Payload inválido deveria ter falhado na validação.');
        } catch (error) {
            if (error.statusCode !== 400) log.failure('Esperava 400 Bad Request para validação.', error);
            log.success('Validação de esquema confirmou erro 400 conforme esperado.');
        }

        // --- CONCLUSÃO ---
        console.log(`\n\n${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}🎉  SUÍTE EXTENDIDA CONCLUÍDA COM SUCESSO 🎉${colors.reset}`);
        console.log(`${colors.green}==============================================${colors.reset}`);

    } catch (error) {
        log.failure('A suíte estendida foi interrompida por erro inesperado.', error);
    }
}

runExtendedTestFlow(); 