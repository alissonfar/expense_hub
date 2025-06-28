'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CreditCard, 
  Calendar,
  DollarSign,
  User,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Receipt,
  ExternalLink
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatRelativeDate, generateAvatarColor, getInitials } from '@/lib/utils'
import { Pagamento, FormaPagamento } from '@/types'
import { usePagamentos } from '@/hooks/usePagamentos'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string; color: string }[] = [
  { value: 'PIX', label: 'PIX', color: 'bg-blue-100 text-blue-800' },
  { value: 'DINHEIRO', label: 'Dinheiro', color: 'bg-green-100 text-green-800' },
  { value: 'TRANSFERENCIA', label: 'Transferência', color: 'bg-purple-100 text-purple-800' },
  { value: 'CARTAO_DEBITO', label: 'Cartão Débito', color: 'bg-orange-100 text-orange-800' },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito', color: 'bg-red-100 text-red-800' },
  { value: 'OUTROS', label: 'Outros', color: 'bg-gray-100 text-gray-800' }
]

export default function PagamentoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchPagamento, deletePagamento, deleteState } = usePagamentos({ autoFetch: false })

  const [pagamento, setPagamento] = useState<Pagamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const pagamentoId = params?.id as string

  // Carregar detalhes do pagamento
  useEffect(() => {
    const carregarPagamento = async () => {
      if (!pagamentoId) return

      try {
        setLoading(true)
        setError(null)
        
        const dados = await fetchPagamento(parseInt(pagamentoId))
        if (dados) {
          setPagamento(dados)
        } else {
          setError('Pagamento não encontrado')
        }
      } catch (err: any) {
        console.error('Erro ao carregar pagamento:', err)
        setError(err.message || 'Erro ao carregar pagamento')
      } finally {
        setLoading(false)
      }
    }

    carregarPagamento()
  }, [pagamentoId, fetchPagamento])

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!pagamento) return

    try {
      await deletePagamento(parseInt(pagamento.id))
      toast({
        title: "Pagamento excluído!",
        description: "O pagamento foi removido com sucesso.",
        duration: 3000,
      })
      router.push('/pagamentos')
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o pagamento.",
        variant: "destructive",
      })
    } finally {
      setDeleteModalOpen(false)
    }
  }

  // Obter cor da forma de pagamento
  const getFormaPagamentoColor = (forma: FormaPagamento) => {
    return FORMAS_PAGAMENTO.find(f => f.value === forma)?.color || 'bg-gray-100 text-gray-800'
  }

  // Obter label da forma de pagamento
  const getFormaPagamentoLabel = (forma: FormaPagamento) => {
    return FORMAS_PAGAMENTO.find(f => f.value === forma)?.label || forma
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !pagamento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pagamentos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagamento não encontrado</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pagamento não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'O pagamento que você está procurando não existe ou foi removido.'}
              </p>
              <Button asChild>
                <Link href="/pagamentos">
                  Voltar para Pagamentos
                </Link>
              </Button>
            </div>
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
            <Link href="/pagamentos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes do Pagamento</h1>
            <p className="text-muted-foreground">
              Pagamento de {formatCurrency(pagamento.valor_total)} • {formatDate(pagamento.data_pagamento)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/pagamentos/${pagamento.id}/editar`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleteState.loading}
          >
            <Trash2 className="w-4 h-4 mr-2 text-red-500" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Informações do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pessoa */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback 
                  className={`text-white ${generateAvatarColor(pagamento.pessoa.nome)}`}
                >
                  {getInitials(pagamento.pessoa.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{pagamento.pessoa.nome}</p>
                <p className="text-sm text-muted-foreground">{pagamento.pessoa.email}</p>
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(pagamento.valor_total)}
                </p>
              </div>
              {pagamento.tem_excedente && (
                <div>
                  <p className="text-sm text-muted-foreground">Excedente</p>
                  <p className="text-lg font-semibold text-green-600">
                    +{formatCurrency(pagamento.valor_excedente || 0)}
                  </p>
                </div>
              )}
            </div>

            {/* Data e Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{formatDate(pagamento.data_pagamento)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(pagamento.data_pagamento)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <Badge 
                  variant="secondary" 
                  className={`mt-1 ${getFormaPagamentoColor(pagamento.forma_pagamento)}`}
                >
                  {getFormaPagamentoLabel(pagamento.forma_pagamento)}
                </Badge>
              </div>
            </div>

            {/* Observações */}
            {pagamento.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {pagamento.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {pagamento.transacoes_pagas?.length || 0}
                </p>
                <p className="text-xs text-blue-600">Transações pagas</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {pagamento.tem_excedente ? '1' : '0'}
                </p>
                <p className="text-xs text-green-600">Com excedente</p>
              </div>
            </div>

            {/* Receita de Excedente */}
            {pagamento.receita_excedente && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-800">Receita de Excedente</p>
                </div>
                <p className="text-sm text-green-700">
                  {pagamento.receita_excedente.descricao}
                </p>
                <p className="text-sm font-medium text-green-800">
                  {formatCurrency(pagamento.receita_excedente.valor_total)}
                </p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href={`/transacoes/${pagamento.receita_excedente.id}`}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ver Receita
                  </Link>
                </Button>
              </div>
            )}

            {/* Datas do Sistema */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Criado em:</span>
                <span>{formatDate(pagamento.criado_em)}</span>
              </div>
              <div className="flex justify-between">
                <span>Atualizado em:</span>
                <span>{formatDate(pagamento.atualizado_em)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Pagas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transações Pagas ({pagamento.transacoes_pagas?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pagamento.transacoes_pagas || pagamento.transacoes_pagas.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma transação vinculada a este pagamento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagamento.transacoes_pagas.map((transacaoPaga, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{transacaoPaga.transacao.descricao}</p>
                          <Badge variant="outline" className="text-xs">
                            {transacaoPaga.transacao.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{formatDate(transacaoPaga.transacao.data_transacao)}</span>
                          <span>Total: {formatCurrency(transacaoPaga.transacao.valor_total)}</span>
                          <Badge 
                            variant={transacaoPaga.transacao.status_pagamento === 'PAGO_TOTAL' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transacaoPaga.transacao.status_pagamento}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(transacaoPaga.valor_aplicado)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valor aplicado
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <Link href={`/transacoes/${transacaoPaga.transacao.id}`}>
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Total Aplicado:</span>
                <span className="text-green-600">
                  {formatCurrency(
                    pagamento.transacoes_pagas.reduce((acc, tp) => acc + tp.valor_aplicado, 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <ConfirmationDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Confirmar Exclusão"
        description="Tem certeza de que deseja excluir este pagamento? Esta ação é irreversível e ajustará os saldos das transações associadas."
        onConfirm={handleConfirmDelete}
        isConfirming={deleteState.loading}
        confirmText="Excluir Pagamento"
        confirmingText="Excluindo..."
      />
    </div>
  )
}

// Componente auxiliar para labels
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium ${className}`}>{children}</label>
} 