'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/dashboard/KPICard';
import { calcularProgressoTemporal } from '@/lib/utils';
import { 
  Plus, 
  CalendarIcon, 
  MoreHorizontal, 
  DollarSign, 
  ListChecks, 
  Search,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { pagamentosApi } from '@/lib/api';
import type { Pagamento, Transacao } from '@/lib/types';
import type { Row, ColumnDef } from '@tanstack/react-table';
import { TransactionType, PaymentStatus, PaymentMethod } from '@/lib/types';

type PagamentoBackend = {
  id: number;
  pessoa_id: number;
  valor_total: number;
  valor_excedente?: number;
  data_pagamento: string;
  forma_pagamento: string;
  observacoes?: string;
  processar_excedente: boolean;
  registrado_por: number;
  hubId: number;
  criado_em: string;
  pessoas_pagamentos_pessoa_idTopessoas?: { id: number; nome: string; email: string };
  pagamento_transacoes?: Array<{
    transacao_id: number;
    valor_aplicado: number;
    transacoes?: {
      id: number;
      descricao?: string;
      tipo?: string;
      valor_total: number;
      status_pagamento?: string;
      data_transacao?: string;
    };
  }>;
  receita_excedente?: { id: number; descricao: string; valor_total: number };
};

type PagamentosApiResponse = PagamentoBackend[] | { data: PagamentoBackend[] } | { data: { pagamentos: PagamentoBackend[] } };

// Type guards para formatos de resposta
function isArrayPagamentoBackend(data: unknown): data is PagamentoBackend[] {
  return Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null && 'id' in item);
}
function isDataArrayPagamentoBackend(data: unknown): data is { data: PagamentoBackend[] } {
  return (
    typeof data === 'object' && data !== null &&
    'data' in data && Array.isArray((data as { data: unknown }).data)
  );
}
function isDataPagamentosObject(data: unknown): data is { data: { pagamentos: PagamentoBackend[] } } {
  return (
    typeof data === 'object' && data !== null &&
    'data' in data &&
    typeof (data as { data: unknown }).data === 'object' &&
    (data as { data: { pagamentos?: unknown } }).data !== null &&
    'pagamentos' in (data as { data: { pagamentos?: unknown } }).data &&
    Array.isArray(((data as { data: { pagamentos?: unknown } }).data as { pagamentos?: unknown }).pagamentos)
  );
}

export default function PagamentosPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggle configurável: 'filtrado', 'geral', 'mesAtual'
  const [modoCards, setModoCards] = useState<'filtrado' | 'geral' | 'mesAtual'>('filtrado');

  // Buscar pagamentos reais
  const { data, isLoading } = useQuery({
    queryKey: ['pagamentos', searchTerm],
    queryFn: async () => {
      const res = await pagamentosApi.list(searchTerm ? { search: searchTerm } : {});
      let raw: PagamentosApiResponse;
      if (isArrayPagamentoBackend(res.data)) {
        raw = res.data;
      } else if (isDataArrayPagamentoBackend(res.data)) {
        raw = res.data as { data: PagamentoBackend[] };
      } else if (isDataPagamentosObject(res.data)) {
        raw = res.data as { data: { pagamentos: PagamentoBackend[] } };
      } else {
        raw = [];
      }
      // Aceitar resposta como array direto, array em data, ou objeto com data.pagamentos
      const pagamentosRaw = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown }).data)
          ? (raw as { data: PagamentoBackend[] }).data
          : (raw as { data?: { pagamentos?: PagamentoBackend[] } }).data?.pagamentos || [];
      // Mapear para o tipo Pagamento do frontend
      const mapped = pagamentosRaw.map((p: PagamentoBackend) => ({
        id: p.id,
        pessoa_id: p.pessoa_id,
        valor_total: p.valor_total,
        valor_excedente: p.valor_excedente,
        data_pagamento: p.data_pagamento,
        forma_pagamento: p.forma_pagamento as PaymentMethod, // compatibilidade
        observacoes: p.observacoes,
        processar_excedente: p.processar_excedente,
        registrado_por: p.registrado_por,
        hubId: p.hubId,
        criado_em: p.criado_em,
        pessoa: p.pessoas_pagamentos_pessoa_idTopessoas
          ? {
              id: p.pessoas_pagamentos_pessoa_idTopessoas.id,
              nome: p.pessoas_pagamentos_pessoa_idTopessoas.nome,
              email: p.pessoas_pagamentos_pessoa_idTopessoas.email,
              telefone: undefined,
              ehAdministrador: false,
              ativo: true,
              data_cadastro: '',
              atualizado_em: '',
              conviteToken: undefined
            }
          : undefined,
        transacoes: (p.pagamento_transacoes || []).map(pt => ({
          id: pt.transacoes?.id ?? pt.transacao_id,
          tipo: (pt.transacoes?.tipo ?? 'GASTO') as TransactionType,
          descricao: pt.transacoes?.descricao ?? '',
          local: undefined,
          valor_total: pt.transacoes?.valor_total ?? 0,
          data_transacao: pt.transacoes?.data_transacao ?? '',
          eh_parcelado: false,
          parcela_atual: 0,
          total_parcelas: 0,
          valor_parcela: 0,
          grupo_parcela: undefined,
          observacoes: undefined,
          status_pagamento: (pt.transacoes?.status_pagamento ?? 'PENDENTE') as PaymentStatus,
          proprietario_id: 0,
          criado_por: 0,
          hubId: 0,
          criado_em: '',
          atualizado_em: '',
          proprietario: undefined,
          criador: undefined,
          tags: undefined,
          participantes: undefined,
          pagamentos: undefined
        })),
        receita_excedente: p.receita_excedente,
      }));
      console.log('Array de pagamentos após parse:', pagamentosRaw);
      console.log('Pagamentos mapeados para DataTable:', mapped);
      return mapped;
    },
    staleTime: 1000 * 60 * 2,
  });
  
  // Buscar todos os pagamentos (não filtrados) para totais gerais
  const { data: todosPagamentosData } = useQuery({
    queryKey: ['pagamentos-todos'],
    queryFn: async () => {
      const res = await pagamentosApi.list({ limit: 1000 }); // Buscar todas as transações
      let raw: PagamentosApiResponse;
      if (isArrayPagamentoBackend(res.data)) {
        raw = res.data;
      } else if (isDataArrayPagamentoBackend(res.data)) {
        raw = res.data as { data: PagamentoBackend[] };
      } else if (isDataPagamentosObject(res.data)) {
        raw = res.data as { data: { pagamentos: PagamentoBackend[] } };
      } else {
        raw = [];
      }
      const pagamentosRaw = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown }).data)
          ? (raw as { data: PagamentoBackend[] }).data
          : (raw as { data?: { pagamentos?: PagamentoBackend[] } }).data?.pagamentos || [];
      const mapped = pagamentosRaw.map((p: PagamentoBackend) => ({
        id: p.id,
        pessoa_id: p.pessoa_id,
        valor_total: p.valor_total,
        valor_excedente: p.valor_excedente,
        data_pagamento: p.data_pagamento,
        forma_pagamento: p.forma_pagamento as PaymentMethod,
        observacoes: p.observacoes,
        processar_excedente: p.processar_excedente,
        registrado_por: p.registrado_por,
        hubId: p.hubId,
        criado_em: p.criado_em,
        pessoa: p.pessoas_pagamentos_pessoa_idTopessoas
          ? {
              id: p.pessoas_pagamentos_pessoa_idTopessoas.id,
              nome: p.pessoas_pagamentos_pessoa_idTopessoas.nome,
              email: p.pessoas_pagamentos_pessoa_idTopessoas.email,
              telefone: undefined,
              ehAdministrador: false,
              ativo: true,
              data_cadastro: '',
              atualizado_em: '',
              conviteToken: undefined
            }
          : undefined,
        transacoes: (p.pagamento_transacoes || []).map(pt => ({
          id: pt.transacoes?.id ?? pt.transacao_id,
          tipo: (pt.transacoes?.tipo ?? 'GASTO') as TransactionType,
          descricao: pt.transacoes?.descricao ?? '',
          local: undefined,
          valor_total: pt.transacoes?.valor_total ?? 0,
          data_transacao: pt.transacoes?.data_transacao ?? '',
          eh_parcelado: false,
          parcela_atual: 0,
          total_parcelas: 0,
          valor_parcela: 0,
          grupo_parcela: undefined,
          observacoes: undefined,
          status_pagamento: (pt.transacoes?.status_pagamento ?? 'PENDENTE') as PaymentStatus,
          proprietario_id: 0,
          criado_por: 0,
          hubId: 0,
          criado_em: '',
          atualizado_em: '',
          proprietario: undefined,
          criador: undefined,
          tags: undefined,
          participantes: undefined,
          pagamentos: undefined
        })),
        receita_excedente: p.receita_excedente,
      }));
      return mapped;
    },
    staleTime: 1000 * 60 * 2,
  });
  
  const pagamentos = useMemo(() => {
    console.log('Pagamentos no useMemo:', data);
    return data || [];
  }, [data]);
  
  const todosPagamentos = useMemo(() => {
    return todosPagamentosData || [];
  }, [todosPagamentosData]);
  
  // Filtrar pagamentos do mês atual
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const pagamentosMesAtual = todosPagamentos.filter(p => {
    const data = new Date(p.data_pagamento);
    return data >= inicioMes && data <= fimMes;
  });
  
  // Escolher dados baseado no modo selecionado
  let dadosParaCalcular: typeof todosPagamentos = pagamentos;
  if (modoCards === 'geral') dadosParaCalcular = todosPagamentos;
  if (modoCards === 'mesAtual') dadosParaCalcular = pagamentosMesAtual;

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = dadosParaCalcular.length;
    const valorTotal = dadosParaCalcular.reduce((sum, p) => sum + p.valor_total, 0);
    
    const pagos = dadosParaCalcular.filter(p => p.valor_total > 0).length;
    const valorPagos = dadosParaCalcular.reduce((sum, p) => sum + p.valor_total, 0);
    
    const comExcedente = dadosParaCalcular.filter(p => p.valor_excedente && p.valor_excedente > 0).length;
    const valorExcedente = dadosParaCalcular.reduce((sum, p) => sum + (p.valor_excedente || 0), 0);
    
    const valorTotalPagamentos = dadosParaCalcular.reduce((sum, p) => sum + p.valor_total, 0);
    
    const excedentes = dadosParaCalcular.filter(p => p.valor_excedente && p.valor_excedente > 0).length;
    const valorTotalExcedentes = dadosParaCalcular.reduce((sum, p) => sum + (p.valor_excedente || 0), 0);

    return {
      total,
      valorTotal,
      pagos,
      valorPagos,
      comExcedente,
      valorExcedente,
      valorTotalPagamentos,
      excedentes,
      valorTotalExcedentes
    };
  }, [dadosParaCalcular]);

  // Colunas da tabela
  const columns: ColumnDef<Pagamento, unknown>[] = [
    {
      id: 'pessoa',
      header: 'Pessoa',
      cell: ({ row }: { row: Row<Pagamento> }) => (
        <div className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
            {row.original.pessoa?.nome?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {row.original.pessoa?.nome || 'Pessoa não identificada'}
            </span>
            <span className="text-xs text-gray-500">
              {row.original.pessoa?.email || 'Email não disponível'}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'valor',
      header: 'Valor',
      cell: ({ row }: { row: Row<Pagamento> }) => (
        <div className="flex flex-col">
          <span className="font-bold text-lg text-gray-900">
            R$ {row.original.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-gray-500">
            {row.original.forma_pagamento || 'Não especificado'}
          </span>
        </div>
      ),
    },
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }: { row: Row<Pagamento> }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {row.original.data_pagamento ? new Date(row.original.data_pagamento).toLocaleDateString('pt-BR') : '-'}
            </span>
            <span className="text-xs text-gray-500">
              {row.original.data_pagamento ? new Date(row.original.data_pagamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: { row: Row<Pagamento> }) => {
        const isPago = row.original.valor_total > 0;
        return (
          <div className="flex items-center gap-2">
            {isPago ? (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1 rounded-full shadow-sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Pago
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-1 rounded-full shadow-sm">
                <Clock className="w-3 h-3 mr-1" />
                Pendente
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'transacoes',
      header: 'Transações',
      cell: ({ row }: { row: Row<Pagamento> }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.transacoes || []).slice(0, 2).map((t: Transacao) => (
            <Badge 
              key={t.id} 
              className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200 px-2 py-1 rounded-md text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <ListChecks className="w-3 h-3 mr-1" />
              {t.descricao || `Transação ${t.id}`}
            </Badge>
          ))}
          {(row.original.transacoes || []).length > 2 && (
            <Badge className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">
              +{(row.original.transacoes || []).length - 2} mais
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'excedente',
      header: 'Excedente',
      cell: ({ row }: { row: Row<Pagamento> }) => {
        const excedente = row.original.valor_excedente && row.original.valor_excedente > 0;
        const receita = row.original.receita_excedente;
        return (
          <div className="flex gap-1 items-center">
            {excedente && (
              <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                <AlertCircle className="w-3 h-3 mr-1" />
                R$ {row.original.valor_excedente?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Badge>
            )}
            {receita && (
              <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                Receita #{receita.id}
              </Badge>
            )}
            {!excedente && !receita && (
              <span className="text-gray-400 text-xs">Nenhum</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: '',
      cell: () => (
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-200 rounded-full"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header com gradiente */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              Pagamentos
            </h1>
            <p className="text-gray-600 mt-1">Gerencie todos os pagamentos do hub</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push('/pagamentos/novo')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Pagamento
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
          {modoCards === 'geral' && "Mostrando totais de todos os pagamentos"}
          {modoCards === 'mesAtual' && "Mostrando valores dos pagamentos do mês atual"}
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total"
          value={stats.valorTotal}
          type="balance"
          secondaryValue={stats.total}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Total de Pagamentos",
            description: "Valor total de todos os pagamentos registrados no sistema.",
            details: [
              "Soma de todos os valores",
              "Base para análise de volume",
              "Indica atividade financeira do hub"
            ],
            tip: "Monitore o crescimento do volume de pagamentos"
          }}
        />

        <KPICard
          title="Pagos"
          value={stats.valorPagos}
          type="revenue"
          secondaryValue={stats.pagos}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Pagamentos Realizados",
            description: "Valor total dos pagamentos que foram processados.",
            details: [
              "Valores já transferidos",
              "Indica eficiência operacional",
              "Base para receita confirmada"
            ],
            tip: "Alta taxa de pagamentos processados indica boa gestão"
          }}
        />

        <KPICard
          title="Com Excedente"
          value={stats.valorExcedente}
          type="excess"
          secondaryValue={stats.comExcedente}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Pagamentos com Excedente",
            description: "Valor total dos excedentes gerados pelos pagamentos.",
            details: [
              "Indica eficiência financeira",
              "Pode ser reinvestido ou poupado",
              "Base para otimização de recursos"
            ],
            tip: "Valores positivos são favoráveis para o hub"
          }}
        />

        <KPICard
          title="Valor Total"
          value={stats.valorTotalPagamentos}
          type="balance"
          secondaryValue={stats.total}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Valor Total em Pagamentos",
            description: "Soma de todos os valores dos pagamentos registrados.",
            details: [
              "Inclui todos os valores",
              "Indica volume financeiro",
              "Base para análise de receita"
            ],
            tip: "Compare com períodos anteriores para avaliar crescimento"
          }}
        />

        <KPICard
          title="Excedentes"
          value={stats.valorTotalExcedentes}
          type="excess"
          secondaryValue={stats.excedentes}
          loading={isLoading}
          progress={calcularProgressoTemporal()}
          tooltip={{
            title: "Valores Excedentes",
            description: "Valor total dos excedentes que podem ser reinvestidos.",
            details: [
              "Indica eficiência financeira",
              "Pode ser reinvestido ou poupado",
              "Base para otimização de recursos"
            ],
            tip: "Valores positivos são favoráveis para o hub"
          }}
        />
      </div>

      {/* Filtros e busca com design moderno */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por pessoa, valor ou data..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border-0 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                />
              </div>
              <Button variant="outline" className="gap-2 px-4 py-3 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-xl border-gray-200 hover:bg-gray-50">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl border-gray-200 hover:bg-gray-50">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabela de pagamentos com design moderno */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando pagamentos...</p>
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-gray-600 mb-6">Comece registrando o primeiro pagamento do hub</p>
              <Button 
                onClick={() => router.push('/pagamentos/novo')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Pagamento
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <DataTable 
                columns={columns} 
                data={pagamentos}
                className="[&_table]:w-full [&_thead]:bg-gradient-to-r [&_thead]:from-gray-50 [&_thead]:to-blue-50 [&_th]:border-b [&_th]:border-gray-200 [&_th]:py-4 [&_th]:px-6 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-700 [&_td]:border-b [&_td]:border-gray-100 [&_td]:py-4 [&_td]:px-6 [&_tr]:hover:bg-gradient-to-r [&_tr]:hover:from-blue-50/50 [&_tr]:hover:to-purple-50/50 [&_tr]:transition-all [&_tr]:duration-200"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 