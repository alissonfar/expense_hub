'use client'

import React, { useState } from 'react'
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
import { ArrowLeft, Plus, Save, CreditCard, AlertCircle, Info } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { usePagamentos } from '@/hooks/usePagamentos'
import { useTransacoes } from '@/hooks/useTransacoes'
import { PagamentoForm, FormaPagamento, Transacao } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'DEBITO', label: 'Cartão Débito' },
  { value: 'CREDITO', label: 'Cartão Crédito' },
  { value: 'OUTROS', label: 'Outros' }
]

export default function PagarPorTransacaoPage() {
  const router = useRouter()
  
  // Hooks
  const { createPagamento, createState } = usePagamentos({ autoFetch: false })
  const { transacoes, loading: transacoesLoading } = useTransacoes({ autoFetch: true })

  // Estados do formulário
  const [formData, setFormData] = useState<Partial<PagamentoForm>>({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX',
    observacoes: '',
    processar_excedente: true,
    criar_receita_excedente: true
  })

  // Estados de controle
  const [tipoPagamento, setTipoPagamento] = useState<'individual' | 'composto'>('individual')
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<number | null>(null)
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<{
    transacao_id: number
    valor_aplicado: number
    transacao: Transacao
  }[]>([])
  const [valorTotalPago, setValorTotalPago] = useState<number>(0)

  // Filtrar transações pendentes
  const transacoesPendentes = transacoes.filter(t => 
    t.status_pagamento === 'PENDENTE' || t.status_pagamento === 'PAGO_PARCIAL'
  )

  // Calcular valor total aplicado
  const valorTotalAplicado = transacoesSelecionadas.reduce((acc, t) => acc + t.valor_aplicado, 0)
  const valorExcedente = Math.max(0, valorTotalPago - valorTotalAplicado)

  // Adicionar transação ao pagamento composto
  const adicionarTransacao = () => {
    if (!transacaoSelecionada) return

    const transacao = transacoes.find(t => t.id === transacaoSelecionada)
    if (!transacao) return

    // Verificar se já foi adicionada
    if (transacoesSelecionadas.some(t => t.transacao_id === transacaoSelecionada)) {
      toast({
        title: 'Transação já adicionada',
        description: 'Esta transação já foi incluída no pagamento',
        variant: 'destructive'
      })
      return
    }

    // Calcular valor restante da transação
    const valorRestante = transacao.participantes?.[0]?.valor_devido || 0
    const valorJaPago = transacao.participantes?.[0]?.valor_pago || 0
    const valorDisponivel = valorRestante - valorJaPago

    setTransacoesSelecionadas(prev => [...prev, {
      transacao_id: transacaoSelecionada,
      valor_aplicado: valorDisponivel,
      transacao
    }])

    setTransacaoSelecionada(null)
  }

  // Remover transação do pagamento composto
  const removerTransacao = (transacaoId: number) => {
    setTransacoesSelecionadas(prev => prev.filter(t => t.transacao_id !== transacaoId))
  }

  // Atualizar valor aplicado em uma transação
  const atualizarValorAplicado = (transacaoId: number, novoValor: number) => {
    setTransacoesSelecionadas(prev => prev.map(t => 
      t.transacao_id === transacaoId 
        ? { ...t, valor_aplicado: novoValor }
        : t
    ))
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

    if (tipoPagamento === 'individual') {
      if (!transacaoSelecionada) {
        toast({
          title: 'Transação obrigatória',
          description: 'Selecione uma transação para pagar',
          variant: 'destructive'
        })
        return
      }

      if (!valorTotalPago || valorTotalPago <= 0) {
        toast({
          title: 'Valor obrigatório',
          description: 'Informe o valor pago',
          variant: 'destructive'
        })
        return
      }
    } else {
      if (transacoesSelecionadas.length === 0) {
        toast({
          title: 'Transações obrigatórias',
          description: 'Adicione pelo menos uma transação',
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
    }

    try {
      let dadosPagamento: PagamentoForm

      if (tipoPagamento === 'individual') {
        const transacao = transacoes.find(t => t.id === transacaoSelecionada)
        if (!transacao) throw new Error('Transação não encontrada')

        dadosPagamento = {
          transacao_id: transacaoSelecionada,
          valor_pago: valorTotalPago,
          data_pagamento: formData.data_pagamento!,
          forma_pagamento: formData.forma_pagamento!,
          observacoes: formData.observacoes,
          processar_excedente: formData.processar_excedente,
          criar_receita_excedente: formData.criar_receita_excedente
        }
      } else {
        dadosPagamento = {
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
      }

      console.log('[PagarPorTransacao] Criando pagamento:', dadosPagamento)

      await createPagamento(dadosPagamento)

      toast({
        title: 'Pagamento criado!',
        description: 'O pagamento foi registrado com sucesso',
        duration: 3000,
      })

      router.push('/pagamentos')
    } catch (error: any) {
      console.error('[PagarPorTransacao] Erro ao criar pagamento:', error)
      // O erro já foi tratado no hook
    }
  }

  if (transacoesLoading) {
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
            <h1 className="text-3xl font-bold tracking-tight">Pagar por Transação</h1>
            <p className="text-muted-foreground">
              Selecione transações específicas para pagar
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Tipo de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={tipoPagamento === 'individual' ? 'default' : 'outline'}
                onClick={() => setTipoPagamento('individual')}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="font-medium">Individual</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Pagar uma transação específica
                </span>
              </Button>

              <Button
                type="button"
                variant={tipoPagamento === 'composto' ? 'default' : 'outline'}
                onClick={() => setTipoPagamento('composto')}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Composto</span>
                </div>
                <span className="text-sm text-muted-foreground text-left">
                  Pagar múltiplas transações
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
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

        {/* Seleção de Transações */}
        {tipoPagamento === 'individual' ? (
          <Card>
            <CardHeader>
              <CardTitle>Transação a Pagar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selecionar Transação */}
              <div>
                <Label htmlFor="transacao">Selecionar Transação *</Label>
                <Select 
                  value={transacaoSelecionada?.toString() || ''} 
                  onValueChange={(value) => setTransacaoSelecionada(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma transação pendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {transacoesPendentes.map(transacao => (
                      <SelectItem key={transacao.id} value={transacao.id.toString()}>
                        {transacao.descricao} - {formatCurrency(transacao.valor_total)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor Pago */}
              <div>
                <Label htmlFor="valor_pago">Valor Pago *</Label>
                <Input
                  id="valor_pago"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorTotalPago || ''}
                  onChange={(e) => setValorTotalPago(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Informações da Transação Selecionada */}
              {transacaoSelecionada && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Informações da Transação</h4>
                  {(() => {
                    const transacao = transacoes.find(t => t.id === transacaoSelecionada)
                    if (!transacao) return null

                    const valorRestante = transacao.participantes?.[0]?.valor_devido || 0
                    const valorJaPago = transacao.participantes?.[0]?.valor_pago || 0
                    const valorDisponivel = valorRestante - valorJaPago

                    return (
                      <div className="space-y-2 text-sm">
                        <p><strong>Descrição:</strong> {transacao.descricao}</p>
                        <p><strong>Valor Total:</strong> {formatCurrency(transacao.valor_total)}</p>
                        <p><strong>Valor Restante:</strong> {formatCurrency(valorDisponivel)}</p>
                        <p><strong>Data:</strong> {formatDate(transacao.data_transacao)}</p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transações a Pagar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar Transação */}
              <div className="flex gap-2">
                <Select 
                  value={transacaoSelecionada?.toString() || ''} 
                  onValueChange={(value) => setTransacaoSelecionada(parseInt(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Escolha uma transação pendente" />
                  </SelectTrigger>
                  <SelectContent>
                    {transacoesPendentes
                      .filter(t => !transacoesSelecionadas.some(ts => ts.transacao_id === t.id))
                      .map(transacao => (
                        <SelectItem key={transacao.id} value={transacao.id.toString()}>
                          {transacao.descricao} - {formatCurrency(transacao.valor_total)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={adicionarTransacao}
                  disabled={!transacaoSelecionada}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Lista de Transações Selecionadas */}
              {transacoesSelecionadas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Transações Selecionadas:</h4>
                  {transacoesSelecionadas.map((item, index) => (
                    <div key={item.transacao_id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.transacao.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.transacao.data_transacao)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.valor_aplicado}
                          onChange={(e) => atualizarValorAplicado(item.transacao_id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removerTransacao(item.transacao_id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

              {/* Resumo */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Resumo do Pagamento</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Valor Aplicado:</strong> {formatCurrency(valorTotalAplicado)}</p>
                  <p><strong>Valor Pago:</strong> {formatCurrency(valorTotalPago)}</p>
                  <p><strong>Excedente:</strong> {formatCurrency(valorExcedente)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            <Link href="/pagamentos/novo">
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
      </form>
    </div>
  )
} 