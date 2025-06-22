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

const DATABASE_NAME = 'expense_hub_db';

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

async function criarBancoDados(client, dbName) {
    try {
        // Verifica se o banco já existe
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );

        if (result.rows.length === 0) {
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Banco '${dbName}' criado com sucesso!`);
        } else {
            console.log(`ℹ️  Banco '${dbName}' já existe.`);
        }
    } catch (error) {
        console.error('❌ Erro ao criar banco:', error.message);
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

async function validarDatabase(client) {
    try {
        console.log('\n🔍 VALIDANDO SCHEMA E DADOS...');

        // Contar tabelas
        const tabelas = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(`📊 Total de tabelas: ${tabelas.rows[0].count}`);

        // Contar pessoas
        const pessoas = await client.query('SELECT COUNT(*) as count FROM pessoas');
        console.log(`👥 Total de pessoas: ${pessoas.rows[0].count}`);

        // Contar transações
        const transacoes = await client.query('SELECT COUNT(*) as count FROM transacoes');
        console.log(`💰 Total de transações: ${transacoes.rows[0].count}`);

        // Contar pagamentos
        const pagamentos = await client.query('SELECT COUNT(*) as count FROM pagamentos');
        console.log(`💳 Total de pagamentos: ${pagamentos.rows[0].count}`);

        // Verificar view de transações completas
        const viewTransacoes = await client.query('SELECT COUNT(*) as count FROM view_transacoes_completas');
        console.log(`📋 View transações completas: ${viewTransacoes.rows[0].count} registros`);

        // Verificar view de saldos
        const viewSaldos = await client.query('SELECT COUNT(*) as count FROM view_saldos_pessoas');
        console.log(`💹 View saldos pessoas: ${viewSaldos.rows[0].count} registros`);

        // Testar função de saldo do proprietário
        const saldoProprietario = await client.query('SELECT calcular_saldo_pessoa(1) as saldo');
        console.log(`💰 Saldo do proprietário: R$ ${parseFloat(saldoProprietario.rows[0].saldo).toFixed(2)}`);

        console.log('\n✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
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

// =============================================
// FUNÇÃO PRINCIPAL
// =============================================

async function setupDatabase() {
    console.log('🚀 CONFIGURAÇÃO DO BANCO DE DADOS - EXPENSE HUB');
    console.log('=================================================\n');

    try {
        // 1. Solicitar senha do PostgreSQL
        const senha = await promptInput('🔑 Digite a senha do usuário postgres: ');
        DB_CONFIG.password = senha;

        // 2. Conectar ao PostgreSQL
        console.log('\n📡 CONECTANDO AO POSTGRESQL...');
        const adminClient = await conectarPostgreSQL(DB_CONFIG);

        // 3. Criar banco de dados
        console.log('\n🗄️  CRIANDO BANCO DE DADOS...');
        await criarBancoDados(adminClient, DATABASE_NAME);
        await adminClient.end();

        // 4. Conectar ao novo banco
        console.log('\n🔗 CONECTANDO AO BANCO EXPENSE_HUB_DB...');
        const dbConfig = { ...DB_CONFIG, database: DATABASE_NAME };
        const client = await conectarPostgreSQL(dbConfig);

        // 5. Aplicar schema
        console.log('\n📋 APLICANDO SCHEMA...');
        const schemaSQL = await lerArquivoSQL('migrations/001_initial_schema.sql');
        await executarSQL(client, schemaSQL, 'Schema completo');

        // 6. Inserir dados de teste
        console.log('\n📊 INSERINDO DADOS DE TESTE...');
        const dadosSQL = await lerArquivoSQL('migrations/002_dados_teste.sql');
        await executarSQL(client, dadosSQL, 'Dados de teste');

        // 7. Validar instalação
        await validarDatabase(client);

        // 8. Criar arquivo .env
        console.log('\n⚙️  CRIANDO ARQUIVO .ENV...');
        const envContent = `# Database Configuration
DATABASE_URL="postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DATABASE_NAME}?schema=public"

# Application
NODE_ENV=development
PORT=3001

# JWT Secret (mude em produção)
JWT_SECRET=expense_hub_super_secret_key_change_in_production

# Bcrypt rounds
BCRYPT_ROUNDS=10
`;

        fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
        console.log('✅ Arquivo .env criado com sucesso!');

        await client.end();

        // 9. Próximos passos
        console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('\n📋 RESUMO DA INSTALAÇÃO:');
        console.log(`   📂 Banco: ${DATABASE_NAME}`);
        console.log(`   🌐 Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
        console.log(`   👤 Usuário: ${DB_CONFIG.user}`);
        console.log('   📊 Schema aplicado com todas as tabelas, triggers e funções');
        console.log('   🧪 Dados de teste inseridos');
        console.log('   ⚙️  Arquivo .env configurado');

        console.log('\n🚀 PRÓXIMOS PASSOS:');
        console.log('   1. cd backend');
        console.log('   2. npm run dev (para iniciar o servidor)');
        console.log('   3. Testar as APIs no Postman ou navegador');

        console.log('\n🔍 PARA VALIDAR NO POSTGRESQL:');
        console.log('   SELECT * FROM view_transacoes_completas;');
        console.log('   SELECT * FROM view_saldos_pessoas;');
        console.log('   SELECT calcular_saldo_pessoa(1);');

    } catch (error) {
        console.error('\n💥 ERRO DURANTE A CONFIGURAÇÃO:', error.message);
        console.log('\n🛠️  POSSÍVEIS SOLUÇÕES:');
        console.log('   - Verifique se o PostgreSQL está instalado e rodando');
        console.log('   - Confirme a senha do usuário postgres');
        console.log('   - Verifique se a porta 5432 está livre');
        console.log('   - Execute como administrador se necessário');
        process.exit(1);
    }
}

// =============================================
// EXECUÇÃO
// =============================================

if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase }; 