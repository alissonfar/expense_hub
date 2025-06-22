// Teste de conexão Prisma
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o banco...')
    
    // Teste básico - contar registros
    const pessoasCount = await prisma.pessoas.count()
    const transacoesCount = await prisma.transacoes.count()
    const tagsCount = await prisma.tags.count()
    const pagamentosCount = await prisma.pagamentos.count()
    
    console.log('✅ Conexão bem-sucedida!')
    console.log('📊 Dados no banco:')
    console.log(`   • Pessoas: ${pessoasCount}`)
    console.log(`   • Transações: ${transacoesCount}`)
    console.log(`   • Tags: ${tagsCount}`)
    console.log(`   • Pagamentos: ${pagamentosCount}`)
    
    // Teste de relacionamento - buscar transação com participantes
    console.log('\n🔗 Teste de relacionamentos:')
    const transacaoCompleta = await prisma.transacoes.findFirst({
      include: {
        transacao_participantes: {
          include: {
            pessoas: true
          }
        },
        transacao_tags: {
          include: {
            tags: true
          }
        },
        pessoas_transacoes_proprietario_idTopessoas: true
      }
    })
    
    if (transacaoCompleta) {
      console.log(`   • Transação: ${transacaoCompleta.descricao}`)
      console.log(`   • Proprietário: ${transacaoCompleta.pessoas_transacoes_proprietario_idTopessoas.nome}`)
      console.log(`   • Participantes: ${transacaoCompleta.transacao_participantes.length}`)
      console.log(`   • Tags: ${transacaoCompleta.transacao_tags.length}`)
    }
    
    console.log('\n🎉 Prisma configurado e funcionando perfeitamente!')
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection() 