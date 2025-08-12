import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface OrcamentoCategoria {
  id: string;
  categoriaId: string;
  categoriaNome: string;
  limite: number;
  gastoAtual: number;
  cor?: string;
  criadoEm: string;
  ativo: boolean;
}

export interface OrcamentoMensal {
  id: string;
  ano: number;
  mes: number;
  limiteTotal: number;
  gastoTotal: number;
  categorias: OrcamentoCategoria[];
  criadoEm: string;
  ultimaAtualizacao: string;
}

export interface AlertaOrcamento {
  id: string;
  tipo: 'limite_atingido' | 'limite_ultrapassado' | 'meta_alcancada';
  categoriaId?: string;
  categoriaNome?: string;
  percentual: number;
  valor: number;
  limite: number;
  data: string;
  lido: boolean;
}

const STORAGE_KEY = '@PersonalExpenseHub:orcamentos';
const ALERTAS_KEY = '@PersonalExpenseHub:alertasOrcamento';

/**
 * Hook para gerenciar orçamentos pessoais
 * Funcionalidades: definir limites, acompanhar gastos, alertas automáticos
 */
export function useOrcamento() {
  const { hubAtual } = useAuth();
  const [orcamentos, setOrcamentos] = useState<OrcamentoMensal[]>([]);
  const [alertas, setAlertas] = useState<AlertaOrcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar orçamentos salvos
  useEffect(() => {
    if (!hubAtual?.id) return;

    try {
      const key = `${STORAGE_KEY}:${hubAtual.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setOrcamentos(JSON.parse(saved));
      }

      const alertasKey = `${ALERTAS_KEY}:${hubAtual.id}`;
      const savedAlertas = localStorage.getItem(alertasKey);
      if (savedAlertas) {
        setAlertas(JSON.parse(savedAlertas));
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hubAtual?.id]);

  // Salvar orçamentos
  useEffect(() => {
    if (!hubAtual?.id || isLoading) return;

    try {
      const key = `${STORAGE_KEY}:${hubAtual.id}`;
      localStorage.setItem(key, JSON.stringify(orcamentos));
    } catch (error) {
      console.error('Erro ao salvar orçamentos:', error);
    }
  }, [orcamentos, hubAtual?.id, isLoading]);

  // Salvar alertas
  useEffect(() => {
    if (!hubAtual?.id || isLoading) return;

    try {
      const key = `${ALERTAS_KEY}:${hubAtual.id}`;
      localStorage.setItem(key, JSON.stringify(alertas));
    } catch (error) {
      console.error('Erro ao salvar alertas:', error);
    }
  }, [alertas, hubAtual?.id, isLoading]);

  /**
   * Obter orçamento do mês atual ou específico
   */
  const getOrcamentoMes = useCallback((ano?: number, mes?: number): OrcamentoMensal | null => {
    const agora = new Date();
    const targetAno = ano ?? agora.getFullYear();
    const targetMes = mes ?? agora.getMonth() + 1;

    return orcamentos.find(o => o.ano === targetAno && o.mes === targetMes) || null;
  }, [orcamentos]);

  /**
   * Criar ou atualizar orçamento mensal
   */
  const definirOrcamento = (
    categorias: Array<{ categoriaId: string; categoriaNome: string; limite: number; cor?: string }>,
    ano?: number,
    mes?: number
  ): string => {
    const agora = new Date();
    const targetAno = ano ?? agora.getFullYear();
    const targetMes = mes ?? agora.getMonth() + 1;

    const orcamentoId = `orcamento_${targetAno}_${targetMes}`;
    const limiteTotal = categorias.reduce((sum, cat) => sum + cat.limite, 0);

    const novoOrcamento: OrcamentoMensal = {
      id: orcamentoId,
      ano: targetAno,
      mes: targetMes,
      limiteTotal,
      gastoTotal: 0, // Será atualizado via API
      categorias: categorias.map(cat => ({
        id: `${orcamentoId}_${cat.categoriaId}`,
        categoriaId: cat.categoriaId,
        categoriaNome: cat.categoriaNome,
        limite: cat.limite,
        gastoAtual: 0, // Será atualizado via API
        cor: cat.cor,
        criadoEm: new Date().toISOString(),
        ativo: true,
      })),
      criadoEm: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
    };

    setOrcamentos(prev => {
      const filtered = prev.filter(o => !(o.ano === targetAno && o.mes === targetMes));
      return [...filtered, novoOrcamento];
    });

    return orcamentoId;
  };

  /**
   * Atualizar gastos atuais (normalmente chamado após mudanças em transações)
   */
  const atualizarGastos = (
    gastoPorCategoria: Array<{ categoriaId: string; valor: number }>,
    ano?: number,
    mes?: number
  ) => {
    const agora = new Date();
    const targetAno = ano ?? agora.getFullYear();
    const targetMes = mes ?? agora.getMonth() + 1;

    setOrcamentos(prev => 
      prev.map(orcamento => {
        if (orcamento.ano === targetAno && orcamento.mes === targetMes) {
          const categoriasAtualizadas = orcamento.categorias.map(cat => {
            const gastoInfo = gastoPorCategoria.find(g => g.categoriaId === cat.categoriaId);
            return {
              ...cat,
              gastoAtual: gastoInfo?.valor || 0,
            };
          });

          const novoGastoTotal = categoriasAtualizadas.reduce((sum, cat) => sum + cat.gastoAtual, 0);

          // Verificar alertas
          verificarAlertas(categoriasAtualizadas, orcamento.limiteTotal, novoGastoTotal);

          return {
            ...orcamento,
            categorias: categoriasAtualizadas,
            gastoTotal: novoGastoTotal,
            ultimaAtualizacao: new Date().toISOString(),
          };
        }
        return orcamento;
      })
    );
  };

  /**
   * Verificar e gerar alertas automáticos
   */
  const verificarAlertas = (
    categorias: OrcamentoCategoria[],
    limiteTotal: number,
    gastoTotal: number
  ) => {
    const novosAlertas: AlertaOrcamento[] = [];
    const agora = new Date().toISOString();

    // Alertas por categoria (80% e 100% do limite)
    categorias.forEach(cat => {
      if (cat.limite > 0) {
        const percentual = (cat.gastoAtual / cat.limite) * 100;

        if (percentual >= 100) {
          novosAlertas.push({
            id: `alerta_${Date.now()}_${cat.categoriaId}_ultrapassado`,
            tipo: 'limite_ultrapassado',
            categoriaId: cat.categoriaId,
            categoriaNome: cat.categoriaNome,
            percentual,
            valor: cat.gastoAtual,
            limite: cat.limite,
            data: agora,
            lido: false,
          });
        } else if (percentual >= 80) {
          // Verificar se já não existe alerta similar recente
          const alertaExistente = alertas.some(a => 
            a.categoriaId === cat.categoriaId && 
            a.tipo === 'limite_atingido' &&
            new Date(a.data).getMonth() === new Date().getMonth()
          );

          if (!alertaExistente) {
            novosAlertas.push({
              id: `alerta_${Date.now()}_${cat.categoriaId}_atingido`,
              tipo: 'limite_atingido',
              categoriaId: cat.categoriaId,
              categoriaNome: cat.categoriaNome,
              percentual,
              valor: cat.gastoAtual,
              limite: cat.limite,
              data: agora,
              lido: false,
            });
          }
        }
      }
    });

    // Alerta total (90% do orçamento mensal)
    if (limiteTotal > 0 && gastoTotal > 0) {
      const percentualTotal = (gastoTotal / limiteTotal) * 100;
      if (percentualTotal >= 90) {
        const alertaExistente = alertas.some(a => 
          !a.categoriaId && 
          a.tipo === 'limite_atingido' &&
          new Date(a.data).getMonth() === new Date().getMonth()
        );

        if (!alertaExistente) {
          novosAlertas.push({
            id: `alerta_${Date.now()}_total_atingido`,
            tipo: 'limite_atingido',
            percentual: percentualTotal,
            valor: gastoTotal,
            limite: limiteTotal,
            data: agora,
            lido: false,
          });
        }
      }
    }

    if (novosAlertas.length > 0) {
      setAlertas(prev => [...prev, ...novosAlertas]);
    }
  };

  /**
   * Marcar alerta como lido
   */
  const marcarAlertaLido = (alertaId: string) => {
    setAlertas(prev => 
      prev.map(alerta => 
        alerta.id === alertaId ? { ...alerta, lido: true } : alerta
      )
    );
  };

  /**
   * Limpar alertas antigos (mais de 30 dias)
   */
  const limparAlertasAntigos = () => {
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    setAlertas(prev => 
      prev.filter(alerta => new Date(alerta.data) > trintaDiasAtras)
    );
  };

  /**
   * Estatísticas rápidas
   */
  const getEstatisticas = useCallback(() => {
    const orcamentoAtual = getOrcamentoMes();
    if (!orcamentoAtual) {
      return {
        temOrcamento: false,
        limiteTotal: 0,
        gastoTotal: 0,
        percentualGasto: 0,
        categoriasNoLimite: 0,
        categoriasUltrapassadas: 0,
        alertasNaoLidos: alertas.filter(a => !a.lido).length,
      };
    }

    const categoriasNoLimite = orcamentoAtual.categorias.filter(
      cat => cat.limite > 0 && cat.gastoAtual >= cat.limite * 0.8
    ).length;

    const categoriasUltrapassadas = orcamentoAtual.categorias.filter(
      cat => cat.limite > 0 && cat.gastoAtual > cat.limite
    ).length;

    return {
      temOrcamento: true,
      limiteTotal: orcamentoAtual.limiteTotal,
      gastoTotal: orcamentoAtual.gastoTotal,
      percentualGasto: orcamentoAtual.limiteTotal > 0 
        ? (orcamentoAtual.gastoTotal / orcamentoAtual.limiteTotal) * 100 
        : 0,
      categoriasNoLimite,
      categoriasUltrapassadas,
      alertasNaoLidos: alertas.filter(a => !a.lido).length,
    };
  }, [getOrcamentoMes, alertas]);

  // Memoizar estatísticas para evitar re-renderizações infinitas
  const estatisticas = useMemo(() => getEstatisticas(), [getEstatisticas]);
  const orcamentoAtual = useMemo(() => getOrcamentoMes(), [getOrcamentoMes]);

  return {
    orcamentos,
    alertas: alertas.filter(a => !a.lido), // Apenas não lidos por padrão
    isLoading,
    getOrcamentoMes,
    definirOrcamento,
    atualizarGastos,
    marcarAlertaLido,
    limparAlertasAntigos,
    getEstatisticas,
    orcamentoAtual,
    estatisticas,
  };
}