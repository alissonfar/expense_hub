'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Table, FileImage, Settings, Check } from 'lucide-react';
import { FiltroRelatorio, RelatoriosData } from '@/hooks/useRelatorios';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
      console.log('🚀 Iniciando exportação...', { config, dados: !!dados, filtros });
      
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

      console.log('📊 Dados preparados:', exportData);

      // TODO: Implementar chamada real para API de exportação
      // const response = await api.post('/relatorios/exportar', exportData);
      
      // Simular delay da exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProgress(100);

      // Gerar conteúdo real do relatório
      let conteudo = '';
      let nomeArquivo = `relatorio_${new Date().toISOString().split('T')[0]}`;
      
      if (config.formato === 'csv') {
        // Gerar CSV
        const linhas = [];
        
        if (config.incluirResumo && dados.resumo) {
          linhas.push('RESUMO EXECUTIVO');
          linhas.push('Métrica,Valor');
          linhas.push(`Total Gastos,R$ ${dados.resumo.total_gastos.toFixed(2)}`);
          linhas.push(`Total Receitas,R$ ${dados.resumo.total_receitas.toFixed(2)}`);
          linhas.push(`Saldo do Período,R$ ${dados.resumo.saldo_periodo.toFixed(2)}`);
          linhas.push(`Transações Pendentes,${dados.resumo.transacoes_pendentes}`);
          linhas.push(`Pessoas Devedoras,${dados.resumo.pessoas_devedoras}`);
          linhas.push(`Transações Vencidas,${dados.resumo.transacoes_vencidas}`);
          linhas.push(`Valor Vencido,R$ ${dados.resumo.valor_vencido.toFixed(2)}`);
          linhas.push('');
        }
        
        if (config.incluirComparativo && dados.comparativo) {
          linhas.push('ANÁLISE COMPARATIVA');
          linhas.push('Métrica,Variação (%)');
          linhas.push(`Gastos,${dados.comparativo.gastos_variacao.toFixed(1)}%`);
          linhas.push(`Receitas,${dados.comparativo.receitas_variacao.toFixed(1)}%`);
          linhas.push(`Transações,${dados.comparativo.transacoes_variacao.toFixed(1)}%`);
          linhas.push('');
        }
        
        if (config.incluirGraficos && dados.graficos) {
          if (dados.graficos.gastosPorCategoria.length > 0) {
            linhas.push('GASTOS POR CATEGORIA');
            linhas.push('Categoria,Valor');
            dados.graficos.gastosPorCategoria.forEach(cat => {
              linhas.push(`${cat.nome},R$ ${cat.valor.toFixed(2)}`);
            });
            linhas.push('');
          }
          
          if (dados.graficos.gastosPorDia.length > 0) {
            linhas.push('GASTOS POR DIA');
            linhas.push('Data,Valor');
            dados.graficos.gastosPorDia.forEach(dia => {
              linhas.push(`${dia.data},R$ ${dia.valor.toFixed(2)}`);
            });
            linhas.push('');
          }
        }
        
        if (config.incluirDetalhes) {
          linhas.push('FILTROS APLICADOS');
          linhas.push('Filtro,Valor');
          linhas.push(`Período,${filtros.periodo}`);
          if (filtros.dataInicio) linhas.push(`Data Início,${filtros.dataInicio}`);
          if (filtros.dataFim) linhas.push(`Data Fim,${filtros.dataFim}`);
          if (filtros.categorias.length > 0) linhas.push(`Categorias,${filtros.categorias.join(', ')}`);
          if (filtros.pessoas.length > 0) linhas.push(`Pessoas,${filtros.pessoas.join(', ')}`);
        }
        
        conteudo = linhas.join('\n');
        nomeArquivo += '.csv';
      } else if (config.formato === 'excel') {
        // Para Excel, criar um CSV que pode ser aberto no Excel
        const linhas = [];
        linhas.push('RELATÓRIO DE FINANÇAS PESSOAIS');
        linhas.push('');
        
        if (config.incluirResumo && dados.resumo) {
          linhas.push('RESUMO EXECUTIVO');
          linhas.push('Métrica\tValor');
          linhas.push(`Total Gastos\tR$ ${dados.resumo.total_gastos.toFixed(2)}`);
          linhas.push(`Total Receitas\tR$ ${dados.resumo.total_receitas.toFixed(2)}`);
          linhas.push(`Saldo do Período\tR$ ${dados.resumo.saldo_periodo.toFixed(2)}`);
          linhas.push(`Transações Pendentes\t${dados.resumo.transacoes_pendentes}`);
          linhas.push(`Pessoas Devedoras\t${dados.resumo.pessoas_devedoras}`);
          linhas.push(`Transações Vencidas\t${dados.resumo.transacoes_vencidas}`);
          linhas.push(`Valor Vencido\tR$ ${dados.resumo.valor_vencido.toFixed(2)}`);
          linhas.push('');
        }
        
        if (config.incluirComparativo && dados.comparativo) {
          linhas.push('ANÁLISE COMPARATIVA');
          linhas.push('Métrica\tVariação (%)');
          linhas.push(`Gastos\t${dados.comparativo.gastos_variacao.toFixed(1)}%`);
          linhas.push(`Receitas\t${dados.comparativo.receitas_variacao.toFixed(1)}%`);
          linhas.push(`Transações\t${dados.comparativo.transacoes_variacao.toFixed(1)}%`);
          linhas.push('');
        }
        
        if (config.incluirGraficos && dados.graficos) {
          if (dados.graficos.gastosPorCategoria.length > 0) {
            linhas.push('GASTOS POR CATEGORIA');
            linhas.push('Categoria\tValor');
            dados.graficos.gastosPorCategoria.forEach(cat => {
              linhas.push(`${cat.nome}\tR$ ${cat.valor.toFixed(2)}`);
            });
            linhas.push('');
          }
          
          if (dados.graficos.gastosPorDia.length > 0) {
            linhas.push('GASTOS POR DIA');
            linhas.push('Data\tValor');
            dados.graficos.gastosPorDia.forEach(dia => {
              linhas.push(`${dia.data}\tR$ ${dia.valor.toFixed(2)}`);
            });
            linhas.push('');
          }
        }
        
        conteudo = linhas.join('\n');
        nomeArquivo += '.xls';
      } else {
                // PDF - Gerar PDF profissional com jsPDF
        console.log('📄 Iniciando geração de PDF...');
        
        try {
          const doc = new jsPDF({
            orientation: config.orientacao || 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          console.log('📄 PDF criado com sucesso');

          let yPosition = 25;
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 25;
          const contentWidth = pageWidth - (margin * 2);

          // =============================================
          // CABEÇALHO PROFISSIONAL
          // =============================================
          
          // Retângulo de fundo do cabeçalho
          doc.setFillColor(41, 128, 185);
          doc.rect(0, 0, pageWidth, 45, 'F');
          
          // Logo/Ícone (círculo com $)
          doc.setFillColor(255, 255, 255);
          doc.circle(35, 22, 8, 'F');
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(41, 128, 185);
          doc.text('$', 35, 26, { align: 'center' });
          
          // Título principal
          doc.setFontSize(28);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('RELATÓRIO FINANCEIRO', pageWidth / 2, 22, { align: 'center' });
          
          // Subtítulo
          doc.setFontSize(14);
          doc.setFont('helvetica', 'normal');
          doc.text('Personal Expense Hub', pageWidth / 2, 32, { align: 'center' });
          
          // Data e hora de geração
          doc.setFontSize(10);
          doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 40, { align: 'center' });
          
          yPosition = 60;

        // =============================================
        // INFORMAÇÕES DO PERÍODO
        // =============================================
        
        // Período analisado
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('PERÍODO ANALISADO', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(74, 85, 104);
        
        const periodoText = filtros.periodo === 'personalizado' 
          ? `${filtros.dataInicio} a ${filtros.dataFim}`
          : filtros.periodo.replace('_', ' ').toUpperCase();
        
        doc.text(`Período: ${periodoText}`, margin, yPosition);
        yPosition += 6;
        
        if (dados.periodo) {
          doc.text(`Data início: ${dados.periodo.data_inicio}`, margin, yPosition);
          yPosition += 6;
          doc.text(`Data fim: ${dados.periodo.data_fim}`, margin, yPosition);
        }
        
        yPosition += 15;

        // =============================================
        // RESUMO EXECUTIVO
        // =============================================
        
        if (config.incluirResumo && dados.resumo) {
          console.log('📊 Adicionando resumo executivo...', dados.resumo);
          
          // Título da seção com linha decorativa
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(41, 128, 185);
          doc.text('RESUMO EXECUTIVO', margin, yPosition);
          
          // Linha decorativa
          doc.setDrawColor(41, 128, 185);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition + 2, margin + 60, yPosition + 2);
          
          yPosition += 15;

          const resumoData = [
            ['Métrica', 'Valor'],
            ['Total de Gastos', `R$ ${dados.resumo.total_gastos.toFixed(2)}`],
            ['Total de Receitas', `R$ ${dados.resumo.total_receitas.toFixed(2)}`],
            ['Saldo do Período', `R$ ${dados.resumo.saldo_periodo.toFixed(2)}`],
            ['Transações Pendentes', dados.resumo.transacoes_pendentes.toString()],
            ['Pessoas Devedoras', dados.resumo.pessoas_devedoras.toString()],
            ['Transações Vencidas', dados.resumo.transacoes_vencidas.toString()],
            ['Valor Vencido', `R$ ${dados.resumo.valor_vencido.toFixed(2)}`]
          ];

          console.log('📊 Criando tabela de resumo...', resumoData);
          
          autoTable(doc, {
            startY: yPosition,
            head: [resumoData[0]],
            body: resumoData.slice(1),
            theme: 'grid',
            headStyles: { 
              fillColor: [41, 128, 185], 
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 11
            },
            styles: { 
              fontSize: 10,
              cellPadding: 6,
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            columnStyles: {
              0: { cellWidth: contentWidth * 0.6 },
              1: { cellWidth: contentWidth * 0.4, halign: 'right' }
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yPosition = (doc as any).lastAutoTable.finalY + 20;
          console.log('📊 Tabela de resumo criada, nova posição Y:', yPosition);
        }

        // =============================================
        // ANÁLISE COMPARATIVA
        // =============================================
        
        if (config.incluirComparativo && dados.comparativo) {
          console.log('📊 Adicionando análise comparativa...', dados.comparativo);
          
          // Título da seção com linha decorativa
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(46, 204, 113);
          doc.text('ANÁLISE COMPARATIVA', margin, yPosition);
          
          // Linha decorativa
          doc.setDrawColor(46, 204, 113);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition + 2, margin + 70, yPosition + 2);
          
          yPosition += 15;

          const comparativoData = [
            ['Métrica', 'Variação (%)'],
            ['Gastos', `${dados.comparativo.gastos_variacao.toFixed(1)}%`],
            ['Receitas', `${dados.comparativo.receitas_variacao.toFixed(1)}%`],
            ['Transações', `${dados.comparativo.transacoes_variacao.toFixed(1)}%`],
            ['Transações Vencidas', `${dados.comparativo.transacoes_vencidas_variacao.toFixed(1)}%`],
            ['Valor Vencido', `${dados.comparativo.valor_vencido_variacao.toFixed(1)}%`]
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [comparativoData[0]],
            body: comparativoData.slice(1),
            theme: 'grid',
            headStyles: { 
              fillColor: [46, 204, 113], 
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 11
            },
            styles: { 
              fontSize: 10,
              cellPadding: 6,
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            columnStyles: {
              0: { cellWidth: contentWidth * 0.6 },
              1: { cellWidth: contentWidth * 0.4, halign: 'right' }
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yPosition = (doc as any).lastAutoTable.finalY + 20;
        }

        // =============================================
        // ANÁLISE POR CATEGORIAS
        // =============================================
        
        if (config.incluirGraficos && dados.graficos && dados.graficos.gastosPorCategoria.length > 0) {
          console.log('📊 Adicionando gastos por categoria...', dados.graficos.gastosPorCategoria);
          
          // Título da seção com linha decorativa
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(155, 89, 182);
          doc.text('ANÁLISE POR CATEGORIAS', margin, yPosition);
          
          // Linha decorativa
          doc.setDrawColor(155, 89, 182);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition + 2, margin + 80, yPosition + 2);
          
          yPosition += 15;

          const categoriaData = [
            ['Categoria', 'Valor']
          ];

          dados.graficos.gastosPorCategoria.forEach(cat => {
            categoriaData.push([cat.nome, `R$ ${cat.valor.toFixed(2)}`]);
          });

          autoTable(doc, {
            startY: yPosition,
            head: [categoriaData[0]],
            body: categoriaData.slice(1),
            theme: 'grid',
            headStyles: { 
              fillColor: [155, 89, 182], 
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 11
            },
            styles: { 
              fontSize: 10,
              cellPadding: 6,
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            columnStyles: {
              0: { cellWidth: contentWidth * 0.6 },
              1: { cellWidth: contentWidth * 0.4, halign: 'right' }
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yPosition = (doc as any).lastAutoTable.finalY + 20;
        }

        // =============================================
        // EVOLUÇÃO TEMPORAL
        // =============================================
        
        if (config.incluirGraficos && dados.graficos && dados.graficos.gastosPorDia.length > 0) {
          console.log('📊 Adicionando gastos por dia...', dados.graficos.gastosPorDia);
          
          // Título da seção com linha decorativa
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(230, 126, 34);
          doc.text('EVOLUÇÃO TEMPORAL', margin, yPosition);
          
          // Linha decorativa
          doc.setDrawColor(230, 126, 34);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition + 2, margin + 70, yPosition + 2);
          
          yPosition += 15;

          const diaData = [
            ['Data', 'Valor']
          ];

          dados.graficos.gastosPorDia.forEach(dia => {
            diaData.push([dia.data, `R$ ${dia.valor.toFixed(2)}`]);
          });

          autoTable(doc, {
            startY: yPosition,
            head: [diaData[0]],
            body: diaData.slice(1),
            theme: 'grid',
            headStyles: { 
              fillColor: [230, 126, 34], 
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 11
            },
            styles: { 
              fontSize: 10,
              cellPadding: 6,
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            columnStyles: {
              0: { cellWidth: contentWidth * 0.5 },
              1: { cellWidth: contentWidth * 0.5, halign: 'right' }
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yPosition = (doc as any).lastAutoTable.finalY + 20;
        }

        // =============================================
        // CONFIGURAÇÕES E FILTROS
        // =============================================
        
        if (config.incluirDetalhes) {
          console.log('📊 Adicionando filtros aplicados...', filtros);
          
          // Título da seção com linha decorativa
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(52, 73, 94);
          doc.text('CONFIGURAÇÕES E FILTROS', margin, yPosition);
          
          // Linha decorativa
          doc.setDrawColor(52, 73, 94);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition + 2, margin + 90, yPosition + 2);
          
          yPosition += 15;

          const filtrosData = [
            ['Filtro', 'Valor'],
            ['Período', filtros.periodo]
          ];

          if (filtros.dataInicio) filtrosData.push(['Data Início', filtros.dataInicio]);
          if (filtros.dataFim) filtrosData.push(['Data Fim', filtros.dataFim]);
          if (filtros.categorias.length > 0) filtrosData.push(['Categorias', filtros.categorias.join(', ')]);
          if (filtros.pessoas.length > 0) filtrosData.push(['Pessoas', filtros.pessoas.join(', ')]);

          autoTable(doc, {
            startY: yPosition,
            head: [filtrosData[0]],
            body: filtrosData.slice(1),
            theme: 'grid',
            headStyles: { 
              fillColor: [52, 73, 94], 
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 11
            },
            styles: { 
              fontSize: 10,
              cellPadding: 6,
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth,
            columnStyles: {
              0: { cellWidth: contentWidth * 0.5 },
              1: { cellWidth: contentWidth * 0.5 }
            }
          });
        }

        // =============================================
        // RODAPÉ PROFISSIONAL
        // =============================================
        
        // Adicionar rodapé na última página
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Linha separadora
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
          
          // Texto do rodapé
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`Personal Expense Hub - Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
          doc.text(`Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // Gerar PDF
        console.log('📄 Gerando blob do PDF...');
        const pdfBlob = doc.output('blob');
        console.log('📄 Blob gerado:', pdfBlob);
        
        const url = window.URL.createObjectURL(pdfBlob);
        console.log('📄 URL criada:', url);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('📄 PDF profissional gerado e baixado com sucesso!');

        toast({
          title: "Exportação concluída!",
          description: `Relatório PDF profissional gerado com sucesso`,
        });

        setIsOpen(false);
        return; // Sair da função para PDF
        } catch (pdfError) {
          console.error('❌ Erro na geração do PDF:', pdfError);
          throw new Error(`Erro na geração do PDF: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
        }
      }
      
      const blob = new Blob([conteudo], { 
        type: config.formato === 'excel' ? 'text/tab-separated-values' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
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
      console.error('❌ Erro na exportação:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Não foi possível exportar o relatório. Tente novamente.",
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
                    onClick={() => setConfig({ ...config, formato: formato.value as 'pdf' | 'excel' | 'csv' })}
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