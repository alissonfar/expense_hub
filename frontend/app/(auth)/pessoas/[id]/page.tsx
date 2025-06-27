'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Crown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  AlertCircle,
  Eye
} from 'lucide-react'
import { usePessoa, usePessoaMutations } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate, generateAvatarColor } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function PessoaDetalhesPage() {
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()
  const { pessoa, loading, error, refetch } = usePessoa(Number(id))
  const { deletarPessoa, loading: loadingMutation } = usePessoaMutations()

  // Gerar iniciais do nome
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Confirmar exclusão
  const confirmarExclusao = async () => {
    if (!pessoa || !user?.eh_proprietario) {
      toast({
        title: "Sem permissão",
        description: "Apenas proprietários podem desativar pessoas.",
        variant: "destructive",
      })
      return
    }

    const confirmacao = window.confirm(
      `Tem certeza que deseja desativar ${pessoa.nome}?\n\nEsta ação pode ser revertida posteriormente.`
    )

    if (confirmacao) {
      const sucesso = await deletarPessoa(pessoa.id, pessoa.nome)
      if (sucesso) {
        // Recarregar dados ou redirecionar
        refetch()
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !pessoa) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pessoas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Pessoa não encontrada</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar pessoa</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'A pessoa solicitada não foi encontrada.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => refetch()}>
                  Tentar Novamente
                </Button>
                <Button asChild>
                  <Link href="/pessoas">Voltar à Lista</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pessoas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className={`h-12 w-12 ${generateAvatarColor(pessoa.nome)}`}>
              <AvatarFallback className="text-white">
                {getInitials(pessoa.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{pessoa.nome}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={pessoa.eh_proprietario ? "default" : "secondary"}>
                  {pessoa.eh_proprietario ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Proprietário
                    </>
                  ) : (
                    "Participante"
                  )}
                </Badge>
                <Badge variant={pessoa.ativo ? "default" : "destructive"}>
                  {pessoa.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {user?.eh_proprietario && pessoa.ativo && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/pessoas/${id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            
            {!pessoa.eh_proprietario && (
              <Button 
                variant="destructive" 
                onClick={confirmarExclusao}
                disabled={loadingMutation}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loadingMutation ? 'Desativando...' : 'Desativar'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Informações da Pessoa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="font-medium">{pessoa.email}</p>
            </div>

            {pessoa.telefone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Telefone
                </div>
                <p className="font-medium">{pessoa.telefone}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Cadastrado em
              </div>
              <p className="font-medium">
                {pessoa.data_cadastro ? formatDate(pessoa.data_cadastro) : 'Data não disponível'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Atualizado em
              </div>
              <p className="font-medium">
                {pessoa.atualizado_em ? formatDate(pessoa.atualizado_em) : 'Data não disponível'}
              </p>
            </div>
          </div>

          {pessoa.eh_proprietario && (
            <>
              <Separator />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">Proprietário do Sistema</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Esta pessoa tem acesso total ao sistema, incluindo gerenciamento de usuários, 
                  criação de transações e configurações avançadas.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Financeiras */}
      {pessoa.estatisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estatísticas Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Transações</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {pessoa.estatisticas.total_transacoes}
                </p>
                <p className="text-xs text-blue-600">Total de participações</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Devendo</span>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(pessoa.estatisticas.total_devendo)}
                </p>
                <p className="text-xs text-red-600">Valor em aberto</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Recebendo</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(pessoa.estatisticas.total_recebendo)}
                </p>
                <p className="text-xs text-green-600">Valor a receber</p>
              </div>

              <div className={`border rounded-lg p-4 ${
                pessoa.estatisticas.saldo_liquido >= 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`w-5 h-5 ${
                    pessoa.estatisticas.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    pessoa.estatisticas.saldo_liquido >= 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Saldo Líquido
                  </span>
                </div>
                <p className={`text-2xl font-bold ${
                  pessoa.estatisticas.saldo_liquido >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  {formatCurrency(pessoa.estatisticas.saldo_liquido)}
                </p>
                <p className={`text-xs ${
                  pessoa.estatisticas.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {pessoa.estatisticas.saldo_liquido >= 0 ? 'Credor' : 'Devedor'}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Resumo de Pagamentos</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Total pago: <span className="font-medium">{formatCurrency(pessoa.estatisticas.total_pago)}</span></p>
                  <p>Status geral: <span className={`font-medium ${
                    pessoa.estatisticas.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pessoa.estatisticas.saldo_liquido >= 0 ? 'Em dia' : 'Com pendências'}
                  </span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/relatorios/pendencias?pessoa_id=${pessoa.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes Financeiros
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" asChild>
              <Link href={`/transacoes?pessoa_id=${pessoa.id}`}>
                <Receipt className="w-4 h-4 mr-2" />
                Ver Transações
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href={`/pagamentos?pessoa_id=${pessoa.id}`}>
                <DollarSign className="w-4 h-4 mr-2" />
                Ver Pagamentos
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/relatorios/saldos?pessoa_id=${pessoa.id}` as any}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Relatório de Saldos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 