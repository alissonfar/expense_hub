const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyTriggers() {
  console.log('==========================================');
  console.log('  APLICANDO TRIGGERS DE INTEGRIDADE');
  console.log('  Personal Expense Hub - Multi-Tenant');
  console.log('==========================================\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'apply-integrity-triggers.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Lendo script SQL...');
    console.log('🔍 Executando triggers de integridade...\n');

    // Executar o script SQL
    await prisma.$executeRawUnsafe(sqlContent);

    console.log('✅ Triggers aplicados com sucesso!');
    console.log('\n📋 Triggers instalados:');
    console.log('   • trigger_validar_tag_transacao_hub');
    console.log('   • trigger_validar_pagamento_transacao_hub');
    console.log('   • trigger_validar_participante_hub');
    console.log('\n🛡️  Isolamento multi-tenant garantido!');

  } catch (error) {
    console.error('❌ Erro ao aplicar triggers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyTriggers();
}

module.exports = { applyTriggers }; 