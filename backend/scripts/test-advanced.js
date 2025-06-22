// Teste avançado das funcionalidades do banco
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAdvancedFeatures() {
  try {
    console.log('🧪 Testando funcionalidades avançadas...\n')
    
    // 1. Teste de triggers - verificar status automático
    console.log('📊 1. Status de pagamento automático:')
    const transacoes = await prisma.transacoes.findMany({
      include: {
        transacao_participantes: true,
        pagamentos: true
      }
    })
    
    transacoes.forEach(t => {
      const totalDevido = t.transacao_participantes.reduce((sum, p) => sum + Number(p.valor_devido), 0)
      const totalPago = t.pagamentos.reduce((sum, p) => sum + Number(p.valor_pago), 0)
      console.log(`   • ${t.descricao}: R$ ${totalPago}/${totalDevido} - Status: ${t.status_pagamento}`)
    })
    
    // 2. Teste das views personalizadas
    console.log('\n📈 2. Views personalizadas:')
    try {
      const viewTransacoes = await prisma.$queryRaw`SELECT * FROM view_transacoes_completas LIMIT 2`
      console.log(`   • view_transacoes_completas: ${viewTransacoes.length} registros`)
      
      const viewSaldos = await prisma.$queryRaw`SELECT * FROM view_saldos_pessoas`
      console.log(`   • view_saldos_pessoas: ${viewSaldos.length} registros`)
    } catch (error) {
      console.log(`   • Views: ${error.message}`)
    }
    
    // 3. Teste de função personalizada
    console.log('\n💰 3. Função de cálculo de saldo:')
    try {
      const saldoJoao = await prisma.$queryRaw`SELECT calcular_saldo_pessoa(4) as saldo`
      console.log(`   • Saldo do João: R$ ${saldoJoao[0]?.saldo || 'N/A'}`)
    } catch (error) {
      console.log(`   • Função de saldo: ${error.message}`)
    }
    
    // 4. Teste de parcelamento
    console.log('\n📅 4. Sistema de parcelamento:')
    const parceladas = await prisma.transacoes.findMany({
      where: { eh_parcelado: true }
    })
    console.log(`   • Transações parceladas encontradas: ${parceladas.length}`)
    
    // 5. Teste de constraints e validações
    console.log('\n🔒 5. Validações e constraints:')
    const pessoaProprietario = await prisma.pessoas.findFirst({
      where: { eh_proprietario: true }
    })
    console.log(`   • Proprietário encontrado: ${pessoaProprietario?.nome || 'Nenhum'}`)
    
    // 6. Performance de relacionamentos complexos
    console.log('\n⚡ 6. Query complexa (relacionamentos):')
    const queryCompleta = await prisma.pessoas.findMany({
      include: {
        transacao_participantes: {
          include: {
            transacoes: {
              include: {
                transacao_tags: {
                  include: {
                    tags: true
                  }
                }
              }
            }
          }
        },
        pagamentos_pagamentos_pessoa_idTopessoas: true
      }
    })
    console.log(`   • Pessoas com dados completos: ${queryCompleta.length}`)
    
    console.log('\n✅ Todos os testes avançados executados!')
    
  } catch (error) {
    console.error('❌ Erro nos testes avançados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdvancedFeatures() 