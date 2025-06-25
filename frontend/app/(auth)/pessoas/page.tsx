'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Crown,
  User,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle
} from 'lucide-react'
import { usePessoas, usePessoaMutations } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate, generateAvatarColor } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/constants'
import { toast } from '@/hooks/use-toast'
import { PessoaFormModal } from '@/components/forms/PessoaFormModal'
import type { Pessoa } from '@/types'

export default function PessoasPage() {
  const { user } = useAuth()
  const { pessoas, loading, error, refetch, contarPessoas } = usePessoas()
  const { deletarPessoa, loading: loadingMutation } = usePessoaMutations()
  
  // Estados locais
  const [termoBusca, setTermoBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'proprietario' | 'participante'>('all')
  const [modalNovaAberto, setModalNovaAberto] = useState(false)
  const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | null>(null)

  // Estatísticas
  const stats = contarPessoas()

  // Filtrar pessoas baseado nos filtros
  const pessoasFiltradas = useMemo(() => {
    return pessoas.filter(pessoa => {
      // Filtro de busca
      const matchBusca = !termoBusca || 
        pessoa.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        pessoa.email.toLowerCase().includes(termoBusca.toLowerCase())

      // Filtro de status
      const matchStatus = filtroStatus === 'all' || 
        (filtroStatus === 'ativo' && pessoa.ativo) ||
        (filtroStatus === 'inativo' && !pessoa.ativo)

      // Filtro de tipo
      const matchTipo = filtroTipo === 'all' ||
        (filtroTipo === 'proprietario' && pessoa.eh_proprietario) ||
        (filtroTipo === 'participante' && !pessoa.eh_proprietario)

      return matchBusca && matchStatus && matchTipo
    })
  }, [pessoas, termoBusca, filtroStatus, filtroTipo])

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
  const confirmarExclusao = async (pessoa: Pessoa) => {
    if (!user?.eh_proprietario) {
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
        refetch()
      }
    }
  }

  // Callback para nova pessoa criada
  const handlePessoaCriada = () => {
    setModalNovaAberto(false)
    refetch()
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
            <p className="text-muted-foreground">
              Gerencie participantes e proprietários do sistema
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar pessoas</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => refetch()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
          <p className="text-muted-foreground">
            Gerencie participantes e proprietários do sistema
          </p>
        </div>
        {user?.eh_proprietario && (
          <Dialog open={modalNovaAberto} onOpenChange={setModalNovaAberto}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Pessoa
              </Button>
            </DialogTrigger>
            <PessoaFormModal onSuccess={handlePessoaCriada} />
          </Dialog>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.ativas}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.proprietarios}</p>
                <p className="text-xs text-muted-foreground">Proprietários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.participantes}</p>
                <p className="text-xs text-muted-foreground">Participantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros</span>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>

              {/* Status */}
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>

              {/* Tipo */}
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="proprietario">Proprietários</SelectItem>
                  <SelectItem value="participante">Participantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Pessoas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Pessoas Cadastradas ({pessoasFiltradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : pessoasFiltradas.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {termoBusca || filtroStatus !== 'all' || filtroTipo !== 'all' 
                  ? 'Nenhuma pessoa encontrada' 
                  : 'Nenhuma pessoa cadastrada'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {termoBusca || filtroStatus !== 'all' || filtroTipo !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Adicione a primeira pessoa ao sistema.'
                }
              </p>
              {user?.eh_proprietario && !termoBusca && filtroStatus === 'all' && filtroTipo === 'all' && (
                <Button onClick={() => setModalNovaAberto(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeira Pessoa
                </Button>
              )}
            </div>
          ) : (
            // Lista de pessoas
            <div className="space-y-2">
              {pessoasFiltradas.map((pessoa) => (
                <div
                  key={pessoa.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className={`h-12 w-12 ${generateAvatarColor(pessoa.nome)}`}>
                    <AvatarFallback className="text-white">
                      {getInitials(pessoa.nome)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Informações */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{pessoa.nome}</h3>
                      {pessoa.eh_proprietario && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {pessoa.email}
                      </div>
                      {pessoa.telefone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {pessoa.telefone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status e Tipo */}
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={pessoa.ativo ? "default" : "destructive"}
                      className="w-fit"
                    >
                      {pessoa.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge 
                      variant={pessoa.eh_proprietario ? "secondary" : "outline"}
                      className="w-fit"
                    >
                      {pessoa.eh_proprietario ? "Proprietário" : "Participante"}
                    </Badge>
                  </div>

                  {/* Estatísticas */}
                  {pessoa.estatisticas && (
                    <div className="hidden lg:flex flex-col gap-1 text-right">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Saldo: </span>
                        <span className={pessoa.estatisticas.saldo_liquido >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(pessoa.estatisticas.saldo_liquido)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pessoa.estatisticas.total_transacoes} transações
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pessoas/${pessoa.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    
                    {user?.eh_proprietario && (
                      <>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pessoas/${pessoa.id}/editar`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        
                        {pessoa.ativo && !pessoa.eh_proprietario && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => confirmarExclusao(pessoa)}
                            disabled={loadingMutation}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 