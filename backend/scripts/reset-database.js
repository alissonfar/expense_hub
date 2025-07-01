const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Erro ao executar: ${cmd}`);
    if (e.stdout) console.error('STDOUT:', e.stdout.toString());
    if (e.stderr) console.error('STDERR:', e.stderr.toString());
    if (e.message) console.error('Mensagem:', e.message);
    process.exit(1);
  }
}

console.log('==========================================');
console.log('  RESET TOTAL DO BANCO DE DADOS (PRISMA)  ');
console.log('==========================================\n');

// Diagnóstico: mostrar DATABASE_URL
console.log('DATABASE_URL:', process.env.DATABASE_URL || '(não definida)');

// Diagnóstico: versão do Prisma CLI
run('npx prisma --version');

// 1. Drop all tables (prisma migrate reset)
run('npx prisma migrate reset --force --skip-seed');

// 2. (Opcional) Executar seed se desejar
// run('npx prisma db seed');

console.log('\n✅ Banco de dados resetado com sucesso!'); 