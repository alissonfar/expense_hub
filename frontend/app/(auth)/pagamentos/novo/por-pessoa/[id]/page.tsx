'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, CreditCard, AlertCircle, Info, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { usePagamentos } from '@/hooks/usePagamentos'
import { usePessoas } from '@/hooks/usePessoas'
import { PagamentoForm, FormaPagamento, Transacao, Pessoa } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'DEBITO', label: 'Cartão Débito' },
  { value: 'CREDITO', label: 'Cartão Crédito' },
  { value: 'OUTROS', label: 'Outros' }
]

interface PageProps {
  params: { id: string }
}

export default function TransacoesPessoaPage({ params }: PageProps) {
  const router = useRouter()
  const pessoaId = parseInt(params.id)
  
  // Hooks
  const { createPagamento, createState } = usePagamentos({ autoFetch: false })
  const { getPessoaComTransacoes, loading: pessoasLoading } = usePessoas()
  
  // Estados
  const [pessoa, setPessoa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados do formulário
  const [formData, setFormData] = useState<Partial<PagamentoForm>>({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX',
    observacoes: '',
    processar_excedente: true,
    criar_receita_excedente: true
  })
  
  // Estados de controle
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<{
    transacao_id: number
    valor_aplicado: number
    transacao: Transacao
  }[]>([])
  const [valorTotalPago, setValorTotalPago] = useState<number>(0)
  
  // Carregar pessoa com transações
  useEffect(() => {
    const carregarPessoa = async () => {
      setLoading(true)
      const pessoaData = await getPessoaComTransacoes(pessoaId)
      setPessoa(pessoaData)
      setLoading(false)
    }
    
    carregarPessoa()
  }, [pessoaId, getPessoaComTransacoes])
  
  // Filtrar transações pendentes da pessoa
  const transacoesPendentes = pessoa?.transacoes?.filter((t: any) => 
    t.status_pagamento === 'PENDENTE' || t.status_pagamento === 'PAGO_PARCIAL'
  ) || []
  
  // Calcular valores
  const valorTotalAplicado = transacoesSelecionadas.reduce((acc, t) => acc + t.valor_aplicado, 0)
  const valorExcedente = Math.max(0, valorTotalPago - valorTotalAplicado)
  const saldoPendenteTotal = transacoesPendentes.reduce((total, t) => {
    if (t.status_pagamento === 'PENDENTE') {
      return total + (t.transacao_participantes?.[0]?.valor_devido ?? 0)
    } else if (t.status_pagamento === 'PAGO_PARCIAL') {
      const valorDevido = t.transacao_participantes?.[0]?.valor_devido ?? 0
      const valorPago = t.transacao_participantes?.[0]?.valor_pago ?? 0
      return total + (valorDevido - valorPago)
    }
    return total
  }, 0)
  
  // Selecionar/deselecionar transação
  const toggleTransacao = (transacao: Transacao) => {
    const valorRestante = transacao.transacao_participantes?.[0]?.valor_devido ?? 0
    const valorJaPago = transacao.transacao_participantes?.[0]?.valor_pago ?? 0
    const valorDisponivel = valorRestante - valorJaPago
    
    const jaSelecionada = transacoesSelecionadas.some(t => t.transacao_id === transacao.id)
    
    if (jaSelecionada) {
      setTransacoesSelecionadas(prev => prev.filter(t => t.transacao_id !== transacao.id))
    } else {
      setTransacoesSelecionadas(prev => [...prev, {
        transacao_id: transacao.id,
        valor_aplicado: valorDisponivel,
        transacao
      }])
    }
  }
  
  // Atualizar valor aplicado em uma transação
  const atualizarValorAplicado = (transacaoId: number, novoValor: number) => {
    setTransacoesSelecionadas(prev => prev.map(t => 
      t.transacao_id === transacaoId 
        ? { ...t, valor_aplicado: novoValor }
        : t
    ))
  }
  
  // Selecionar todas as transações
  const selecionarTodas = () => {
    const todasTransacoes = transacoesPendentes.map(transacao => {
      const valorRestante = transacao.transacao_participantes?.[0]?.valor_devido ?? 0
      const valorJaPago = transacao.transacao_participantes?.[0]?.valor_pago ?? 0
      const valorDisponivel = valorRestante - valorJaPago
      
      return {
        transacao_id: transacao.id,
        valor_aplicado: valorDisponivel,
        transacao
      }
    })
    
    setTransacoesSelecionadas(todasTransacoes)
  }
  
  // Deselecionar todas as transações
  const deselecionarTodas = () => {
    setTransacoesSelecionadas([])
  }
  
  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!formData.data_pagamento) {
      toast({
        title: 'Data obrigatória',
        description: 'Informe a data do pagamento',
        variant: 'destructive'
      })
      return
    }
    
    if (transacoesSelecionadas.length === 0) {
      toast({
        title: 'Transações obrigatórias',
        description: 'Selecione pelo menos uma transação',
        variant: 'destructive'
      })
      return
    }
    
    if (!valorTotalPago || valorTotalPago <= 0) {
      toast({
        title: 'Valor obrigatório',
        description: 'Informe o valor total pago',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const dadosPagamento: PagamentoForm = {
        transacoes: transacoesSelecionadas.map(t => ({
          transacao_id: t.transacao_id,
          valor_aplicado: t.valor_aplicado
        })),
        data_pagamento: formData.data_pagamento!,
        forma_pagamento: formData.forma_pagamento!,
        observacoes: formData.observacoes,
        processar_excedente: formData.processar_excedente,
        criar_receita_excedente: formData.criar_receita_excedente
      }
      
      console.log('[TransacoesPessoa] Criando pagamento:', dadosPagamento)
      
      await createPagamento(dadosPagamento)
      
      toast({
        title: 'Pagamento criado!',
        description: `Pagamento registrado para ${pessoa?.nome}`,
        duration: 3000,
      })
      
      router.push('/pagamentos')
    } catch (error: any) {
      console.error('[TransacoesPessoa] Erro ao criar pagamento:', error)
      // O erro já foi tratado no hook
    }
  }
  
  if (loading || pessoasLoading) {
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
  
  if (!pessoa) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pagamentos/novo/por-pessoa">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pessoa não encontrada</h3>
            <p className="text-muted-foreground">
              A pessoa selecionada não foi encontrada no sistema
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pagamentos/novo/por-pessoa">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transações de {pessoa.nome}</h1>
            <p className="text-muted-foreground">
              Selecione as transações pendentes para pagar
            </p>
          </div>
        </div>
      </div>
      
      {/* Informações da Pessoa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Informações da Pessoa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
              <p className="text-lg font-semibold">{pessoa.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg">{pessoa.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Saldo Pendente</Label>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(saldoPendenteTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de Transações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transações Pendentes</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selecionarTodas}
                  disabled={transacoesPendentes.length === 0}
                >
                  Selecionar Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselecionarTodas}
                  disabled={transacoesSelecionadas.length === 0}
                >
                  Deselecionar Todas
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transacoesPendentes.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma transação pendente</h3>
                <p className="text-muted-foreground">
                  {pessoa.nome} está em dia com todos os pagamentos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transacoesPendentes.map((transacao) => {
                  const valorRestante = transacao.transacao_participantes?.[0]?.valor_devido ?? 0
                  const valorJaPago = transacao.transacao_participantes?.[0]?.valor_pago ?? 0
                  const valorDisponivel = valorRestante - valorJaPago
                  const selecionada = transacoesSelecionadas.some(t => t.transacao_id === transacao.id)
                  const valorAplicado = transacoesSelecionadas.find(t => t.transacao_id === transacao.id)?.valor_aplicado || 0
                  
                  return (
                    <div
                      key={transacao.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        selecionada ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selecionada}
                          onCheckedChange={() => toggleTransacao(transacao)}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{transacao.descricao}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={transacao.status_pagamento === 'PENDENTE' ? 'destructive' : 'secondary'}>
                                {transacao.status_pagamento === 'PENDENTE' ? 'Pendente' : 'Pago Parcial'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(transacao.data_transacao)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Valor Total:</span>
                              <span className="ml-2 font-medium">{formatCurrency(transacao.valor_total ?? 0)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Valor Restante:</span>
                              <span className="ml-2 font-medium text-green-600">{formatCurrency(valorDisponivel ?? 0)}</span>
                            </div>
                            {selecionada && (
                              <div>
                                <Label className="text-muted-foreground">Valor a Aplicar:</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={valorDisponivel}
                                  value={valorAplicado}
                                  onChange={(e) => atualizarValorAplicado(transacao.id, parseFloat(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Informações do Pagamento */}
        {transacoesSelecionadas.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Data do Pagamento */}
                <div>
                  <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
                  <Input
                    id="data_pagamento"
                    type="date"
                    value={formData.data_pagamento}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      data_pagamento: e.target.value 
                    }))}
                    required
                  />
                </div>
                
                {/* Forma de Pagamento */}
                <div>
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Select 
                    value={formData.forma_pagamento} 
                    onValueChange={(value: FormaPagamento) => 
                      setFormData(prev => ({ ...prev, forma_pagamento: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map(forma => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Valor Total Pago */}
                <div>
                  <Label htmlFor="valor_total_pago">Valor Total Pago *</Label>
                  <Input
                    id="valor_total_pago"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valorTotalPago || ''}
                    onChange={(e) => setValorTotalPago(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    required
                  />
                </div>
                
                {/* Observações */}
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      observacoes: e.target.value 
                    }))}
                    placeholder="Observações sobre o pagamento..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {transacoesSelecionadas.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Transações selecionadas
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(valorTotalAplicado)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Valor aplicado
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(valorExcedente)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Excedente
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Configurações de Excedente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Configurações de Excedente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="processar_excedente"
                    checked={formData.processar_excedente}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, processar_excedente: checked as boolean }))
                    }
                  />
                  <Label htmlFor="processar_excedente">
                    Processar excedente automaticamente
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criar_receita_excedente"
                    checked={formData.criar_receita_excedente}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, criar_receita_excedente: checked as boolean }))
                    }
                  />
                  <Label htmlFor="criar_receita_excedente">
                    Criar receita para valores excedentes
                  </Label>
                </div>
                
                {valorExcedente > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Excedente detectado:</strong> {formatCurrency(valorExcedente)}
                      {formData.criar_receita_excedente && (
                        <span className="block mt-1">
                          Uma receita será criada automaticamente para este valor.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Ações */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/pagamentos/novo/por-pessoa">
                  Cancelar
                </Link>
              </Button>
              <Button 
                type="submit" 
                disabled={createState.loading}
                className="min-w-[120px]"
              >
                {createState.loading ? (
                  'Criando...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Pagamento
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
} 