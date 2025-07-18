'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

// Sistema de debug condicional (só em desenvolvimento)
const isDevelopment = process.env.NODE_ENV === 'development';
const debugLog = isDevelopment ? console.log : () => {};
const debugError = isDevelopment ? console.error : () => {};
const debugWarn = isDevelopment ? console.warn : () => {};
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Users, CheckSquare, Divide, ListChecks, AlertCircle, Info, Loader2, Calculator, CreditCard, DollarSign } from 'lucide-react';
import { usePessoas } from '@/hooks/usePessoas';

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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  
  // Estados de loading granulares
  const [isLoadingPendencias, setIsLoadingPendencias] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs para manter foco nos inputs
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const opcoesFormaPagamento = [
    { label: 'PIX', value: 'PIX', icon: '💳' },
    { label: 'Dinheiro', value: 'DINHEIRO', icon: '💵' },
    { label: 'Transferência', value: 'TRANSFERENCIA', icon: '🏦' },
    { label: 'Débito', value: 'DEBITO', icon: '💳' },
    { label: 'Crédito', value: 'CREDITO', icon: '💳' },
    { label: 'Outros', value: 'OUTROS', icon: '📋' },
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
  const { data: pendenciasData, error: erroPendencias } = useQuery({
    queryKey: ['pendencias', pessoaSelecionada],
    queryFn: async () => {
      if (!pessoaSelecionada) return [];
      setIsLoadingPendencias(true);
      try {
      const res = await api.get('/relatorios/pendencias', { params: { pessoa_id: pessoaSelecionada } });
      return res.data.data?.pendencias || [];
      } finally {
        setIsLoadingPendencias(false);
      }
    },
    enabled: !!pessoaSelecionada,
    staleTime: 1000 * 60 * 2,
  });
  const linhas: PendenciaLinha[] = useMemo(() => {
    debugLog(`🔍 DEBUG: Mapeando dados das pendências:`, pendenciasData);
    
    if (pendenciasData && pendenciasData.length > 0) {
      debugLog(`🔍 DEBUG: Estrutura do primeiro item:`, pendenciasData[0]);
      debugLog(`🔍 DEBUG: Chaves disponíveis:`, Object.keys(pendenciasData[0]));
    }
    
    const linhasMapeadas = (pendenciasData || []).map((p: Record<string, unknown>, index: number) => {
      // Usar transacao_id como ID principal (conforme API)
      const transacaoId = p.transacao_id as number;
      
      // Validar se transacao_id existe
      if (!transacaoId) {
        debugError(`❌ ERROR: transacao_id não encontrado para item ${index}:`, p);
        return null; // Retornar null para filtrar depois
      }
      
      debugLog(`🔍 DEBUG: Item ${index} - ID da transação:`, transacaoId);
      
      const linha = {
        id: transacaoId,
        descricao: (p.descricao as string) + ((p.parcela_atual && p.total_parcelas) ? ` (Parc. ${p.parcela_atual}/${p.total_parcelas})` : ''),
        valorDevido: p.valor_devido as number,
        valorPago: p.valor_pago as number,
        saldoDevedor: p.valor_pendente as number,
        status: (p.valor_pendente as number) <= 0.01 ? 'Quitado' : (p.valor_pago as number) > 0 ? 'Parcial' : 'Pendente',
    ehParcelado: !!p.parcela_atual,
        parcelaAtual: p.parcela_atual as number | undefined,
        totalParcelas: p.total_parcelas as number | undefined,
      };
      
      debugLog(`🔍 DEBUG: Linha mapeada:`, linha);
      return linha;
    }).filter(Boolean); // Filtrar itens null
    
    debugLog(`🔍 DEBUG: Total de linhas mapeadas:`, linhasMapeadas.length);
    return linhasMapeadas;
  }, [pendenciasData]);

  // Atalhos inteligentes
  const pagarTudo = async () => {
    setIsProcessingAction(true);
    try {
      // Filtrar apenas linhas que não estão quitadas e têm saldo
      const linhasValidas = linhas.filter(l => l.status !== 'Quitado' && l.saldoDevedor > 0);
      if (linhasValidas.length === 0) {
        toast({ 
          title: 'Nenhuma transação disponível', 
          description: 'Todas as transações estão quitadas ou não têm saldo.',
          variant: 'destructive'
        });
        return;
      }
      
      const total = linhasValidas.reduce((acc, l) => acc + l.saldoDevedor, 0);
      
      // Confirmação antes de pagar tudo
      if (!confirm(`Confirmar pagamento total de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para ${linhasValidas.length} transação(ões)?`)) {
        return;
      }
      
      const novos = Object.fromEntries(linhasValidas.map(l => [l.id, l.saldoDevedor.toString()]));
    setValoresPagamento(novos);
      setSelecionadas(linhasValidas.map(l => l.id));
      
      // Atualizar valor total automaticamente
      setValorTotal(total);
      
      toast({ 
        title: 'Pagamento configurado', 
        description: `${linhasValidas.length} transação(ões) selecionada(s) com valor total de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const dividirIgualmente = async () => {
    setIsProcessingAction(true);
    try {
      if (selecionadas.length === 0) {
        toast({ 
          title: 'Nenhuma transação selecionada', 
          description: 'Selecione pelo menos uma transação para dividir o valor.',
          variant: 'destructive'
        });
        return;
      }
      
      if (valorTotal <= 0) {
        toast({ 
          title: 'Valor total inválido', 
          description: 'Defina um valor total maior que zero para dividir.',
          variant: 'destructive'
        });
        return;
      }
      
    const porTransacao = valorTotal / selecionadas.length;
    const novos = { ...valoresPagamento };
      selecionadas.forEach(id => { 
        novos[id] = porTransacao.toFixed(2); 
      });
    setValoresPagamento(novos);
      
      toast({ 
        title: 'Valor dividido', 
        description: `${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} dividido em ${selecionadas.length} transação(ões)`
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const marcarTodas = async () => {
    setIsProcessingAction(true);
    try {
      const linhasValidas = linhas.filter(l => l.status !== 'Quitado' && l.saldoDevedor > 0);
      if (linhasValidas.length === 0) {
        toast({ 
          title: 'Nenhuma transação disponível', 
          description: 'Todas as transações estão quitadas ou não têm saldo.',
          variant: 'destructive'
      });
        return;
      }
      
      setSelecionadas(linhasValidas.map(l => l.id));
      toast({ 
        title: 'Transações selecionadas', 
        description: `${linhasValidas.length} transação(ões) marcada(s)`
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const desmarcarTodas = async () => {
    setIsProcessingAction(true);
    try {
      setSelecionadas([]);
      toast({ 
        title: 'Seleção limpa', 
        description: 'Todas as transações foram desmarcadas'
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Corrigir seleção individual: evitar duplicidade
  const handleSelectTransacao = (id: number, checked: boolean) => {
    // Validar se o ID é válido (aceitar índice como fallback)
    if (id === undefined || id === null) {
      debugError(`❌ ERROR: ID inválido recebido:`, id);
      return;
    }
    
    const idNumero = Number(id);
    // Aceitar índice como ID válido (para casos onde não há ID real)
    if (isNaN(idNumero) && typeof id !== 'number') {
      debugError(`❌ ERROR: ID não é um número válido:`, id);
      return;
    }
    
    debugLog(`🔍 DEBUG: Tentando ${checked ? 'selecionar' : 'desmarcar'} transação ID: ${idNumero}`);
    debugLog(`🔍 DEBUG: Estado atual das selecionadas:`, selecionadas);
    
    setSelecionadas(sel => {
      debugLog(`🔍 DEBUG: Estado anterior:`, sel);
      
      let novoEstado;
      if (checked) {
        if (sel.includes(idNumero)) {
          debugLog(`🔍 DEBUG: ID ${idNumero} já estava selecionado, mantendo estado`);
          novoEstado = sel; // Já está selecionada
        } else {
          debugLog(`🔍 DEBUG: Adicionando ID ${idNumero} ao estado`);
          novoEstado = [...sel, idNumero];
        }
      } else {
        debugLog(`🔍 DEBUG: Removendo ID ${idNumero} do estado`);
        novoEstado = sel.filter(item => item !== idNumero);
      }
      
      debugLog(`🔍 DEBUG: Novo estado:`, novoEstado);
      return novoEstado;
    });
    
    // Feedback visual para seleção individual (apenas em console para debug)
    const linha = linhas.find(l => l.id === idNumero);
    if (linha) {
      debugLog(`✅ ${checked ? 'Selecionada' : 'Desmarcada'}: ${linha.descricao} (ID: ${idNumero})`);
    } else {
      debugWarn(`⚠️ WARNING: Linha não encontrada para ID: ${idNumero}`);
    }
  };



  // Estatísticas para melhor UX
  const estatisticas = useMemo(() => {
    const totalPendencias = linhas.length;
    const pendenciasQuitadas = linhas.filter(l => l.status === 'Quitado').length;
    const pendenciasPendentes = linhas.filter(l => l.status === 'Pendente').length;
    const pendenciasParciais = linhas.filter(l => l.status === 'Parcial').length;
    const valorTotalPendente = linhas.reduce((acc, l) => acc + l.saldoDevedor, 0);
    
    return {
      totalPendencias,
      pendenciasQuitadas,
      pendenciasPendentes,
      pendenciasParciais,
      valorTotalPendente,
      percentualQuitado: totalPendencias > 0 ? (pendenciasQuitadas / totalPendencias) * 100 : 0
    };
  }, [linhas]);



  // useEffect para limpar valores órfãos quando seleções mudam
  useEffect(() => {
    debugLog(`🔍 DEBUG: useEffect - selecionadas mudaram:`, selecionadas);
    debugLog(`🔍 DEBUG: useEffect - valoresPagamento atual:`, valoresPagamento);
    
    // Limpar valores de transações que não estão mais selecionadas
    const valoresParaManter = Object.keys(valoresPagamento).reduce((acc, key) => {
      const id = Number(key);
      if (selecionadas.includes(id)) {
        acc[key] = valoresPagamento[id];
      } else {
        debugLog(`🧹 DEBUG: Removendo valor órfão para ID: ${id}`);
      }
      return acc;
    }, {} as Record<string, string>);
    
    // Só atualizar se houve mudança
    if (Object.keys(valoresParaManter).length !== Object.keys(valoresPagamento).length) {
      debugLog(`🧹 DEBUG: Limpando valores órfãos. Antes: ${Object.keys(valoresPagamento).length}, Depois: ${Object.keys(valoresParaManter).length}`);
      setValoresPagamento(valoresParaManter);
    }
  }, [selecionadas, valoresPagamento]); // Incluir valoresPagamento na dependência



  // Funções auxiliares para melhor UX
  const getStatusBadge = (status: string) => {
    const variants = {
      'Quitado': 'default',
      'Parcial': 'secondary',
      'Pendente': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Quitado':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'Parcial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'Pendente':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Mutação para criar pagamento
  const mutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      try {
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
      } finally {
        setIsSubmitting(false);
      }
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Novo Pagamento</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Registre pagamentos para quitar pendências de transações
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ajuda
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>Selecione uma pessoa, escolha as transações e defina os valores para registrar o pagamento.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
              <CardTitle className="flex items-center gap-2" id="pagamento-title">
                <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Selecionar Pessoa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2" id="pessoa-label">Selecione a pessoa para pagamento</h2>
            <Combobox
              options={opcoesPessoas}
              value={pessoaSelecionada}
              onChange={v => setPessoaSelecionada(v as number | null)}
              placeholder={isLoading ? 'Carregando pessoas...' : 'Buscar membro...'}
              className="max-w-md"
              aria-labelledby="pessoa-label"
              aria-describedby="pessoa-description"
            />
            <div id="pessoa-description" className="sr-only">
              Campo obrigatório para selecionar a pessoa que fará o pagamento
            </div>
            {pessoaSelecionada && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Pessoa selecionada:</strong> {opcoesPessoas.find(p => p.value === pessoaSelecionada)?.label}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {pessoaSelecionada && (
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-green-600" />
              Resumo das Pendências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{estatisticas.totalPendencias}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estatisticas.pendenciasQuitadas}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Quitadas</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendenciasParciais}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Parciais</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{estatisticas.pendenciasPendentes}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Pendentes</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Valor Total Pendente:</span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {estatisticas.valorTotalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${100 - estatisticas.percentualQuitado}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {estatisticas.percentualQuitado.toFixed(1)}% quitado
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurações */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forma de Pagamento
            </label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {opcoesFormaPagamento.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    <span className="flex items-center gap-2">
                      <span>{opcao.icon}</span>
                      {opcao.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="processarExcedente"
              checked={processarExcedente}
              onChange={e => setProcessarExcedente(e.target.checked)}
            />
            <label htmlFor="processarExcedente" className="text-sm text-gray-700 dark:text-gray-300">
              Processar excedente como crédito
            </label>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Info className="h-3 w-3" />
                  Quando ativado, valores excedentes são convertidos em crédito para a pessoa
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Se o valor pago for maior que o saldo devedor, o excedente será registrado como crédito para futuras transações.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Tabela de Pendências */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-purple-600" />
              Pendências
            </CardTitle>
            <div className="flex items-center gap-2">
              {isLoadingPendencias && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              )}
              {erroPendencias && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Erro ao carregar
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {!pessoaSelecionada ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Selecione uma pessoa para visualizar as pendências
              </p>
            </div>
          ) : linhas.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {isLoadingPendencias ? 'Carregando pendências...' : 'Nenhuma pendência encontrada para esta pessoa.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ações Rápidas */}
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={pagarTudo} 
                        disabled={isProcessingAction || linhas.filter(l => l.status !== 'Quitado' && l.saldoDevedor > 0).length === 0}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                        Pagar Tudo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Seleciona e define valores para todas as transações pendentes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={dividirIgualmente} 
                        disabled={isProcessingAction || selecionadas.length === 0 || valorTotal <= 0}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Divide className="h-4 w-4" />}
                        Dividir Igualmente
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Divide o valor total igualmente entre as transações selecionadas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={marcarTodas} 
                        disabled={isProcessingAction || linhas.filter(l => l.status !== 'Quitado').length === 0}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                        Marcar Todas
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Seleciona todas as transações não quitadas</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={desmarcarTodas} 
                        disabled={isProcessingAction || selecionadas.length === 0}
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
                        Desmarcar Todas
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove a seleção de todas as transações</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Tabela */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <Checkbox 
                            checked={selecionadas.length > 0 && selecionadas.length === linhas.filter(l => l.status !== 'Quitado').length}
                            onChange={e => {
                              if (e.target.checked) {
                                marcarTodas();
                              } else {
                                desmarcarTodas();
                              }
                            }}
                            disabled={isProcessingAction}
                            aria-label="Selecionar todas as transações"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Transação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Valor Devido
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Valor Pago
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Saldo Devedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Valor a Pagar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {linhas.map((linha, index) => {
                        const isSelected = selecionadas.includes(linha.id);
                        const isQuitado = linha.status === 'Quitado';
                        
                        return (
                          <tr 
                            key={`${linha.id}-${index}`}
                            className={cn(
                              "transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800",
                              isSelected && "bg-blue-50 dark:bg-blue-950/20",
                              isQuitado && "opacity-60"
                            )}
                          >
                            <td className="px-4 py-3">
                              <Checkbox 
                                checked={isSelected}
                                onChange={e => handleSelectTransacao(linha.id, e.target.checked)}
                                disabled={isQuitado || isProcessingAction}
                                aria-label={`Selecionar transação ${linha.descricao}`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(linha.status)}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {linha.descricao}
                                  </div>
                                  {linha.ehParcelado && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Parcela {linha.parcelaAtual}/{linha.totalParcelas}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(linha.status)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {linha.valorDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {linha.valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {linha.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={linha.saldoDevedor}
                                value={valoresPagamento[linha.id] || ''}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  const num = parseFloat(valor);
                                  
                                  // Validações
                                  if (valor && (num < 0 || num > linha.saldoDevedor)) {
                                    toast({
                                      title: 'Valor inválido',
                                      description: `O valor deve estar entre 0 e ${linha.saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                                      variant: 'destructive'
                                    });
                                    return;
                                  }
                                  
                                  setValoresPagamento(prev => ({
                                    ...prev,
                                    [linha.id]: valor
                                  }));
                                }}
                                placeholder="0,00"
                                disabled={!isSelected || isQuitado}
                                className="w-24 text-sm"
                                ref={(el) => {
                                  inputRefs.current[linha.id] = el;
                                }}
                                aria-label={`Valor a pagar para ${linha.descricao}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumo do Pagamento */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-green-600" />
                Resumo do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transações selecionadas:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selecionadas.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Valor total:</span>
                  <span className="text-lg font-bold text-green-600">
                    {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                {/* Campo para definir valor total manualmente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Definir valor total do pagamento:
                  </label>
                    <Input
                      type="number"
                    step="0.01"
                    min="0"
                    value={valorTotal || ''}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      setValorTotal(valor);
                    }}
                    placeholder="0,00"
                    className="w-full"
                    />
                  </div>

                {/* Botões rápidos para valores */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const totalPendente = selecionadas.reduce((acc, id) => {
                        const linha = linhas.find(l => l.id === id);
                        return acc + (linha?.saldoDevedor || 0);
                      }, 0);
                      setValorTotal(totalPendente);
                    }}
                    disabled={selecionadas.length === 0}
                    className="text-xs"
                  >
                    Usar Total Pendente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selecionadas.length > 0) {
                        const porTransacao = valorTotal / selecionadas.length;
                        const novos = { ...valoresPagamento };
                        selecionadas.forEach(id => { 
                          novos[id] = porTransacao.toFixed(2); 
                        });
                        setValoresPagamento(novos);
                      }
                    }}
                    disabled={selecionadas.length === 0 || valorTotal <= 0}
                    className="text-xs"
                  >
                    Dividir Igualmente
                  </Button>
                </div>

                {selecionadas.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Transações selecionadas:
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selecionadas.map(id => {
                        const linha = linhas.find(l => l.id === id);
                        const valor = valoresPagamento[id];
                        return linha ? (
                          <div key={id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400 truncate max-w-24">
                              {linha.descricao}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {valor ? parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

                  <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || isSubmitting || selecionadas.length === 0 || valorTotal <= 0 || !pessoaSelecionada}
                className="w-full"
                    size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pagamento
              </>
            )}
              </Button>

              {selecionadas.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Selecione pelo menos uma transação para continuar
                </p>
              )}

              {selecionadas.length > 0 && valorTotal <= 0 && (
                <p className="text-xs text-red-500 text-center">
                  Defina valores para as transações selecionadas
                </p>
              )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
} 