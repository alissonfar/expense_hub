'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, CreditCard, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { usePagamentos } from '@/hooks/usePagamentos'
import { PagamentoForm, FormaPagamento, Pagamento } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'CARTAO_DEBITO', label: 'Cartão Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito' },
  { value: 'OUTROS', label: 'Outros' }
]

export default function EditarPagamentoPage() {
  const router = useRouter()
  const params = useParams()
  const pagamentoId = parseInt(params?.id as string)

  const { 
    fetchPagamento, 
    updatePagamento, 
    updateState 
  } = usePagamentos({ autoFetch: false })

  // Estados
  const [pagamento, setPagamento] = useState<Pagamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Partial<PagamentoForm>>({
    data_pagamento: '',
    forma_pagamento: 'PIX',
    observacoes: ''
  })

  /**
   * Carregar dados do pagamento
   */
  useEffect(() => {
    const carregarPagamento = async () => {
      try {
        setLoading(true)
        
        const pagamentoData = await fetchPagamento(pagamentoId)
        
        if (pagamentoData) {
          setPagamento(pagamentoData)
          setFormData({
            data_pagamento: pagamentoData.data_pagamento,
            forma_pagamento: pagamentoData.forma_pagamento,
            observacoes: pagamentoData.observacoes || ''
          })
        } else {
          toast({
            title: 'Erro',
            description: 'Pagamento não encontrado',
            variant: 'destructive'
          })
          router.push('/pagamentos')
        }
      } catch (err: any) {
        console.error('[EditarPagamento] Erro ao carregar pagamento:', err)
        toast({
          title: 'Erro',
          description: err.message || 'Erro ao carregar dados do pagamento',
          variant: 'destructive'
        })
        router.push('/pagamentos')
      } finally {
        setLoading(false)
      }
    }

    if (pagamentoId && !isNaN(pagamentoId)) {
      carregarPagamento()
    } else {
      toast({
        title: 'Erro',
        description: 'ID do pagamento inválido',
        variant: 'destructive'
      })
      router.push('/pagamentos')
    }
  }, [pagamentoId, fetchPagamento, router])

  /**
   * Submeter formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pagamento) return

    // Validações básicas
    if (!formData.data_pagamento) {
      toast({
        title: 'Erro',
        description: 'Data do pagamento é obrigatória',
        variant: 'destructive'
      })
      return
    }

    try {
      console.log('[EditarPagamento] Atualizando pagamento:', formData)

      await updatePagamento(pagamentoId, formData)

      toast({
        title: 'Sucesso',
        description: 'Pagamento atualizado com sucesso',
        variant: 'default'
      })

      router.push('/pagamentos')
    } catch (err: any) {
      console.error('[EditarPagamento] Erro ao atualizar:', err)
      // O erro já foi tratado no hook
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-16" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pagamento) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pagamento não encontrado</h3>
          <p className="text-muted-foreground mb-4">
            O pagamento que você está tentando editar não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/pagamentos">
              Voltar para Pagamentos
            </Link>
          </Button>
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
            <Link href="/pagamentos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Pagamento</h1>
            <p className="text-muted-foreground">
              Atualize as informações do pagamento
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Resumo do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Pessoa</p>
              <p className="font-medium">{pagamento.pessoa.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">{formatCurrency(pagamento.valor_total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="font-medium">{pagamento.transacoes_pagas?.length || 0} transação(ões)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="font-medium">{formatDate(pagamento.criado_em)}</p>
            </div>
          </div>

          {pagamento.tem_excedente && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Excedente:</strong> {formatCurrency(pagamento.valor_excedente || 0)}
                {pagamento.receita_excedente && (
                  <span className="block mt-1">
                    Receita criada: {pagamento.receita_excedente.descricao}
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Edição */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Editáveis</CardTitle>
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
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Limitações de Edição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Restrições de Edição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">O que não pode ser alterado:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Pessoa que fez o pagamento</li>
                <li>• Valor total pago</li>
                <li>• Transações vinculadas ao pagamento</li>
                <li>• Configurações de excedente já processadas</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Transações Vinculadas */}
        {pagamento.transacoes_pagas && pagamento.transacoes_pagas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transações Vinculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pagamento.transacoes_pagas.map((tp, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{tp.transacao.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tp.transacao.data_transacao)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(tp.valor_aplicado)}</p>
                      <p className="text-sm text-muted-foreground">Valor aplicado</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/pagamentos">
              Cancelar
            </Link>
          </Button>
          <Button 
            type="submit" 
            disabled={updateState.loading}
            className="min-w-[120px]"
          >
            {updateState.loading ? (
              'Salvando...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 