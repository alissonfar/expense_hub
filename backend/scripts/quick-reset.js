const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// =============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =============================================

const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '', // Será solicitada via input
    database: 'personal_expense_hub'
};

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

async function conectarPostgreSQL(config) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados!');
        return client;
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco:', error.message);
        console.log('\n🔧 Verifique se:');
        console.log('   - PostgreSQL está rodando');
        console.log('   - Credenciais estão corretas');
        console.log('   - Banco expense_hub_db existe');
        throw error;
    }
}

async function obterContadores(client) {
    try {
        const contadores = {};
        
        const tabelas = [
            'pessoas', 'tags', 'transacoes', 'transacao_participantes', 
            'transacao_tags', 'pagamentos', 'pagamento_transacoes', 'configuracoes_sistema'
        ];
        
        for (const tabela of tabelas) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${tabela}`);
                contadores[tabela] = parseInt(result.rows[0].count);
            } catch (error) {
                contadores[tabela] = 0;
            }
        }
        
        return contadores;
    } catch (error) {
        console.error('❌ Erro ao obter contadores:', error.message);
        return {};
    }
}

async function limparBancoRapido(client) {
    try {
        console.log('\n🗑️  LIMPANDO DADOS DO BANCO...');
        
        // Obter contadores antes da limpeza
        const contadoresAntes = await obterContadores(client);
        
        console.log('📊 Dados encontrados:');
        Object.entries(contadoresAntes).forEach(([tabela, count]) => {
            if (count > 0) {
                console.log(`   • ${tabela}: ${count} registros`);
            }
        });
        
        // Sequência de limpeza respeitando foreign keys
        const tabelasParaLimpar = [
            'pagamento_transacoes',
            'pagamentos',
            'transacao_tags',
            'transacao_participantes',
            'transacoes',
            'tags',
            'configuracoes_sistema',
            'pessoas'
        ];
        
        let totalRemovidos = 0;
        
        for (const tabela of tabelasParaLimpar) {
            try {
                const result = await client.query(`DELETE FROM ${tabela}`);
                const removidos = result.rowCount;
                totalRemovidos += removidos;
                if (removidos > 0) {
                    console.log(`   ✅ ${tabela}: ${removidos} registros removidos`);
                }
            } catch (error) {
                console.log(`   ⚠️  ${tabela}: ${error.message}`);
            }
        }
        
        // Resetar sequências de ID
        const sequencias = [
            'pessoas_id_seq',
            'tags_id_seq',
            'transacoes_id_seq',
            'transacao_participantes_id_seq',
            'pagamentos_id_seq',
            'pagamento_transacoes_id_seq',
            'configuracoes_sistema_id_seq'
        ];
        
        for (const sequencia of sequencias) {
            try {
                await client.query(`ALTER SEQUENCE ${sequencia} RESTART WITH 1`);
                console.log(`   ✅ ${sequencia} resetada`);
            } catch (error) {
                console.log(`   ⚠️  ${sequencia}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Limpeza concluída! ${totalRemovidos} registros removidos.`);
        
    } catch (error) {
        console.error('❌ Erro ao limpar banco:', error.message);
        throw error;
    }
}

async function inserirDadosBasicos(client) {
    try {
        console.log('\n📊 INSERINDO DADOS BÁSICOS...');
        
        // Inserir dados de teste
        const dadosSQL = await lerArquivoSQL('migrations/002_dados_teste.sql');
        await executarSQL(client, dadosSQL, 'Dados básicos de teste');
        
        console.log('✅ Dados básicos inseridos com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inserir dados básicos:', error.message);
        throw error;
    }
}

async function lerArquivoSQL(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
        console.error(`❌ Erro ao ler arquivo ${filePath}:`, error.message);
        throw error;
    }
}

async function executarSQL(client, sqlContent, description) {
    try {
        console.log(`🔄 Executando: ${description}...`);
        await client.query(sqlContent);
        console.log(`✅ ${description} executado com sucesso!`);
    } catch (error) {
        console.error(`❌ Erro em ${description}:`, error.message);
        throw error;
    }
}

function promptInput(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

function promptConfirmacao(question) {
    return promptInput(`${question} (s/N): `).then(answer => {
        return answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim';
    });
}

// =============================================
// FUNÇÃO PRINCIPAL
// =============================================

async function quickReset() {
    console.log('⚡ RESET RÁPIDO DO BANCO - EXPENSE HUB');
    console.log('=======================================\n');
    
    console.log('⚠️  ATENÇÃO: Esta operação irá:');
    console.log('   • Remover TODOS os dados do banco');
    console.log('   • Resetar todas as sequências de ID');
    console.log('   • MANTER o schema atual');
    console.log('   • Inserir dados básicos de teste (opcional)');
    console.log('   • Esta ação NÃO PODE SER DESFEITA!\n');

    try {
        // 1. Confirmar operação
        const confirmar = await promptConfirmacao('Tem certeza que deseja continuar?');
        if (!confirmar) {
            console.log('❌ Operação cancelada pelo usuário.');
            return;
        }

        // 2. Solicitar senha do PostgreSQL
        const senha = await promptInput('🔑 Digite a senha do usuário postgres: ');
        DB_CONFIG.password = senha;

        // 3. Conectar ao banco
        console.log('\n📡 CONECTANDO AO BANCO...');
        const client = await conectarPostgreSQL(DB_CONFIG);

        // 4. Limpar banco de dados
        await limparBancoRapido(client);

        // 5. Perguntar se quer inserir dados básicos
        const inserirDados = await promptConfirmacao('Deseja inserir dados básicos de teste?');
        if (inserirDados) {
            await inserirDadosBasicos(client);
        }

        await client.end();

        // 6. Próximos passos
        console.log('\n🎉 RESET RÁPIDO CONCLUÍDO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('   1. Execute: npm run db:generate');
        console.log('   2. Execute: npm run dev');
        console.log('   3. Acesse: http://localhost:3001/api/test-db');

    } catch (error) {
        console.error('\n❌ ERRO DURANTE O RESET:', error.message);
        console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
        console.log('   • Verifique se o PostgreSQL está rodando');
        console.log('   • Confirme se a senha está correta');
        console.log('   • Execute: npm run db:setup (se o banco não existir)');
    }
}

// =============================================
// EXECUÇÃO DO SCRIPT
// =============================================

if (require.main === module) {
    quickReset().catch(console.error);
}

module.exports = { quickReset }; 