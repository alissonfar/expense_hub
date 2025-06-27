'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatRelativeDate, generateAvatarColor, getInitials } from '@/lib/utils'
import { FormaPagamento, PagamentoFilters } from '@/types'
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

export default function PagamentosPage() {
  const {
    pagamentos,
    pagination,
    statistics,
    loading,
    error,
    deleteState,
    filters,
    hasActiveFilters,
    applyFilters,
    clearFilters,
    changePage,
    refresh,
    deletePagamento
  } = usePagamentos({ autoFetch: true })

  // Estados locais para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<FormaPagamento | ''>('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [pagamentoToDelete, setPagamentoToDelete] = useState<string | null>(null)

  // Aplicar filtros
  const handleApplyFilters = () => {
    const newFilters: Partial<PagamentoFilters> = {}
    
    if (selectedFormaPagamento) {
      newFilters.forma_pagamento = selectedFormaPagamento
    }
    if (dataInicio) {
      newFilters.data_inicio = dataInicio
    }
    if (dataFim) {
      newFilters.data_fim = dataFim
    }

    applyFilters(newFilters)
    setShowFilters(false)
  }

  // Limpar filtros
  const handleClearFilters = () => {
    setSelectedFormaPagamento('')
    setDataInicio('')
    setDataFim('')
    clearFilters()
    setShowFilters(false)
  }

  // Confirmar exclusão
  const handleDeleteClick = (pagamentoId: string) => {
    setPagamentoToDelete(pagamentoId)
    setDeleteModalOpen(true)
  }

  // Executar exclusão
  const handleConfirmDelete = async () => {
    if (!pagamentoToDelete) return

    try {
      await deletePagamento(parseInt(pagamentoToDelete))
      toast({
        title: "Pagamento excluído!",
        description: "O pagamento foi removido com sucesso.",
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o pagamento.",
        variant: "destructive",
      })
    } finally {
      setDeleteModalOpen(false)
      setPagamentoToDelete(null)
    }
  }

  // Obter cor da forma de pagamento
  const getFormaPagamentoColor = (forma: FormaPagamento) => {
    return FORMAS_PAGAMENTO.find(f => f.value === forma)?.color || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Gerencie registros de pagamentos recebidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/pagamentos/novo">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pagamento
            </Link>
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagamentos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_pagamentos}</div>
            <p className="text-xs text-muted-foreground">
              {pagination.total} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.valor_total ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              Média: {formatCurrency(statistics.valor_medio ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Excedente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pagamentos_com_excedente}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.valor_excedente_total ?? 0)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Métodos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(statistics.formas_pagamento).length}
            </div>
            <p className="text-xs text-muted-foreground">
              PIX: {statistics.formas_pagamento.PIX || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros e Busca
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="secondary">
                  Filtros ativos
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Forma de Pagamento */}
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select 
                  value={selectedFormaPagamento} 
                  onValueChange={(value: FormaPagamento | '') => setSelectedFormaPagamento(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as formas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as formas</SelectItem>
                    {FORMAS_PAGAMENTO.map(forma => (
                      <SelectItem key={forma.value} value={forma.value}>
                        {forma.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início */}
              <div>
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              {/* Data Fim */}
              <div>
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              {/* Ações */}
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Aplicar
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar pagamentos</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros ou limpar a busca'
                  : 'Registre o primeiro pagamento para começar'
                }
              </p>
              <div className="flex justify-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar Filtros
                  </Button>
                )}
                <Button asChild>
                  <Link href="/pagamentos/novo">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Pagamento
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pagamentos.map((pagamento) => (
                <div key={pagamento.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback 
                        className={`text-sm text-white ${generateAvatarColor(pagamento.pessoa.nome)}`}
                      >
                        {getInitials(pagamento.pessoa.nome)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium">{pagamento.pessoa.nome}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(pagamento.data_pagamento)}
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getFormaPagamentoColor(pagamento.forma_pagamento)}`}
                        >
                          {FORMAS_PAGAMENTO.find(f => f.value === pagamento.forma_pagamento)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {formatCurrency(pagamento.valor_total ?? 0)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {pagamento.tem_excedente && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            +{formatCurrency(pagamento.valor_excedente ?? 0)}
                          </Badge>
                        )}
                        <span>{pagamento.transacoes_pagas?.length || 0} transação(ões)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pagamentos/${pagamento.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pagamentos/${pagamento.id}/editar`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteClick(pagamento.id)}
                        disabled={deleteState.loading}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} pagamentos
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => changePage(page)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Próxima
                </Button>
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
        description="Tem certeza de que deseja excluir este pagamento? Esta ação é irreversível."
        onConfirm={handleConfirmDelete}
        isConfirming={deleteState.loading}
        confirmText="Excluir Pagamento"
        confirmingText="Excluindo..."
      />
    </div>
  )
} 