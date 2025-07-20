const axios = require('axios');
const crypto = require('crypto');

const API_BASE = 'http://localhost:3001/api';
const TEST_EMAIL = `teste.convite.${Date.now()}@example.com`;
const TEST_PASSWORD = 'Teste@123456';

console.log('🧪 TESTE DO FLUXO DE CONVITE E VERIFICAÇÃO');
console.log('=' .repeat(60));

async function testConviteVerificacaoFlow() {
  try {
    console.log('📋 Dados do teste:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Senha: ${TEST_PASSWORD}`);
    console.log('');

    // 1. Criar usuário admin para fazer o convite
    console.log('👤 1. Criando usuário admin...');
    const adminData = {
      nome: 'Admin Teste',
      email: `admin.${Date.now()}@example.com`,
      senha: 'Admin@123456',
      telefone: '(11) 99999-9999',
      nomeHub: 'Hub de Teste'
    };

    const adminResponse = await axios.post(`${API_BASE}/auth/register`, adminData);
    console.log('   ✅ Admin criado:', adminResponse.data.message);

    // 2. Fazer login do admin
    console.log('\n🔐 2. Fazendo login do admin...');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: adminData.email,
      senha: adminData.senha
    });

    const adminToken = adminLoginResponse.data.data.refreshToken;
    console.log('   ✅ Admin logado');

    // 3. Selecionar hub do admin
    console.log('\n🏢 3. Selecionando hub do admin...');
    const hubId = adminLoginResponse.data.data.hubs[0].id;
    const selectHubResponse = await axios.post(`${API_BASE}/auth/select-hub`, {
      hubId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const adminAccessToken = selectHubResponse.data.data.accessToken;
    console.log('   ✅ Hub selecionado');

    // 4. Convidar membro
    console.log('\n📧 4. Convidando membro...');
    const conviteResponse = await axios.post(`${API_BASE}/pessoas/convidar`, {
      email: TEST_EMAIL,
      nome: 'Membro Teste',
      role: 'MEMBRO'
    }, {
      headers: { Authorization: `Bearer ${adminAccessToken}` }
    });

    console.log('   ✅ Convite enviado:', conviteResponse.data.message);

    // 5. Buscar dados do convite no banco
    console.log('\n🔍 5. Buscando dados do convite...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const pessoaConvidada = await prisma.pessoas.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        nome: true,
        email: true,
        conviteToken: true,
        conviteAtivo: true,
        emailVerificado: true,
        senha_hash: true,
        ativo: true
      }
    });

    if (!pessoaConvidada) {
      throw new Error('Pessoa convidada não encontrada');
    }

    console.log('   📊 Status antes da ativação:');
    console.log(`      - Convite ativo: ${pessoaConvidada.conviteAtivo}`);
    console.log(`      - Email verificado: ${pessoaConvidada.emailVerificado}`);
    console.log(`      - Tem senha: ${!!pessoaConvidada.senha_hash}`);
    console.log(`      - Ativo: ${pessoaConvidada.ativo}`);

    // 6. Ativar convite
    console.log('\n✅ 6. Ativando convite...');
    const ativacaoResponse = await axios.post(`${API_BASE}/auth/ativar-convite`, {
      token: pessoaConvidada.conviteToken,
      novaSenha: TEST_PASSWORD
    });

    console.log('   ✅ Convite ativado:', ativacaoResponse.data.message);

    // 7. Verificar status após ativação
    console.log('\n🔍 7. Verificando status após ativação...');
    const pessoaAtivada = await prisma.pessoas.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        nome: true,
        email: true,
        conviteToken: true,
        conviteAtivo: true,
        emailVerificado: true,
        emailVerificadoEm: true,
        senha_hash: true,
        ativo: true
      }
    });

    console.log('   📊 Status após ativação:');
    console.log(`      - Convite ativo: ${pessoaAtivada.conviteAtivo}`);
    console.log(`      - Email verificado: ${pessoaAtivada.emailVerificado}`);
    console.log(`      - Data verificação: ${pessoaAtivada.emailVerificadoEm}`);
    console.log(`      - Tem senha: ${!!pessoaAtivada.senha_hash}`);
    console.log(`      - Ativo: ${pessoaAtivada.ativo}`);

    // 8. Tentar fazer login
    console.log('\n🔐 8. Testando login após ativação...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      senha: TEST_PASSWORD
    });

    console.log('   ✅ Login bem-sucedido:', loginResponse.data.message);
    console.log('   📊 Hubs disponíveis:', loginResponse.data.data.hubs.length);

    // 9. Verificar se pode selecionar hub
    console.log('\n🏢 9. Testando seleção de hub...');
    const membroToken = loginResponse.data.data.refreshToken;
    const membroHubId = loginResponse.data.data.hubs[0].id;

    const selectHubMembroResponse = await axios.post(`${API_BASE}/auth/select-hub`, {
      hubId: membroHubId
    }, {
      headers: { Authorization: `Bearer ${membroToken}` }
    });

    console.log('   ✅ Hub selecionado pelo membro');
    console.log('   🔑 Access token gerado:', !!selectHubMembroResponse.data.data.accessToken);

    await prisma.$disconnect();

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('=' .repeat(60));
    console.log('✅ Fluxo de convite e verificação funcionando corretamente');
    console.log('✅ Conta marcada como verificada após ativação');
    console.log('✅ Login funcionando após ativação');
    console.log('✅ Seleção de hub funcionando');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.response?.data || error.message);
    
    if (error.response?.data?.error === 'EmailNaoVerificado') {
      console.error('🚨 PROBLEMA: Conta não foi marcada como verificada!');
      console.error('   Isso indica que a correção não foi aplicada corretamente.');
    }
    
    console.log('\n🔧 VERIFICAÇÕES:');
    console.log('   1. Backend está rodando?');
    console.log('   2. Correção foi aplicada?');
    console.log('   3. Banco de dados está acessível?');
  }
}

// Executar teste
testConviteVerificacaoFlow(); 