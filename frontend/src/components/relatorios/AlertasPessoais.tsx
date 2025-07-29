'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  TrendingUp, 
  Target,
  PiggyBank,
  CheckCircle,
  X,
  Eye,
  Settings,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { useOrcamento } from '@/hooks/useOrcamento';
import { useMetasFinanceiras } from '@/hooks/useMetasFinanceiras';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertasPessoaisProps {
  className?: string;
}

export type TipoAlerta = 
  | 'orcamento_limite'
  | 'orcamento_ultrapassado'
  | 'meta_prazo'
  | 'meta_progresso_lento'
  | 'gastos_crescentes'
  | 'economia_possivel'
  | 'parabens'
  | 'lembrete';

export interface AlertaInteligente {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;
  severidade: 'info' | 'warning' | 'error' | 'success';
  acao?: {
    label: string;
    callback: () => void;
  };
  data: string;
  lido: boolean;
  categoria?: string;
  valor?: number;
  metaId?: string;
}

export function AlertasPessoais({ className }: AlertasPessoaisProps) {
  const { orcamentoAtual, estatisticas: estatisticasOrcamento } = useOrcamento();
  const { metasAtivas, estatisticas: estatisticasMetas } = useMetasFinanceiras();
  
  const [todosAlertas, setTodosAlertas] = useState<AlertaInteligente[]>([]);
  const [alertasLidos, setAlertasLidos] = useState<string[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Gerar alertas inteligentes baseados nos dados disponíveis
  useEffect(() => {
    const novosAlertas: AlertaInteligente[] = [];
    const agora = new Date();

    // Alertas de Orçamento
    if (orcamentoAtual) {
      // Orçamento próximo do limite (80%)
      if (estatisticasOrcamento.percentualGasto >= 80 && estatisticasOrcamento.percentualGasto < 100) {
        novosAlertas.push({
          id: `orcamento_limite_${agora.getTime()}`,
          tipo: 'orcamento_limite',
          titulo: '⚠️ Orçamento próximo do limite',
          mensagem: `Você já utilizou ${estatisticasOrcamento.percentualGasto.toFixed(0)}% do seu orçamento mensal. Cuidado para não ultrapassar!`,
          severidade: 'warning',
          data: agora.toISOString(),
          lido: false,
          valor: estatisticasOrcamento.gastoTotal,
        });
      }

      // Orçamento ultrapassado
      if (estatisticasOrcamento.percentualGasto >= 100) {
        novosAlertas.push({
          id: `orcamento_ultrapassado_${agora.getTime()}`,
          tipo: 'orcamento_ultrapassado',
          titulo: '🚨 Orçamento ultrapassado!',
          mensagem: `Você ultrapassou seu orçamento em ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(estatisticasOrcamento.gastoTotal - estatisticasOrcamento.limiteTotal)}. Revise seus gastos.`,
          severidade: 'error',
          data: agora.toISOString(),
          lido: false,
          valor: estatisticasOrcamento.gastoTotal - estatisticasOrcamento.limiteTotal,
        });
      }

      // Categorias específicas ultrapassadas
      if (orcamentoAtual.categorias) {
        orcamentoAtual.categorias.forEach(categoria => {
          if (categoria.gastoAtual > categoria.limite) {
            novosAlertas.push({
              id: `categoria_ultrapassada_${categoria.id}_${agora.getTime()}`,
              tipo: 'orcamento_ultrapassado',
              titulo: `💸 ${categoria.categoriaNome} ultrapassou o limite`,
              mensagem: `A categoria "${categoria.categoriaNome}" ultrapassou o limite em ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(categoria.gastoAtual - categoria.limite)}.`,
              severidade: 'error',
              data: agora.toISOString(),
              lido: false,
              categoria: categoria.categoriaNome,
              valor: categoria.gastoAtual - categoria.limite,
            });
          }
        });
      }
    }

    // Alertas de Metas
    metasAtivas.forEach(meta => {
      const diasRestantes = differenceInDays(new Date(meta.dataFim), agora);
      const percentualCompleto = meta.valorObjetivo > 0 ? (meta.valorAtual / meta.valorObjetivo) * 100 : 0;

      // Meta próxima do prazo
      if (diasRestantes <= 7 && diasRestantes > 0 && percentualCompleto < 80) {
        novosAlertas.push({
          id: `meta_prazo_${meta.id}_${agora.getTime()}`,
          tipo: 'meta_prazo',
          titulo: `⏰ Meta "${meta.nome}" próxima do prazo`,
          mensagem: `Sua meta vence em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''} e você está com ${percentualCompleto.toFixed(0)}% completo. Acelere para conquistá-la!`,
          severidade: 'warning',
          data: agora.toISOString(),
          lido: false,
          metaId: meta.id,
        });
      }

      // Meta com progresso lento
      if (diasRestantes > 7 && percentualCompleto < 25) {
        const diasDecorridos = differenceInDays(agora, new Date(meta.dataInicio));
        const totalDias = differenceInDays(new Date(meta.dataFim), new Date(meta.dataInicio));
        const percentualTempo = diasDecorridos / totalDias * 100;

        if (percentualTempo > 50 && percentualCompleto < 25) {
          novosAlertas.push({
            id: `meta_progresso_lento_${meta.id}_${agora.getTime()}`,
            tipo: 'meta_progresso_lento',
            titulo: `🐌 Meta "${meta.nome}" com progresso lento`,
            mensagem: `Você está no meio do prazo mas apenas ${percentualCompleto.toFixed(0)}% da meta foi completada. Considere revisar sua estratégia.`,
            severidade: 'info',
            data: agora.toISOString(),
            lido: false,
            metaId: meta.id,
          });
        }
      }

      // Meta quase conquistada
      if (percentualCompleto >= 90 && percentualCompleto < 100) {
        novosAlertas.push({
          id: `meta_quase_conquistada_${meta.id}_${agora.getTime()}`,
          tipo: 'parabens',
          titulo: `🎯 Quase lá! Meta "${meta.nome}"`,
          mensagem: `Você está a apenas ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(meta.valorObjetivo - meta.valorAtual)} de conquistar sua meta!`,
          severidade: 'success',
          data: agora.toISOString(),
          lido: false,
          metaId: meta.id,
        });
      }
    });

    // Alertas de economia e insights
    if (orcamentoAtual && estatisticasOrcamento.percentualGasto < 70) {
      const economia = estatisticasOrcamento.limiteTotal - estatisticasOrcamento.gastoTotal;
      novosAlertas.push({
        id: `economia_possivel_${agora.getTime()}`,
        tipo: 'economia_possivel',
        titulo: '💰 Boa! Você está economizando',
        mensagem: `Parabéns! Você está ${(100 - estatisticasOrcamento.percentualGasto).toFixed(0)}% abaixo do seu orçamento. Isso representa uma economia de ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(economia)}.`,
        severidade: 'success',
        data: agora.toISOString(),
        lido: false,
        valor: economia,
      });
    }

    // Parabéns por conquistas recentes
    if (estatisticasMetas.conquistasRecentes > 0) {
      novosAlertas.push({
        id: `conquistas_recentes_${agora.getTime()}`,
        tipo: 'parabens',
        titulo: '🏆 Parabéns pelas conquistas!',
        mensagem: `Você conquistou ${estatisticasMetas.conquistasRecentes} meta${estatisticasMetas.conquistasRecentes > 1 ? 's' : ''} nos últimos 30 dias. Continue assim!`,
        severidade: 'success',
        data: agora.toISOString(),
        lido: false,
      });
    }

    setTodosAlertas(novosAlertas);
  }, [orcamentoAtual, estatisticasOrcamento, metasAtivas, estatisticasMetas]);

  // Filtrar alertas não lidos
  const alertas = todosAlertas.filter(alerta => !alertasLidos.includes(alerta.id));

  const marcarComoLido = (alertaId: string) => {
    setAlertasLidos(prev => [...prev, alertaId]);
  };

  const marcarTodosComoLidos = () => {
    const todosIds = todosAlertas.map(a => a.id);
    setAlertasLidos(prev => [...prev, ...todosIds]);
    
    toast({
      title: "Alertas marcados como lidos",
      description: "Todos os alertas foram marcados como lidos.",
    });
  };

  const getIconeAlerta = (tipo: TipoAlerta) => {
    switch (tipo) {
      case 'orcamento_limite':
      case 'orcamento_ultrapassado':
        return <PiggyBank className="h-4 w-4" />;
      case 'meta_prazo':
      case 'meta_progresso_lento':
        return <Target className="h-4 w-4" />;
      case 'gastos_crescentes':
        return <TrendingUp className="h-4 w-4" />;
      case 'economia_possivel':
        return <CheckCircle className="h-4 w-4" />;
      case 'parabens':
        return <CheckCircle className="h-4 w-4" />;
      case 'lembrete':
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCorSeveridade = (severidade: AlertaInteligente['severidade']) => {
    switch (severidade) {
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getCorIcone = (severidade: AlertaInteligente['severidade']) => {
    switch (severidade) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  };

  const alertasExibir = mostrarTodos ? alertas : alertas.slice(0, 3);

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
              <Bell className="h-5 w-5 text-orange-600" />
              <CardTitle>Alertas Inteligentes</CardTitle>
              {alertas.length > 0 && (
                <Badge variant="destructive" className="h-5">
                  {alertas.length}
                </Badge>
              )}
            </div>
            
            {alertas.length > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={marcarTodosComoLidos}
                  className="gap-2 text-xs"
                >
                  <CheckCircle className="h-3 w-3" />
                  Marcar todos como lidos
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <CardDescription>
            {alertas.length === 0 
              ? "Tudo certo! Não há alertas importantes no momento"
              : `${alertas.length} alerta${alertas.length > 1 ? 's' : ''} importante${alertas.length > 1 ? 's' : ''} para sua atenção`
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {alertas.length === 0 ? (
            // Estado sem alertas
            <div className="text-center py-8">
              <div className="relative">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <CheckCircle className="h-6 w-6 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tudo tranquilo! 🎉
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Suas finanças estão organizadas. Continue acompanhando para manter o controle!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-3 border rounded-lg">
                  <PiggyBank className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Orçamento</p>
                  <p className="text-xs text-gray-600">Sob controle</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Metas</p>
                  <p className="text-xs text-gray-600">No caminho certo</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Insights</p>
                  <p className="text-xs text-gray-600">Em análise</p>
                </div>
              </div>
            </div>
          ) : (
            // Lista de alertas
            <div className="space-y-4">
              <AnimatePresence>
                {alertasExibir.map((alerta, index) => (
                  <motion.div
                    key={alerta.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={cn(
                      "p-4 border-l-4 rounded-lg transition-all duration-200 hover:shadow-md",
                      getCorSeveridade(alerta.severidade)
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("mt-1", getCorIcone(alerta.severidade))}>
                          {getIconeAlerta(alerta.tipo)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {alerta.titulo}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {alerta.mensagem}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(alerta.data), 'HH:mm', { locale: ptBR })}
                            </div>
                            {alerta.categoria && (
                              <Badge variant="outline" className="text-xs">
                                {alerta.categoria}
                              </Badge>
                            )}
                            {alerta.valor && (
                              <span className="font-medium">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(alerta.valor)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        {alerta.acao && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={alerta.acao.callback}
                            className="h-7 px-2 text-xs"
                          >
                            {alerta.acao.label}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarComoLido(alerta.id)}
                          className="h-7 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {alertas.length > 3 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMostrarTodos(!mostrarTodos)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {mostrarTodos 
                      ? 'Mostrar menos' 
                      : `Ver todos (${alertas.length - 3} restantes)`
                    }
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}