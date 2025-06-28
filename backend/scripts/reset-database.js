const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Erro ao executar: ${cmd}`);
    process.exit(1);
  }
}

console.log('==========================================');
console.log('  RESET TOTAL DO BANCO DE DADOS (PRISMA)  ');
console.log('==========================================\n');

// 1. Drop all tables (prisma migrate reset)
run('npx prisma migrate reset --force --skip-seed');

// 2. (Opcional) Executar seed se desejar
// run('npx prisma db seed');

console.log('\n✅ Banco de dados resetado com sucesso!'); 