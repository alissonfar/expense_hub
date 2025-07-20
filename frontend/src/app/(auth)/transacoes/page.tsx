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
import { KPICard } from '@/components/dashboard/KPICard';
import { calcularProgressoTemporal } from '@/lib/utils';

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
  CalendarIcon, 
  MoreHorizontal, 
  DollarSign, 
  Clock,
  Edit,
  Trash2,
  Copy,
  Eye,
  Users,
  Tag
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
    limit: 1000, // Aumentado para mostrar todas as transações
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Toggle configurável: 'filtrado', 'geral', 'mesAtual'
  const [modoCards, setModoCards] = useState<'filtrado' | 'geral' | 'mesAtual'>('filtrado');

  useRequireHub();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { toast } = useToast();

  // Queries
  const { data: transacoesData } = useTransacoes(filters);
  
  // Query para buscar todos os dados (não filtrados) para totais gerais
  // Usar limite alto (1000) para garantir que todas as transações sejam buscadas
  const { data: todasTransacoesData } = useTransacoes({ 
    limit: 1000 // Buscar todas as transações para cálculos corretos
  });

  // Mutations
  const deleteTransacao = useDeleteTransacao();
  const duplicateTransacao = useDuplicateTransacao();

  // Corrigir: acessar o array de transações corretamente
  const transacoes = transacoesData?.data?.transacoes || [];
  const todasTransacoes = todasTransacoesData?.data?.transacoes || [];
  
  // Filtrar transações do mês atual
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const transacoesMesAtual = todasTransacoes.filter(t => {
    const data = new Date(t.data_transacao);
    return data >= inicioMes && data <= fimMes;
  });

  // Escolher dados baseado no modo selecionado
  let dadosParaCalcular: typeof todasTransacoes = transacoes;
  if (modoCards === 'geral') dadosParaCalcular = todasTransacoes;
  if (modoCards === 'mesAtual') dadosParaCalcular = transacoesMesAtual;
  
  // DEBUG: Verificar dados reais
  console.log('🔍 DEBUG - transacoesData completo:', transacoesData);
  console.log('🔍 DEBUG - transacoes array:', transacoes);
  console.log('🔍 DEBUG - todasTransacoesData completo:', todasTransacoesData);
  console.log('🔍 DEBUG - todasTransacoes array:', todasTransacoes);
  console.log('🔍 DEBUG - dadosParaCalcular (modo atual):', dadosParaCalcular);
  console.log('🔍 DEBUG - Quantidade de transações por modo:');
  console.log('  - Filtrado:', transacoes.length);
  console.log('  - Geral:', todasTransacoes.length);
  console.log('  - Mês Atual:', transacoesMesAtual.length);
  
  // DEBUG: Verificar se há parcelas
  const parcelas = todasTransacoes.filter(t => t.eh_parcelado);
  console.log('🔍 DEBUG - Parcelas encontradas:', parcelas.length);
  if (parcelas.length > 0) {
    console.log('🔍 DEBUG - Primeira parcela:', parcelas[0]);
    console.log('🔍 DEBUG - Grupo da primeira parcela:', parcelas[0].grupo_parcela);
  }
  
  // DEBUG: Verificar grupos de parcelas únicos
  const gruposParcelas = [...new Set(todasTransacoes.filter(t => t.grupo_parcela).map(t => t.grupo_parcela))];
  console.log('🔍 DEBUG - Grupos de parcelas únicos:', gruposParcelas.length);
  console.log('🔍 DEBUG - Grupos:', gruposParcelas);

  if (dadosParaCalcular.length > 0) {
    console.log('🔍 DEBUG - Todas as transações com valor_total:');
    dadosParaCalcular.forEach((t, index) => {
      console.log(`  Transação ${index}:`, {
        id: t.id,
        descricao: t.descricao,
        valor_total: t.valor_total,
        tipo_valor_total: typeof t.valor_total,
        tipo: t.tipo,
        status: t.status_pagamento
      });
    });
  }

  // Calcular estatísticas para os cards
  const stats = {
    // Valores monetários - com conversão de string para number
    valorTotal: dadosParaCalcular.reduce((sum, t) => {
      const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(t.valor_total || '0') || 0;
      console.log(`🔍 DEBUG - Somando para Total: ${valor} (transação ${t.id})`);
      return sum + valor;
    }, 0),
    valorReceitas: dadosParaCalcular.filter(t => t.tipo === 'RECEITA').reduce((sum, t) => {
      const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(t.valor_total || '0') || 0;
      console.log(`🔍 DEBUG - Somando para Receitas: ${valor} (transação ${t.id})`);
      return sum + valor;
    }, 0),
    valorGastos: dadosParaCalcular.filter(t => t.tipo === 'GASTO').reduce((sum, t) => {
      const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(t.valor_total || '0') || 0;
      console.log(`🔍 DEBUG - Somando para Gastos: ${valor} (transação ${t.id})`);
      return sum + valor;
    }, 0),
    valorPendentes: dadosParaCalcular.filter(t => t.status_pagamento === 'PENDENTE').reduce((sum, t) => {
      const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(t.valor_total || '0') || 0;
      console.log(`🔍 DEBUG - Somando para Pendentes: ${valor} (transação ${t.id})`);
      return sum + valor;
    }, 0),
    valorParceladas: dadosParaCalcular.filter(t => t.eh_parcelado).reduce((sum, t) => {
      const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(t.valor_total || '0') || 0;
      console.log(`🔍 DEBUG - Somando para Parceladas: ${valor} (transação ${t.id})`);
      return sum + valor;
    }, 0),
    
    // Quantidades
    total: dadosParaCalcular.length,
    receitas: dadosParaCalcular.filter(t => t.tipo === 'RECEITA').length,
    gastos: dadosParaCalcular.filter(t => t.tipo === 'GASTO').length,
    pendentes: dadosParaCalcular.filter(t => t.status_pagamento === 'PENDENTE').length,
    parceladas: dadosParaCalcular.filter(t => t.eh_parcelado).length,
  };

  // DEBUG: Verificar stats calculados
  console.log('🔍 DEBUG - Stats calculados:', stats);

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
              }).format(valor ?? 0)}
            </div>
            {transacao.eh_parcelado && (
              <div className="text-xs text-gray-500">
                Total: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(transacao.valor_total ?? 0)}
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
      // ✅ NOVO: Coluna de Vencimento
      id: 'vencimento',
      header: 'Vencimento',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        if (!transacao.data_vencimento || transacao.tipo !== 'GASTO') return '-';
        
        const hoje = new Date();
        const vencimento = new Date(transacao.data_vencimento);
        const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasAteVencimento < 0) {
          return <Badge variant="destructive">Vencida</Badge>;
        } else if (diasAteVencimento === 0) {
          return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Hoje</Badge>;
        } else if (diasAteVencimento <= 7) {
          return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{diasAteVencimento}d</Badge>;
        } else {
          return (
            <div className="text-sm text-gray-600">
              {format(vencimento, 'dd/MM', { locale: ptBR })}
            </div>
          );
        }
      },
    },
    {
      // ✅ NOVO: Coluna de Forma de Pagamento
      id: 'forma_pagamento',
      header: 'Forma de Pagamento',
      cell: ({ row }: { row: { original: Transacao } }) => {
        const transacao = row.original;
        if (!transacao.forma_pagamento) return '-';
        
        const formas = {
          PIX: { label: 'PIX', color: 'bg-green-100 text-green-800 border-green-200' },
          DINHEIRO: { label: 'Dinheiro', color: 'bg-gray-100 text-gray-800 border-gray-200' },
          TRANSFERENCIA: { label: 'Transferência', color: 'bg-blue-100 text-blue-800 border-blue-200' },
          DEBITO: { label: 'Débito', color: 'bg-purple-100 text-purple-800 border-purple-200' },
          CREDITO: { label: 'Crédito', color: 'bg-orange-100 text-orange-800 border-orange-200' },
          OUTROS: { label: 'Outros', color: 'bg-gray-100 text-gray-800 border-gray-200' }
        };
        
        const formaInfo = formas[transacao.forma_pagamento as keyof typeof formas];
        if (!formaInfo) return '-';
        
        return (
          <Badge variant="outline" className={formaInfo.color}>
            {formaInfo.label}
          </Badge>
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
        const config = statusConfig[transacao.status_pagamento ?? 'PENDENTE'];
        
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
            {count} participante(s)
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
                  <Trash2 className="mr-2 h-4 w-4" />
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
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header com gradiente */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
              Transações
            </h1>
            <p className="text-gray-600 mt-1">Gerencie todas as transações do hub</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push('/transacoes/nova')}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Toggle para Configurar Cards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Configuração dos Cards:
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="cardMode"
                checked={modoCards === 'filtrado'}
                onChange={() => setModoCards('filtrado')}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">Valores Filtrados</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="cardMode"
                checked={modoCards === 'geral'}
                onChange={() => setModoCards('geral')}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">Totais Gerais</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="cardMode"
                checked={modoCards === 'mesAtual'}
                onChange={() => setModoCards('mesAtual')}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">Mês Atual</span>
            </label>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {modoCards === 'filtrado' && "Mostrando valores dos filtros aplicados"}
          {modoCards === 'geral' && "Mostrando totais de todas as transações"}
          {modoCards === 'mesAtual' && "Mostrando valores das transações do mês atual"}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total"
          value={stats.valorTotal}
          type="balance"
          secondaryValue={stats.total}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Total de Transações",
            description: "Valor total de todas as transações registradas no sistema.",
            details: [
              "Inclui receitas e despesas",
              "Base para análise de volume",
              "Indica atividade financeira"
            ],
            tip: "Monitore o crescimento do volume de transações"
          }}
        />
        
        <KPICard
          title="Receitas"
          value={stats.valorReceitas}
          type="revenue"
          secondaryValue={stats.receitas}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Transações de Receita",
            description: "Valor total das transações que representam entradas financeiras.",
            details: [
              "Inclui vendas, serviços e outras receitas",
              "Valores que aumentam o saldo",
              "Base para cálculo de lucros"
            ],
            tip: "Maior volume de receitas indica crescimento"
          }}
        />
        
        <KPICard
          title="Gastos"
          value={stats.valorGastos}
          type="expense"
          secondaryValue={stats.gastos}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Transações de Gasto",
            description: "Valor total das transações que representam saídas financeiras.",
            details: [
              "Inclui custos operacionais e despesas",
              "Valores que diminuem o saldo",
              "Base para controle de custos"
            ],
            tip: "Monitore gastos para manter equilíbrio"
          }}
        />
        
        <KPICard
          title="Pendentes"
          value={stats.valorPendentes}
          type="pending"
          secondaryValue={stats.pendentes}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Transações Pendentes",
            description: "Valor total das transações que aguardam confirmação de pagamento.",
            details: [
              "Requerem atenção para aprovação",
              "Podem afetar o saldo final",
              "Importante revisar regularmente"
            ],
            tip: "Revisar pendências para evitar atrasos"
          }}
        />
        
        <KPICard
          title="Parceladas"
          value={stats.valorParceladas}
          type="balance"
          secondaryValue={stats.parceladas}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Transações Parceladas",
            description: "Valor total das transações que foram divididas em parcelas.",
            details: [
              "Facilita o controle de pagamentos",
              "Melhora o fluxo de caixa",
              "Base para planejamento financeiro"
            ],
            tip: "Parcelamento pode melhorar a gestão financeira"
          }}
        />
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 border-0 bg-white rounded-xl shadow-sm"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? 'bg-green-50 border-green-200 text-green-700' : ''} rounded-xl shadow-sm`}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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

              {/* ✅ NOVO: Filtro por Forma de Pagamento */}
              <Select
                value={filters.forma_pagamento || ''}
                onValueChange={(value) => handleFilterChange('forma_pagamento', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Forma de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as formas</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="DEBITO">Débito</SelectItem>
                  <SelectItem value="CREDITO">Crédito</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>

              {/* ✅ NOVO: Filtro por Status de Vencimento */}
              <Select
                value={filters.vencimento_status || ''}
                onValueChange={(value) => handleFilterChange('vencimento_status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status Vencimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="VENCIDA">Vencidas</SelectItem>
                  <SelectItem value="VENCE_HOJE">Vence hoje</SelectItem>
                  <SelectItem value="VENCE_SEMANA">Vence esta semana</SelectItem>
                  <SelectItem value="VENCE_MES">Vence este mês</SelectItem>
                  <SelectItem value="NAO_VENCE">Não vence</SelectItem>
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
                  setFilters({ page: 1, limit: 1000 });
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
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={transacoes}
            className="[&_table]:w-full [&_thead]:bg-gradient-to-r [&_thead]:from-gray-50 [&_thead]:to-green-50 [&_th]:border-b [&_th]:border-gray-200 [&_th]:py-4 [&_th]:px-6 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-700 [&_td]:border-b [&_td]:border-gray-100 [&_td]:py-4 [&_td]:px-6 [&_tr]:hover:bg-gradient-to-r [&_tr]:hover:from-green-50/50 [&_tr]:hover:to-emerald-50/50 [&_tr]:transition-all [&_tr]:duration-200"
          />
        </CardContent>
      </Card>
    </div>
  );
} 