const http = require('http');
const { randomBytes } = require('crypto');

// --- CONFIGURAÇÕES E ESTADO ---
const DELAY_MS = 1500; // Intervalo de 1.5s entre os passos
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
    colaboradorA: {
        nome: 'Colaborador Hub A',
        email: `colab.a.${randomSuffix}@test.com`
    }
};

const state = {
    hubA: { refreshToken: null, accessToken: null, id: null },
    hubB: { refreshToken: null, accessToken: null, id: null },
    colaboradorA: { refreshToken: null, accessToken: null, id: null }
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
        const options = { hostname: 'localhost', port: 3001, path: `/api${path}`, method: 'GET', headers: { 'Authorization': `Bearer ${token}` } };
        return request(options);
    }
};


// --- FLUXO DE TESTE PRINCIPAL ---
async function runTestFlow() {
    try {
        console.log(`${colors.yellow}🚀 INICIANDO SUÍTE DE TESTES AUTOMATIZADOS PARA A API MULTI-TENANT...${colors.reset}`);

        // -------------------------
        // SUÍTE 1: REGISTRO E AUTH
        // -------------------------
        log.suite('SUÍTE 1: REGISTRO E AUTENTICAÇÃO');
        log.step(1, 'Registrando Hub A');
        await api.post('/auth/register', { ...credentials.hubA });
        log.success(`Hub A (${credentials.hubA.nomeHub}) registrado.`);
        await sleep(DELAY_MS);

        log.step(2, 'Registrando Hub B');
        await api.post('/auth/register', { ...credentials.hubB });
        log.success(`Hub B (${credentials.hubB.nomeHub}) registrado.`);
        await sleep(DELAY_MS);

        log.step(3, 'Autenticação em 2 Passos - Hub A');
        console.group();
        const loginARes = await api.post('/auth/login', { email: credentials.hubA.email, senha: credentials.hubA.senha });
        state.hubA.refreshToken = loginARes.body.refreshToken;
        state.hubA.id = loginARes.body.data.hubs[0].id;
        log.success('Refresh Token do Hub A obtido.');
        const selectARes = await api.post('/auth/select-hub', { hubId: state.hubA.id }, state.hubA.refreshToken);
        state.hubA.accessToken = selectARes.body.data.accessToken;
        log.success('Access Token do Hub A obtido.');
        console.groupEnd();
        await sleep(DELAY_MS);

        log.step(4, 'Autenticação em 2 Passos - Hub B');
        console.group();
        const loginBRes = await api.post('/auth/login', { email: credentials.hubB.email, senha: credentials.hubB.senha });
        state.hubB.refreshToken = loginBRes.body.refreshToken;
        state.hubB.id = loginBRes.body.data.hubs[0].id;
        log.success('Refresh Token do Hub B obtido.');
        const selectBRes = await api.post('/auth/select-hub', { hubId: state.hubB.id }, state.hubB.refreshToken);
        state.hubB.accessToken = selectBRes.body.data.accessToken;
        log.success('Access Token do Hub B obtido.');
        console.groupEnd();


        // ---------------------------------
        // SUÍTE 2: ISOLAMENTO DE DADOS
        // ---------------------------------
        log.suite('SUÍTE 2: TESTES DE ISOLAMENTO DE DADOS');
        log.step(5, 'Criando recursos em cada Hub');
        console.group();
        await api.post('/pessoas', { nome: 'Membro A', email: `membro.a.${randomSuffix}@test.com`, role: 'COLABORADOR', dataAccessPolicy: 'GLOBAL' }, state.hubA.accessToken);
        log.success('Pessoa "Membro A" criada no Hub A.');
        await api.post('/pessoas', { nome: 'Membro B', email: `membro.b.${randomSuffix}@test.com`, role: 'COLABORADOR', dataAccessPolicy: 'GLOBAL' }, state.hubB.accessToken);
        log.success('Pessoa "Membro B" criada no Hub B.');
        await api.post('/tags', { nome: 'Tag do Hub A' }, state.hubA.accessToken);
        log.success('Tag "Tag do Hub A" criada no Hub A.');
        await api.post('/tags', { nome: 'Tag do Hub B' }, state.hubB.accessToken);
        log.success('Tag "Tag do Hub B" criada no Hub B.');
        console.groupEnd();
        await sleep(DELAY_MS);

        log.step(6, 'Validação de Isolamento - Acessando com Token do Hub A');
        console.group();
        const pessoasA = (await api.get('/pessoas', state.hubA.accessToken)).body.data.map(p => p.nome);
        log.success(`Pessoas vistas pelo Hub A: [${pessoasA.join(', ')}]`);
        if (pessoasA.includes('Membro B')) log.failure('VIOLAÇÃO DE ISOLAMENTO!', 'Hub A vê pessoas do Hub B.');
        const tagsA = (await api.get('/tags', state.hubA.accessToken)).body.data.map(t => t.nome);
        log.success(`Tags vistas pelo Hub A: [${tagsA.join(', ')}]`);
        if (tagsA.includes('Tag do Hub B')) log.failure('VIOLAÇÃO DE ISOLAMENTO!', 'Hub A vê tags do Hub B.');
        console.groupEnd();
        await sleep(DELAY_MS);

        log.step(7, 'Validação de Isolamento - Acessando com Token do Hub B');
        console.group();
        const pessoasB = (await api.get('/pessoas', state.hubB.accessToken)).body.data.map(p => p.nome);
        log.success(`Pessoas vistas pelo Hub B: [${pessoasB.join(', ')}]`);
        if (pessoasB.includes('Membro A')) log.failure('VIOLAÇÃO DE ISOLAMENTO!', 'Hub B vê pessoas do Hub A.');
        const tagsB = (await api.get('/tags', state.hubB.accessToken)).body.data.map(t => t.nome);
        log.success(`Tags vistas pelo Hub B: [${tagsB.join(', ')}]`);
        if (tagsB.includes('Tag do Hub A')) log.failure('VIOLAÇÃO DE ISOLAMENTO!', 'Hub B vê tags do Hub B.');
        console.groupEnd();
        

        // ---------------------------------
        // SUÍTE 3: CONTROLE DE ACESSO (RBAC)
        // ---------------------------------
        log.suite('SUÍTE 3: TESTE DE CONTROLE DE ACESSO (RBAC)');
        log.step(8, 'Admin do Hub A convida Admin do Hub B como COLABORADOR');
        await api.post('/pessoas', {
            email: credentials.hubB.email, // Convidando um usuário existente
            nome: credentials.hubB.nome,
            role: 'COLABORADOR',
            dataAccessPolicy: 'GLOBAL'
        }, state.hubA.accessToken);
        log.success(`Usuário ${credentials.hubB.email} agora é COLABORADOR no Hub A.`);
        await sleep(DELAY_MS);

        log.step(9, 'Tentando executar Ação de Admin com Token de Colaborador');
        console.group();
        log.success('Primeiro, autenticando como Admin do Hub B para obter tokens...');
        const loginColabRes = await api.post('/auth/login', { email: credentials.hubB.email, senha: credentials.hubB.senha });
        const colabRefreshToken = loginColabRes.body.refreshToken;

        // O usuário B agora pertence a dois hubs. Precisamos pegar o ID do Hub A.
        const hubAFromLogin = loginColabRes.body.data.hubs.find(h => h.nome === credentials.hubA.nomeHub);
        if (!hubAFromLogin) log.failure('Falha no teste: Hub A não encontrado na lista de hubs do usuário B.');

        log.success(`Selecionando o Hub A com o token do usuário B (onde ele é COLABORADOR)`);
        const selectColabRes = await api.post('/auth/select-hub', { hubId: hubAFromLogin.id }, colabRefreshToken);
        const colabAccessTokenParaHubA = selectColabRes.body.data.accessToken;
        log.success('Token de acesso de COLABORADOR para o Hub A obtido.');

        log.success('Agora, tentando convidar um novo membro para o Hub A (deve falhar com 403)...');
        try {
            await api.post('/pessoas', { nome: 'Invasor', email: 'invasor@test.com', role: 'COLABORADOR', dataAccessPolicy: 'GLOBAL' }, colabAccessTokenParaHubA);
            log.failure('FALHA DE RBAC!', 'Colaborador conseguiu executar uma ação de Administrador.');
        } catch (error) {
            if (error.statusCode === 403) {
                log.success('RBAC confirmado! O servidor retornou 403 Forbidden, como esperado.');
            } else {
                log.failure('FALHA DE RBAC! Esperava 403, mas recebeu outro erro.', error);
            }
        }
        console.groupEnd();
        
        // --- CONCLUSÃO ---
        console.log(`\n\n${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}🎉🎉🎉  SUÍTE DE TESTES CONCLUÍDA COM SUCESSO 🎉🎉🎉${colors.reset}`);
        console.log(`${colors.green}==============================================${colors.reset}`);
        console.log('✅ Arquitetura Multi-Tenant e Segurança de Acesso validadas.');

    } catch (error) {
        log.failure('A suíte de testes foi interrompida por um erro inesperado.', error);
    }
}

runTestFlow(); 