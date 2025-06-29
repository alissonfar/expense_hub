'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Save, CreditCard, AlertCircle, Info, Trash2, Loader2, X, Check } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { usePagamentos } from '@/hooks/usePagamentos'
import { useTransacoes } from '@/hooks/useTransacoes'
import { usePessoas } from '@/hooks/usePessoas'
import { Pagamento, PagamentoForm, FormaPagamento, Transacao, TransacaoParticipante } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'OUTROS', label: 'Outros' }
]

export default function PagarPorTransacaoPage() {
  const router = useRouter()
  
  // Hooks
  const { createPagamento, createState } = usePagamentos({ autoFetch: false })
  const { transacoes, loading: transacoesLoading } = useTransacoes()
  const { pessoas, loading: pessoasLoading } = usePessoas()

  // Estados do formulário
  const [formData, setFormData] = useState<Partial<PagamentoForm>>({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX',
    observacoes: '',
    processar_excedente: true,
    criar_receita_excedente: true
  })

  // Estados de controle
  const [pessoaIdPagador, setPessoaIdPagador] = useState<number | null>(null)
  const [tipoPagamento, setTipoPagamento] = useState<'individual' | 'composto'>('individual')
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<number | null>(null)
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<{
    transacao_id: number
    valor_aplicado: number
    transacao: Transacao
  }[]>([])
  const [valorTotalPago, setValorTotalPago] = useState<number>(0)
  const [minPaymentDate, setMinPaymentDate] = useState<string | undefined>(undefined)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [pagamentoSalvo, setPagamentoSalvo] = useState<Pagamento | null>(null)

  useEffect(() => {
    // Zera o valor se a transação for desmarcada ou o pagador removido
    if (!transacaoSelecionada || !pessoaIdPagador) {
      setValorTotalPago(0)
      return
    }

    const transacao = transacoes.find(t => t.id === transacaoSelecionada)
    if (transacao) {
      const participante = transacao.transacao_participantes.find(p => p.pessoa_id === pessoaIdPagador)
      if (participante) {
        const valorPendente = (participante.valor_devido || 0) - (participante.valor_pago || 0)
        // Preenche automaticamente o campo de valor com o total pendente
        setValorTotalPago(Number(valorPendente.toFixed(2)))
      } else {
        // Pessoa não é participante, zera o valor
        setValorTotalPago(0)
      }
    }
  }, [transacaoSelecionada, pessoaIdPagador, transacoes])

  // Efeito para ajustar a data mínima de pagamento permitida
  useEffect(() => {
    let newMinDate: string | undefined = undefined;

    if (tipoPagamento === 'individual' && transacaoSelecionada) {
      const transacao = transacoes.find(t => t.id === transacaoSelecionada);
      if (transacao) {
        newMinDate = new Date(transacao.data_transacao).toISOString().split('T')[0];
      }
    } else if (tipoPagamento === 'composto' && transacoesSelecionadas.length > 0) {
      const latestTimestamp = Math.max(...transacoesSelecionadas.map(t => new Date(t.transacao.data_transacao).getTime()));
      newMinDate = new Date(latestTimestamp).toISOString().split('T')[0];
    }

    setMinPaymentDate(newMinDate);

    if (newMinDate && formData.data_pagamento && formData.data_pagamento < newMinDate) {
      setFormData(prev => ({ ...prev, data_pagamento: newMinDate }));
      toast({
        title: "Data do Pagamento Ajustada",
        description: `A data foi ajustada para não ser anterior à data da transação mais recente.`,
        variant: "default"
      });
    }
  }, [transacaoSelecionada, transacoesSelecionadas, tipoPagamento, transacoes]);

  // Filtrar transações pendentes com base na pessoa selecionada
  const transacoesPendentes = transacoes.filter(t => {
    const isPendente = t.status_pagamento === 'PENDENTE' || t.status_pagamento === 'PAGO_PARCIAL';
    if (!isPendente) return false;
    if (!pessoaIdPagador) return true; // Mostra todas se nenhuma pessoa selecionada
    
    // Mostra a transação se a pessoa selecionada for participante dela
    return t.transacao_participantes.some(p => p.pessoa_id === pessoaIdPagador);
  });

  // Calcular valor total aplicado
  const valorTotalAplicado = transacoesSelecionadas.reduce((acc, t) => acc + t.valor_aplicado, 0)
  const valorExcedente = Math.max(0, valorTotalPago - valorTotalAplicado)

  // Adicionar transação ao pagamento composto
  const adicionarTransacao = () => {
    if (!pessoaIdPagador) {
      toast({
        title: 'Selecione um pagador',
        description: 'Você precisa selecionar quem está pagando antes de adicionar transações.',
        variant: 'destructive'
      })
      return;
    }

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

    // Encontrar o participante específico
    const participante = transacao.transacao_participantes.find(p => p.pessoa_id === pessoaIdPagador);
    if (!participante) {
      toast({
        title: 'Pagador não é participante',
        description: 'A pessoa selecionada como pagadora não participa desta transação.',
        variant: 'destructive'
      })
      return;
    }

    const valorPendente = (participante.valor_devido || 0) - (participante.valor_pago || 0);

    setTransacoesSelecionadas(prev => [...prev, {
      transacao_id: transacaoSelecionada,
      valor_aplicado: Number(valorPendente.toFixed(2)),
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

  // Achar transação para pagamento individual
  const transacaoParaPagamentoIndividual = useMemo(() => {
    if (tipoPagamento !== 'individual' || !transacaoSelecionada) return null;
    return transacoes.find((t: Transacao) => t.id === transacaoSelecionada);
  }, [transacoes, tipoPagamento, transacaoSelecionada]);

  // Achar participante na transação individual
  const participanteNaTransacaoIndividual = useMemo(() => {
    if (!transacaoParaPagamentoIndividual || !pessoaIdPagador) return null;
    return transacaoParaPagamentoIndividual.transacao_participantes?.find((p: TransacaoParticipante) => p.pessoa_id === pessoaIdPagador);
  }, [transacaoParaPagamentoIndividual, pessoaIdPagador]);

  // Calcular valor devido na transação individual
  const valorTotalPagoIndividual = useMemo(() => {
    if (tipoPagamento === 'individual') {
      const valor = parseFloat(formData.valor_pago || '0');
      return isNaN(valor) ? 0 : valor;
    }
    return 0;
  }, [formData.valor_pago, tipoPagamento]);

  // Efeito para recalcular dívida total quando pagador ou transações mudam
  useEffect(() => {
    if (!pessoaIdPagador) {
      setValorTotalPago(0);
      return;
    }

    const total = transacoes
      .filter((t: Transacao) => t.transacao_participantes?.some((p: TransacaoParticipante) => p.pessoa_id === pessoaIdPagador))
      .reduce((acc, t) => {
        const participante = t.transacao_participantes?.find((p: TransacaoParticipante) => p.pessoa_id === pessoaIdPagador);
        if (participante) {
          const valorPendente = parseFloat(participante.valor_devido) - parseFloat(participante.valor_pago);
          return acc + (valorPendente > 0 ? valorPendente : 0);
        }
        return acc;
      }, 0);

    setValorTotalPago(total);
  }, [pessoaIdPagador, transacoes]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!pessoaIdPagador) {
      newErrors.pagador = 'É obrigatório selecionar a pessoa que está pagando.'
    }
    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'A data do pagamento é obrigatória.'
    }
    if (tipoPagamento === 'individual') {
      if (!transacaoSelecionada) {
        newErrors.transacao = 'É obrigatório selecionar uma transação para pagamento individual.'
      }
      if (!valorTotalPago || valorTotalPago <= 0) {
        newErrors.valor_pago = 'O valor pago deve ser maior que zero.'
      }
    } else { // Composto
      if (transacoesSelecionadas.length === 0) {
        newErrors.transacoes = 'Adicione pelo menos uma transação ao pagamento.'
      }
      if (!valorTotalPago || valorTotalPago <= 0) {
        newErrors.valor_total = 'O valor total pago deve ser maior que zero.'
      }
      const totalAplicado = transacoesSelecionadas.reduce((acc, t) => acc + t.valor_aplicado, 0)
      if (valorTotalPago < totalAplicado) {
        newErrors.valor_total_insuficiente = 'O valor total pago não pode ser menor que o valor aplicado nas transações.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetFormulario = () => {
    setFormData({
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: 'PIX',
      observacoes: '',
      processar_excedente: true,
      criar_receita_excedente: true
    })
    setTipoPagamento('individual')
    setTransacaoSelecionada(null)
    setTransacoesSelecionadas([])
    setValorTotalPago(0)
    setErrors({})
    setShowSuccess(false)
    setPagamentoSalvo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      const primeiroErro = Object.values(errors)[0]
      toast({
        title: 'Erro de Validação',
        description: primeiroErro || 'Verifique os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const dadosPagamento: PagamentoForm = {
      data_pagamento: formData.data_pagamento!,
      forma_pagamento: formData.forma_pagamento!,
      observacoes: formData.observacoes,
      processar_excedente: formData.processar_excedente,
      criar_receita_excedente: formData.criar_receita_excedente,
      pessoa_id: pessoaIdPagador!,
    }

    if (tipoPagamento === 'individual') {
      dadosPagamento.transacao_id = transacaoSelecionada!
      dadosPagamento.valor_pago = valorTotalPago
    } else {
      dadosPagamento.transacoes = transacoesSelecionadas.map(t => ({
        transacao_id: t.transacao_id,
        valor_aplicado: t.valor_aplicado,
      }))
      dadosPagamento.valor_total = valorTotalPago
    }

    await createPagamento(dadosPagamento, {
      autoToast: false,
      onSuccess: (pagamentoCriado) => {
        setPagamentoSalvo(pagamentoCriado)
        setShowSuccess(true)
        toast({
          title: '🎉 Pagamento Salvo!',
          description: `Pagamento de ${formatCurrency(pagamentoCriado.valor_total)} registrado com sucesso.`,
          duration: 5000,
        })
        setTimeout(() => {
          router.push('/pagamentos')
        }, 4000)
      },
      onError: (error) => {
        toast({
          title: '❌ Erro ao Salvar',
          description: error.message || 'Não foi possível registrar o pagamento.',
          variant: 'destructive',
        })
      },
    })
  }

  if (showSuccess && pagamentoSalvo) {
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100 shadow-lg animate-in slide-in-from-top-4 duration-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-1">
                  🎉 Pagamento Salvo com Sucesso!
                </h3>
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    Valor Total: <span className="font-medium">{formatCurrency(pagamentoSalvo.valor_total)}</span>
                  </p>
                  {pagamentoSalvo.valor_excedente > 0 && (
                    <p className="text-green-600">
                      Excedente Gerado: <span className="font-medium">{formatCurrency(pagamentoSalvo.valor_excedente)}</span>
                    </p>
                  )}
                  <p className="text-xs opacity-80">Redirecionando para a lista de pagamentos em 4s...</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={resetFormulario} className="border-green-300 text-green-700 hover:bg-green-200">
                <Plus className="h-4 w-4 mr-2" />
                Novo Pagamento
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/pagamentos')} className="text-green-600 hover:bg-green-200">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
            <CardTitle>Tipo de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <Button
                type="button"
                variant={tipoPagamento === 'individual' ? 'default' : 'ghost'}
                onClick={() => setTipoPagamento('individual')}
              >
                Individual
              </Button>
              <Button
                type="button"
                variant={tipoPagamento === 'composto' ? 'default' : 'ghost'}
                onClick={() => setTipoPagamento('composto')}
              >
                Composto
              </Button>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
              {tipoPagamento === 'individual' 
                ? 'Ideal para pagar uma única transação específica.'
                : 'Ideal para pagar múltiplas transações de uma só vez com um único valor.'}
            </p>
          </CardContent>
        </Card>

        {/* Pagador */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pagador</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid gap-2">
                <Label htmlFor="pagador">Quem está pagando?</Label>
                <Select
                  onValueChange={(value) => setPessoaIdPagador(Number(value))}
                  defaultValue={pessoaIdPagador?.toString()}
                >
                  <SelectTrigger id="pagador">
                    <SelectValue placeholder="Selecione a pessoa que está realizando o pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {pessoas.map((pessoa) => (
                      <SelectItem key={pessoa.id} value={pessoa.id.toString()}>
                        {pessoa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-sm text-muted-foreground">
                  Este campo define em nome de quem o pagamento será registrado.
                </p>
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
                min={minPaymentDate}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
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
                  disabled={!transacaoSelecionada}
                />
              </div>

              {transacaoSelecionada && pessoaIdPagador && (() => {
                const transacao = transacoes.find(t => t.id === transacaoSelecionada)
                const pessoa = pessoas.find(p => p.id === pessoaIdPagador)
                if (!transacao || !pessoa) return null

                const participante = transacao.transacao_participantes.find(p => p.pessoa_id === pessoaIdPagador)

                if (!participante) {
                  return (
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-center">
                      <p>
                        <strong>Atenção:</strong> {pessoa.nome} não participa da transação selecionada.
                      </p>
                    </div>
                  )
                }

                const valorDevido = participante.valor_devido || 0
                const valorPago = participante.valor_pago || 0
                const valorPendente = valorDevido - valorPago

                return (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
                    <h4 className="font-semibold text-center mb-2">
                      Detalhes da Dívida de {pessoa.nome}
                    </h4>
                    <div className="flex justify-between">
                      <span>Valor devido na transação:</span>
                      <span className="font-medium">{formatCurrency(valorDevido)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor já pago:</span>
                      <span className="font-medium text-green-600">{formatCurrency(valorPago)}</span>
                    </div>
                    <Separator className="my-1"/>
                    <div className="flex justify-between font-bold text-base">
                      <span>Pendente:</span>
                      <span className="text-red-600">{formatCurrency(valorPendente)}</span>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento Composto</CardTitle>
              <CardDescription>Adicione as transações e informe o valor total do pagamento.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="transacao-composto">Selecionar Transação</Label>
                   <Select
                    value={transacaoSelecionada?.toString() || ''}
                    onValueChange={(value) => setTransacaoSelecionada(Number(value))}
                    disabled={!pessoaIdPagador}
                  >
                    <SelectTrigger id="transacao-composto">
                      <SelectValue placeholder={!pessoaIdPagador ? "Selecione um pagador primeiro" : "Selecione uma transação"} />
                    </SelectTrigger>
                    <SelectContent>
                      {transacoesPendentes.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.descricao} - {formatCurrency(t.valor_total)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={adicionarTransacao} disabled={!transacaoSelecionada}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Transação
                </Button>
              </div>
              
              <Separator className="my-6" />

              {transacoesSelecionadas.length > 0 ? (
                <>
                  <h4 className="font-medium text-lg mb-4">Transações Adicionadas</h4>
                  <ul className="space-y-4">
                    {transacoesSelecionadas.map(t => {
                      const participante = t.transacao.transacao_participantes.find(p => p.pessoa_id === pessoaIdPagador);
                      const valorDevido = participante?.valor_devido || 0;
                      const valorPago = participante?.valor_pago || 0;
                      const valorPendente = valorDevido - valorPago;
                      
                      return (
                      <li key={t.transacao_id} className="p-4 border rounded-lg space-y-4 bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-base">{t.transacao.descricao}</p>
                            <p className="text-sm text-muted-foreground">Data: {formatDate(t.transacao.data_transacao)}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removerTransacao(t.transacao_id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="text-sm space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <div className="flex justify-between">
                            <span>Devido por {pessoas.find(p => p.id === pessoaIdPagador)?.nome?.split(' ')[0] || 'Pagador'}:</span>
                            <span className="font-medium">{formatCurrency(valorDevido)}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                             <span>Já Pago:</span>
                            <span className="font-medium">{formatCurrency(valorPago)}</span>
                          </div>
                          <Separator/>
                          <div className="flex justify-between font-bold">
                            <span>Pendente:</span>
                            <span>{formatCurrency(valorPendente)}</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`valor-aplicado-${t.transacao_id}`} className="font-medium">Valor a Pagar nesta Transação</Label>
                          <Input
                            id={`valor-aplicado-${t.transacao_id}`}
                            type="number"
                            step="0.01"
                            value={t.valor_aplicado}
                            onChange={(e) => atualizarValorAplicado(t.transacao_id, parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </li>
                    )})}
                  </ul>
                </>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  <p>Nenhuma transação adicionada.</p>
                  <p className="text-xs">Use o seletor acima para começar.</p>
                </div>
              )}

               {transacoesSelecionadas.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <CardTitle className="mb-4">Resumo do Pagamento</CardTitle>
                  
                  <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">Total Aplicado nas Transações:</span>
                      <span className="font-bold">{formatCurrency(valorTotalAplicado)}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valor-total-pago" className="text-lg font-medium">Valor Total do Pagamento*</Label>
                      <Input
                        id="valor-total-pago"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={valorTotalPago || ''}
                        onChange={(e) => setValorTotalPago(parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        required
                        className="h-12 text-xl"
                      />
                    </div>
                    
                    <Separator />

                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">Diferença:</span>
                      <span className={`font-bold ${
                        (valorTotalPago - valorTotalAplicado) < 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {formatCurrency(valorTotalPago - valorTotalAplicado)}
                        {(valorTotalPago - valorTotalAplicado) > 0 && " (Excedente)"}
                        {(valorTotalPago - valorTotalAplicado) < 0 && " (Faltante)"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                      <div className="flex items-start space-x-3 rounded-md border p-4">
                        <Checkbox id="processar_excedente" checked={formData.processar_excedente} onCheckedChange={(checked) => setFormData(prev => ({...prev, processar_excedente: !!checked}))} />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="processar_excedente"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Processar excedente automaticamente
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Se o valor pago for maior que o aplicado, o sistema tentará usar o excedente em outras dívidas.
                          </p>
                        </div>
                      </div>
                       <div className="flex items-start space-x-3 rounded-md border p-4">
                        <Checkbox id="criar_receita_excedente" checked={formData.criar_receita_excedente} onCheckedChange={(checked) => setFormData(prev => ({...prev, criar_receita_excedente: !!checked}))} />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="criar_receita_excedente"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Criar receita para valores excedentes
                          </label>
                          <p className="text-sm text-muted-foreground">
                             Se houver excedente, uma nova transação de receita será criada com o valor restante.
                          </p>
                        </div>
                      </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={createState.loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createState.loading} className="min-w-[150px]">
            {createState.loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Criar Pagamento'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 