'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Users, CheckSquare, Divide, ListChecks } from 'lucide-react';
import { usePessoas } from '@/hooks/usePessoas';
import { useTransacoes } from '@/hooks/useTransacoes';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { pagamentosApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function NovoPagamentoPage() {
  const { data: pessoas = [], isLoading } = usePessoas();
  const [pessoaSelecionada, setPessoaSelecionada] = useState<number | null>(null);
  const [valoresPagamento, setValoresPagamento] = useState<Record<number, number>>({});
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');
  const opcoesFormaPagamento = [
    { label: 'PIX', value: 'PIX' },
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'Transferência', value: 'TRANSFERENCIA' },
    { label: 'Débito', value: 'DEBITO' },
    { label: 'Crédito', value: 'CREDITO' },
    { label: 'Outros', value: 'OUTROS' },
  ];
  const { toast } = useToast();
  const router = useRouter();

  // Opções para o Combobox
  const opcoesPessoas = pessoas.map(p => ({
    label: p.pessoa?.nome || '-',
    value: p.pessoa?.id,
    email: p.pessoa?.email,
  }));

  // Adicionar controle de erro
  const { data: pendenciasData, isLoading: loadingPendencias, error: erroPendencias } = useQuery({
    queryKey: ['pendencias', pessoaSelecionada],
    queryFn: async () => {
      if (!pessoaSelecionada) return [];
      const res = await api.get('/relatorios/pendencias', { params: { pessoa_id: pessoaSelecionada } });
      return res.data.data?.pendencias || [];
    },
    enabled: !!pessoaSelecionada,
    staleTime: 1000 * 60 * 2,
  });
  const linhas = useMemo(() => (pendenciasData || []).map((p: any) => ({
    id: p.transacao_id,
    descricao: p.descricao + (p.parcela_atual && p.total_parcelas ? ` (Parc. ${p.parcela_atual}/${p.total_parcelas})` : ''),
    valorDevido: p.valor_devido,
    valorPago: p.valor_pago,
    saldoDevedor: p.valor_pendente,
    status: p.valor_pendente <= 0.01 ? 'Quitado' : p.valor_pago > 0 ? 'Parcial' : 'Pendente',
    ehParcelado: !!p.parcela_atual,
    parcelaAtual: p.parcela_atual,
    totalParcelas: p.total_parcelas,
  })), [pendenciasData]);

  // Atalhos inteligentes
  const pagarTudo = () => {
    const novos = Object.fromEntries(linhas.map(l => [l.id, l.saldoDevedor]));
    setValoresPagamento(novos);
    setSelecionadas(linhas.map(l => l.id));
  };
  const dividirIgualmente = () => {
    const total = linhas.filter(l => selecionadas.includes(l.id)).reduce((acc, l) => acc + l.saldoDevedor, 0);
    const porTransacao = selecionadas.length ? total / selecionadas.length : 0;
    const novos = { ...valoresPagamento };
    selecionadas.forEach(id => { novos[id] = porTransacao; });
    setValoresPagamento(novos);
  };
  const marcarTodas = () => setSelecionadas(linhas.map(l => l.id));
  const desmarcarTodas = () => setSelecionadas([]);

  // Tooltips para status
  const statusTooltips: Record<string, string> = {
    'Quitado': 'Transação totalmente paga para esta pessoa.',
    'Parcial': 'Já houve pagamento parcial, mas ainda resta saldo.',
    'Pendente': 'Nenhum pagamento registrado para esta pessoa nesta transação.'
  };

  // Colunas da tabela refinadas
  const columns = [
    {
      id: 'select',
      header: '',
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={selecionadas.includes(row.original.id)}
          onChange={e => {
            setSelecionadas(sel =>
              e.target.checked ? [...sel, row.original.id] : sel.filter(id => id !== row.original.id)
            );
          }}
          disabled={row.original.status === 'Quitado'}
          tabIndex={0}
          className={row.original.status === 'Quitado' ? 'opacity-50 cursor-not-allowed' : ''}
        />
      ),
    },
    {
      id: 'descricao',
      header: 'Descrição',
      cell: ({ row }: any) => row.original.descricao,
    },
    {
      id: 'valorDevido',
      header: 'Valor devido',
      cell: ({ row }: any) => (
        <span className="font-medium">
          {row.original.valorDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'valorPago',
      header: 'Valor já pago',
      cell: ({ row }: any) => (
        <span>
          {row.original.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'saldoDevedor',
      header: 'Saldo devedor',
      cell: ({ row }: any) => (
        <span className="text-red-600 font-semibold">
          {row.original.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Badge variant="outline" className={
                  row.original.status === 'Quitado' ? 'bg-green-100 text-green-700 border-green-200' :
                  row.original.status === 'Parcial' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }>
                  {row.original.status}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent>{statusTooltips[row.original.status]}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      id: 'valorPagar',
      header: 'Valor a pagar',
      cell: ({ row }: any) => (
        <Input
          type="number"
          min={0}
          max={row.original.saldoDevedor}
          step={0.01}
          value={valoresPagamento[row.original.id] ?? ''}
          disabled={!selecionadas.includes(row.original.id) || row.original.status === 'Quitado' || row.original.saldoDevedor === 0}
          onChange={e => {
            const v = parseFloat(e.target.value) || 0;
            setValoresPagamento(vals => ({ ...vals, [row.original.id]: v }));
          }}
          className={`w-28 ${selecionadas.includes(row.original.id) ? 'ring-2 ring-blue-300' : ''}`}
          placeholder={row.original.saldoDevedor > 0 ? `Até ${row.original.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '—'}
          tabIndex={0}
        />
      ),
    },
  ];

  // Cálculo do total a pagar
  const totalSelecionado = selecionadas.reduce((acc, id) => acc + (valoresPagamento[id] || 0), 0);
  const podeConfirmar = selecionadas.length > 0 && totalSelecionado > 0;

  // Mutação para criar pagamento
  const mutation = useMutation({
    mutationFn: async () => {
      // Montar payload conforme API
      const payload = {
        pessoa_id: pessoaSelecionada,
        valor_total: totalSelecionado,
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: formaPagamento,
        transacoes: selecionadas.map(id => ({
          transacao_id: id,
          valor_aplicado: valoresPagamento[id] || 0,
        })),
      };
      await pagamentosApi.create(payload);
    },
    onSuccess: () => {
      toast({ title: 'Pagamento registrado com sucesso!' });
      setSelecionadas([]);
      setValoresPagamento({});
      // Redirecionar para listagem após sucesso
      setTimeout(() => router.push('/pagamentos'), 1200);
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao registrar pagamento',
        description: err?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Novo Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Selecione a pessoa para pagamento</h2>
            <Combobox
              options={opcoesPessoas}
              value={pessoaSelecionada}
              onChange={setPessoaSelecionada}
              placeholder={isLoading ? 'Carregando pessoas...' : 'Buscar membro...'}
              className="max-w-md"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Forma de pagamento</h2>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFormaPagamento.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de débitos */}
          <div className="mt-8">
            {!pessoaSelecionada ? (
              <div className="text-center text-muted-foreground py-12">
                Selecione uma pessoa para visualizar os débitos.
              </div>
            ) : erroPendencias ? (
              <div className="text-center text-red-600 py-12">Erro ao buscar débitos. Tente novamente.</div>
            ) : loadingPendencias ? (
              <div className="text-center text-muted-foreground py-12">Carregando débitos...</div>
            ) : linhas.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">Nenhum débito encontrado para esta pessoa.</div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={pagarTudo} className="gap-1"><CheckSquare className="w-4 h-4" />Pagar tudo</Button>
                  <Button variant="outline" size="sm" onClick={dividirIgualmente} className="gap-1"><Divide className="w-4 h-4" />Dividir igualmente</Button>
                  <Button variant="outline" size="sm" onClick={marcarTodas} className="gap-1"><ListChecks className="w-4 h-4" />Marcar todas</Button>
                  <Button variant="outline" size="sm" onClick={desmarcarTodas} className="gap-1">Desmarcar todas</Button>
                </div>
                <DataTable columns={columns} data={linhas} />
                {/* Resumo do pagamento */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-2">Resumo do Pagamento</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Total a pagar:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {totalSelecionado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {selecionadas.length === 0 ? 'Nenhuma transação selecionada.' : `${selecionadas.length} transação(ões) selecionada(s).`}
                  </div>
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={!podeConfirmar || mutation.isLoading || !formaPagamento}
                    onClick={() => mutation.mutate()}
                  >
                    {mutation.isLoading ? 'Registrando...' : 'Confirmar Pagamento'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 