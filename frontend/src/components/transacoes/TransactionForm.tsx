'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, FileText, Users, Tag, Calculator, Check, X, Calendar, DollarSign, MapPin, CreditCard, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
// (Label, Avatar) não usados atualmente; comentar para evitar linter
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTransacao } from '@/hooks/useTransacoes';
import { usePessoasAtivas } from '@/hooks/usePessoas';
import { useToast } from '@/hooks/use-toast';
import { useTags } from '@/hooks/useTags';
import { useRouter } from 'next/navigation'; // Mantido apenas para Cancelar
import { useEffect } from 'react';
import { Tabs as UITabs, TabsList as UITabsList, TabsTrigger as UITabsTrigger } from '@/components/ui/tabs';
import { TipoTransacao } from '@/lib/types';
import { useCreateReceita } from '@/hooks/useTransacoes';

// Atualizar schema Zod para incluir participantes
const participanteSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  valor_devido: z.preprocess((v) => Number(v) || 0, z.number().min(0, 'Valor deve ser positivo')),
});

const transactionSchema = z.object({
  descricao: z.string().min(3, 'Descrição obrigatória (mínimo 3 caracteres).'),
  local: z.string().optional(),
  valor_total: z.preprocess((v) => Number(v) || 0, z.number().positive('O valor deve ser maior que zero.')),
  data_transacao: z.string().min(1, 'Data obrigatória.'),
  eh_parcelado: z.boolean().optional(),
  total_parcelas: z.number().min(1).max(36).optional(),
  observacoes: z.string().max(1000, 'Máximo 1000 caracteres.').optional(),
  participantes: z.preprocess(
    (v) => Array.isArray(v) ? v : [],
    z.array(participanteSchema).min(1, 'Adicione pelo menos um participante')
  ),
  tags: z.array(z.string()).max(5, 'Máximo de 5 tags por transação').optional(),
  // tags serão integradas na próxima etapa
}).refine((data) => {
  const participantes = Array.isArray(data.participantes) ? data.participantes : [];
  const soma = participantes.reduce((acc, p) => acc + (typeof p.valor_devido === 'number' ? p.valor_devido : 0), 0);
  return Math.abs(soma - (typeof data.valor_total === 'number' ? data.valor_total : 0)) < 0.01;
}, {
  message: 'A soma dos valores dos participantes deve ser igual ao valor total',
  path: ['participantes'],
});

// NOVOS SCHEMAS
const receitaSchema = z.object({
  descricao: z.string().min(3, 'Descrição obrigatória (mínimo 3 caracteres).'),
  local: z.string().optional(),
  valor_recebido: z.preprocess((v) => Number(v) || 0, z.number().positive('O valor deve ser maior que zero.')),
  data_transacao: z.string().min(1, 'Data obrigatória.'),
  observacoes: z.string().max(1000, 'Máximo 1000 caracteres.').optional(),
  tags: z.array(z.string()).max(5, 'Máximo de 5 tags por transação').optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;
type ReceitaFormValues = z.infer<typeof receitaSchema>;

type EditTransactionFormValues = {
  descricao: string;
  local?: string;
  observacoes?: string;
  tags?: string[];
  data_transacao: string;
  valor_total: number;
  eh_parcelado: boolean;
  total_parcelas: number;
  participantes: { nome: string; valor_devido: number; }[];
};

type EditReceitaFormValues = {
  descricao: string;
  local?: string;
  observacoes?: string;
  tags?: string[];
  data_transacao: string;
  valor_recebido: number;
};

interface TransactionFormProps {
  modoEdicao?: boolean;
  defaultValues?: TransactionFormValues | ReceitaFormValues;
  onSubmitEdicao?: (data: TransactionFormValues | ReceitaFormValues) => Promise<void>;
}

// Estrutura visual inicial baseada no design do formulário antigo
export default function TransactionForm({ modoEdicao = false, defaultValues, onSubmitEdicao }: TransactionFormProps) {
  const { usuario } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { data: participantesAtivos = [] } = usePessoasAtivas();
  const createTransacao = useCreateTransacao();
  const createReceita = useCreateReceita();
  // NOVO: Estado para tipo de transação
  const [tipoTransacao, setTipoTransacao] = useState<'GASTO' | 'RECEITA'>(TipoTransacao.GASTO);
  const [activeTab, setActiveTab] = useState('basico');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: categorias = [], isLoading: loadingCategorias } = useTags({ ativo: true });

  // NOVO: Alternar schema conforme tipo
  // Separação dos formulários por tipo
  const gastoForm = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultValues && 'valor_total' in defaultValues ? defaultValues : {
      descricao: '',
      local: '',
      valor_total: 0,
      data_transacao: '',
      eh_parcelado: false,
      total_parcelas: 1,
      observacoes: '',
      participantes: [],
      tags: [],
    },
    mode: 'onChange',
    shouldUnregister: false,
  });

  const receitaForm = useForm({
    resolver: zodResolver(receitaSchema),
    defaultValues: defaultValues && 'valor_recebido' in defaultValues ? defaultValues : {
      descricao: '',
      local: '',
      valor_recebido: 0,
      data_transacao: '',
      observacoes: '',
      tags: [],
    },
    mode: 'onChange',
    shouldUnregister: false,
  });

  // Seleciona o form correto conforme o tipo
  const form = tipoTransacao === 'GASTO' ? gastoForm : receitaForm;

  React.useEffect(() => {
    const participantes = gastoForm.watch('participantes');
    if (tipoTransacao === 'GASTO' && usuario && Array.isArray(participantes) && participantes.length === 0) {
      gastoForm.setValue('participantes', [{ nome: usuario.nome, valor_devido: Number(gastoForm.watch('valor_total')) || 0 }]);
    }
    // eslint-disable-next-line
  }, [usuario, tipoTransacao]);

  // Substituir o mock de tags por categorias reais
  const availableTags = categorias.map(tag => ({ id: String(tag.id), nome: tag.nome, cor: tag.cor }));

  const toggleTag = (tagId: string) => {
    if (tipoTransacao === 'GASTO') {
      const tags = gastoForm.getValues().tags || [];
      if (tags.includes(tagId)) {
        gastoForm.setValue('tags', tags.filter((id: string) => id !== tagId));
      } else if (tags.length < 5) {
        gastoForm.setValue('tags', [...tags, tagId]);
      }
    } else {
      const tags = receitaForm.getValues().tags || [];
      if (tags.includes(tagId)) {
        receitaForm.setValue('tags', tags.filter((id: string) => id !== tagId));
      } else if (tags.length < 5) {
        receitaForm.setValue('tags', [...tags, tagId]);
      }
    }
  };

  // Funções para adicionar/remover participantes
  // Adicionar participante
  const addParticipante = useCallback(() => {
    if (tipoTransacao === 'GASTO') {
      const participantesRaw = gastoForm.getValues().participantes;
      const atuais = Array.isArray(participantesRaw) ? participantesRaw : [];
      const novoParticipante = { nome: '', valor_devido: 0, pessoa_id: null };
      gastoForm.setValue('participantes', [
        ...atuais,
        novoParticipante,
      ]);
    }
  }, [tipoTransacao, gastoForm]);
  // Remover participante
  const removeParticipante = (index: number) => {
    if (tipoTransacao === 'GASTO') {
      const participantesRaw = gastoForm.getValues().participantes;
      const atuais = Array.isArray(participantesRaw) ? participantesRaw : [];
      const participantes = [...atuais];
      participantes.splice(index, 1);
      gastoForm.setValue('participantes', participantes);
    }
  };

  // Extrair dependência complexa para variável
  const participantesRaw = gastoForm.watch('participantes');
  const participantesArr = useMemo(() => {
    if (Array.isArray(participantesRaw)) {
      return participantesRaw.map(p => ({
        ...p,
        valor_devido: Number(p.valor_devido) || 0,
        nome: p.nome || '',
        pessoa_id: p.pessoa_id ?? null,
      }));
    }
    return [];
  }, [participantesRaw, gastoForm]);

  // Efeito para inicializar participantes quando participantesAtivos for carregado
  useEffect(() => {
    if (
      tipoTransacao === 'GASTO' &&
      Array.isArray(participantesAtivos) &&
      participantesAtivos.length > 0 &&
      Array.isArray((gastoForm.getValues() as TransactionFormValues).participantes) &&
      (gastoForm.getValues() as TransactionFormValues).participantes.length === 0
    ) {
      const primeiro = participantesAtivos[0];
      const novoParticipante = { nome: primeiro.nome, valor_devido: 0, pessoa_id: primeiro.id };
      gastoForm.setValue('participantes', [novoParticipante]);
    }
  }, [tipoTransacao, participantesAtivos, gastoForm]);

  const valorTotal = tipoTransacao === 'GASTO' ? Number(gastoForm.watch('valor_total')) || 0 : 0;

  // Handler de envio
  const onSubmit = useCallback(async (values: TransactionFormValues | ReceitaFormValues) => {
    if (modoEdicao && onSubmitEdicao) {
      if (tipoTransacao === 'GASTO') {
        const payloadGasto: EditTransactionFormValues = {
          descricao: values.descricao,
          local: values.local,
          observacoes: values.observacoes,
          tags: values.tags || [],
          data_transacao: (values as TransactionFormValues).data_transacao,
          valor_total: (values as TransactionFormValues).valor_total,
          eh_parcelado: Boolean((values as TransactionFormValues).eh_parcelado),
          total_parcelas: (values as TransactionFormValues).total_parcelas || 1,
          participantes: (values as TransactionFormValues).participantes,
        };
        await onSubmitEdicao(payloadGasto);
      } else {
        const payloadReceita: EditReceitaFormValues = {
          descricao: values.descricao,
          local: values.local,
          observacoes: values.observacoes,
          tags: values.tags || [],
          data_transacao: (values as ReceitaFormValues).data_transacao,
          valor_recebido: (values as ReceitaFormValues).valor_recebido,
        };
        await onSubmitEdicao(payloadReceita);
      }
      return;
    }
    try {
      if (tipoTransacao === TipoTransacao.GASTO) {
        // Mapear participantes para o formato da API { pessoa_id, valor_devido }
        const participantesPayload = (values as TransactionFormValues).participantes.map(p => {
          const encontrado = participantesAtivos.find(pa => pa.nome && p.nome && pa.nome.toLowerCase() === p.nome.toLowerCase());
          const pessoaId = encontrado ? encontrado.id : (usuario?.pessoaId ?? 0);
          return {
            pessoa_id: pessoaId,
            valor_devido: Number(p.valor_devido) || 0, // ✅ Correto: backend espera valor_devido
          };
        });

        const payload = {
          descricao: values.descricao,
          local: values.local || undefined,
          valor_total: Number((values as TransactionFormValues).valor_total),
          data_transacao: values.data_transacao,
          observacoes: values.observacoes || undefined,
          eh_parcelado: Boolean((values as TransactionFormValues).eh_parcelado),
          total_parcelas: Number((values as TransactionFormValues).total_parcelas || 1),
          participantes: participantesPayload,
          tags: (values.tags || []).map(t => Number(t)),
          proprietario_id: usuario?.pessoaId ?? 0,
          tipo: tipoTransacao,
        };

        await createTransacao.mutateAsync(payload);
        toast({
          title: 'Sucesso',
          description: 'Transação criada com sucesso!',
        });
      } else {
        // RECEITA
        const payload = {
          descricao: values.descricao,
          local: values.local || undefined,
          valor_recebido: Number((values as ReceitaFormValues).valor_recebido),
          data_transacao: values.data_transacao,
          observacoes: values.observacoes || undefined,
          tags: (values.tags || []).map(t => Number(t)),
        };
        await createReceita.mutateAsync(payload);
        toast({
          title: 'Sucesso',
          description: 'Receita criada com sucesso!',
        });
      }
      setShowSuccess(true);
      form.reset();
      setActiveTab('basico');
      // Focar no primeiro campo para agilizar próximo lançamento
      setTimeout(() => {
        if (tipoTransacao === 'GASTO') {
          gastoForm.setFocus('descricao');
        } else {
          receitaForm.setFocus('descricao');
        }
      }, 0);

      // Ocultar mensagem de sucesso após alguns segundos
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const mensagem = err?.response?.data?.error || err?.message || 'Não foi possível criar a transação';
      toast({
        title: 'Erro',
        description: mensagem,
        variant: 'destructive',
      });
    }
  }, [participantesAtivos, usuario, createTransacao, createReceita, toast, form, tipoTransacao, modoEdicao, onSubmitEdicao, gastoForm, receitaForm]);

  // Função de dividir igualmente extraída para reutilizar em atalho Ctrl+D
  // Dividir igualmente
  const dividirIgualmente = useCallback(async () => {
    if (tipoTransacao !== 'GASTO') return;
    if (participantesArr.length === 0) return;
    if (participantesArr.length === 1) {
      gastoForm.setValue('participantes', [{ ...participantesArr[0], valor_devido: valorTotal }]);
    } else {
      const valorPorPessoa = valorTotal / participantesArr.length;
      const novosParticipantes = participantesArr.map((p, i) => ({
        ...p,
        valor_devido: i === participantesArr.length - 1 ? valorTotal - valorPorPessoa * (participantesArr.length - 1) : valorPorPessoa,
      }));
      gastoForm.setValue('participantes', novosParticipantes);
    }
    await gastoForm.trigger('participantes');
  }, [participantesArr, valorTotal, tipoTransacao, gastoForm]);

  // Registro de atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl / Cmd + Enter -> Salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (form.formState.isValid && !createTransacao.isPending) {
          form.handleSubmit(onSubmit)();
        }
      }

      // Esc -> Cancelar ou fechar atalhos
      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else {
          router.back();
        }
      }

      // F1 -> Toggle painel de atalhos
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }

      // Alt + Left/Right -> Navegar abas
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const tabs = ['basico', 'participantes', 'tags', 'resumo'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex !== -1) {
          const newIndex = e.key === 'ArrowLeft' ? currentIndex - 1 : currentIndex + 1;
          if (newIndex >= 0 && newIndex < tabs.length) {
            setActiveTab(tabs[newIndex]);
          }
        }
      }

      // Ctrl+D -> Dividir igualmente
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        dividirIgualmente();
      }

      // Ctrl+N -> Novo participante
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addParticipante();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, form, createTransacao.isPending, dividirIgualmente, addParticipante, showShortcuts, onSubmit, router]);

  // NOVO: Renderização condicional dos campos
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto space-y-6">
      {modoEdicao && (
        <div className="p-3 mb-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800 text-sm">
          Apenas os campos <b>descrição</b>, <b>local</b>, <b>observações</b> e <b>tags</b> podem ser editados. Os demais campos são bloqueados por regras do sistema.
        </div>
      )}
      <UITabs value={tipoTransacao} onValueChange={v => setTipoTransacao(v as 'GASTO' | 'RECEITA')} className="mb-4">
        <UITabsList className="grid grid-cols-2 w-64 mx-auto">
          <UITabsTrigger value="GASTO" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Gasto
          </UITabsTrigger>
          <UITabsTrigger value="RECEITA" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Receita
          </UITabsTrigger>
        </UITabsList>
      </UITabs>
      {/* Painel de Atalhos */}
      {showShortcuts && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Atalhos de Teclado
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
                  <span>Salvar transação</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                  <span>Cancelar</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F1</kbd>
                  <span>Mostrar/ocultar atalhos</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+←/→</kbd>
                  <span>Navegar entre abas</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+D</kbd>
                  <span>Dividir igualmente</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                  <span>Novo participante</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback de Sucesso */}
      {showSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Transação salva com sucesso!</h3>
                  <p className="text-sm text-green-600">
                    Formulário será resetado em alguns segundos...
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuccess(false)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Check className="h-4 w-4 mr-2" />
                Nova Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abas principais do formulário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {tipoTransacao === 'GASTO' ? 'Nova Transação' : 'Nova Receita'}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="text-xs ml-2"
            >
              <Keyboard className="h-3 w-3 mr-1" />
              F1
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Tabs internas só para GASTO */}
          {tipoTransacao === 'GASTO' ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="participantes" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participantes
                  {/* Participantes */}
                  {(() => {
                    const participantes = gastoForm.watch('participantes') as Array<{ nome: string; valor_devido: number; pessoa_id?: number | null }> | undefined;
                    return (
                      <Badge variant="secondary" className="ml-1">{Array.isArray(participantes) ? participantes.length : 0}</Badge>
                    );
                  })()}
                </TabsTrigger>
                <TabsTrigger value="tags" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                  <Badge variant="secondary" className="ml-1">{(gastoForm.watch('tags') || []).length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="resumo" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Resumo
                </TabsTrigger>
              </TabsList>

              {/* Conteúdo das abas - placeholders para próxima etapa */}
              <TabsContent value="basico" className="space-y-4 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Descrição */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="descricao" className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4" />
                      Descrição *
                    </label>
                    <Input id="descricao" {...gastoForm.register('descricao')} autoFocus />
                    {gastoForm.formState.errors.descricao && <p className="text-sm text-red-500">{gastoForm.formState.errors.descricao.message}</p>}
                  </div>
                  {/* Local/Fonte */}
                  <div className="space-y-2">
                    <label htmlFor="local" className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4" />
                      Local/Fonte
                    </label>
                    <Input id="local" {...gastoForm.register('local')} />
                  </div>
                  {/* Valor Total */}
                  <div className="space-y-2">
                    <label htmlFor="valor" className="flex items-center gap-2 font-medium">
                      <DollarSign className="h-4 w-4" />
                      Valor Total *
                    </label>
                    <Input id="valor" type="number" step="0.01" min="0.01" {...gastoForm.register('valor_total', { valueAsNumber: true })} disabled={modoEdicao} />
                    {gastoForm.formState.errors.valor_total && <p className="text-sm text-red-500">{gastoForm.formState.errors.valor_total.message}</p>}
                  </div>
                  {/* Data */}
                  <div className="space-y-2">
                    <label htmlFor="data" className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4" />
                      Data *
                    </label>
                    <Input id="data" type="date" {...gastoForm.register('data_transacao')} disabled={modoEdicao} />
                    {gastoForm.formState.errors.data_transacao && <p className="text-sm text-red-500">{gastoForm.formState.errors.data_transacao.message}</p>}
                  </div>
                  {/* Parcelamento */}
                  <div className="space-y-4 md:col-span-2">
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <Checkbox id="parcelado" {...gastoForm.register('eh_parcelado')} disabled={modoEdicao} />
                      <label htmlFor="parcelado" className="flex items-center gap-2 font-medium">
                        <CreditCard className="h-4 w-4" />
                        Parcelar este gasto
                      </label>
                    </div>
                    {/* Total de Parcelas (condicional) */}
                    <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <label htmlFor="parcelas">Total de Parcelas *</label>
                        <Select value={String(gastoForm.watch('total_parcelas'))} onValueChange={value => gastoForm.setValue('total_parcelas', Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="1" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {gastoForm.formState.errors.total_parcelas && <p className="text-sm text-red-500">{gastoForm.formState.errors.total_parcelas.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label>Valor por Parcela</label>
                        <div className="p-3 bg-background rounded border text-lg font-semibold">
                          {gastoForm.watch('eh_parcelado') ? `R$ ${(Number(gastoForm.watch('valor_total') || 0) / Math.max(Number(gastoForm.watch('total_parcelas') || 1), 1)).toFixed(2)}` : `R$ ${Number(gastoForm.watch('valor_total') || 0).toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Observações */}
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="observacoes" className="font-medium">Observações</label>
                    <Textarea id="observacoes" {...gastoForm.register('observacoes')} className="min-h-[80px]" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="participantes" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Participantes do Gasto</h3>
                    <p className="text-sm text-muted-foreground">Defina quem vai participar e quanto cada pessoa deve pagar</p>
                  </div>
                  <Button type="button" variant="outline" onClick={addParticipante}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {/* Calculadora rápida */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Calculadora Rápida</h4>
                      <Button type="button" variant="outline" size="sm" onClick={dividirIgualmente}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Dividir Igualmente
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <div className="font-semibold">R$ {Number(gastoForm.watch('valor_total') || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Participantes:</span>
                        {(() => {
                          const participantes = gastoForm.watch('participantes') as Array<{ nome: string; valor_devido: number; pessoa_id?: number | null }> | undefined;
                          return (
                            <div className="font-semibold">{Array.isArray(participantes) ? participantes.length : 0}</div>
                          );
                        })()}
                      </div>
                      {/* Corrigir Soma Atual */}
                      <div>
                        <span className="text-muted-foreground">Soma Atual:</span>
                        <div className={`font-semibold ${Math.abs(participantesArr.reduce((acc, p) => acc + p.valor_devido, 0) - valorTotal) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>R$ {Number(participantesArr.reduce((acc, p) => acc + p.valor_devido, 0)).toFixed(2)}</div>
                      </div>
                      {/* Corrigir Diferença */}
                      <div>
                        <span className="text-muted-foreground">Diferença:</span>
                        <div className={`font-semibold ${Math.abs(participantesArr.reduce((acc, p) => acc + p.valor_devido, 0) - valorTotal) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>R$ {Number(valorTotal - participantesArr.reduce((acc, p) => acc + p.valor_devido, 0)).toFixed(2)}</div>
                      </div>
                    </div>
                    {/* Feedback de balanceamento */}
                    {gastoForm.formState.errors.participantes && (
                      <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {gastoForm.formState.errors.participantes.message as string}
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Lista de participantes */}
                <div className="space-y-3">
                  {Array.isArray(gastoForm.watch('participantes') as unknown)
                    ? (gastoForm.watch('participantes') as Array<{ nome: string; valor_devido: number; pessoa_id?: number | null }> ).length === 0
                    : true && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum participante adicionado</p>
                      <p className="text-sm">Clique em &quot;Adicionar&quot; para incluir participantes</p>
                    </div>
                  )}
                  {/* Corrigir Resumo dos participantes */}
                  {participantesArr.map((participante, index) => {
                    // Participantes já selecionados (exceto o atual)
                    const idsSelecionados = participantesArr.map((p, i) => i !== index ? p.pessoa_id : null).filter(Boolean);
                    const opcoes = participantesAtivos
                      .filter(p => !idsSelecionados.includes(p.id))
                      .map(p => ({ label: p.nome, value: p.id, email: p.email }));
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-64 max-w-xs">
                              <Combobox
                                options={opcoes}
                                value={participante.pessoa_id}
                                onChange={(value: unknown) => {
                                  const valor = typeof value === 'number' || value === null || value === undefined ? value : undefined;
                                  const participantes = Array.isArray(gastoForm.getValues().participantes as unknown)
                                    ? [...(gastoForm.getValues().participantes as Array<{ nome: string; valor_devido: number; pessoa_id?: number | null }>)]
                                    : [];
                                  const pessoa = participantesAtivos.find(p => p.id === valor);
                                  participantes[index].pessoa_id = valor;
                                  participantes[index].nome = pessoa?.nome || '';
                                  gastoForm.setValue('participantes', participantes);
                                }}
                                placeholder="Selecione o participante"
                                searchPlaceholder="Buscar membro..."
                                emptyPlaceholder="Nenhum membro encontrado."
                              />
                            </div>
                            <Input
                              className="w-32"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Valor devido"
                              value={participante.valor_devido}
                              onChange={e => {
                                const participantes = Array.isArray(gastoForm.getValues().participantes as unknown)
                                  ? [...(gastoForm.getValues().participantes as Array<{ nome: string; valor_devido: number; pessoa_id?: number | null }>)]
                                  : [];
                                participantes[index].valor_devido = parseFloat(e.target.value) || 0;
                                gastoForm.setValue('participantes', participantes);
                              }}
                            />
                            <div className="p-3 bg-muted rounded text-sm w-24 text-center">
                              {valorTotal > 0 ? `${((participante.valor_devido / valorTotal) * 100).toFixed(1)}%` : '0%'}
                            </div>
                            <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => removeParticipante(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {/* Feedback de erro (placeholder) */}
                {gastoForm.formState.errors.participantes && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mt-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {gastoForm.formState.errors.participantes.message as string}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="tags" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold">Tags e Categorias</h3>
                  <p className="text-sm text-muted-foreground">Selecione até 5 tags para categorizar esta transação</p>
                </div>
                {loadingCategorias ? (
                  <div className="text-center text-muted-foreground">Carregando categorias...</div>
                ) : availableTags.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">Nenhuma categoria cadastrada</p>
                    <Button variant="default" onClick={() => router.push('/categorias/nova')}>
                      Cadastrar Categoria
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableTags.map(tag => (
                      <Card
                        key={tag.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          (gastoForm.watch('tags') || []).includes(tag.id)
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                            <span className="text-sm font-medium">{tag.nome}</span>
                            {(gastoForm.watch('tags') || []).includes(tag.id) && (
                              <Check className="h-4 w-4 text-primary ml-auto" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {/* Badges de tags selecionadas */}
                {(gastoForm.watch('tags') || []).length > 0 && (
                  <div className="space-y-2">
                    <label className="font-medium">Tags Selecionadas:</label>
                    <div className="flex flex-wrap gap-2">
                      {(gastoForm.watch('tags') || []).map(tagId => {
                        const tag = availableTags.find(t => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor }} />
                            {tag.nome}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleTag(tagId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {/* Feedback de erro */}
                {gastoForm.formState.errors.tags && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {gastoForm.formState.errors.tags.message as string}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="resumo" className="space-y-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold">Resumo da Transação</h3>
                  <p className="text-sm text-muted-foreground">Revise todos os dados antes de salvar</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Informações Básicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        <div className="font-medium">Gasto</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Descrição:</span>
                        <div className="font-medium">{gastoForm.watch('descricao')}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Local/Fonte:</span>
                        <div className="font-medium">{gastoForm.watch('local')}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Valor:</span>
                        <div className="font-medium text-lg">R$ {Number(gastoForm.watch('valor_total') || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Data:</span>
                        <div className="font-medium">{gastoForm.watch('data_transacao')}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Parcelamento:</span>
                        <div className="font-medium">{gastoForm.watch('eh_parcelado') ? `${gastoForm.watch('total_parcelas')}x` : 'À vista'}</div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Participantes e Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Participantes e Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Participantes:</span>
                        <div className="space-y-1 mt-1">
                          {/* Corrigir Resumo dos participantes */}
                          {participantesArr.map((participante, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{participante.nome}</span>
                              <span className="font-medium">R$ {Number(participante.valor_devido).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(gastoForm.watch('tags') || []).map(tagId => {
                            const tag = availableTags.find(t => t.id === tagId);
                            return tag ? (
                              <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor }} />
                                {tag.nome}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Observações:</span>
                        <div className="text-sm bg-muted p-2 rounded mt-1">{gastoForm.watch('observacoes')}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Status de validação (placeholder) */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-medium">Pronto para salvar</span>
                    </div>
                  </CardContent>
                </Card>
                {/* <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-700 font-medium">Verificar participantes</span>
                    </div>
                  </CardContent>
                </Card> */}
              </TabsContent>
            </Tabs>
          ) : (
            // RECEITA: campos simplificados
            <div className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="descricao" className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" /> Descrição *
                  </label>
                  <Input id="descricao" {...receitaForm.register('descricao')} autoFocus />
                  {receitaForm.formState.errors.descricao && <p className="text-sm text-red-500">{receitaForm.formState.errors.descricao.message}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="local" className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" /> Fonte
                  </label>
                  <Input id="local" {...receitaForm.register('local')} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="valor_recebido" className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-4 w-4" /> Valor Recebido *
                  </label>
                  <Input id="valor_recebido" type="number" step="0.01" min="0.01" {...receitaForm.register('valor_recebido', { valueAsNumber: true })} />
                  {receitaForm.formState.errors.valor_recebido && <p className="text-sm text-red-500">{receitaForm.formState.errors.valor_recebido.message}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="data" className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4" /> Data *
                  </label>
                  <Input id="data" type="date" {...receitaForm.register('data_transacao')} />
                  {receitaForm.formState.errors.data_transacao && <p className="text-sm text-red-500">{receitaForm.formState.errors.data_transacao.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="observacoes" className="font-medium">Observações</label>
                  <Textarea id="observacoes" {...receitaForm.register('observacoes')} className="min-h-[80px]" />
                </div>
              </div>
              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold">Tags e Categorias</h3>
                <p className="text-sm text-muted-foreground">Selecione até 5 tags para categorizar esta receita</p>
                {loadingCategorias ? (
                  <div className="text-center text-muted-foreground">Carregando categorias...</div>
                ) : availableTags.length === 0 ? (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">Nenhuma categoria cadastrada</p>
                    <Button variant="default" onClick={() => router.push('/categorias/nova')}>
                      Cadastrar Categoria
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableTags.map(tag => (
                      <Card
                        key={tag.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          (receitaForm.watch('tags') || []).includes(tag.id)
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                            <span className="text-sm font-medium">{tag.nome}</span>
                            {(receitaForm.watch('tags') || []).includes(tag.id) && (
                              <Check className="h-4 w-4 text-primary ml-auto" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {/* Badges de tags selecionadas */}
                {(receitaForm.watch('tags') || []).length > 0 && (
                  <div className="space-y-2">
                    <label className="font-medium">Tags Selecionadas:</label>
                    <div className="flex flex-wrap gap-2">
                      {(receitaForm.watch('tags') || []).map(tagId => {
                        const tag = availableTags.find(t => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor }} />
                            {tag.nome}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => toggleTag(tagId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {/* Feedback de erro */}
                {receitaForm.formState.errors.tags && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {receitaForm.formState.errors.tags.message as string}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" className="min-w-[140px]" disabled={!form.formState.isValid || createTransacao.isPending || createReceita.isPending}>
              <Check className="h-4 w-4 mr-2" />
              {tipoTransacao === 'GASTO' ? 'Salvar Transação' : 'Salvar Receita'}
              <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl+↵</kbd>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}