 'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FiltroRelatorio, PeriodoTipo } from '@/hooks/useRelatorios';
import { useFiltrosSalvos } from '@/hooks/useFiltrosSalvos';

interface FiltrosAvancadosProps {
  filtros: FiltroRelatorio;
  onFiltrosChange: (filtros: FiltroRelatorio) => void;
  className?: string;
}

const periodoOptions: { value: PeriodoTipo; label: string }[] = [
  { value: '7_dias', label: 'Últimos 7 dias' },
  { value: '30_dias', label: 'Últimos 30 dias' },
  { value: '90_dias', label: 'Últimos 90 dias' },
  { value: '1_ano', label: 'Último ano' },
  { value: 'personalizado', label: 'Período personalizado' },
];

export function FiltrosAvancados({
  filtros,
  onFiltrosChange,
  className,
}: FiltrosAvancadosProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [nomeNovoFiltro, setNomeNovoFiltro] = useState('');
  
  // Hook para gerenciar filtros salvos
  const {
    filtrosSalvos,
    salvarFiltro,
    carregarFiltro,
    nomeJaExiste,
  } = useFiltrosSalvos();

  const handlePeriodoChange = (periodo: PeriodoTipo) => {
    onFiltrosChange({
      ...filtros,
      periodo,
      ...(periodo !== 'personalizado' && { dataInicio: undefined, dataFim: undefined }),
    });
  };

  const handleDataChange = (tipo: 'inicio' | 'fim', data: Date | undefined) => {
    onFiltrosChange({
      ...filtros,
      [tipo === 'inicio' ? 'dataInicio' : 'dataFim']: data ? format(data, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleValorChange = (tipo: 'minimo' | 'maximo', valor: string) => {
    const numericValue = valor ? parseFloat(valor) : undefined;
    onFiltrosChange({
      ...filtros,
      [tipo === 'minimo' ? 'valorMinimo' : 'valorMaximo']: numericValue,
    });
  };

  const handleStatusChange = (status: 'TODOS' | 'CONFIRMADO' | 'PENDENTE') => {
    onFiltrosChange({ ...filtros, status });
  };

  const handleOrdenacaoChange = (campo: string, direcao?: 'asc' | 'desc') => {
    onFiltrosChange({
      ...filtros,
      ordenacao: {
        campo: campo as 'data' | 'valor' | 'categoria' | 'pessoa',
        direcao: direcao || filtros.ordenacao.direcao,
      },
    });
  };

  const limparFiltros = () => {
    onFiltrosChange({
      periodo: '30_dias',
      categorias: [],
      pessoas: [],
      status: 'TODOS',
      ordenacao: { campo: 'data', direcao: 'desc' },
    });
  };

  const handleSalvarFiltro = () => {
    if (nomeNovoFiltro.trim() && !nomeJaExiste(nomeNovoFiltro.trim())) {
      salvarFiltro(nomeNovoFiltro.trim(), filtros);
      setNomeNovoFiltro('');
      setShowSaveDialog(false);
    }
  };

  const handleCarregarFiltro = (filtroId: string) => {
    const filtrosCarregados = carregarFiltro(filtroId);
    if (filtrosCarregados) {
      onFiltrosChange(filtrosCarregados);
    }
  };

  const filtrosAtivos = [
    filtros.periodo !== '30_dias' && `Período: ${periodoOptions.find(p => p.value === filtros.periodo)?.label}`,
    filtros.dataInicio && `De: ${format(new Date(filtros.dataInicio), 'dd/MM/yyyy')}`,
    filtros.dataFim && `Até: ${format(new Date(filtros.dataFim), 'dd/MM/yyyy')}`,
    filtros.valorMinimo && `Min: R$ ${filtros.valorMinimo.toFixed(2)}`,
    filtros.valorMaximo && `Max: R$ ${filtros.valorMaximo.toFixed(2)}`,
    filtros.status !== 'TODOS' && `Status: ${filtros.status}`,
    filtros.categorias.length > 0 && `${filtros.categorias.length} categoria(s)`,
    filtros.pessoas.length > 0 && `${filtros.pessoas.length} pessoa(s)`,
  ].filter(Boolean);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros Avançados
          </CardTitle>
          <div className="flex items-center gap-2">
            {filtrosSalvos.length > 0 && (
              <Select onValueChange={handleCarregarFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtros salvos" />
                </SelectTrigger>
                <SelectContent>
                  {filtrosSalvos.map((filtroSalvo) => (
                    <SelectItem key={filtroSalvo.id} value={filtroSalvo.id}>
                      {filtroSalvo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Ocultar' : 'Expandir'}
            </Button>
          </div>
        </div>
        
        {/* Filtros Ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filtrosAtivos.map((filtro, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {filtro}
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={limparFiltros}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Linha 1: Período e Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select value={filtros.periodo} onValueChange={handlePeriodoChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtros.periodo === 'personalizado' && (
              <>
                <div>
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtros.dataInicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtros.dataInicio ? 
                          format(new Date(filtros.dataInicio), 'dd/MM/yyyy', { locale: ptBR }) : 
                          "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filtros.dataInicio ? new Date(filtros.dataInicio) : undefined}
                        onSelect={(date) => handleDataChange('inicio', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtros.dataFim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtros.dataFim ? 
                          format(new Date(filtros.dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 
                          "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filtros.dataFim ? new Date(filtros.dataFim) : undefined}
                        onSelect={(date) => handleDataChange('fim', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>

          {/* Linha 2: Valores e Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="valorMinimo">Valor Mínimo</Label>
              <Input
                id="valorMinimo"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filtros.valorMinimo || ''}
                onChange={(e) => handleValorChange('minimo', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="valorMaximo">Valor Máximo</Label>
              <Input
                id="valorMaximo"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filtros.valorMaximo || ''}
                onChange={(e) => handleValorChange('maximo', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filtros.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmadas</SelectItem>
                  <SelectItem value="PENDENTE">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 3: Ordenação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ordenarPor">Ordenar Por</Label>
              <Select 
                value={filtros.ordenacao.campo} 
                onValueChange={(value) => handleOrdenacaoChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="valor">Valor</SelectItem>
                  <SelectItem value="categoria">Categoria</SelectItem>
                  <SelectItem value="pessoa">Pessoa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="direcao">Direção</Label>
              <Select 
                value={filtros.ordenacao.direcao} 
                onValueChange={(value: 'asc' | 'desc') => handleOrdenacaoChange(filtros.ordenacao.campo, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TODO: Implementar seletores de categorias e pessoas quando disponível */}
        </CardContent>
      )}

      {/* Dialog para salvar filtro */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Salvar Filtro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nomeFiltro">Nome do Filtro</Label>
                <Input
                  id="nomeFiltro"
                  placeholder="Ex: Gastos do mês"
                  value={nomeNovoFiltro}
                  onChange={(e) => setNomeNovoFiltro(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSalvarFiltro()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvarFiltro}
                  disabled={!nomeNovoFiltro.trim() || nomeJaExiste(nomeNovoFiltro.trim())}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}