'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Table, FileImage, User } from 'lucide-react';
import { RelatorioPessoaData, RelatorioPessoaParams } from '@/hooks/useRelatorioPessoa';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportacaoRelatorioPessoaProps {
  dados: RelatorioPessoaData;
  filtros: RelatorioPessoaParams;
  className?: string;
}

interface ConfiguracaoExportacao {
  formato: 'pdf' | 'excel' | 'csv';
  incluirResumo: boolean;
  incluirTransacoes: boolean;
  incluirDetalhes: boolean;
  incluirGraficos: boolean;
  orientacao?: 'portrait' | 'landscape';
}

export function ExportacaoRelatorioPessoa({ dados, filtros, className }: ExportacaoRelatorioPessoaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<ConfiguracaoExportacao>({
    formato: 'pdf',
    incluirResumo: true,
    incluirTransacoes: true,
    incluirDetalhes: true,
    incluirGraficos: false,
    orientacao: 'portrait',
  });

  const formatoOptions = [
    { 
      value: 'pdf', 
      label: 'PDF', 
      icon: FileText, 
      description: 'Relatório formatado para impressão',
      features: ['Layout profissional', 'Gráficos inclusos', 'Pronto para compartilhar']
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
      console.log('🚀 Iniciando exportação do relatório por pessoa...', { config, dados: !!dados, filtros });
      
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

      // Executar exportação baseada no formato
      switch (config.formato) {
        case 'pdf':
          await exportarPDF();
          break;
        case 'excel':
          await exportarExcel();
          break;
        case 'csv':
          await exportarCSV();
          break;
      }

      clearInterval(progressInterval);
      setProgress(100);

      // Aguardar um pouco para mostrar 100%
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        setIsOpen(false);
        toast({
          title: "Exportação concluída!",
          description: `Relatório de ${dados.saldo.pessoaNome} salvo como relatorio-pessoa.${config.formato}`,
        });
      }, 500);

    } catch (error) {
      console.error('❌ Erro na exportação:', error);
      setIsExporting(false);
      setProgress(0);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const exportarPDF = async () => {
    console.log('📄 Gerando PDF...');
    
    try {
      const doc = new jsPDF(config.orientacao === 'landscape' ? 'landscape' : 'portrait', 'mm', 'a4');
      
      // Configurações do documento
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Cabeçalho
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('Relatório Individual', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Nome da pessoa
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text(dados.saldo.pessoaNome, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Informações do período
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(52, 73, 94);
      const periodo = filtros.periodo === 'mes_atual' ? 'Mês Atual' : 
                     `${filtros.dataInicio} a ${filtros.dataFim}`;
      doc.text(`Período: ${periodo}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(127, 140, 141);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Resumo do Saldo
      if (config.incluirResumo) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Resumo do Saldo', margin, yPosition);
        yPosition += 10;

        const saldoData = [
          ['Métrica', 'Valor'],
          ['Total Devido', `R$ ${dados.saldo.totalDeve.toFixed(2)}`],
          ['Total Pago', `R$ ${dados.saldo.totalPago.toFixed(2)}`],
          ['Saldo Final', `R$ ${dados.saldo.saldoFinal.toFixed(2)}`],
          ['Status', dados.saldo.status],
          ['Transações Pendentes', dados.saldo.transacoesPendentes.toString()],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [saldoData[0]],
          body: saldoData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // Resumo das Transações
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Resumo das Transações', margin, yPosition);
        yPosition += 10;

        const resumoData = [
          ['Métrica', 'Valor'],
          ['Total de Transações', dados.resumo.totalTransacoes.toString()],
          ['Transações Pendentes', dados.resumo.transacoesPendentes.toString()],
          ['Transações Pagas', dados.resumo.transacoesPagas.toString()],
          ['Valor Médio', `R$ ${dados.resumo.valorMedioTransacao.toFixed(2)}`],
          ['Maior Transação', `R$ ${dados.resumo.maiorTransacao.toFixed(2)}`],
          ['Menor Transação', `R$ ${dados.resumo.menorTransacao.toFixed(2)}`],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [resumoData[0]],
          body: resumoData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [52, 152, 219], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Lista de Transações
      if (config.incluirTransacoes && dados.transacoes && dados.transacoes.length > 0) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Lista de Transações', margin, yPosition);
        yPosition += 10;

        const transacoesData = dados.transacoes.map(transacao => [
          transacao.descricao,
          new Date(transacao.dataTransacao).toLocaleDateString('pt-BR'),
          `R$ ${transacao.valorTotal.toFixed(2)}`,
          `R$ ${transacao.valorDevido.toFixed(2)}`,
          `R$ ${transacao.valorPago.toFixed(2)}`,
          transacao.statusPagamento,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Descrição', 'Data', 'Valor Total', 'Devido', 'Pago', 'Status']],
          body: transacoesData,
          theme: 'grid',
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          styles: { fontSize: 8 },
          margin: { left: margin, right: margin },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(127, 140, 141);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      // Salvar arquivo
      const filename = `relatorio-${dados.saldo.pessoaNome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  };

  const exportarExcel = async () => {
    console.log('📊 Gerando Excel...');
    
    try {
      // Criar conteúdo CSV (simulando Excel)
      let csvContent = '';
      
      // Cabeçalho
      csvContent += `Relatório Individual - ${dados.saldo.pessoaNome}\n`;
      csvContent += `Período: ${filtros.periodo === 'mes_atual' ? 'Mês Atual' : `${filtros.dataInicio} a ${filtros.dataFim}`}\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Resumo do Saldo
      if (config.incluirResumo) {
        csvContent += 'RESUMO DO SALDO\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total Devido,R$ ${dados.saldo.totalDeve.toFixed(2)}\n`;
        csvContent += `Total Pago,R$ ${dados.saldo.totalPago.toFixed(2)}\n`;
        csvContent += `Saldo Final,R$ ${dados.saldo.saldoFinal.toFixed(2)}\n`;
        csvContent += `Status,${dados.saldo.status}\n`;
        csvContent += `Transações Pendentes,${dados.saldo.transacoesPendentes}\n\n`;

        csvContent += 'RESUMO DAS TRANSAÇÕES\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total de Transações,${dados.resumo.totalTransacoes}\n`;
        csvContent += `Transações Pendentes,${dados.resumo.transacoesPendentes}\n`;
        csvContent += `Transações Pagas,${dados.resumo.transacoesPagas}\n`;
        csvContent += `Valor Médio,R$ ${dados.resumo.valorMedioTransacao.toFixed(2)}\n`;
        csvContent += `Maior Transação,R$ ${dados.resumo.maiorTransacao.toFixed(2)}\n`;
        csvContent += `Menor Transação,R$ ${dados.resumo.menorTransacao.toFixed(2)}\n\n`;
      }

      // Lista de Transações
      if (config.incluirTransacoes && dados.transacoes && dados.transacoes.length > 0) {
        csvContent += 'LISTA DE TRANSAÇÕES\n';
        csvContent += 'Descrição,Data,Valor Total,Devido,Pago,Status\n';
        dados.transacoes.forEach(transacao => {
          csvContent += `${transacao.descricao},${new Date(transacao.dataTransacao).toLocaleDateString('pt-BR')},R$ ${transacao.valorTotal.toFixed(2)},R$ ${transacao.valorDevido.toFixed(2)},R$ ${transacao.valorPago.toFixed(2)},${transacao.statusPagamento}\n`;
        });
      }

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `relatorio-${dados.saldo.pessoaNome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ Excel/CSV gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw error;
    }
  };

  const exportarCSV = async () => {
    console.log('📄 Gerando CSV...');
    
    try {
      // Criar conteúdo CSV
      let csvContent = '';
      
      // Cabeçalho
      csvContent += `Relatório Individual - ${dados.saldo.pessoaNome}\n`;
      csvContent += `Período: ${filtros.periodo === 'mes_atual' ? 'Mês Atual' : `${filtros.dataInicio} a ${filtros.dataFim}`}\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Resumo do Saldo
      if (config.incluirResumo) {
        csvContent += 'RESUMO DO SALDO\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total Devido,R$ ${dados.saldo.totalDeve.toFixed(2)}\n`;
        csvContent += `Total Pago,R$ ${dados.saldo.totalPago.toFixed(2)}\n`;
        csvContent += `Saldo Final,R$ ${dados.saldo.saldoFinal.toFixed(2)}\n`;
        csvContent += `Status,${dados.saldo.status}\n`;
        csvContent += `Transações Pendentes,${dados.saldo.transacoesPendentes}\n\n`;

        csvContent += 'RESUMO DAS TRANSAÇÕES\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total de Transações,${dados.resumo.totalTransacoes}\n`;
        csvContent += `Transações Pendentes,${dados.resumo.transacoesPendentes}\n`;
        csvContent += `Transações Pagas,${dados.resumo.transacoesPagas}\n`;
        csvContent += `Valor Médio,R$ ${dados.resumo.valorMedioTransacao.toFixed(2)}\n`;
        csvContent += `Maior Transação,R$ ${dados.resumo.maiorTransacao.toFixed(2)}\n`;
        csvContent += `Menor Transação,R$ ${dados.resumo.menorTransacao.toFixed(2)}\n\n`;
      }

      // Lista de Transações
      if (config.incluirTransacoes && dados.transacoes && dados.transacoes.length > 0) {
        csvContent += 'LISTA DE TRANSAÇÕES\n';
        csvContent += 'Descrição,Data,Valor Total,Devido,Pago,Status\n';
        dados.transacoes.forEach(transacao => {
          csvContent += `${transacao.descricao},${new Date(transacao.dataTransacao).toLocaleDateString('pt-BR')},R$ ${transacao.valorTotal.toFixed(2)},R$ ${transacao.valorDevido.toFixed(2)},R$ ${transacao.valorPago.toFixed(2)},${transacao.statusPagamento}\n`;
        });
      }

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `relatorio-${dados.saldo.pessoaNome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ CSV gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar CSV:', error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Exportar Relatório Individual
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para o relatório de {dados.saldo.pessoaNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato */}
          <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <Select
              value={config.formato}
              onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
                setConfig(prev => ({ ...prev, formato: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                {formatoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opções de Conteúdo */}
          <div className="space-y-3">
            <Label>Conteúdo a Incluir</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirResumo"
                  checked={config.incluirResumo}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, incluirResumo: !!checked }))
                  }
                />
                <Label htmlFor="incluirResumo" className="text-sm font-normal">
                  Resumo do saldo e transações
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirTransacoes"
                  checked={config.incluirTransacoes}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, incluirTransacoes: !!checked }))
                  }
                />
                <Label htmlFor="incluirTransacoes" className="text-sm font-normal">
                  Lista detalhada de transações
                </Label>
              </div>
            </div>
          </div>

          {/* Orientação (apenas para PDF) */}
          {config.formato === 'pdf' && (
            <div className="space-y-3">
              <Label>Orientação da Página</Label>
              <Select
                value={config.orientacao}
                onValueChange={(value: 'portrait' | 'landscape') => 
                  setConfig(prev => ({ ...prev, orientacao: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a orientação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Retrato</SelectItem>
                  <SelectItem value="landscape">Paisagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Progresso */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exportando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2">
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
              className="min-w-[100px]"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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