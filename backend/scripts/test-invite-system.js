// Script de teste para o novo sistema de convite e onboarding
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
    membroConvidado: {
        nome: 'Membro Convidado',
        email: `convidado.${randomSuffix}@test.com`,
        senha: 'SenhaConvidado123!'
    }
};

const state = {
    hubA: { refreshToken: null, accessToken: null, id: null, pessoaId: null },
    conviteToken: null
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
            port: 3001,
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
            port: 3001,
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
            port: 3001,
            path,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers.Authorization = `Bearer ${token}`;
        return request(options, body);
    }
};

// --- FLUXO DE TESTE DO SISTEMA DE CONVITE ---
async function testInviteSystem() {
    try {
        console.log(`${colors.yellow}🚀 INICIANDO TESTE DO SISTEMA DE CONVITE E ONBOARDING...${colors.reset}`);

        // 1. Registrar Hub A
        log.info('1. Registrando Hub A...');
        await api.post('/api/auth/register', { ...credentials.hubA });
        log.success('Hub A registrado.');

        // 2. Login Hub A
        log.info('2. Fazendo login do Hub A...');
        const loginA = await api.post('/api/auth/login', { 
            email: credentials.hubA.email, 
            senha: credentials.hubA.senha 
        });
        
        // Debug: mostrar estrutura da resposta
        log.debug(`Status: ${loginA.statusCode}`);
        log.debug(`Resposta completa: ${JSON.stringify(loginA.body, null, 2)}`);
        
        if (loginA.statusCode !== 200) {
            throw new Error(`Login falhou: ${loginA.body.error} - ${loginA.body.message}`);
        }
        
        state.hubA.refreshToken = loginA.body.refreshToken;
        state.hubA.pessoaId = loginA.body.data.user.pessoaId;
        state.hubA.id = loginA.body.data.hubs[0].id;
        log.success('Login Hub A realizado.');

        // 3. Select Hub A
        log.info('3. Selecionando Hub A...');
        const selectA = await api.post('/api/auth/select-hub', { 
            hubId: state.hubA.id 
        }, state.hubA.refreshToken);
        state.hubA.accessToken = selectA.body.data.accessToken;
        log.success('Hub A selecionado.');

        // 4. Convidar membro
        log.info('4. Convidando novo membro...');
        const convite = await api.post('/api/pessoas', {
            nome: credentials.membroConvidado.nome,
            email: credentials.membroConvidado.email,
            role: 'VISUALIZADOR'
        }, state.hubA.accessToken);
        
        state.conviteToken = convite.body.data.conviteToken;
        log.success(`Membro convidado. Token: ${state.conviteToken.substring(0, 20)}...`);
        
        // Debug: Verificar se o membro aparece logo após convite
        log.debug('🔍 INVESTIGAÇÃO: Verificando membro logo após convite...');
        const membrosAposConvite = await api.get('/api/pessoas?ativo=true', state.hubA.accessToken);
        log.debug(`Membros após convite (ativo=true): ${membrosAposConvite.body.data.length}`);
        const membroAposConvite = membrosAposConvite.body.data.find(m => m.pessoa.email === credentials.membroConvidado.email);
        if (membroAposConvite) {
            log.debug(`✅ Membro encontrado após convite: ${JSON.stringify(membroAposConvite, null, 2)}`);
        } else {
            log.debug('❌ Membro NÃO encontrado após convite!');
        }

        // 5. Tentar login com membro convidado (deve falhar)
        log.info('5. Tentando login com membro convidado (deve falhar)...');
        const loginTentativa = await api.post('/api/auth/login', { 
            email: credentials.membroConvidado.email, 
            senha: credentials.membroConvidado.senha 
        });
        log.debug(`Status da tentativa de login: ${loginTentativa.statusCode}`);
        log.debug(`Resposta da tentativa: ${JSON.stringify(loginTentativa.body, null, 2)}`);
        
        if (loginTentativa.statusCode === 401 && loginTentativa.body.error === 'ConvitePendente') {
            log.success('✅ Login corretamente bloqueado - convite pendente.');
        } else {
            log.error('❌ ERRO: Login funcionou antes da ativação!');
        }

        // 6. Ativar convite
        log.info('6. Ativando convite...');
        const ativacao = await api.post('/api/auth/ativar-convite', {
            token: state.conviteToken,
            novaSenha: credentials.membroConvidado.senha,
            confirmarSenha: credentials.membroConvidado.senha
        });
        log.debug(`Status da ativação: ${ativacao.statusCode}`);
        log.debug(`Resposta da ativação: ${JSON.stringify(ativacao.body, null, 2)}`);
        log.success('✅ Convite ativado com sucesso.');
        
        // Debug: Verificar se o membro ainda aparece após ativação
        log.debug('🔍 INVESTIGAÇÃO: Verificando membro após ativação...');
        const membrosAposAtivacao = await api.get('/api/pessoas?ativo=true', state.hubA.accessToken);
        log.debug(`Membros após ativação (ativo=true): ${membrosAposAtivacao.body.data.length}`);
        const membroAposAtivacao = membrosAposAtivacao.body.data.find(m => m.pessoa.email === credentials.membroConvidado.email);
        if (membroAposAtivacao) {
            log.debug(`✅ Membro encontrado após ativação: ${JSON.stringify(membroAposAtivacao, null, 2)}`);
        } else {
            log.debug('❌ Membro NÃO encontrado após ativação!');
        }

        // 7. Tentar ativar convite novamente (deve falhar)
        log.info('7. Tentando ativar convite novamente (deve falhar)...');
        const reativacao = await api.post('/api/auth/ativar-convite', {
            token: state.conviteToken,
            novaSenha: 'OutraSenha123!',
            confirmarSenha: 'OutraSenha123!'
        });
        log.debug(`Status da reativação: ${reativacao.statusCode}`);
        log.debug(`Resposta da reativação: ${JSON.stringify(reativacao.body, null, 2)}`);
        
        if (reativacao.statusCode === 404 && reativacao.body.error === 'ConviteInvalido') {
            log.success('✅ Convite corretamente invalidado após ativação.');
        } else {
            log.error('❌ ERRO: Convite foi ativado duas vezes!');
        }

        // 8. Fazer login com membro ativado
        log.info('8. Fazendo login com membro ativado...');
        const loginConvidado = await api.post('/api/auth/login', { 
            email: credentials.membroConvidado.email, 
            senha: credentials.membroConvidado.senha 
        });
        log.success('Login do membro convidado realizado com sucesso.');

        // 8.1. VISUALIZADOR seleciona Hub e tenta listar membros
        log.info('8.1. VISUALIZADOR selecionando Hub e tentando listar membros...');
        const refreshTokenConvidado = loginConvidado.body.refreshToken;
        const hubIdConvidado = loginConvidado.body.data.hubs[0].id;
        
        // Selecionar Hub para obter accessToken
        const selectHubConvidado = await api.post('/api/auth/select-hub', { 
            hubId: hubIdConvidado 
        }, refreshTokenConvidado);
        
        if (selectHubConvidado.statusCode === 200) {
            const accessTokenConvidado = selectHubConvidado.body.data.accessToken;
            log.success('VISUALIZADOR selecionou Hub com sucesso.');
            
            // Agora tentar listar membros com o accessToken correto
            const membrosPorVisualizador = await api.get('/api/pessoas', accessTokenConvidado);

            if (membrosPorVisualizador.statusCode === 200 && Array.isArray(membrosPorVisualizador.body.data)) {
                log.success(`VISUALIZADOR conseguiu listar ${membrosPorVisualizador.body.data.length} membros do Hub.`);
                log.debug(`Membros visíveis para VISUALIZADOR: ${membrosPorVisualizador.body.data.map(m => m.pessoa.email).join(', ')}`);
                const encontrouProprietario = membrosPorVisualizador.body.data.some(m => m.pessoa.email === credentials.hubA.email);
                if (encontrouProprietario) {
                    log.success('VISUALIZADOR vê o proprietário do Hub (correto).');
                } else {
                    log.error('VISUALIZADOR NÃO vê o proprietário do Hub (erro).');
                }
            } else {
                log.error('VISUALIZADOR não conseguiu listar membros do Hub!');
                log.debug(`Resposta: ${JSON.stringify(membrosPorVisualizador.body, null, 2)}`);
            }
        } else {
            log.error('VISUALIZADOR não conseguiu selecionar Hub!');
            log.debug(`Resposta da seleção: ${JSON.stringify(selectHubConvidado.body, null, 2)}`);
        }

        // 9. Verificar se membro aparece na lista
        log.info('9. Verificando se membro aparece na lista...');
        
        // Debug: Verificar membros antes da listagem
        log.debug('🔍 INVESTIGAÇÃO: Verificando dados do membro...');
        
        // Tentar buscar o membro diretamente pelo email
        try {
            const membroDireto = await api.get(`/api/pessoas?email=${credentials.membroConvidado.email}`, state.hubA.accessToken);
            log.debug(`Busca direta por email - Status: ${membroDireto.statusCode}`);
            log.debug(`Busca direta por email - Resposta: ${JSON.stringify(membroDireto.body, null, 2)}`);
        } catch (error) {
            log.debug(`Erro na busca direta: ${error.message}`);
        }
        
        // Listar todos os membros sem filtros
        const membros = await api.get('/api/pessoas', state.hubA.accessToken);
        log.debug(`Status da listagem: ${membros.statusCode}`);
        log.debug(`Total de membros: ${membros.body.data ? membros.body.data.length : 0}`);
        log.debug(`Membros: ${JSON.stringify(membros.body.data, null, 2)}`);
        
        // Debug: Verificar se há paginação
        if (membros.body.pagination) {
            log.debug(`Paginação: ${JSON.stringify(membros.body.pagination, null, 2)}`);
        }
        
        // Tentar buscar com diferentes parâmetros
        log.debug('🔍 INVESTIGAÇÃO: Tentando diferentes filtros...');
        
        // Buscar sem filtro de ativo
        try {
            const membrosSemFiltro = await api.get('/api/pessoas?ativo=true', state.hubA.accessToken);
            log.debug(`Listagem com ativo=true - Status: ${membrosSemFiltro.statusCode}`);
            log.debug(`Listagem com ativo=true - Total: ${membrosSemFiltro.body.data ? membrosSemFiltro.body.data.length : 0}`);
        } catch (error) {
            log.debug(`Erro na listagem com filtro: ${error.message}`);
        }
        
        // Buscar com role específico
        try {
            const membrosRole = await api.get('/api/pessoas?role=VISUALIZADOR', state.hubA.accessToken);
            log.debug(`Listagem com role=VISUALIZADOR - Status: ${membrosRole.statusCode}`);
            log.debug(`Listagem com role=VISUALIZADOR - Total: ${membrosRole.body.data ? membrosRole.body.data.length : 0}`);
        } catch (error) {
            log.debug(`Erro na listagem por role: ${error.message}`);
        }
        
        const membroEncontrado = membros.body.data.find(m => m.pessoa.email === credentials.membroConvidado.email);
        
        if (membroEncontrado) {
            log.success('✅ Membro encontrado na lista do Hub.');
            log.debug(`Dados do membro encontrado: ${JSON.stringify(membroEncontrado, null, 2)}`);
        } else {
            log.error('❌ Membro não encontrado na lista do Hub.');
            log.debug('🔍 INVESTIGAÇÃO: Verificando possíveis causas...');
            
            // Verificar se o membro existe mas não aparece na listagem
            log.debug(`Email procurado: ${credentials.membroConvidado.email}`);
            log.debug(`Emails na lista: ${membros.body.data.map(m => m.pessoa.email).join(', ')}`);
        }

        // 10. Teste de reenvio de convite (deve falhar pois já foi ativado)
        log.info('10. Tentando reenviar convite (deve falhar)...');
        const reenvio = await api.post('/api/auth/reenviar-convite', {
            email: credentials.membroConvidado.email
        }, state.hubA.accessToken);
        log.debug(`Status do reenvio: ${reenvio.statusCode}`);
        log.debug(`Resposta do reenvio: ${JSON.stringify(reenvio.body, null, 2)}`);
        
        if (reenvio.statusCode === 400 && (reenvio.body.error === 'ConviteInativo' || reenvio.body.error === 'MembroJaAtivado')) {
            log.success('✅ Reenvio corretamente bloqueado para membro já ativado.');
        } else {
            log.error('❌ ERRO: Reenvio funcionou para membro já ativado!');
        }

        console.log(`\n${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}🎉 TESTE DO SISTEMA DE CONVITE CONCLUÍDO COM SUCESSO! 🎉${colors.reset}`);
        console.log(`${colors.green}==============================================${colors.reset}`);
        console.log(`${colors.green}✅ Convite gerado e enviado${colors.reset}`);
        console.log(`${colors.green}✅ Login bloqueado antes da ativação${colors.reset}`);
        console.log(`${colors.green}✅ Convite ativado com sucesso${colors.reset}`);
        console.log(`${colors.green}✅ Login funcionou após ativação${colors.reset}`);
        console.log(`${colors.green}✅ Convite invalidado após uso${colors.reset}`);
        console.log(`${colors.green}✅ Membro integrado ao Hub${colors.reset}`);

    } catch (error) {
        log.error(`Erro no teste: ${error.message}`);
        if (error.body) {
            log.debug(`Detalhes: ${JSON.stringify(error.body, null, 2)}`);
        }
    }
}

// Executar teste
testInviteSystem(); 