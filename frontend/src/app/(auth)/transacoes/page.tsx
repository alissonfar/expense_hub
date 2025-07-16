'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRequireHub, usePermissions } from '@/hooks/useAuth';
import { useTransacoes, useDeleteTransacao, useDuplicateTransacao } from '@/hooks/useTransacoes';
import { useRouter } from 'next/navigation';

import type { TransacaoFilters, Transacao } from '@/lib/types';
import { DataTable } from '@/components/ui/data-table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Copy, 
  Eye,
  CalendarIcon,
  DollarSign,
  Users,
  Tag,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TransacoesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<TransacaoFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useRequireHub();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { toast } = useToast();

  // Queries
  const { data: transacoesData } = useTransacoes(filters);

  // Mutations
  const deleteTransacao = useDeleteTransacao();
  const duplicateTransacao = useDuplicateTransacao();

  const transacoes = transacoesData?.data || [];

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value || undefined, page: 1 }));
  };

  const handleFilterChange = (key: keyof TransacaoFilters, value: string | undefined) => {
    const normalized = value === 'todos' ? undefined : value;
    setFilters(prev => ({
      ...prev,
      [key]: normalized,
      page: 1,
    }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilters(prev => ({
      ...prev,
      data_inicio: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      data_fim: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
      page: 1
    }));
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransacao.mutateAsync(id);
      toast({
        title: "Transação excluída",
        description: "A transação foi movida para a lixeira.",
      });
    } catch (error: unknown) {
      let message = "Erro ao excluir transação";
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response.data as { message?: string }).message || message;
      }
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateTransacao.mutateAsync(id);
      toast({
        title: "Transação duplicada",
        description: "Uma nova transação foi criada baseada na original.",
      });
    } catch (error: unknown) {
      let message = "Erro ao duplicar transação";
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response.data as { message?: string }).message || message;
      }
      toast({
        title: "Erro ao duplicar",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Columns for DataTable
  const columns = [
    {
      id: 'tipo',
      header: 'Tipo',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        return (
          <Badge 
            variant={transacao.tipo === 'RECEITA' ? 'default' : 'secondary'}
            className={`${
              transacao.tipo === 'RECEITA' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-red-100 text-red-700 border-red-200'
            }`}
          >
            <DollarSign className="w-3 h-3 mr-1" />
            {transacao.tipo === 'RECEITA' ? 'Receita' : 'Gasto'}
          </Badge>
        );
      },
    },
    {
      id: 'descricao',
      header: 'Descrição',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{transacao.descricao}</div>
            {transacao.local && (
              <div className="text-sm text-gray-500">{transacao.local}</div>
            )}
            {transacao.eh_parcelado && (
              <Badge variant="outline" className="text-xs">
                Parcela {transacao.parcela_atual}/{transacao.total_parcelas}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'valor',
      header: 'Valor',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        const valor = transacao.eh_parcelado ? transacao.valor_parcela : transacao.valor_total;
        return (
          <div className="text-right">
            <div className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(valor)}
            </div>
            {transacao.eh_parcelado && (
              <div className="text-xs text-gray-500">
                Total: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(transacao.valor_total)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        return (
          <div className="flex items-center text-sm">
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
            {format(new Date(transacao.data_transacao), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        const statusConfig = {
          PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          PAGO_PARCIAL: { label: 'Parcial', color: 'bg-blue-100 text-blue-700 border-blue-200' },
          PAGO_TOTAL: { label: 'Pago', color: 'bg-green-100 text-green-700 border-green-200' },
        };
        const config = statusConfig[transacao.status_pagamento];
        
        return (
          <Badge variant="outline" className={config.color}>
            <Clock className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'participantes',
      header: 'Participantes',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        const count = transacao.participantes?.length || 0;
        return (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {count} {count === 1 ? 'pessoa' : 'pessoas'}
          </div>
        );
      },
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        const tags = transacao.tags || [];
        
        if (tags.length === 0) return null;
        
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: tag.cor, color: tag.cor }}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.nome}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/transacoes/${transacao.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              {canEdit() && (
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {canCreate() && (
                <DropdownMenuItem onClick={() => handleDuplicate(transacao.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
              )}
              {canDelete() && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(transacao.id)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Button variant="default" className="gap-2" onClick={() => router.push('/transacoes/nova')}>
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 border-blue-200' : ''}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.tipo || ''}
                onValueChange={(value) => handleFilterChange('tipo', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="GASTO">Gastos</SelectItem>
                  <SelectItem value="RECEITA">Receitas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status_pagamento || ''}
                onValueChange={(value) => handleFilterChange('status_pagamento', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO_PARCIAL">Pago Parcial</SelectItem>
                  <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      'Período'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ page: 1, limit: 20 });
                  setSearchTerm('');
                  setDateRange(undefined);
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={transacoes}
          />
        </CardContent>
      </Card>
    </div>
  );
} 