'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { usePessoas } from '@/hooks/usePessoas'
import { formatCurrency } from '@/lib/utils'

export default function PagarPorPessoaPage() {
  const router = useRouter()
  const { pessoas, loading, getPessoaComTransacoes } = usePessoas()
  const [searchTerm, setSearchTerm] = useState('')
  const [pessoasComPendencias, setPessoasComPendencias] = useState<any[]>([])
  const [loadingPendencias, setLoadingPendencias] = useState(true)

  // Carregar pessoas com transações pendentes
  useEffect(() => {
    const carregarPessoasComPendencias = async () => {
      setLoadingPendencias(true)
      
      try {
        const pessoasComTransacoes = await Promise.all(
          pessoas.map(async (pessoa) => {
            const pessoaCompleta = await getPessoaComTransacoes(pessoa.id)
            return pessoaCompleta
          })
        )

        // Filtrar apenas pessoas com transações pendentes
        const pessoasComPendencias = pessoasComTransacoes.filter(pessoa => {
          if (!pessoa || !pessoa.transacoes) return false
          
          return pessoa.transacoes.some((t: any) => 
            t.status_pagamento === 'PENDENTE' || t.status_pagamento === 'PAGO_PARCIAL'
          )
        })

        setPessoasComPendencias(pessoasComPendencias)
      } catch (error) {
        console.error('[PagarPorPessoa] Erro ao carregar pessoas com pendências:', error)
      } finally {
        setLoadingPendencias(false)
      }
    }

    if (pessoas.length > 0) {
      carregarPessoasComPendencias()
    }
  }, [pessoas, getPessoaComTransacoes])

  // Filtrar pessoas com base na busca
  const pessoasFiltradas = pessoasComPendencias.filter(pessoa => {
    if (!pessoa) return false
    
    const matchesSearch = pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pessoa.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Calcular saldo pendente de uma pessoa
  const calcularSaldoPendente = (pessoa: any) => {
    if (!pessoa.transacoes) return 0
    return pessoa.transacoes.reduce((total: number, transacao: any) => {
      const participantes = transacao.transacao_participantes ?? [];
      return total + participantes.reduce((acc: number, p: any) => {
        if (transacao.status_pagamento === 'PENDENTE') {
          return acc + (p.valor_devido ?? 0)
        } else if (transacao.status_pagamento === 'PAGO_PARCIAL') {
          const valorDevido = p.valor_devido ?? 0
          const valorPago = p.valor_pago ?? 0
          return acc + (valorDevido - valorPago)
        }
        return acc
      }, 0)
    }, 0)
  }

  // Contar transações pendentes
  const contarTransacoesPendentes = (pessoa: any) => {
    if (!pessoa.transacoes) return 0
    
    return pessoa.transacoes.filter((t: any) => 
      t.status_pagamento === 'PENDENTE' || t.status_pagamento === 'PAGO_PARCIAL'
    ).length
  }

  const handlePessoaClick = (pessoaId: number) => {
    router.push(`/pagamentos/novo/por-pessoa/${pessoaId}`)
  }

  if (loading || loadingPendencias) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pagamentos/novo">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagar por Pessoa</h1>
            <p className="text-muted-foreground">
              Selecione uma pessoa para ver suas transações pendentes
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pessoas */}
      {pessoasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa com pendências'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Todas as pessoas estão em dia com seus pagamentos'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pessoasFiltradas.map((pessoa) => {
            const saldoPendente = calcularSaldoPendente(pessoa)
            const transacoesPendentes = contarTransacoesPendentes(pessoa)
            
            return (
              <Card 
                key={pessoa.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePessoaClick(pessoa.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{pessoa.nome}</h3>
                        {pessoa.eh_proprietario && (
                          <Badge variant="secondary">Proprietário</Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {pessoa.email}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span>{transacoesPendentes} transação{transacoesPendentes !== 1 ? 'ões' : ''} pendente{transacoesPendentes !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            Saldo pendente: {formatCurrency(saldoPendente)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(saldoPendente)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total pendente
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Estatísticas */}
      {pessoasFiltradas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {pessoasFiltradas.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pessoas com pendências
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {pessoasFiltradas.reduce((total, pessoa) => 
                    total + contarTransacoesPendentes(pessoa), 0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Transações pendentes
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    pessoasFiltradas.reduce((total, pessoa) => 
                      total + calcularSaldoPendente(pessoa), 0
                    )
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Valor total pendente
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 