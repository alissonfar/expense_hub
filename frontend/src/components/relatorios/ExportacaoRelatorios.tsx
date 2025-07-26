'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Table, FileImage, Settings, Check, AlertCircle } from 'lucide-react';
import { FiltroRelatorio, RelatoriosData } from '@/hooks/useRelatorios';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ExportacaoRelatoriosProps {
  dados: RelatoriosData;
  filtros: FiltroRelatorio;
  className?: string;
}

interface ConfiguracaoExportacao {
  formato: 'pdf' | 'excel' | 'csv';
  incluirGraficos: boolean;
  incluirResumo: boolean;
  incluirDetalhes: boolean;
  incluirComparativo: boolean;
  orientacao?: 'portrait' | 'landscape';
}

export function ExportacaoRelatorios({ dados, filtros, className }: ExportacaoRelatoriosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<ConfiguracaoExportacao>({
    formato: 'pdf',
    incluirGraficos: true,
    incluirResumo: true,
    incluirDetalhes: true,
    incluirComparativo: !!dados.comparativo,
    orientacao: 'portrait',
  });

  const formatoOptions = [
    { 
      value: 'pdf', 
      label: 'PDF', 
      icon: FileText, 
      description: 'Relatório formatado para impressão',
      features: ['Gráficos inclusos', 'Layout profissional', 'Pronto para compartilhar']
    },
    { 
      value: 'excel', 
      label: 'Excel', 
      icon: Table, 
      description: 'Planilha para análise detalhada',
      features: ['Múltiplas abas', 'Dados brutos', 'Fórmulas incluídas']
    },
    { 
      value: 'csv', 
      label: 'CSV', 
      icon: FileImage, 
      description: 'Dados brutos para importação',
      features: ['Formato universal', 'Leve e rápido', 'Compatível com qualquer sistema']
    },
  ];

  const handleExportar = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Preparar dados para exportação
      const exportData = {
        ...filtros,
        configuracao: config,
        dados: {
          resumo: config.incluirResumo ? dados.resumo : undefined,
          graficos: config.incluirGraficos ? dados.graficos : undefined,
          comparativo: config.incluirComparativo ? dados.comparativo : undefined,
        },
      };

      // TODO: Implementar chamada real para API de exportação
      // const response = await api.post('/relatorios/exportar', exportData);
      
      // Simular delay da exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProgress(100);

      // Simular download
      const blob = new Blob(['Dados do relatório...'], { 
        type: config.formato === 'pdf' ? 'application/pdf' : 
              config.formato === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${Date.now()}.${config.formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída!",
        description: `Relatório exportado em formato ${config.formato.toUpperCase()}`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const selectedFormat = formatoOptions.find(f => f.value === config.formato);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatório
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação e baixe seu relatório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Formato */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato do Arquivo</Label>
            <div className="grid grid-cols-3 gap-3">
              {formatoOptions.map((formato) => {
                const Icon = formato.icon;
                return (
                  <Card 
                    key={formato.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      config.formato === formato.value 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setConfig({ ...config, formato: formato.value as any })}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${
                        config.formato === formato.value ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <p className={`font-medium ${
                        config.formato === formato.value ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {formato.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formato.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Características do formato selecionado */}
            {selectedFormat && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-2">
                        Características do {selectedFormat.label}:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {selectedFormat.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-600 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Opções de Conteúdo */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Conteúdo a Incluir</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incluirResumo"
                  checked={config.incluirResumo}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, incluirResumo: !!checked })
                  }
                />
                <Label htmlFor="incluirResumo" className="text-sm">
                  Resumo Executivo
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incluirGraficos"
                  checked={config.incluirGraficos}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, incluirGraficos: !!checked })
                  }
                  disabled={config.formato === 'csv'}
                />
                <Label htmlFor="incluirGraficos" className="text-sm">
                  Gráficos e Visualizações
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incluirDetalhes"
                  checked={config.incluirDetalhes}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, incluirDetalhes: !!checked })
                  }
                />
                <Label htmlFor="incluirDetalhes" className="text-sm">
                  Dados Detalhados
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incluirComparativo"
                  checked={config.incluirComparativo}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, incluirComparativo: !!checked })
                  }
                  disabled={!dados.comparativo}
                />
                <Label htmlFor="incluirComparativo" className="text-sm">
                  Análise Comparativa
                </Label>
              </div>
            </div>
          </div>

          {/* Orientação para PDF */}
          {config.formato === 'pdf' && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Orientação da Página</Label>
                <Select 
                  value={config.orientacao} 
                  onValueChange={(value: 'portrait' | 'landscape') => 
                    setConfig({ ...config, orientacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Progresso da Exportação */}
          {isExporting && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 animate-spin text-blue-600" />
                  <Label className="text-sm font-medium">Gerando relatório...</Label>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-gray-500">
                  {progress < 30 ? 'Coletando dados...' :
                   progress < 60 ? 'Processando informações...' :
                   progress < 90 ? 'Formatando relatório...' :
                   'Finalizando exportação...'}
                </p>
              </div>
            </>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExportar}
              disabled={isExporting}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}