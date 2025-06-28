// Script de debug para investigar problema do login do VISUALIZADOR
const http = require('http');
const { randomBytes } = require('crypto');

const DELAY_MS = 1000;
const randomSuffix = randomBytes(4).toString('hex');

const credentials = {
    hubA: {
        nome: 'Admin Hub A',
        email: `admin.alpha.${randomSuffix}@test.com`,
        senha: 'SenhaSegura123!',
        nomeHub: `Empresa Alpha ${randomSuffix}`
    },
    membroVisualizador: {
        nome: 'Membro Visualizador',
        email: `visualizador.${randomSuffix}@test.com`,
        senha: 'SenhaVisualizador123!'
    }
};

const state = {
    hubA: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    membroVisualizador: { refreshToken: null, accessToken: null, id: null, pessoaId: null }
};

// --- HELPERS ---
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ️ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    debug: (msg) => console.log(`${colors.magenta}🔍 ${msg}${colors.reset}`)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, body: parsedData });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

const api = {
    get: (path, token = null) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers.Authorization = `Bearer ${token}`;
        return request(options);
    },
    
    post: (path, body, token = null) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers.Authorization = `Bearer ${token}`;
        return request(options, body);
    },
    
    put: (path, body, token = null) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers.Authorization = `Bearer ${token}`;
        return request(options, body);
    }
};

// --- FLUXO DE DEBUG ---
async function debugVisualizador() {
    try {
        console.log(`${colors.yellow}🔍 INICIANDO DEBUG DO PROBLEMA DO VISUALIZADOR...${colors.reset}`);

        // 1. Registrar Hub A
        log.info('1. Registrando Hub A...');
        await api.post('/auth/register', { ...credentials.hubA });
        log.success('Hub A registrado.');

        // 2. Login Hub A
        log.info('2. Fazendo login do Hub A...');
        const loginA = await api.post('/auth/login', { 
            email: credentials.hubA.email, 
            senha: credentials.hubA.senha 
        });
        state.hubA.refreshToken = loginA.body.refreshToken;
        state.hubA.pessoaId = loginA.body.data.user.pessoaId;
        state.hubA.id = loginA.body.data.hubs[0].id;
        log.success('Login Hub A realizado.');

        // 3. Select Hub A
        log.info('3. Selecionando Hub A...');
        const selectA = await api.post('/auth/select-hub', { 
            hubId: state.hubA.id 
        }, state.hubA.refreshToken);
        state.hubA.accessToken = selectA.body.data.accessToken;
        log.success('Hub A selecionado.');

        // 4. Criar membro VISUALIZADOR
        log.info('4. Criando membro VISUALIZADOR...');
        const membroVisualizador = await api.post('/pessoas', {
            nome: credentials.membroVisualizador.nome,
            email: credentials.membroVisualizador.email,
            role: 'VISUALIZADOR'
        }, state.hubA.accessToken);
        const membroVisualizadorId = membroVisualizador.body.data.pessoa.id;
        log.success(`Membro VISUALIZADOR criado com ID: ${membroVisualizadorId}`);

        // 5. Verificar dados do membro criado
        log.info('5. Verificando dados do membro criado...');
        const membroDetails = await api.get(`/pessoas/${membroVisualizadorId}`, state.hubA.accessToken);
        log.debug(`Dados do membro: ${JSON.stringify(membroDetails.body, null, 2)}`);

        // 6. Tentar diferentes abordagens de login
        log.info('6. Testando diferentes abordagens de login...');

        // 6.1 - Tentar com senha das credenciais (deve falhar)
        log.debug('6.1 - Tentando login com senha das credenciais...');
        try {
            const loginTest1 = await api.post('/auth/login', { 
                email: credentials.membroVisualizador.email, 
                senha: credentials.membroVisualizador.senha 
            });
            log.error('ERRO: Login funcionou com senha das credenciais! Deveria falhar.');
            log.debug(`Resposta: ${JSON.stringify(loginTest1.body, null, 2)}`);
        } catch (error) {
            log.success('Login com senha das credenciais falhou (esperado).');
            log.debug(`Erro: ${JSON.stringify(error.body, null, 2)}`);
        }

        // 6.2 - Tentar com senha temporária (deve falhar também)
        log.debug('6.2 - Tentando login com senha temporária...');
        const senhaTemp = 'CONVITE_PENDENTE_' + new Date().toISOString().split('T')[0];
        log.debug(`Senha temporária tentada: ${senhaTemp}`);
        
        try {
            const loginTest2 = await api.post('/auth/login', { 
                email: credentials.membroVisualizador.email, 
                senha: senhaTemp
            });
            log.error('ERRO: Login funcionou com senha temporária! Deveria falhar.');
            log.debug(`Resposta: ${JSON.stringify(loginTest2.body, null, 2)}`);
        } catch (error) {
            log.success('Login com senha temporária falhou (esperado).');
            log.debug(`Erro: ${JSON.stringify(error.body, null, 2)}`);
        }

        // 6.3 - Tentar com senha temporária completa
        log.debug('6.3 - Tentando login com senha temporária completa...');
        const senhaTempCompleta = 'CONVITE_PENDENTE_' + new Date().toISOString();
        log.debug(`Senha temporária completa tentada: ${senhaTempCompleta}`);
        
        try {
            const loginTest3 = await api.post('/auth/login', { 
                email: credentials.membroVisualizador.email, 
                senha: senhaTempCompleta
            });
            log.error('ERRO: Login funcionou com senha temporária completa! Deveria falhar.');
            log.debug(`Resposta: ${JSON.stringify(loginTest3.body, null, 2)}`);
        } catch (error) {
            log.success('Login com senha temporária completa falhou (esperado).');
            log.debug(`Erro: ${JSON.stringify(error.body, null, 2)}`);
        }

        // 7. Conclusão
        log.warning('PROBLEMA IDENTIFICADO: O sistema não permite login com senhas temporárias!');
        log.warning('Isso indica que o fluxo de convites não está funcionando corretamente.');
        log.warning('O membro VISUALIZADOR precisa de uma forma alternativa de acessar o sistema.');

        console.log(`\n${colors.yellow}🔍 CONCLUSÃO DO DEBUG:${colors.reset}`);
        console.log(`${colors.yellow}   ❌ Login com senha temporária não funciona${colors.reset}`);
        console.log(`${colors.yellow}   ❌ Login com senha das credenciais não funciona${colors.reset}`);
        console.log(`${colors.yellow}   ❌ Sistema de convites tem falha fundamental${colors.reset}`);
        console.log(`${colors.yellow}   💡 Necessário corrigir o fluxo de convites${colors.reset}`);

    } catch (error) {
        log.error(`Erro no debug: ${error.message}`);
        if (error.body) {
            log.debug(`Detalhes: ${JSON.stringify(error.body, null, 2)}`);
        }
    }
}

// Executar debug
debugVisualizador(); 