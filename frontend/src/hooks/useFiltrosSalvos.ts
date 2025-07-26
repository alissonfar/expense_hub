import { useState, useEffect } from 'react';
import { FiltroRelatorio } from './useRelatorios';

export interface FiltroSalvo {
  id: string;
  nome: string;
  filtros: FiltroRelatorio;
  criadoEm: string;
  ultimoUso?: string;
}

const STORAGE_KEY = '@PersonalExpenseHub:filtrosSalvos';

/**
 * Hook para gerenciar filtros salvos localmente
 * Permite salvar, carregar, atualizar e deletar filtros de relatórios
 */
export function useFiltrosSalvos() {
  const [filtrosSalvos, setFiltrosSalvos] = useState<FiltroSalvo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar filtros salvos do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FiltroSalvo[];
        setFiltrosSalvos(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrosSalvos));
      } catch (error) {
        console.error('Erro ao salvar filtros:', error);
      }
    }
  }, [filtrosSalvos, isLoading]);

  /**
   * Salva um novo filtro
   */
  const salvarFiltro = (nome: string, filtros: FiltroRelatorio): string => {
    const novoFiltro: FiltroSalvo = {
      id: `filtro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nome: nome.trim(),
      filtros,
      criadoEm: new Date().toISOString(),
    };

    setFiltrosSalvos(prev => [...prev, novoFiltro]);
    return novoFiltro.id;
  };

  /**
   * Carrega um filtro salvo e marca como usado recentemente
   */
  const carregarFiltro = (id: string): FiltroRelatorio | null => {
    const filtro = filtrosSalvos.find(f => f.id === id);
    if (!filtro) return null;

    // Marcar como usado recentemente
    setFiltrosSalvos(prev => 
      prev.map(f => 
        f.id === id 
          ? { ...f, ultimoUso: new Date().toISOString() }
          : f
      )
    );

    return filtro.filtros;
  };

  /**
   * Atualiza um filtro existente
   */
  const atualizarFiltro = (id: string, novoNome?: string, novosFiltros?: FiltroRelatorio): boolean => {
    const filtroIndex = filtrosSalvos.findIndex(f => f.id === id);
    if (filtroIndex === -1) return false;

    setFiltrosSalvos(prev => 
      prev.map((f, index) => 
        index === filtroIndex 
          ? {
              ...f,
              ...(novoNome && { nome: novoNome.trim() }),
              ...(novosFiltros && { filtros: novosFiltros }),
              ultimoUso: new Date().toISOString(),
            }
          : f
      )
    );

    return true;
  };

  /**
   * Remove um filtro salvo
   */
  const removerFiltro = (id: string): boolean => {
    const filtroExists = filtrosSalvos.some(f => f.id === id);
    if (!filtroExists) return false;

    setFiltrosSalvos(prev => prev.filter(f => f.id !== id));
    return true;
  };

  /**
   * Verifica se um nome de filtro já existe
   */
  const nomeJaExiste = (nome: string, excluirId?: string): boolean => {
    return filtrosSalvos.some(f => 
      f.nome.toLowerCase() === nome.toLowerCase() && f.id !== excluirId
    );
  };

  /**
   * Obtém filtros ordenados por uso recente
   */
  const getFiltrosOrdenados = (): FiltroSalvo[] => {
    return [...filtrosSalvos].sort((a, b) => {
      // Priorizar por último uso, depois por data de criação
      const aDate = a.ultimoUso || a.criadoEm;
      const bDate = b.ultimoUso || b.criadoEm;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  };

  /**
   * Limpa todos os filtros salvos
   */
  const limparTodosFiltros = (): void => {
    setFiltrosSalvos([]);
  };

  return {
    filtrosSalvos: getFiltrosOrdenados(),
    isLoading,
    salvarFiltro,
    carregarFiltro,
    atualizarFiltro,
    removerFiltro,
    nomeJaExiste,
    limparTodosFiltros,
    totalFiltros: filtrosSalvos.length,
  };
}