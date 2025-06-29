'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { Transacao } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Tags, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Receipt,
  DollarSign
} from 'lucide-react'
import { useTransacaoMutations } from '@/hooks/useTransacaoMutations'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'

export default function TransacaoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params?.id as string)

  const [transacao, setTransacao] = useState<Transacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { deleteTransacao, deleteState } = useTransacaoMutations({
    onSuccess: () => {
      router.push('/transacoes')
    }
  })

  // Buscar detalhes da transação
  useEffect(() => {
    if (!id || isNaN(id)) {
      setError('ID da transação inválido')
      setLoading(false)
      return
    }

    const fetchTransacao = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiGet<{
          success: boolean
          data: Transacao
          message: string
        }>(API_ENDPOINTS.TRANSACOES.GET(id))

        if (response.data.success && response.data.data) {
          setTransacao(response.data.data)
        } else {
          throw new Error(response.data.message || 'Transação não encontrada')
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar transação')
      } finally {
        setLoading(false)
      }
    }

    fetchTransacao()
  }, [id])

  const handleEdit = () => {
    router.push(`/transacoes/${id}/editar`)
  }

  const handleDelete = async () => {
    if (transacao) {
      await deleteTransacao(transacao.id, transacao.descricao)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'destructive'
      case 'PAGO_PARCIAL': return 'secondary'
      case 'PAGO_TOTAL': return 'default'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente'
      case 'PAGO_PARCIAL': return 'Pago Parcial'
      case 'PAGO_TOTAL': return 'Pago Total'
      default: return status
    }
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === 'RECEITA' ? Receipt : DollarSign
  }

  const getTipoColor = (tipo: string) => {
    return tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !transacao) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-red-600 text-lg font-medium">
                {error || 'Transação não encontrada'}
              </div>
              <Button onClick={() => router.push('/transacoes')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Transações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const TipoIcon = getTipoIcon(transacao.tipo)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/transacoes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TipoIcon className={`w-6 h-6 ${getTipoColor(transacao.tipo)}`} />
              {transacao.descricao}
            </h1>
            <p className="text-muted-foreground">
              {transacao.tipo === 'RECEITA' ? 'Receita' : 'Gasto'} #{transacao.id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleEdit} variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-2" />
            Editar
          </Button>
          
          <ConfirmationDialog
            trigger={
              <Button 
                variant="destructive" 
                size="sm"
                disabled={deleteState.loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            }
            title="Confirmar Exclusão"
            description={
              <>
                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                {transacao.status_pagamento !== 'PENDENTE' && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    ⚠️ Esta transação possui pagamentos registrados e pode não ser possível excluí-la.
                  </div>
                )}
              </>
            }
            onConfirm={handleDelete}
            confirmText="Excluir"
            confirmingText="Excluindo..."
            isConfirming={deleteState.loading}
          />
        </div>
      </div>

      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Valor</div>
              <div className={`text-2xl font-bold ${getTipoColor(transacao.tipo)}`}>
                {formatCurrency(transacao.valor_total)}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge variant={getStatusColor(transacao.status_pagamento || 'PENDENTE')}>
                {getStatusText(transacao.status_pagamento || 'PENDENTE')}
              </Badge>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Data da Transação
              </div>
              <div className="text-sm">
                {new Date(transacao.data_transacao).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Local */}
            {transacao.local && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {transacao.tipo === 'RECEITA' ? 'Fonte' : 'Local'}
                </div>
                <div className="text-sm">{transacao.local}</div>
              </div>
            )}
          </div>

          {/* Observações */}
          {transacao.observacoes && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Observações</div>
              <div className="text-sm bg-gray-50 p-3 rounded-md">
                {transacao.observacoes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participantes (apenas para gastos) */}
      {transacao.tipo === 'GASTO' && (transacao as any).transacao_participantes && (transacao as any).transacao_participantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participantes ({(transacao as any).transacao_participantes.length})
            </CardTitle>
            <CardDescription>
              Abaixo estão as pessoas que dividiram este gasto com você.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {(transacao as any).transacao_participantes.map((p: any) => {
                const valorDevido = p.valor_devido || 0;
                const valorPago = p.valor_pago || 0;
                const valorPendente = valorDevido - valorPago;
                const percentualPago = valorDevido > 0 ? (valorPago / valorDevido) * 100 : 0;

                return (
                  <li key={p.pessoa_id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${p.pessoas.email}.png`} alt={p.pessoas.nome} />
                        <AvatarFallback>{p.pessoas.nome.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{p.pessoas.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.pessoas.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-grow max-w-xs">
                      <p className="font-semibold text-sm">{formatCurrency(valorDevido)}</p>
                      {valorPago > 0 && (
                        <p className="text-xs text-green-600">
                          Pago: {formatCurrency(valorPago)}
                        </p>
                      )}
                      {valorPendente > 0 && (
                        <p className="text-xs text-red-600 font-medium">
                          Pendente: {formatCurrency(valorPendente)}
                        </p>
                      )}
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{ width: `${percentualPago}%` }}
                        ></div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {transacao.transacao_tags && transacao.transacao_tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="w-5 h-5" />
              Tags ({transacao.transacao_tags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {transacao.transacao_tags.map((tagRelacao) => (
                <Badge 
                  key={tagRelacao.tag_id} 
                  variant="outline"
                  style={{ 
                    borderColor: tagRelacao.tag.cor || '#6b7280',
                    color: tagRelacao.tag.cor || '#6b7280'
                  }}
                >
                  {tagRelacao.tag.icone && (
                    <span className="mr-1">{tagRelacao.tag.icone}</span>
                  )}
                  {tagRelacao.tag.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Parcelado:</span>{' '}
              {transacao.eh_parcelado ? 'Sim' : 'Não'}
            </div>
            {transacao.eh_parcelado && transacao.total_parcelas && (
              <div>
                <span className="font-medium">Total de Parcelas:</span>{' '}
                {transacao.total_parcelas}
              </div>
            )}
            <div>
              <span className="font-medium">Criado em:</span>{' '}
              {new Date(transacao.data_criacao).toLocaleDateString('pt-BR')}
            </div>
            {transacao.atualizado_em && (
              <div>
                <span className="font-medium">Atualizado em:</span>{' '}
                {new Date(transacao.atualizado_em).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 