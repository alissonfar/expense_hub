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

async function listarBancos(client) {
    try {
        const result = await client.query(`
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false 
            ORDER BY datname
        `);
        return result.rows.map(row => row.datname);
    } catch (error) {
        console.error('❌ Erro ao listar bancos:', error.message);
        throw error;
    }
}

async function testarConexaoBanco(config, dbName) {
    const dbConfig = { ...config, database: dbName };
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log(`✅ Conectado ao banco '${dbName}'!`);
        
        // Testar algumas queries básicas
        const tabelas = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(`📊 Total de tabelas: ${tabelas.rows[0].count}`);
        
        await client.end();
        return true;
    } catch (error) {
        console.error(`❌ Erro ao conectar ao banco '${dbName}':`, error.message);
        await client.end();
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

// =============================================
// FUNÇÃO PRINCIPAL
// =============================================

async function testConnection() {
    console.log('🔍 TESTE DE CONEXÃO - EXPENSE HUB');
    console.log('==================================\n');

    try {
        // 1. Solicitar senha do PostgreSQL
        const senha = await promptInput('🔑 Digite a senha do usuário postgres: ');
        DB_CONFIG.password = senha;

        // 2. Conectar ao PostgreSQL
        console.log('\n📡 CONECTANDO AO POSTGRESQL...');
        const adminClient = await conectarPostgreSQL(DB_CONFIG);

        // 3. Listar bancos existentes
        console.log('\n📋 BANCOS EXISTENTES:');
        const bancos = await listarBancos(adminClient);
        bancos.forEach(banco => {
            console.log(`   • ${banco}`);
        });

        // 4. Verificar se o banco existe
        console.log(`\n🔍 VERIFICANDO BANCO '${DATABASE_NAME}'...`);
        const bancoExiste = await verificarBancoExiste(adminClient, DATABASE_NAME);
        
        if (bancoExiste) {
            console.log(`✅ Banco '${DATABASE_NAME}' encontrado!`);
            
            // 5. Testar conexão direta ao banco
            console.log(`\n🔗 TESTANDO CONEXÃO DIRETA...`);
            const conexaoOk = await testarConexaoBanco(DB_CONFIG, DATABASE_NAME);
            
            if (conexaoOk) {
                console.log('\n🎉 TUDO FUNCIONANDO PERFEITAMENTE!');
                console.log('\n📋 PRÓXIMOS PASSOS:');
                console.log('   1. Execute: npm run db:reset');
                console.log('   2. Execute: npm run db:generate');
                console.log('   3. Execute: npm run dev');
            } else {
                console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
                console.log('   • O banco existe mas não consegue conectar');
                console.log('   • Verifique permissões do usuário postgres');
                console.log('   • Verifique se há conexões ativas bloqueando');
            }
        } else {
            console.log(`❌ Banco '${DATABASE_NAME}' NÃO encontrado!`);
            console.log('\n💡 SOLUÇÕES:');
            console.log('   1. Execute: npm run db:setup');
            console.log('   2. Ou crie o banco manualmente:');
            console.log(`      CREATE DATABASE ${DATABASE_NAME};`);
        }

        await adminClient.end();

    } catch (error) {
        console.error('\n❌ ERRO DURANTE O TESTE:', error.message);
        console.log('\n🔧 SOLUÇÕES POSSÍVEIS:');
        console.log('   • Verifique se o PostgreSQL está rodando');
        console.log('   • Confirme se a senha está correta');
        console.log('   • Verifique se a porta 5432 está disponível');
        console.log('   • Execute como administrador se necessário');
    }
}

// =============================================
// EXECUÇÃO DO SCRIPT
// =============================================

if (require.main === module) {
    testConnection().catch(console.error);
}

module.exports = { testConnection }; 