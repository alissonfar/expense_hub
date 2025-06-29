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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Crown,
  User,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { usePessoas, usePessoaMutations } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'
import { generateAvatarColor } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { PessoaFormModal } from '@/components/forms/PessoaFormModal'
import type { Pessoa } from '@/types'

export default function MembrosPage() {
  const { selectedHub } = useAuth()
  const { pessoas, loading, error, refetch, contarPessoas } = usePessoas()
  const { deletarPessoa, loading: loadingMutation } = usePessoaMutations()
  
  // Estados locais
  const [termoBusca, setTermoBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'proprietario' | 'administrador' | 'colaborador'>('all')
  const [modalNovaAberto, setModalNovaAberto] = useState(false)
  const [pessoaParaDeletar, setPessoaParaDeletar] = useState<Pessoa | null>(null)

  // Permissões
  const canManage = selectedHub?.role === 'PROPRIETARIO' || selectedHub?.role === 'ADMINISTRADOR'
  const canDelete = selectedHub?.role === 'PROPRIETARIO'

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

      // Filtro de tipo (ainda usa 'eh_proprietario', precisa ser ajustado quando os dados do membro vierem da API)
      const matchTipo = filtroTipo === 'all' ||
        (filtroTipo === 'proprietario' && pessoa.eh_proprietario) ||
        (filtroTipo === 'administrador' && !pessoa.eh_proprietario) // Exemplo, precisa de ajuste

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

  const handleDeletarClick = (pessoa: Pessoa) => {
    if (!canDelete) {
        toast({ title: "Acesso Negado", description: "Apenas proprietários podem remover membros.", variant: "destructive" });
        return;
    }
    setPessoaParaDeletar(pessoa);
  }
  
  const handleConfirmarDelecao = async () => {
    if (!pessoaParaDeletar) return;
    await deletarPessoa(pessoaParaDeletar.id);
    setPessoaParaDeletar(null);
  }

  const handleFormSuccess = () => {
    setModalNovaAberto(false);
    refetch();
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 text-center text-red-500">
        <AlertCircle className="mx-auto h-12 w-12" />
        <h2 className="mt-4 text-xl font-semibold">Erro ao carregar membros</h2>
        <p className="text-sm">{error}</p>
        <Button onClick={() => refetch()} className="mt-4">Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users />
                Gerenciar Membros do Hub
            </h1>
            <p className="text-muted-foreground">Adicione, edite e gerencie os membros do seu Hub.</p>
        </div>
        {canManage && (
            <Button onClick={() => setModalNovaAberto(true)}>
                <Plus className="mr-2 h-4 w-4" /> Convidar Novo Membro
            </Button>
        )}
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Total de Membros</h3>
                  <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Ativos</h3>
                  <p className="text-2xl font-bold">{stats.ativos}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Inativos</h3>
                  <p className="text-2xl font-bold">{stats.inativos}</p>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Proprietários</h3>
                  <p className="text-2xl font-bold">{stats.proprietarios}</p>
              </div>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome ou email..." className="pl-8" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} />
                </div>
                <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por Permissão" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Permissões</SelectItem>
                        <SelectItem value="proprietario">Proprietários</SelectItem>
                        <SelectItem value="administrador">Administradores</SelectItem>
                        <SelectItem value="colaborador">Colaboradores</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Permissão no Hub</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pessoasFiltradas.map(pessoa => (
                        <TableRow key={pessoa.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar style={{ backgroundColor: generateAvatarColor(pessoa.nome) }}>
                                        <AvatarFallback>{getInitials(pessoa.nome)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{pessoa.nome}</p>
                                        <p className="text-sm text-muted-foreground">{pessoa.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={pessoa.ativo ? "default" : "destructive"}>
                                    {pessoa.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {pessoa.eh_proprietario && <Crown className="h-4 w-4 text-yellow-500" />}
                                {/* Aqui precisaremos da role do membro no Hub */}
                            </TableCell>
                            <TableCell className="text-right">
                                <Link href={`/pessoas/${pessoa.id}`}>
                                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                </Link>
                                {canManage && (
                                <Link href={`/pessoas/${pessoa.id}/editar`}>
                                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                </Link>
                                )}
                                {canDelete && pessoa.id !== selectedHub?.id && ( // Evitar auto-deleção
                                <Button variant="ghost" size="icon" onClick={() => handleDeletarClick(pessoa)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      {/* Modal Novo Membro */}
      <Dialog open={modalNovaAberto} onOpenChange={setModalNovaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
          </DialogHeader>
          <PessoaFormModal onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
      
      {/* Modal Confirmação Deleção */}
      <Dialog open={!!pessoaParaDeletar} onOpenChange={() => setPessoaParaDeletar(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
              </DialogHeader>
              <p>Tem certeza que deseja remover <strong>{pessoaParaDeletar?.nome}</strong> do Hub?</p>
              <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setPessoaParaDeletar(null)}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleConfirmarDelecao} disabled={loadingMutation}>
                      {loadingMutation ? 'Removendo...' : 'Confirmar e Remover'}
                  </Button>
              </div>
          </DialogContent>
      </Dialog>

    </div>
  )
} 