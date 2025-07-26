'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PiggyBank, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { useOrcamento, OrcamentoCategoria } from '@/hooks/useOrcamento';
import { useTags } from '@/hooks/useTags';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ControleOrcamentoProps {
  className?: string;
}

interface NovaCategoriaBudget {
  categoriaId: string;
  categoriaNome: string;
  limite: number;
  cor?: string;
}

export function ControleOrcamento({ className }: ControleOrcamentoProps) {
  const { 
    orcamentoAtual, 
    estatisticas, 
    isLoading, 
    definirOrcamento,
    alertas 
  } = useOrcamento();
  
  const { data: tags = [] } = useTags();
  
  const [showDefinirDialog, setShowDefinirDialog] = useState(false);
  const [novasCategorias, setNovasCategorias] = useState<NovaCategoriaBudget[]>([]);
  const [categoriaTemp, setCategoriaTemp] = useState<NovaCategoriaBudget>({
    categoriaId: '',
    categoriaNome: '',
    limite: 0,
  });

  // Cores predefinidas para categorias
  const coresDisponiveis = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ];

  const adicionarCategoria = () => {
    if (!categoriaTemp.categoriaId || categoriaTemp.limite <= 0) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria e defina um limite válido",
        variant: "destructive",
      });
      return;
    }

    // Verificar se categoria já foi adicionada
    if (novasCategorias.some(cat => cat.categoriaId === categoriaTemp.categoriaId)) {
      toast({
        title: "Categoria já adicionada",
        description: "Esta categoria já possui um orçamento definido",
        variant: "destructive",
      });
      return;
    }

    const tagSelecionada = tags?.find(tag => tag.id === categoriaTemp.categoriaId);
    const corAleatoria = coresDisponiveis[novasCategorias.length % coresDisponiveis.length];

    setNovasCategorias(prev => [...prev, {
      ...categoriaTemp,
      categoriaNome: tagSelecionada?.nome || categoriaTemp.categoriaNome,
      cor: corAleatoria,
    }]);

    setCategoriaTemp({
      categoriaId: '',
      categoriaNome: '',
      limite: 0,
    });
  };

  const removerCategoria = (categoriaId: string) => {
    setNovasCategorias(prev => prev.filter(cat => cat.categoriaId !== categoriaId));
  };

  const salvarOrcamento = () => {
    if (novasCategorias.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma categoria ao orçamento",
        variant: "destructive",
      });
      return;
    }

    try {
      definirOrcamento(novasCategorias);
      
      toast({
        title: "Orçamento definido!",
        description: `Orçamento mensal de ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(novasCategorias.reduce((sum, cat) => sum + cat.limite, 0))} foi criado com sucesso.`,
      });

      setShowDefinirDialog(false);
      setNovasCategorias([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 100) return 'bg-red-500';
    if (percentual >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (categoria: OrcamentoCategoria) => {
    const percentual = categoria.limite > 0 ? (categoria.gastoAtual / categoria.limite) * 100 : 0;
    
    if (percentual >= 100) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentual >= 80) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
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
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
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
              <PiggyBank className="h-5 w-5 text-blue-600" />
              <CardTitle>Controle de Orçamento</CardTitle>
            </div>
            
            {!orcamentoAtual ? (
              <Dialog open={showDefinirDialog} onOpenChange={setShowDefinirDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Definir Orçamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Definir Orçamento Mensal
                    </DialogTitle>
                    <DialogDescription>
                      Configure limites de gastos por categoria para o mês atual
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Adicionar Nova Categoria */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Categoria
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="categoria">Categoria</Label>
                          <Select
                            value={categoriaTemp.categoriaId}
                            onValueChange={(value) => {
                              const tag = tags?.find(t => t.id === value);
                              setCategoriaTemp(prev => ({
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
                              {tags
                                .filter(tag => !novasCategorias.some(cat => cat.categoriaId === tag.id))
                                .map(tag => (
                                <SelectItem key={tag.id} value={tag.id}>
                                  {tag.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="limite">Limite (R$)</Label>
                          <Input
                            id="limite"
                            type="number"
                            min="0"
                            step="0.01"
                            value={categoriaTemp.limite || ''}
                            onChange={(e) => 
                              setCategoriaTemp(prev => ({
                                ...prev,
                                limite: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <Button 
                            onClick={adicionarCategoria}
                            disabled={!categoriaTemp.categoriaId || categoriaTemp.limite <= 0}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Categorias Adicionadas */}
                    {novasCategorias.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Categorias do Orçamento</h4>
                          <Badge variant="secondary">
                            Total: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(novasCategorias.reduce((sum, cat) => sum + cat.limite, 0))}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {novasCategorias.map(categoria => (
                            <div 
                              key={categoria.categoriaId}
                              className="flex items-center justify-between p-3 border rounded-lg bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: categoria.cor }}
                                />
                                <div>
                                  <p className="font-medium">{categoria.categoriaNome}</p>
                                  <p className="text-sm text-gray-600">
                                    Limite: {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(categoria.limite)}
                                  </p>
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removerCategoria(categoria.categoriaId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDefinirDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={salvarOrcamento}
                        disabled={novasCategorias.length === 0}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Salvar Orçamento
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Badge>
                <Button variant="outline" size="sm" className="gap-1">
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
              </div>
            )}
          </div>
          
          <CardDescription>
            {!orcamentoAtual 
              ? "Configure limites de gastos por categoria para controlar suas finanças pessoais"
              : `Acompanhe seu progresso em relação ao orçamento de ${new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(estatisticas.limiteTotal)}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!orcamentoAtual ? (
            // Estado sem orçamento
            <div className="text-center py-12">
              <PiggyBank className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum orçamento definido
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Defina limites de gastos por categoria para manter suas finanças organizadas e receber alertas quando necessário.
              </p>
              <Dialog open={showDefinirDialog} onOpenChange={setShowDefinirDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Orçamento
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            // Dashboard do orçamento
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Progresso Geral</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(estatisticas.gastoTotal)}
                      </span>
                      <span className="text-blue-600">
                        de {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(estatisticas.limiteTotal)}
                      </span>
                    </div>
                    <Progress 
                      value={estatisticas.percentualGasto} 
                      className="h-2"
                      indicatorClassName={getProgressColor(estatisticas.percentualGasto)}
                    />
                    <p className="text-xs text-blue-600">
                      {estatisticas.percentualGasto.toFixed(1)}% do orçamento utilizado
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      estatisticas.categoriasUltrapassadas > 0 ? 'text-red-500' :
                      estatisticas.categoriasNoLimite > 0 ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <p className="text-sm font-medium">Status das Categorias</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      {estatisticas.categoriasUltrapassadas} ultrapassaram o limite
                    </p>
                    <p className="text-xs text-gray-600">
                      {estatisticas.categoriasNoLimite} próximas do limite
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <p className="text-sm font-medium">Alertas</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">
                      {estatisticas.alertasNaoLidos}
                    </p>
                    <p className="text-xs text-gray-600">
                      notificações não lidas
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Categorias Detalhadas */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  </div>
                  Detalhamento por Categoria
                </h4>
                
                <div className="grid gap-4">
                  {orcamentoAtual.categorias.map(categoria => {
                    const percentual = categoria.limite > 0 
                      ? (categoria.gastoAtual / categoria.limite) * 100 
                      : 0;
                    
                    return (
                      <motion.div
                        key={categoria.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoria.cor }}
                            />
                            <div>
                              <h5 className="font-medium">{categoria.categoriaNome}</h5>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(categoria.gastoAtual)}
                                </span>
                                <span>de</span>
                                <span>
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(categoria.limite)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getStatusIcon(categoria)}
                            <Badge 
                              variant={
                                percentual >= 100 ? "destructive" :
                                percentual >= 80 ? "default" : "secondary"
                              }
                            >
                              {percentual.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <Progress 
                          value={Math.min(percentual, 100)} 
                          className="h-2"
                          indicatorClassName={getProgressColor(percentual)}
                        />
                        
                        {categoria.limite > 0 && categoria.gastoAtual <= categoria.limite && (
                          <p className="text-xs text-gray-500 mt-2">
                            Restam {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(categoria.limite - categoria.gastoAtual)}
                          </p>
                        )}
                        
                        {categoria.gastoAtual > categoria.limite && (
                          <p className="text-xs text-red-600 mt-2">
                            Ultrapassou em {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(categoria.gastoAtual - categoria.limite)}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}