'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Target, 
  Plus, 
  Trophy, 
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Save,
  Star,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Gift
} from 'lucide-react';
import { useMetasFinanceiras, MetaFinanceira, TipoMeta } from '@/hooks/useMetasFinanceiras';
import { useTags } from '@/hooks/useTags';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetasFinanceirasProps {
  className?: string;
}

interface NovaMeta {
  nome: string;
  descricao: string;
  tipo: TipoMeta;
  valorObjetivo: number;
  dataFim: Date | undefined;
  categoriaId?: string;
  categoriaNome?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  lembretes: boolean;
  cor: string;
}

export function MetasFinanceiras({ className }: MetasFinanceirasProps) {
  const { 
    metasAtivas, 
    metasConcluidas,
    estatisticas,
    conquistas,
    isLoading, 
    criarMeta,
    atualizarProgresso,
    alterarStatusMeta,
    editarMeta,
    removerMeta,
    getProgressoMeta
  } = useMetasFinanceiras();
  
  const { data: tags = [] } = useTags();
  
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [showConquistasDialog, setShowConquistasDialog] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<MetaFinanceira | null>(null);
  const [novoValorProgresso, setNovoValorProgresso] = useState('');
  
  const [novaMeta, setNovaMeta] = useState<NovaMeta>({
    nome: '',
    descricao: '',
    tipo: 'valor_fixo',
    valorObjetivo: 0,
    dataFim: undefined,
    prioridade: 'media',
    lembretes: true,
    cor: '#3B82F6',
  });

  // Cores predefinidas
  const coresDisponiveis = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Tipos de meta disponíveis
  const tiposMeta = [
    { value: 'valor_fixo', label: 'Valor Fixo', description: 'Economizar um valor específico' },
    { value: 'economia', label: 'Economia Mensal', description: 'Economizar um valor por mês' },
    { value: 'reducao_gastos', label: 'Redução de Gastos', description: 'Reduzir gastos em relação ao período anterior' },
    { value: 'limite_categoria', label: 'Limite por Categoria', description: 'Não ultrapassar limite em categoria específica' },
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa', color: 'bg-gray-500' },
    { value: 'media', label: 'Média', color: 'bg-blue-500' },
    { value: 'alta', label: 'Alta', color: 'bg-red-500' },
  ];

  const resetFormulario = () => {
    setNovaMeta({
      nome: '',
      descricao: '',
      tipo: 'valor_fixo',
      valorObjetivo: 0,
      dataFim: undefined,
      prioridade: 'media',
      lembretes: true,
      cor: '#3B82F6',
    });
  };

  const handleCriarMeta = () => {
    if (!novaMeta.nome.trim() || novaMeta.valorObjetivo <= 0 || !novaMeta.dataFim) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      criarMeta(
        novaMeta.nome,
        novaMeta.valorObjetivo,
        novaMeta.dataFim.toISOString(),
        novaMeta.tipo,
        {
          descricao: novaMeta.descricao,
          categoriaId: novaMeta.categoriaId,
          categoriaNome: novaMeta.categoriaNome,
          prioridade: novaMeta.prioridade,
          lembretes: novaMeta.lembretes,
          cor: novaMeta.cor,
        }
      );

      toast({
        title: "Meta criada!",
        description: `Meta "${novaMeta.nome}" foi criada com sucesso.`,
      });

      setShowCriarDialog(false);
      resetFormulario();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAtualizarProgresso = (meta: MetaFinanceira) => {
    const valor = parseFloat(novoValorProgresso);
    if (isNaN(valor) || valor < 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      });
      return;
    }

    atualizarProgresso(meta.id, valor);
    setNovoValorProgresso('');
    setMetaSelecionada(null);

    toast({
      title: "Progresso atualizado!",
      description: `Meta "${meta.nome}" foi atualizada.`,
    });
  };

  const getIconeStatus = (meta: MetaFinanceira) => {
    switch (meta.status) {
      case 'concluida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pausada':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'ativa':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCorPrioridade = (prioridade: string) => {
    const prioridadeInfo = prioridades.find(p => p.value === prioridade);
    return prioridadeInfo?.color || 'bg-gray-500';
  };

  const formatarDataRestante = (dataFim: string) => {
    const hoje = new Date();
    const fim = new Date(dataFim);
    const diasRestantes = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return { texto: 'Vencida', cor: 'text-red-600' };
    if (diasRestantes === 0) return { texto: 'Hoje', cor: 'text-yellow-600' };
    if (diasRestantes === 1) return { texto: '1 dia', cor: 'text-yellow-600' };
    if (diasRestantes <= 7) return { texto: `${diasRestantes} dias`, cor: 'text-yellow-600' };
    if (diasRestantes <= 30) return { texto: `${diasRestantes} dias`, cor: 'text-blue-600' };
    
    return { texto: `${diasRestantes} dias`, cor: 'text-gray-600' };
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <CardTitle>Metas Financeiras</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {conquistas.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowConquistasDialog(true)}
                  className="gap-2"
                >
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Conquistas ({conquistas.length})
                </Button>
              )}
              
              <Dialog open={showCriarDialog} onOpenChange={setShowCriarDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Criar Nova Meta Financeira
                    </DialogTitle>
                    <DialogDescription>
                      Defina uma meta financeira pessoal para manter o foco nos seus objetivos
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da Meta *</Label>
                        <Input
                          id="nome"
                          value={novaMeta.nome}
                          onChange={(e) => setNovaMeta(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Ex: Economia para viagem"
                          maxLength={50}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo de Meta</Label>
                        <Select
                          value={novaMeta.tipo}
                          onValueChange={(value: TipoMeta) => setNovaMeta(prev => ({ ...prev, tipo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposMeta.map(tipo => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                <div>
                                  <div className="font-medium">{tipo.label}</div>
                                  <div className="text-xs text-gray-500">{tipo.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={novaMeta.descricao}
                        onChange={(e) => setNovaMeta(prev => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descreva o objetivo da sua meta..."
                        rows={3}
                        maxLength={200}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor Objetivo (R$) *</Label>
                        <Input
                          id="valor"
                          type="number"
                          min="0"
                          step="0.01"
                          value={novaMeta.valorObjetivo || ''}
                          onChange={(e) => setNovaMeta(prev => ({ 
                            ...prev, 
                            valorObjetivo: parseFloat(e.target.value) || 0 
                          }))}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Data de Conclusão *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !novaMeta.dataFim && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {novaMeta.dataFim ? (
                                format(novaMeta.dataFim, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={novaMeta.dataFim}
                              onSelect={(date) => setNovaMeta(prev => ({ ...prev, dataFim: date }))}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {novaMeta.tipo === 'limite_categoria' && (
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select
                          value={novaMeta.categoriaId || ''}
                          onValueChange={(value) => {
                            const tag = tags?.find(t => t.id === value);
                            setNovaMeta(prev => ({
                              ...prev,
                              categoriaId: value,
                              categoriaNome: tag?.nome || '',
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {tags?.map(tag => (
                              <SelectItem key={tag.id} value={tag.id}>
                                {tag.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <Select
                          value={novaMeta.prioridade}
                          onValueChange={(value: 'baixa' | 'media' | 'alta') => 
                            setNovaMeta(prev => ({ ...prev, prioridade: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {prioridades.map(prioridade => (
                              <SelectItem key={prioridade.value} value={prioridade.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${prioridade.color}`} />
                                  {prioridade.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cor da Meta</Label>
                        <div className="flex gap-2 flex-wrap">
                          {coresDisponiveis.map(cor => (
                            <button
                              key={cor}
                              type="button"
                              className={`w-6 h-6 rounded-full border-2 ${
                                novaMeta.cor === cor ? 'border-gray-900' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: cor }}
                              onClick={() => setNovaMeta(prev => ({ ...prev, cor }))}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lembretes"
                        checked={novaMeta.lembretes}
                        onCheckedChange={(checked) => 
                          setNovaMeta(prev => ({ ...prev, lembretes: !!checked }))
                        }
                      />
                      <Label htmlFor="lembretes" className="text-sm">
                        Ativar lembretes para esta meta
                      </Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCriarDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCriarMeta}
                        disabled={!novaMeta.nome.trim() || novaMeta.valorObjetivo <= 0 || !novaMeta.dataFim}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Criar Meta
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <CardDescription>
            {metasAtivas.length === 0 
              ? "Crie metas financeiras para organizar e alcançar seus objetivos pessoais"
              : `Acompanhe o progresso das suas ${metasAtivas.length} metas ativas`
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {metasAtivas.length === 0 ? (
            // Estado sem metas
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma meta definida
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Defina metas financeiras para manter o foco nos seus objetivos pessoais e acompanhar seu progresso.
              </p>
              <Dialog open={showCriarDialog} onOpenChange={setShowCriarDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeira Meta
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            // Dashboard das metas
            <div className="space-y-6">
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Metas Ativas</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{estatisticas.totalMetasAtivas}</p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Progresso Médio</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {estatisticas.progressoMedio.toFixed(0)}%
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">Concluídas</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">{estatisticas.totalMetasConcluidas}</p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">Próximas do Prazo</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{estatisticas.metasProximasVencimento}</p>
                </div>
              </div>

              <Separator />

              {/* Lista de Metas Ativas */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <div className="flex">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  </div>
                  Metas Ativas
                </h4>
                
                <AnimatePresence>
                  <div className="grid gap-4">
                    {metasAtivas.map((meta, index) => {
                      const progressoDetalhado = getProgressoMeta(meta.id);
                      const percentualCompleto = progressoDetalhado?.percentualCompleto || 0;
                      const dataRestante = formatarDataRestante(meta.dataFim);
                      
                      return (
                        <motion.div
                          key={meta.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                          style={{ borderLeftColor: meta.cor, borderLeftWidth: '4px' }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-lg">{meta.nome}</h5>
                                <Badge variant="secondary" className="text-xs">
                                  {tiposMeta.find(t => t.value === meta.tipo)?.label}
                                </Badge>
                                <div className={`w-2 h-2 rounded-full ${getCorPrioridade(meta.prioridade)}`} />
                              </div>
                              
                              {meta.descricao && (
                                <p className="text-sm text-gray-600 mb-2">{meta.descricao}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span className={dataRestante.cor}>
                                    {dataRestante.texto}
                                  </span>
                                </div>
                                {meta.categoriaNome && (
                                  <Badge variant="outline" className="text-xs">
                                    {meta.categoriaNome}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getIconeStatus(meta)}
                              <Badge 
                                variant={percentualCompleto >= 100 ? "default" : "secondary"}
                                className={percentualCompleto >= 100 ? "bg-green-600" : ""}
                              >
                                {percentualCompleto.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(meta.valorAtual)}
                                </span>
                                <span className="font-medium">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(meta.valorObjetivo)}
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(percentualCompleto, 100)} 
                                className="h-2"
                                style={{ 
                                  '--progress-foreground': meta.cor 
                                } as React.CSSProperties}
                              />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-500">
                                {meta.valorObjetivo > meta.valorAtual && (
                                  <span>
                                    Faltam {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(meta.valorObjetivo - meta.valorAtual)}
                                  </span>
                                )}
                                
                                {meta.valorAtual >= meta.valorObjetivo && (
                                  <span className="text-green-600 font-medium">
                                    🎉 Meta conquistada!
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMetaSelecionada(meta);
                                    setNovoValorProgresso(meta.valorAtual.toString());
                                  }}
                                  className="h-7 px-2"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => alterarStatusMeta(meta.id, 'pausada')}
                                  className="h-7 px-2"
                                >
                                  <PauseCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para atualizar progresso */}
      {metaSelecionada && (
        <Dialog open={!!metaSelecionada} onOpenChange={() => setMetaSelecionada(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Progresso</DialogTitle>
              <DialogDescription>
                Atualize o progresso da meta "{metaSelecionada.nome}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novoValor">Valor Atual (R$)</Label>
                <Input
                  id="novoValor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={novoValorProgresso}
                  onChange={(e) => setNovoValorProgresso(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMetaSelecionada(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleAtualizarProgresso(metaSelecionada)}>
                  Atualizar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Conquistas */}
      <Dialog open={showConquistasDialog} onOpenChange={setShowConquistasDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Suas Conquistas
            </DialogTitle>
            <DialogDescription>
              Parabéns pelas metas conquistadas! 🎉
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conquistas.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Ainda sem conquistas</p>
              </div>
            ) : (
              conquistas.map(conquista => (
                <div key={conquista.metaId} className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div className="flex-1">
                      <h4 className="font-medium">{conquista.metaNome}</h4>
                      <p className="text-sm text-gray-600">
                        Concluída em {format(parseISO(conquista.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Valor: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(conquista.valorAlcancado)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Concluída em {conquista.tempoParaConclusao} dias
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}