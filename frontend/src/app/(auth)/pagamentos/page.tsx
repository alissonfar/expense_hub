'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, CalendarIcon, MoreHorizontal, DollarSign, ListChecks } from 'lucide-react';
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
  const pagamentos = useMemo(() => {
    console.log('Pagamentos no useMemo:', data);
    return data || [];
  }, [data]);

  // Colunas da tabela
  const columns: ColumnDef<Pagamento, unknown>[] = [
    {
      id: 'pessoa',
      header: 'Pessoa',
      cell: () => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <span>Placeholder for Pessoa</span>
        </div>
      ),
    },
    {
      id: 'valor',
      header: 'Valor',
      cell: () => (
        <div className="font-medium">
          <span>Placeholder for Valor</span>
        </div>
      ),
    },
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }: { row: Row<Pagamento> }) => (
        <div className="flex items-center text-sm">
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
          {row.original.data_pagamento ? new Date(row.original.data_pagamento).toLocaleDateString('pt-BR') : '-'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          Pago
        </Badge>
      ),
    },
    {
      id: 'transacoes',
      header: 'Transações',
      cell: ({ row }: { row: Row<Pagamento> }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.transacoes || []).map((t: Transacao) => (
            <Badge key={t.id} variant="outline" className="text-xs">
              <ListChecks className="w-3 h-3 mr-1" />
              {t.descricao || `ID ${t.id}`}
            </Badge>
          ))}
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
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200" title="Pagamento gerou excedente e receita automática">
                Excedente
              </Badge>
            )}
            {receita && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200" title="Receita gerada pelo excedente">
                Receita #{receita.id}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: '',
      cell: () => (
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <Button variant="default" className="gap-2" onClick={() => router.push('/pagamentos/novo')}>
          <Plus className="w-4 h-4" />
          Novo Pagamento
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por pessoa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Filtros futuros aqui */}
          </div>
        </CardHeader>
      </Card>

      {/* Tabela de pagamentos */}
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando pagamentos...</div>
          ) : pagamentos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum pagamento encontrado.<br />
              Clique em <b>Novo Pagamento</b> para registrar o primeiro!
            </div>
          ) : (
            <>
              {console.log('DataTable recebendo:', pagamentos)}
              <DataTable columns={columns} data={pagamentos} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 