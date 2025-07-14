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

export default function PagamentosPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar pagamentos reais
  const { data, isLoading } = useQuery({
    queryKey: ['pagamentos', searchTerm],
    queryFn: async () => {
      const res = await pagamentosApi.list(searchTerm ? { search: searchTerm } : {});
      console.log('Resposta bruta do backend:', res.data);
      // Aceitar resposta como array direto, array em data, ou objeto com data.pagamentos
      const pagamentosRaw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.pagamentos || [];
      console.log('Array de pagamentos após parse:', pagamentosRaw);
      const mapped = pagamentosRaw.map((p: any) => ({
        ...p,
        pessoa: p.pessoas_pagamentos_pessoa_idTopessoas,
        transacoes: (p.transacoes_pagas || []).map((t: any) => ({
          ...t,
          descricao: t.descricao || t.transacoes?.descricao || t.transacao?.descricao || `ID ${t.transacao_id}`,
          transacao_id: t.transacao_id,
        })),
      }));
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
  const columns = [
    {
      id: 'pessoa',
      header: 'Pessoa',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          {row.original.pessoa?.nome || '-'}
        </div>
      ),
    },
    {
      id: 'valor',
      header: 'Valor',
      cell: ({ row }: any) => (
        <div className="font-medium">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.valor_total || 0)}
        </div>
      ),
    },
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }: any) => (
        <div className="flex items-center text-sm">
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
          {row.original.data_pagamento ? new Date(row.original.data_pagamento).toLocaleDateString('pt-BR') : '-'}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
          Pago
        </Badge>
      ),
    },
    {
      id: 'transacoes',
      header: 'Transações',
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.transacoes || []).map((t: any) => (
            <Badge key={t.transacao_id} variant="outline" className="text-xs">
              <ListChecks className="w-3 h-3 mr-1" />
              {t.descricao || `ID ${t.transacao_id}`}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'acoes',
      header: '',
      cell: ({ row }: any) => (
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