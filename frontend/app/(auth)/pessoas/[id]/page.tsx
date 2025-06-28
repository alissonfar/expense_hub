'use client'

import React from 'react'
<<<<<<< HEAD
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Crown, User, Mail, Phone, Calendar, Activity } from 'lucide-react'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

import { usePessoas } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'

interface PessoaDetalhesPageProps {
  params: {
    id: string
  }
}

export default function PessoaDetalhesPage({ params }: PessoaDetalhesPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { pessoas, loading, error } = usePessoas()

  const pessoaId = parseInt(params.id)
  const pessoa = pessoas.find(p => p.id === pessoaId)

  // Função para gerar iniciais do nome
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
=======
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Eye,
  Info,
  List,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart,
  Contact
} from 'lucide-react'
import { usePessoa, usePessoaMutations } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate, generateAvatarColor } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useSaldoHistorico } from '@/hooks/useSaldoHistorico'
import { Chart } from '@/components/charts/Chart'

export default function PessoaDetalhesPage() {
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()
  const { pessoa, loading, error, refetch } = usePessoa(Number(id))
  const { deletarPessoa, loading: loadingMutation } = usePessoaMutations()
  const { data: chartData, loading: chartLoading, error: chartError } = useSaldoHistorico(pessoa?.id);

  const router = useRouter()

  // Gerar iniciais do nome
  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
>>>>>>> transacoesFront
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

<<<<<<< HEAD
  // Função para gerar cor do avatar
  const getAvatarColor = (nome: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
    ]
    const index = nome.length % colors.length
    return colors[index]
  }

  // Verificar se usuário pode gerenciar pessoas
  const canManage = user?.eh_proprietario
=======
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
>>>>>>> transacoesFront

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
<<<<<<< HEAD
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
=======
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
>>>>>>> transacoesFront
          </CardContent>
        </Card>
      </div>
    )
  }

<<<<<<< HEAD
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">Erro ao carregar pessoa: {error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
=======
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
>>>>>>> transacoesFront
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

<<<<<<< HEAD
  if (!pessoa) {
    notFound()
  }

=======
>>>>>>> transacoesFront
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
<<<<<<< HEAD
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes da Pessoa</h1>
            <p className="text-muted-foreground">
              Informações completas sobre {pessoa.nome}
            </p>
          </div>
        </div>

        {canManage && (
          <Button onClick={() => router.push(`/pessoas/${pessoa.id}/editar`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {/* Informações Principais */}
=======
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
>>>>>>> transacoesFront
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
<<<<<<< HEAD
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-20 w-20">
              <AvatarFallback className={`text-white text-xl ${getAvatarColor(pessoa.nome)}`}>
                {getInitials(pessoa.nome)}
              </AvatarFallback>
            </Avatar>

            {/* Informações */}
            <div className="flex-1 space-y-4">
              {/* Nome e Status */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold">{pessoa.nome}</h2>
                  {pessoa.eh_proprietario ? (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Crown className="h-3 w-3 mr-1" />
                      Proprietário
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      Participante
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{pessoa.email}</p>
                  </div>
                </div>

                {pessoa.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{pessoa.telefone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                      {new Date(pessoa.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Última atualização</p>
                    <p className="font-medium">
                      {new Date(pessoa.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas (se disponível) */}
=======
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
>>>>>>> transacoesFront
      {pessoa.estatisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
<<<<<<< HEAD
              <Activity className="h-5 w-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {pessoa.estatisticas.total_transacoes}
                </p>
                <p className="text-sm text-muted-foreground">Transações</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  R$ {pessoa.estatisticas.total_pago?.toFixed(2) || '0,00'}
                </p>
                <p className="text-sm text-muted-foreground">Total Pago</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  R$ {pessoa.estatisticas.total_pendente?.toFixed(2) || '0,00'}
                </p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
            </div>
=======
              <DollarSign className="h-5 w-5" />
              Estatísticas Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total de Transações */}
                <Link href={`/transacoes?pessoa_id=${pessoa.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-1">
                        Transações
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total de transações em que esta pessoa participou.</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardTitle>
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {pessoa.estatisticas.total_participacoes}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total de participações
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Valor Devendo */}
                <Link href={`/relatorios/pendencias?pessoa_id=${pessoa.id}&status_saldo=DEVEDOR`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Devendo</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total que esta pessoa ainda precisa pagar <br /> de todas as suas participações em despesas.</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">
                        {formatCurrency(Number(pessoa.estatisticas.total_devido_pendente) || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Valor a Receber */}
                <Link href={`/relatorios/pendencias?pessoa_id=${pessoa.id}&status_saldo=CREDOR`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Recebendo</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total que esta pessoa tem a receber de outras <br /> com base em pagamentos que ela realizou.</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">
                        {formatCurrency(Number(pessoa.estatisticas.total_receber_pendente) || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Saldo Líquido */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Balanço final: (Total Recebendo) - (Total Devendo).</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${Number(pessoa.estatisticas.saldo_liquido) >= 0 ? 'text-gray-700' : 'text-orange-500'}`}>
                      {formatCurrency(Number(pessoa.estatisticas.saldo_liquido) || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TooltipProvider>
>>>>>>> transacoesFront
          </CardContent>
        </Card>
      )}

<<<<<<< HEAD
      {/* Permissões (para proprietários) */}
      {pessoa.eh_proprietario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Permissões de Proprietário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Gerenciar pessoas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Criar transações</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Gerenciar pagamentos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Acessar relatórios</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Configurar sistema</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Gerenciar tags</span>
              </div>
=======
      {/* Resumo de Pagamentos */}
      {pessoa.estatisticas && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Total pago: <span className="font-medium">{formatCurrency(Number(pessoa.estatisticas.total_pago) || 0)}</span></p>
              <p>Status geral: <span className={`font-medium ${
                Number(pessoa.estatisticas.saldo_liquido) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Number(pessoa.estatisticas.saldo_liquido) >= 0 ? 'Em dia' : 'Com pendências'}
              </span></p>
>>>>>>> transacoesFront
            </div>
          </CardContent>
        </Card>
      )}
<<<<<<< HEAD
=======

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

      {/* Abas com Detalhes */}
      <Tabs defaultValue="transacoes" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transacoes">
            <List className="mr-2 h-4 w-4" /> Transações Recentes
          </TabsTrigger>
          <TabsTrigger value="evolucao">
            <TrendingUp className="mr-2 h-4 w-4" /> Evolução do Saldo
          </TabsTrigger>
          <TabsTrigger value="informacoes">
            <Contact className="mr-2 h-4 w-4" /> Informações
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da Aba de Transações */}
        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Últimas 10 Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pessoa.transacoes && pessoa.transacoes.length > 0 ? (
                <ul className="space-y-4">
                  {pessoa.transacoes.slice(0, 10).map((transacao) => {
                    const participante = transacao.transacao_participantes.find(p => p.pessoa_id === pessoa.id)
                    const ehDespesa = transacao.tipo === 'DESPESA'
                    const valor = ehDespesa ? (participante?.valor_devido ?? 0) : (transacao.valor_total ?? 0)

                    return (
                      <li key={transacao.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          {ehDespesa ? (
                            <ArrowDownCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <ArrowUpCircle className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium">{transacao.descricao}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transacao.data_transacao).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${ehDespesa ? 'text-red-500' : 'text-green-500'}`}>
                          {formatCurrency(Number(valor) || 0)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhuma transação encontrada para esta pessoa.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Conteúdo da Aba de Evolução do Saldo */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução do Saldo
              </CardTitle>
              <CardDescription>
                Acompanhe a variação do saldo desta pessoa ao longo do tempo.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pr-6">
              {chartLoading && (
                <Skeleton className="w-full h-full" />
              )}
              {chartError && !chartLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-500">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                    <p>Não foi possível carregar o gráfico.</p>
                    <p className="text-sm text-muted-foreground">{chartError}</p>
                  </div>
                </div>
              )}
              {!chartLoading && !chartError && chartData && (
                chartData.length > 1 ? (
                   <Chart 
                      type="area" 
                      data={chartData} 
                      xKey="data" 
                      yKey="saldo"
                      height={300}
                    />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <BarChart className="h-10 w-10 mx-auto mb-2" />
                      <p>Dados insuficientes para exibir o gráfico.</p>
                       <p className="text-sm">É necessário mais de um ponto de dados para a visualização.</p>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da Aba de Informações */}
        <TabsContent value="informacoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contact className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{pessoa.email}</span>
              </div>
              {pessoa.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{pessoa.telefone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Membro desde: {new Date(pessoa.criado_em).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {pessoa.ativo ? (
                  <Badge variant="default" className="bg-green-600">Ativo</Badge>
                ) : (
                  <Badge variant="destructive">Inativo</Badge>
                )}
                {pessoa.eh_proprietario && (
                  <Badge variant="secondary">Proprietário</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
>>>>>>> transacoesFront
    </div>
  )
} 