'use client'

import React from 'react'
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

export default function MembroDetalhesPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  
  const { selectedHub } = useAuth()
  const { pessoa, loading, error, refetch } = usePessoa(Number(id))
  const { deletarPessoa, loading: loadingMutation } = usePessoaMutations()
  const { data: chartData, loading: chartLoading, error: chartError } = useSaldoHistorico(pessoa?.id);
  
  const canManage = selectedHub?.role === 'PROPRIETARIO' || selectedHub?.role === 'ADMINISTRADOR'
  const canDelete = selectedHub?.role === 'PROPRIETARIO'

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const confirmarExclusao = async () => {
    if (!pessoa || !canDelete) {
      toast({
        title: "Sem permissão",
        description: "Apenas proprietários podem remover membros.",
        variant: "destructive",
      })
      return
    }

    const confirmacao = window.confirm(
      `Tem certeza que deseja remover ${pessoa.nome} do Hub?\n\nEsta ação não poderá ser desfeita.`
    )

    if (confirmacao) {
      await deletarPessoa(pessoa.id)
      router.push('/pessoas')
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
              Voltar para Membros
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Membro não encontrado</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar membro</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'O membro solicitado não foi encontrado.'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar Novamente
              </Button>
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
              Voltar para a Lista de Membros
            </Link>
          </Button>
        </div>
        
        <div className="flex gap-2">
            {canManage && (
              <Button asChild>
                <Link href={`/pessoas/${id}/editar`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Membro
                </Link>
              </Button>
            )}
            {canDelete && pessoa.id !== selectedHub?.id && ( // Evitar auto-deleção
              <Button variant="destructive" onClick={confirmarExclusao} disabled={loadingMutation}>
                <Trash2 className="w-4 h-4 mr-2" />
                {loadingMutation ? 'Removendo...' : 'Remover Membro'}
              </Button>
            )}
        </div>
      </div>

      {/* Perfil e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className={`h-24 w-24 text-4xl mb-4`} style={{backgroundColor: generateAvatarColor(pessoa.nome)}}>
                  <AvatarFallback>{getInitials(pessoa.nome)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{pessoa.nome}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant={pessoa.ativo ? 'default' : 'destructive'}>
                        {pessoa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {/* A role deve vir do endpoint de membros */}
                    {pessoa.eh_proprietario && ( 
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Crown className="w-3 h-3 mr-1" />
                          Proprietário
                        </Badge>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Contact className="w-5 h-5" />Informações de Contato</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <span className="text-muted-foreground">Email</span>
                            <p className="font-medium">{pessoa.email}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <span className="text-muted-foreground">Telefone</span>
                            <p className="font-medium">{pessoa.telefone || 'Não informado'}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <span className="text-muted-foreground">Membro desde</span>
                            <p className="font-medium">{formatDate(pessoa.data_cadastro)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
              <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5"/>Resumo Financeiro</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* ... cards de estatísticas ... */}
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5"/>Histórico de Saldo</CardTitle></CardHeader>
                  <CardContent>
                    {chartLoading && <Skeleton className="h-64 w-full" />}
                    {chartError && <p className="text-red-500 text-center">{chartError}</p>}
                    {chartData && <Chart type="line" data={chartData} />}
                  </CardContent>
              </Card>
          </div>
      </div>
      
      {/* Abas de Informações Detalhadas */}
      <Tabs defaultValue="transacoes" className="w-full">
        <TabsList>
            <TabsTrigger value="transacoes">Transações Recentes</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="dividas">Dívidas</TabsTrigger>
        </TabsList>
        <TabsContent value="transacoes">
            <Card><CardContent className="pt-6">Em breve: Lista de transações da pessoa.</CardContent></Card>
        </TabsContent>
         <TabsContent value="pagamentos">
            <Card><CardContent className="pt-6">Em breve: Lista de pagamentos feitos pela pessoa.</CardContent></Card>
        </TabsContent>
        <TabsContent value="dividas">
            <Card><CardContent className="pt-6">Em breve: Lista de dívidas pendentes da pessoa.</CardContent></Card>
        </TabsContent>
      </Tabs>
      
    </div>
  )
} 