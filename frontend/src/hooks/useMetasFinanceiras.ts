import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

export type TipoMeta = 'economia' | 'reducao_gastos' | 'limite_categoria' | 'valor_fixo' | 'percentual';

export type StatusMeta = 'ativa' | 'pausada' | 'concluida' | 'cancelada';

export interface MetaFinanceira {
  id: string;
  nome: string;
  descricao?: string;
  tipo: TipoMeta;
  valorObjetivo: number;
  valorAtual: number;
  categoriaId?: string; // Para metas específicas de categoria
  categoriaNome?: string;
  dataInicio: string;
  dataFim: string;
  status: StatusMeta;
  cor: string;
  icone?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  lembretes: boolean;
  criadoEm: string;
  ultimaAtualizacao: string;
  conquistado?: boolean;
  dataConquista?: string;
}

export interface ProgressoMeta {
  metaId: string;
  data: string;
  valor: number;
  observacao?: string;
}

export interface ConquistaMeta {
  metaId: string;
  metaNome: string;
  data: string;
  valorAlcancado: number;
  tempoParaConclusao: number; // em dias
  categoria?: string;
}

const STORAGE_KEY = '@PersonalExpenseHub:metas';
const PROGRESSOS_KEY = '@PersonalExpenseHub:progressosMetas';
const CONQUISTAS_KEY = '@PersonalExpenseHub:conquistasMetas';

/**
 * Hook para gerenciar metas financeiras pessoais
 * Funcionalidades: definir metas, acompanhar progresso, celebrar conquistas
 */
export function useMetasFinanceiras() {
  const { hubAtual } = useAuth();
  const [metas, setMetas] = useState<MetaFinanceira[]>([]);
  const [progressos, setProgressos] = useState<ProgressoMeta[]>([]);
  const [conquistas, setConquistas] = useState<ConquistaMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cores predefinidas para metas
  const coresDisponiveis = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  // Carregar dados salvos
  useEffect(() => {
    if (!hubAtual?.id) return;

    try {
      const keyMetas = `${STORAGE_KEY}:${hubAtual.id}`;
      const savedMetas = localStorage.getItem(keyMetas);
      if (savedMetas) {
        setMetas(JSON.parse(savedMetas));
      }

      const keyProgressos = `${PROGRESSOS_KEY}:${hubAtual.id}`;
      const savedProgressos = localStorage.getItem(keyProgressos);
      if (savedProgressos) {
        setProgressos(JSON.parse(savedProgressos));
      }

      const keyConquistas = `${CONQUISTAS_KEY}:${hubAtual.id}`;
      const savedConquistas = localStorage.getItem(keyConquistas);
      if (savedConquistas) {
        setConquistas(JSON.parse(savedConquistas));
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hubAtual?.id]);

  // Salvar metas
  useEffect(() => {
    if (!hubAtual?.id || isLoading) return;

    try {
      const key = `${STORAGE_KEY}:${hubAtual.id}`;
      localStorage.setItem(key, JSON.stringify(metas));
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
    }
  }, [metas, hubAtual?.id, isLoading]);

  // Salvar progressos
  useEffect(() => {
    if (!hubAtual?.id || isLoading) return;

    try {
      const key = `${PROGRESSOS_KEY}:${hubAtual.id}`;
      localStorage.setItem(key, JSON.stringify(progressos));
    } catch (error) {
      console.error('Erro ao salvar progressos:', error);
    }
  }, [progressos, hubAtual?.id, isLoading]);

  // Salvar conquistas
  useEffect(() => {
    if (!hubAtual?.id || isLoading) return;

    try {
      const key = `${CONQUISTAS_KEY}:${hubAtual.id}`;
      localStorage.setItem(key, JSON.stringify(conquistas));
    } catch (error) {
      console.error('Erro ao salvar conquistas:', error);
    }
  }, [conquistas, hubAtual?.id, isLoading]);

  /**
   * Criar nova meta
   */
  const criarMeta = (
    nome: string,
    valorObjetivo: number,
    dataFim: string,
    tipo: TipoMeta = 'valor_fixo',
    opcoes: {
      descricao?: string;
      categoriaId?: string;
      categoriaNome?: string;
      prioridade?: 'baixa' | 'media' | 'alta';
      lembretes?: boolean;
      cor?: string;
    } = {}
  ): string => {
    const metaId = `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const agora = new Date().toISOString();
    
    const novaMeta: MetaFinanceira = {
      id: metaId,
      nome: nome.trim(),
      descricao: opcoes.descricao?.trim(),
      tipo,
      valorObjetivo,
      valorAtual: 0,
      categoriaId: opcoes.categoriaId,
      categoriaNome: opcoes.categoriaNome,
      dataInicio: agora,
      dataFim,
      status: 'ativa',
      cor: opcoes.cor || coresDisponiveis[metas.length % coresDisponiveis.length],
      prioridade: opcoes.prioridade || 'media',
      lembretes: opcoes.lembretes ?? true,
      criadoEm: agora,
      ultimaAtualizacao: agora,
    };

    setMetas(prev => [...prev, novaMeta]);
    return metaId;
  };

  /**
   * Atualizar progresso de uma meta
   */
  const atualizarProgresso = (metaId: string, novoValor: number, observacao?: string) => {
    const meta = metas.find(m => m.id === metaId);
    if (!meta || meta.status !== 'ativa') return;

    const agora = new Date().toISOString();

    // Registrar progresso
    const novoProgresso: ProgressoMeta = {
      metaId,
      data: agora,
      valor: novoValor,
      observacao,
    };

    setProgressos(prev => [...prev, novoProgresso]);

    // Atualizar meta
    setMetas(prev => 
      prev.map(m => {
        if (m.id === metaId) {
          const metaAtualizada = {
            ...m,
            valorAtual: novoValor,
            ultimaAtualizacao: agora,
          };

          // Verificar se a meta foi conquistada
          if (novoValor >= m.valorObjetivo && !m.conquistado) {
            metaAtualizada.conquistado = true;
            metaAtualizada.dataConquista = agora;
            metaAtualizada.status = 'concluida';

            // Registrar conquista
            const novaConquista: ConquistaMeta = {
              metaId: m.id,
              metaNome: m.nome,
              data: agora,
              valorAlcancado: novoValor,
              tempoParaConclusao: Math.ceil(
                (new Date(agora).getTime() - new Date(m.dataInicio).getTime()) / (1000 * 60 * 60 * 24)
              ),
              categoria: m.categoriaNome,
            };

            setConquistas(prev => [...prev, novaConquista]);
          }

          return metaAtualizada;
        }
        return m;
      })
    );
  };

  /**
   * Alterar status de uma meta
   */
  const alterarStatusMeta = (metaId: string, novoStatus: StatusMeta) => {
    setMetas(prev => 
      prev.map(m => 
        m.id === metaId 
          ? { ...m, status: novoStatus, ultimaAtualizacao: new Date().toISOString() }
          : m
      )
    );
  };

  /**
   * Editar meta existente
   */
  const editarMeta = (
    metaId: string,
    dadosAtualizados: Partial<Pick<MetaFinanceira, 'nome' | 'descricao' | 'valorObjetivo' | 'dataFim' | 'prioridade' | 'lembretes' | 'cor'>>
  ) => {
    setMetas(prev => 
      prev.map(m => 
        m.id === metaId 
          ? { ...m, ...dadosAtualizados, ultimaAtualizacao: new Date().toISOString() }
          : m
      )
    );
  };

  /**
   * Remover meta
   */
  const removerMeta = (metaId: string) => {
    setMetas(prev => prev.filter(m => m.id !== metaId));
    setProgressos(prev => prev.filter(p => p.metaId !== metaId));
  };

  /**
   * Obter progresso detalhado de uma meta
   */
  const getProgressoMeta = (metaId: string) => {
    const meta = metas.find(m => m.id === metaId);
    if (!meta) return null;

    const progressosMetaOrdenados = progressos
      .filter(p => p.metaId === metaId)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const percentualCompleto = meta.valorObjetivo > 0 
      ? Math.min((meta.valorAtual / meta.valorObjetivo) * 100, 100)
      : 0;

    const diasRestantes = Math.ceil(
      (new Date(meta.dataFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const velocidadeMedia = progressosMetaOrdenados.length > 1
      ? meta.valorAtual / progressosMetaOrdenados.length
      : 0;

    const estimativaConclusao = velocidadeMedia > 0 && meta.valorAtual < meta.valorObjetivo
      ? Math.ceil((meta.valorObjetivo - meta.valorAtual) / velocidadeMedia)
      : null;

    return {
      meta,
      progressos: progressosMetaOrdenados,
      percentualCompleto,
      diasRestantes,
      velocidadeMedia,
      estimativaConclusao,
      statusTempo: diasRestantes < 0 ? 'vencida' : diasRestantes <= 7 ? 'urgente' : 'normal',
    };
  };

  /**
   * Obter estatísticas gerais
   */
  const getEstatisticas = () => {
    const metasAtivas = metas.filter(m => m.status === 'ativa');
    const metasConcluidas = metas.filter(m => m.status === 'concluida');
    const metasVencidas = metasAtivas.filter(m => new Date(m.dataFim) < new Date());
    
    const totalMetasAtivas = metasAtivas.length;
    const totalMetasConcluidas = metasConcluidas.length;
    const totalMetasVencidas = metasVencidas.length;
    
    const progressoMedio = metasAtivas.length > 0
      ? metasAtivas.reduce((acc, meta) => {
          const percentual = meta.valorObjetivo > 0 ? (meta.valorAtual / meta.valorObjetivo) * 100 : 0;
          return acc + Math.min(percentual, 100);
        }, 0) / metasAtivas.length
      : 0;

    const metasProximasVencimento = metasAtivas.filter(m => {
      const diasRestantes = Math.ceil(
        (new Date(m.dataFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return diasRestantes <= 7 && diasRestantes > 0;
    });

    const conquistasUltimos30Dias = conquistas.filter(c => {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      return new Date(c.data) > trintaDiasAtras;
    });

    return {
      totalMetasAtivas,
      totalMetasConcluidas,
      totalMetasVencidas,
      progressoMedio,
      metasProximasVencimento: metasProximasVencimento.length,
      conquistasRecentes: conquistasUltimos30Dias.length,
      taxaSucesso: metas.length > 0 ? (metasConcluidas.length / metas.length) * 100 : 0,
    };
  };

  /**
   * Obter metas por status
   */
  const getMetasPorStatus = (status: StatusMeta) => {
    return metas.filter(m => m.status === status);
  };

  /**
   * Obter metas por prioridade
   */
  const getMetasPorPrioridade = (prioridade: 'baixa' | 'media' | 'alta') => {
    return metas.filter(m => m.prioridade === prioridade && m.status === 'ativa');
  };

  // Memoizar estatísticas e listas para evitar re-renderizações infinitas
  const estatisticas = useMemo(() => getEstatisticas(), [metas, conquistas]);
  const metasAtivas = useMemo(() => getMetasPorStatus('ativa'), [metas]);
  const metasConcluidas = useMemo(() => getMetasPorStatus('concluida'), [metas]);

  return {
    metas,
    conquistas,
    isLoading,
    criarMeta,
    atualizarProgresso,
    alterarStatusMeta,
    editarMeta,
    removerMeta,
    getProgressoMeta,
    getEstatisticas,
    getMetasPorStatus,
    getMetasPorPrioridade,
    metasAtivas,
    metasConcluidas,
    estatisticas,
  };
}