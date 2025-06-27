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
    database: 'postgres' // Conecta ao banco padrão primeiro
};

const DATABASE_NAME = 'personal_expense_hub';

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

async function conectarPostgreSQL(config) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL!');
        return client;
    } catch (error) {
        console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
        console.log('\n🔧 Verifique se:');
        console.log('   - PostgreSQL está rodando');
        console.log('   - Credenciais estão corretas');
        console.log('   - Porta 5432 está disponível');
        throw error;
    }
}

async function verificarBancoExiste(client, dbName) {
    try {
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error.message);
        throw error;
    }
}

async function conectarAoBancoAplicacao(config, dbName) {
    const dbConfig = { ...config, database: dbName };
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log(`✅ Conectado ao banco '${dbName}'!`);
        return client;
    } catch (error) {
        console.error(`❌ Erro ao conectar ao banco '${dbName}':`, error.message);
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

async function lerArquivoSQL(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
        console.error(`❌ Erro ao ler arquivo ${filePath}:`, error.message);
        throw error;
    }
}

async function obterContadores(client) {
    try {
        const contadores = {};
        
        // Contar registros em cada tabela
        const tabelas = [
            'pessoas', 'tags', 'transacoes', 'transacao_participantes', 
            'transacao_tags', 'pagamentos', 'pagamento_transacoes', 'configuracoes_sistema'
        ];
        
        for (const tabela of tabelas) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${tabela}`);
                contadores[tabela] = parseInt(result.rows[0].count);
            } catch (error) {
                contadores[tabela] = 0; // Tabela não existe ainda
            }
        }
        
        return contadores;
    } catch (error) {
        console.error('❌ Erro ao obter contadores:', error.message);
        return {};
    }
}

async function limparBancoDados(client) {
    try {
        console.log('\n🗑️  LIMPANDO BANCO DE DADOS...');
        
        // Obter contadores antes da limpeza
        const contadoresAntes = await obterContadores(client);
        
        console.log('📊 Dados encontrados antes da limpeza:');
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
        
        for (const tabela of tabelasParaLimpar) {
            try {
                await client.query(`DELETE FROM ${tabela}`);
                console.log(`   ✅ ${tabela} limpa`);
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
        
        console.log('\n✅ Banco de dados limpo com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao limpar banco:', error.message);
        throw error;
    }
}

async function reaplicarSchema(client) {
    try {
        console.log('\n📋 REAPLICANDO SCHEMA...');
        
        // Aplicar schema completo
        const schemaSQL = await lerArquivoSQL('migrations/001_initial_schema.sql');
        await executarSQL(client, schemaSQL, 'Schema completo');
        
        console.log('✅ Schema reaplicado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao reaplicar schema:', error.message);
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

async function validarReset(client) {
    try {
        console.log('\n🔍 VALIDANDO RESET...');
        
        const contadoresDepois = await obterContadores(client);
        
        console.log('📊 Dados após o reset:');
        Object.entries(contadoresDepois).forEach(([tabela, count]) => {
            console.log(`   • ${tabela}: ${count} registros`);
        });
        
        // Verificar se há pelo menos um proprietário
        const proprietarios = await client.query('SELECT COUNT(*) as count FROM pessoas WHERE eh_proprietario = true');
        if (parseInt(proprietarios.rows[0].count) === 0) {
            console.log('⚠️  ATENÇÃO: Nenhum proprietário encontrado!');
        } else {
            console.log('✅ Proprietário encontrado');
        }
        
        console.log('\n✅ VALIDAÇÃO CONCLUÍDA!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro na validação:', error.message);
        return false;
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

async function resetDatabase() {
    console.log('🔄 RESET DO BANCO DE DADOS - EXPENSE HUB');
    console.log('==========================================\n');
    
    console.log('⚠️  ATENÇÃO: Esta operação irá:');
    console.log('   • Remover TODOS os dados do banco');
    console.log('   • Resetar todas as sequências de ID');
    console.log('   • Reaplicar o schema completo');
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

        // 3. Conectar ao PostgreSQL
        console.log('\n📡 CONECTANDO AO POSTGRESQL...');
        const adminClient = await conectarPostgreSQL(DB_CONFIG);

        // 4. Verificar se o banco existe
        const bancoExiste = await verificarBancoExiste(adminClient, DATABASE_NAME);
        await adminClient.end();

        if (!bancoExiste) {
            console.log(`❌ Banco '${DATABASE_NAME}' não encontrado!`);
            console.log('💡 Execute primeiro: npm run db:setup');
            return;
        }

        // 5. Conectar ao banco da aplicação
        console.log('\n🔗 CONECTANDO AO BANCO DA APLICAÇÃO...');
        const client = await conectarAoBancoAplicacao(DB_CONFIG, DATABASE_NAME);

        // 6. Limpar banco de dados
        await limparBancoDados(client);

        // 7. Perguntar se quer reaplicar schema
        const querReaplicarSchema = await promptConfirmacao('Deseja reaplicar o schema completo?');
        if (querReaplicarSchema) {
            await reaplicarSchema(client);
        }

        // 8. Perguntar se quer inserir dados básicos
        const inserirDados = await promptConfirmacao('Deseja inserir dados básicos de teste?');
        if (inserirDados) {
            await inserirDadosBasicos(client);
        }

        // 9. Validar reset
        await validarReset(client);

        await client.end();

        // 10. Próximos passos
        console.log('\n🎉 RESET CONCLUÍDO COM SUCESSO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('   1. Execute: npm run db:generate');
        console.log('   2. Execute: npm run dev');
        console.log('   3. Acesse: http://localhost:3001/api/test-db');
        console.log('   4. Faça login com os dados de teste');

    } catch (error) {
        console.error('\n❌ ERRO DURANTE O RESET:', error.message);
        console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
        console.log('   • Verifique se o PostgreSQL está rodando');
        console.log('   • Confirme se a senha está correta');
        console.log('   • Execute: npm run db:setup (se o banco não existir)');
        console.log('   • Verifique as permissões do usuário postgres');
    }
}

// =============================================
// EXECUÇÃO DO SCRIPT
// =============================================

if (require.main === module) {
    resetDatabase().catch(console.error);
}

module.exports = { resetDatabase }; 