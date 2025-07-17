'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Users, CheckSquare, Divide, ListChecks } from 'lucide-react';
import { usePessoas } from '@/hooks/usePessoas';
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
import { Checkbox } from '@/components/ui/checkbox';

// Tipo explícito para as linhas da tabela de pendências
interface PendenciaLinha {
  id: number;
  descricao: string;
  valorDevido: number;
  valorPago: number;
  saldoDevedor: number;
  status: 'Quitado' | 'Parcial' | 'Pendente';
  ehParcelado: boolean;
  parcelaAtual?: number;
  totalParcelas?: number;
}

export default function NovoPagamentoPage() {
  const { data: pessoas = [], isLoading } = usePessoas();
  const [pessoaSelecionada, setPessoaSelecionada] = useState<number | null>(null);
  // Refatorar valoresPagamento para string
  const [valoresPagamento, setValoresPagamento] = useState<Record<number, string>>({});
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');
  const [processarExcedente, setProcessarExcedente] = useState<boolean>(true);
  const [valorTotal, setValorTotal] = useState<number>(0);
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
  const linhas: PendenciaLinha[] = useMemo(() => (pendenciasData || []).map((p: { id: number; descricao: string; valor_devido: number; valor_pago: number; valor_pendente: number; parcela_atual?: number; total_parcelas?: number }) => ({
    id: p.id,
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
    const novos = Object.fromEntries(linhas.map(l => [l.id, l.saldoDevedor.toString()]));
    setValoresPagamento(novos);
    setSelecionadas(linhas.map(l => l.id));
  };
  // Adaptar dividir igualmente para usar valorTotal
  const dividirIgualmente = () => {
    if (selecionadas.length === 0 || valorTotal <= 0) return;
    const porTransacao = valorTotal / selecionadas.length;
    const novos = { ...valoresPagamento };
    selecionadas.forEach(id => { novos[id] = porTransacao.toString(); });
    setValoresPagamento(novos);
  };
  const marcarTodas = () => setSelecionadas(linhas.map(l => l.id));
  const desmarcarTodas = () => setSelecionadas([]);

  // Corrigir seleção individual: evitar duplicidade
  const handleSelectTransacao = (id: number, checked: boolean) => {
    setSelecionadas(sel => {
      if (checked) {
        return sel.includes(id) ? sel : [...sel, id];
      } else {
        return sel.filter(item => item !== id);
      }
    });
  };

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
      cell: ({ row }: { row: { original: PendenciaLinha } }) => (
        <input
          type="checkbox"
          checked={selecionadas.includes(row.original.id)}
          onChange={e => handleSelectTransacao(row.original.id, e.target.checked)}
          disabled={row.original.status === 'Quitado'}
          tabIndex={0}
          className={row.original.status === 'Quitado' ? 'opacity-50 cursor-not-allowed' : ''}
        />
      ),
    },
    {
      id: 'descricao',
      header: 'Descrição',
      cell: ({ row }: { row: { original: PendenciaLinha } }) => row.original.descricao,
    },
    {
      id: 'valorDevido',
      header: 'Valor devido',
      cell: ({ row }: { row: { original: PendenciaLinha } }) => (
        <span className="font-medium">
          {row.original.valorDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'valorPago',
      header: 'Valor já pago',
      cell: ({ row }: { row: { original: PendenciaLinha } }) => (
        <span>
          {row.original.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'saldoDevedor',
      header: 'Saldo devedor',
      cell: ({ row }: { row: { original: PendenciaLinha } }) => (
        <span className="text-red-600 font-semibold">
          {row.original.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: PendenciaLinha } }) => (
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
      cell: ({ row }: { row: { original: PendenciaLinha } }) => (
        <Input
          type="text"
          inputMode="decimal"
          min={0}
          max={row.original.saldoDevedor}
          step={0.01}
          value={valoresPagamento[row.original.id] ?? ''}
          disabled={!selecionadas.includes(row.original.id) || row.original.status === 'Quitado' || row.original.saldoDevedor === 0}
          onChange={e => {
            const v = e.target.value;
            // Permitir string vazia, números válidos e ponto/virgula
            if (/^\d*(\.|,)?\d{0,2}$/.test(v) || v === '') {
              setValoresPagamento(vals => ({ ...vals, [row.original.id]: v.replace(',', '.') }));
            }
          }}
          className={`w-28 ${selecionadas.includes(row.original.id) ? 'ring-2 ring-blue-300' : ''}`}
          placeholder={row.original.saldoDevedor > 0 ? `Até ${row.original.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : '—'}
          tabIndex={0}
        />
      ),
    },
  ];

  // Calcular total das selecionadas dinamicamente (convertendo para número)
  const totalSelecionado = selecionadas.reduce((acc, id) => acc + (parseFloat(valoresPagamento[id]) || 0), 0);
  const podeConfirmar = selecionadas.length > 0 && totalSelecionado > 0;

  // Calcular total devido das selecionadas
  const totalDevidoSelecionado = selecionadas.reduce((acc, id) => acc + (linhas.find(l => l.id === id)?.saldoDevedor || 0), 0);

  // Mutação para criar pagamento
  const mutation = useMutation({
    mutationFn: async () => {
      // Montar payload conforme API
      const payload = {
        pessoa_id: pessoaSelecionada,
        valor_total: valorTotal,
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: formaPagamento,
        processar_excedente: processarExcedente,
        transacoes: selecionadas.map(id => ({
          transacao_id: id,
          valor_aplicado: parseFloat(valoresPagamento[id]) || 0,
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
    onError: (err: unknown) => {
      let message = 'Tente novamente.';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        message = (err.response.data as { message?: string }).message || message;
      }
      toast({
        title: 'Erro ao registrar pagamento',
        description: message,
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
              onChange={v => setPessoaSelecionada(v as number | null)}
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
          <div className="flex items-center gap-2 mt-4">
            <Checkbox id="processarExcedente" checked={processarExcedente} onChange={e => setProcessarExcedente(e.target.checked)} />
            <label htmlFor="processarExcedente" className="text-sm select-none cursor-pointer">
              Processar excedente (gerar receita automaticamente se houver valor a mais)
            </label>
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
                    <span className="text-muted-foreground">Total devido das selecionadas:</span>
                    <span className="text-lg font-bold text-blue-700">
                      {totalDevidoSelecionado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="valorTotal" className="font-medium">Valor total do pagamento:</label>
                    <Input
                      id="valorTotal"
                      type="number"
                      min={0}
                      step={0.01}
                      value={valorTotal}
                      onChange={e => setValorTotal(Number(e.target.value) || 0)}
                      className="w-40"
                      placeholder="Ex: 100,00"
                    />
                  </div>
                  {valorTotal > totalDevidoSelecionado && (
                    <div className="text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1 mb-2">
                      Atenção: O valor pago excede o saldo das transações. O excedente será processado como receita.
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mb-2">
                    {selecionadas.length === 0 ? 'Nenhuma transação selecionada.' : `${selecionadas.length} transação(ões) selecionada(s).`}
                  </div>
                  {selecionadas.length > 0 && (
                    <ul className="text-xs text-muted-foreground mb-4 list-disc ml-5">
                      {selecionadas.map(id => {
                        const linha = linhas.find(l => l.id === id);
                        return linha ? <li key={`${id}-${valoresPagamento[id]}`}>{linha.descricao} — {(parseFloat(valoresPagamento[id]) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</li> : null;
                      })}
                    </ul>
                  )}
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    disabled={!podeConfirmar || mutation.isPending || !formaPagamento}
                    onClick={() => mutation.mutate()}
                  >
                    {mutation.isPending ? 'Registrando...' : 'Confirmar Pagamento'}
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