import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { PanoramaGeralParams } from '@/hooks/usePanoramaGeral';

interface FiltrosPanoramaGeralProps {
  filtros: PanoramaGeralParams;
  onFiltrosChange: (filtros: PanoramaGeralParams) => void;
}

export function FiltrosPanoramaGeral({ filtros, onFiltrosChange }: FiltrosPanoramaGeralProps) {
  const handleChange = (campo: keyof PanoramaGeralParams, valor: unknown) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const resetFiltros = () => {
    onFiltrosChange({
      periodo: 'mes_atual',
      statusPagamento: 'TODOS',
      ordenarPor: 'valor_devido',
      ordem: 'desc',
      incluirDetalhes: false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Análise
          </CardTitle>
          <Button variant="outline" size="sm" onClick={resetFiltros}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div className="space-y-2">
            <Label htmlFor="periodo">Período</Label>
            <Select
              value={filtros.periodo}
              onValueChange={(value: 'mes_atual' | 'personalizado') => 
                handleChange('periodo', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Início (se período personalizado) */}
          {filtros.periodo === 'personalizado' && (
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio || ''}
                onChange={(e) => handleChange('dataInicio', e.target.value)}
              />
            </div>
          )}

          {/* Data Fim (se período personalizado) */}
          {filtros.periodo === 'personalizado' && (
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim || ''}
                onChange={(e) => handleChange('dataFim', e.target.value)}
              />
            </div>
          )}

          {/* Status de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="statusPagamento">Status</Label>
            <Select
              value={filtros.statusPagamento}
              onValueChange={(value: 'PENDENTE' | 'PAGO_PARCIAL' | 'TODOS') => 
                handleChange('statusPagamento', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status do pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PAGO_PARCIAL">Pago Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordenar Por */}
          <div className="space-y-2">
            <Label htmlFor="ordenarPor">Ordenar Por</Label>
            <Select
              value={filtros.ordenarPor}
              onValueChange={(value: 'nome' | 'valor_devido' | 'dias_atraso') => 
                handleChange('ordenarPor', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Campo de ordenação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Nome</SelectItem>
                <SelectItem value="valor_devido">Valor Devido</SelectItem>
                <SelectItem value="dias_atraso">Dias de Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordem */}
          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem</Label>
            <Select
              value={filtros.ordem}
              onValueChange={(value: 'asc' | 'desc') => 
                handleChange('ordem', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Direção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Incluir Detalhes */}
          <div className="space-y-2">
            <Label>Opções</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirDetalhes"
                checked={filtros.incluirDetalhes}
                onCheckedChange={(checked) => handleChange('incluirDetalhes', checked)}
              />
              <Label htmlFor="incluirDetalhes" className="text-sm font-normal">
                Incluir detalhes das transações
              </Label>
            </div>
          </div>
        </div>

        {/* Resumo dos Filtros Aplicados */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Filtros aplicados:</span>
            {' '}
            {filtros.periodo === 'mes_atual' ? 'Mês Atual' : 
             filtros.dataInicio && filtros.dataFim ? 
             `${filtros.dataInicio} a ${filtros.dataFim}` : 'Período personalizado'
            }
            {' • '}
            Status: {filtros.statusPagamento}
            {' • '}
            Ordem: {filtros.ordenarPor} ({filtros.ordem === 'desc' ? 'Decrescente' : 'Crescente'})
            {filtros.incluirDetalhes && ' • Detalhes incluídos'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}