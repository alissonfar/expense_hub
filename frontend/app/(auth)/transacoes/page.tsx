'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Filter, Search, Download, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { useTransacoes } from '@/hooks/useTransacoes'
import { usePessoas } from '@/hooks/usePessoas'
import { useTags } from '@/hooks/useTags'
import { useAuth } from '@/lib/auth'
import { 
  TransacaoFiltros, 
  TipoTransacao, 
  StatusPagamento 
} from '@/types'

export default function TransacoesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { pessoas } = usePessoas()
  const { tags } = useTags()

  // Estados dos filtros
  const [filtros, setFiltros] = useState<TransacaoFiltros>({
    page: 1,
    limit: 20
  })
  const [busca, setBusca] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Hook principal de transações
  const {
    transacoes,
    loading,
    error,
    paginacao,
    estatisticas,
    computedStats,
    refetch,
    goToPage,
    changeLimit
  } = useTransacoes(filtros)

  // Filtros computados com busca
  const transacoesFiltradas = useMemo(() => {
    if (!busca.trim()) return transacoes

    const termoBusca = busca.toLowerCase()
    return transacoes.filter(transacao =>
      transacao.descricao?.toLowerCase().includes(termoBusca) ||
      transacao.local?.toLowerCase().includes(termoBusca) ||
      (transacao.transacao_participantes && transacao.transacao_participantes.some(p => 
        p.pessoas?.nome?.toLowerCase().includes(termoBusca)
      )) ||
      (transacao.transacao_tags && transacao.transacao_tags.some(t => 
        t.tag?.nome?.toLowerCase().includes(termoBusca)
      ))
    )
  }, [transacoes, busca])

  // Handlers para filtros
  const handleFiltroChange = (key: keyof TransacaoFiltros, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset página ao mudar filtro
    }))
  }

  const limparFiltros = () => {
    setFiltros({
      page: 1,
      limit: 20
    })
    setBusca('')
  }

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString))
  }

  // Status badge
  const getStatusBadge = (status: StatusPagamento) => {
    const variants = {
      'PENDENTE': { variant: 'destructive' as const, label: 'Pendente' },
      'PAGO_PARCIAL': { variant: 'secondary' as const, label: 'Parcial' },
      'PAGO_TOTAL': { variant: 'default' as const, label: 'Pago' }
    }
    
    const config = variants[status] || variants.PENDENTE
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">Erro ao carregar transações: {error}</p>
              <Button onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie seus gastos e receitas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/transacoes/nova')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {computedStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(computedStats.totalGastos)}
              </div>
              <p className="text-xs text-muted-foreground">Total Gastos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(computedStats.totalReceitas)}
              </div>
              <p className="text-xs text-muted-foreground">Total Receitas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${
                computedStats.saldo >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(computedStats.saldo)}
              </div>
              <p className="text-xs text-muted-foreground">Saldo</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {computedStats.pendentes}
              </div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {computedStats.total}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Linha principal de busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, local, pessoa ou tag..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                
                <Button
                  variant="outline"
                  onClick={refetch}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Filtros expandidos */}
            {showFilters && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={filtros.tipo || ''}
                      onValueChange={(value) => 
                        handleFiltroChange('tipo', value === 'all' ? undefined : value as TipoTransacao)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="GASTO">💸 Gastos</SelectItem>
                        <SelectItem value="RECEITA">💰 Receitas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filtros.status_pagamento || ''}
                      onValueChange={(value) => 
                        handleFiltroChange('status_pagamento', value === 'all' ? undefined : value as StatusPagamento)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PAGO_PARCIAL">Pago Parcial</SelectItem>
                        <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Pessoa</label>
                    <Select
                      value={filtros.pessoa_id?.toString() || ''}
                      onValueChange={(value) => 
                        handleFiltroChange('pessoa_id', value === 'all' ? undefined : Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as pessoas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as pessoas</SelectItem>
                        {pessoas.map((pessoa) => (
                          <SelectItem key={pessoa.id} value={pessoa.id.toString()}>
                            {pessoa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tag</label>
                    <Select
                      value={filtros.tag_id?.toString() || ''}
                      onValueChange={(value) => 
                        handleFiltroChange('tag_id', value === 'all' ? undefined : Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as tags</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.icone} {tag.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={limparFiltros}>
                    Limpar Filtros
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transações
            {paginacao && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({paginacao.total} encontradas)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : transacoesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/transacoes/nova')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira transação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transacoesFiltradas.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/transacoes/${transacao.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {transacao.tipo === 'GASTO' ? '💸' : '💰'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{transacao.descricao}</h3>
                        {transacao.eh_parcelado && (
                          <Badge variant="outline" className="text-xs">
                            {transacao.parcela_atual}/{transacao.total_parcelas}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          {transacao.local && (
                            <span>📍 {transacao.local}</span>
                          )}
                          <span>📅 {formatDate(transacao.data_transacao)}</span>
                        </div>
                        
                                                 {transacao.transacao_participantes && transacao.transacao_participantes.length > 0 && (
                           <div className="flex items-center gap-1">
                             <span>👥</span>
                             {transacao.transacao_participantes.slice(0, 3).map((p, i) => (
                               <span key={p.id}>
                                 {i > 0 && ', '}
                                 {p.pessoas?.nome || `Pessoa #${p.pessoa_id}`}
                               </span>
                             ))}
                             {transacao.transacao_participantes.length > 3 && (
                               <span> +{transacao.transacao_participantes.length - 3}</span>
                             )}
                           </div>
                         )}
                        
                                                 {transacao.transacao_tags && transacao.transacao_tags.length > 0 && (
                           <div className="flex gap-1 flex-wrap">
                             {transacao.transacao_tags.slice(0, 3).map((tagRel) => (
                               <Badge 
                                 key={tagRel.tag_id} 
                                 variant="outline" 
                                 className="text-xs"
                                 style={{ backgroundColor: tagRel.tag?.cor ? tagRel.tag.cor + '20' : undefined }}
                               >
                                 {tagRel.tag?.icone} {tagRel.tag?.nome || `Tag #${tagRel.tag_id}`}
                               </Badge>
                             ))}
                             {transacao.transacao_tags.length > 3 && (
                               <Badge variant="outline" className="text-xs">
                                 +{transacao.transacao_tags.length - 3}
                               </Badge>
                             )}
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      transacao.tipo === 'GASTO' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transacao.tipo === 'GASTO' ? '-' : '+'}
                      {formatCurrency(transacao.valor_total)}
                    </div>
                    {getStatusBadge(transacao.status_pagamento)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {paginacao && paginacao.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {paginacao.page} de {paginacao.pages} 
                ({paginacao.total} transações)
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltros(goToPage(paginacao.page - 1))}
                  disabled={paginacao.page === 1}
                >
                  Anterior
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltros(goToPage(paginacao.page + 1))}
                  disabled={paginacao.page === paginacao.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 