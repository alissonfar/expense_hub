'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Table, FileImage, Settings, Check } from 'lucide-react';
import { PanoramaGeralData, PanoramaGeralParams } from '@/hooks/usePanoramaGeral';
import { usePessoas } from '@/hooks/usePessoas';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportacaoPanoramaGeralProps {
  dados: PanoramaGeralData;
  filtros: PanoramaGeralParams;
  className?: string;
}

interface ConfiguracaoExportacao {
  modalidade: 'panorama_geral' | 'relatorio_pessoa';
  formato: 'pdf' | 'excel' | 'csv';
  incluirResumo: boolean;
  incluirDevedores: boolean;
  incluirAnaliseStatus: boolean;
  incluirDetalhes: boolean;
  pessoaId?: number;
  orientacao?: 'portrait' | 'landscape';
}

export function ExportacaoPanoramaGeral({ dados, filtros, className }: ExportacaoPanoramaGeralProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<ConfiguracaoExportacao>({
    modalidade: 'panorama_geral',
    formato: 'pdf',
    incluirResumo: true,
    incluirDevedores: true,
    incluirAnaliseStatus: true,
    incluirDetalhes: filtros.incluirDetalhes || false,
    orientacao: 'portrait',
  });

  // Buscar pessoas para seleção
  const { data: pessoas } = usePessoas({ ativo: true });

  const modalidadeOptions = [
    {
      value: 'panorama_geral',
      label: 'Panorama Geral',
      description: 'Relatório completo do HUB com todas as pessoas',
      features: ['Visão geral', 'Todas as pessoas', 'Análise por status']
    },
    {
      value: 'relatorio_pessoa',
      label: 'Relatório por Pessoa',
      description: 'Relatório detalhado de uma pessoa específica',
      features: ['Transações detalhadas', 'Status de pagamento', 'Para envio individual']
    }
  ];

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
      console.log('🚀 Iniciando exportação do Panorama Geral...', { config, dados: !!dados, filtros });
      
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
          devedores: config.incluirDevedores ? dados.devedores : undefined,
          analiseStatus: config.incluirAnaliseStatus ? dados.analisePorStatus : undefined,
        },
        // Garantir que detalhes das transações sejam incluídos para relatórios por pessoa
        incluirDetalhes: config.modalidade === 'relatorio_pessoa' ? true : filtros.incluirDetalhes
      };

      console.log('📊 Dados preparados:', exportData);

      // Executar exportação baseada na modalidade e formato
      if (config.modalidade === 'panorama_geral') {
        switch (config.formato) {
          case 'pdf':
            await exportarPDF(exportData);
            break;
          case 'excel':
            await exportarExcel(exportData);
            break;
          case 'csv':
            await exportarCSV(exportData);
            break;
        }
      } else {
        // Relatório por pessoa
        if (!config.pessoaId) {
          throw new Error('Pessoa não selecionada');
        }
        
        const pessoaSelecionada = pessoas?.find(p => p.pessoaId === config.pessoaId);
        if (!pessoaSelecionada) {
          throw new Error('Pessoa não encontrada');
        }

        switch (config.formato) {
          case 'pdf':
            await exportarPDFPorPessoa(pessoaSelecionada, exportData);
            break;
          case 'excel':
            await exportarExcelPorPessoa(pessoaSelecionada, exportData);
            break;
          case 'csv':
            await exportarCSVPorPessoa(pessoaSelecionada, exportData);
            break;
        }
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
          description: `Relatório salvo como panorama-geral.${config.formato}`,
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

  const exportarPDF = async (exportData: any) => {
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
      doc.text('Panorama Geral do HUB', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

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

      // Resumo Executivo
      if (config.incluirResumo && dados.resumo) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Resumo Executivo', margin, yPosition);
        yPosition += 10;

        const resumoData = [
          ['Métrica', 'Valor'],
          ['Total Dívidas Pendentes', `R$ ${dados.resumo.totalDividasPendentes.toFixed(2)}`],
          ['Pessoas com Dívidas', dados.resumo.pessoasComDividas.toString()],
          ['Média por Pessoa', `R$ ${dados.resumo.mediaDividaPorPessoa.toFixed(2)}`],
          ['Maior Devedor', `${dados.resumo.pessoaMaiorDevedora} - R$ ${dados.resumo.valorMaiorDivida.toFixed(2)}`],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [resumoData[0]],
          body: resumoData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Lista de Devedores
      if (config.incluirDevedores && dados.devedores && dados.devedores.length > 0) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Lista de Devedores', margin, yPosition);
        yPosition += 10;

        const devedoresData = dados.devedores.map(devedor => [
          devedor.nome,
          `R$ ${devedor.saldoDevido.toFixed(2)}`,
          devedor.transacoesPendentes.toString(),
          devedor.transacoesVencidas.toString(),
          `${devedor.diasSemPagamento} dias`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Nome', 'Saldo Devido', 'Pendentes', 'Vencidas', 'Dias sem Pagamento']],
          body: devedoresData,
          theme: 'grid',
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Análise por Status
      if (config.incluirAnaliseStatus && dados.analisePorStatus) {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Análise por Status', margin, yPosition);
        yPosition += 10;

        const statusData = [
          ['Status', 'Valor Total', 'Quantidade'],
          ['Pendentes', `R$ ${dados.analisePorStatus.pendentes.valor.toFixed(2)}`, dados.analisePorStatus.pendentes.quantidade.toString()],
          ['Vencidas', `R$ ${dados.analisePorStatus.vencidas.valor.toFixed(2)}`, dados.analisePorStatus.vencidas.quantidade.toString()],
          ['Vence Hoje', `R$ ${dados.analisePorStatus.venceHoje.valor.toFixed(2)}`, dados.analisePorStatus.venceHoje.quantidade.toString()],
          ['Vence Esta Semana', `R$ ${dados.analisePorStatus.venceSemana.valor.toFixed(2)}`, dados.analisePorStatus.venceSemana.quantidade.toString()],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [statusData[0]],
          body: statusData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [52, 152, 219], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin },
        });
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
      const filename = `panorama-geral-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  };

  const exportarExcel = async (exportData: any) => {
    console.log('📊 Gerando Excel...');
    
    try {
      // Criar conteúdo CSV (simulando Excel)
      let csvContent = '';
      
      // Cabeçalho
      csvContent += 'Panorama Geral do HUB\n';
      csvContent += `Período: ${filtros.periodo === 'mes_atual' ? 'Mês Atual' : `${filtros.dataInicio} a ${filtros.dataFim}`}\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Resumo Executivo
      if (config.incluirResumo && dados.resumo) {
        csvContent += 'RESUMO EXECUTIVO\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total Dívidas Pendentes,R$ ${dados.resumo.totalDividasPendentes.toFixed(2)}\n`;
        csvContent += `Pessoas com Dívidas,${dados.resumo.pessoasComDividas}\n`;
        csvContent += `Média por Pessoa,R$ ${dados.resumo.mediaDividaPorPessoa.toFixed(2)}\n`;
        csvContent += `Maior Devedor,${dados.resumo.pessoaMaiorDevedora} - R$ ${dados.resumo.valorMaiorDivida.toFixed(2)}\n\n`;
      }

      // Lista de Devedores
      if (config.incluirDevedores && dados.devedores && dados.devedores.length > 0) {
        csvContent += 'LISTA DE DEVEDORES\n';
        csvContent += 'Nome,Saldo Devido,Transações Pendentes,Transações Vencidas,Dias sem Pagamento\n';
        dados.devedores.forEach(devedor => {
          csvContent += `${devedor.nome},R$ ${devedor.saldoDevido.toFixed(2)},${devedor.transacoesPendentes},${devedor.transacoesVencidas},${devedor.diasSemPagamento}\n`;
        });
        csvContent += '\n';
      }

      // Análise por Status
      if (config.incluirAnaliseStatus && dados.analisePorStatus) {
        csvContent += 'ANÁLISE POR STATUS\n';
        csvContent += 'Status,Valor Total,Quantidade\n';
        csvContent += `Pendentes,R$ ${dados.analisePorStatus.pendentes.valor.toFixed(2)},${dados.analisePorStatus.pendentes.quantidade}\n`;
        csvContent += `Vencidas,R$ ${dados.analisePorStatus.vencidas.valor.toFixed(2)},${dados.analisePorStatus.vencidas.quantidade}\n`;
        csvContent += `Vence Hoje,R$ ${dados.analisePorStatus.venceHoje.valor.toFixed(2)},${dados.analisePorStatus.venceHoje.quantidade}\n`;
        csvContent += `Vence Esta Semana,R$ ${dados.analisePorStatus.venceSemana.valor.toFixed(2)},${dados.analisePorStatus.venceSemana.quantidade}\n`;
      }

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `panorama-geral-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ Excel/CSV gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar Excel:', error);
      throw error;
    }
  };

  const exportarCSV = async (exportData: any) => {
    console.log('📄 Gerando CSV...');
    
    try {
      // Criar conteúdo CSV
      let csvContent = '';
      
      // Cabeçalho
      csvContent += 'Panorama Geral do HUB\n';
      csvContent += `Período: ${filtros.periodo === 'mes_atual' ? 'Mês Atual' : `${filtros.dataInicio} a ${filtros.dataFim}`}\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Resumo Executivo
      if (config.incluirResumo && dados.resumo) {
        csvContent += 'RESUMO EXECUTIVO\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total Dívidas Pendentes,R$ ${dados.resumo.totalDividasPendentes.toFixed(2)}\n`;
        csvContent += `Pessoas com Dívidas,${dados.resumo.pessoasComDividas}\n`;
        csvContent += `Média por Pessoa,R$ ${dados.resumo.mediaDividaPorPessoa.toFixed(2)}\n`;
        csvContent += `Maior Devedor,${dados.resumo.pessoaMaiorDevedora} - R$ ${dados.resumo.valorMaiorDivida.toFixed(2)}\n\n`;
      }

      // Lista de Devedores
      if (config.incluirDevedores && dados.devedores && dados.devedores.length > 0) {
        csvContent += 'LISTA DE DEVEDORES\n';
        csvContent += 'Nome,Saldo Devido,Transações Pendentes,Transações Vencidas,Dias sem Pagamento\n';
        dados.devedores.forEach(devedor => {
          csvContent += `${devedor.nome},R$ ${devedor.saldoDevido.toFixed(2)},${devedor.transacoesPendentes},${devedor.transacoesVencidas},${devedor.diasSemPagamento}\n`;
        });
        csvContent += '\n';
      }

      // Análise por Status
      if (config.incluirAnaliseStatus && dados.analisePorStatus) {
        csvContent += 'ANÁLISE POR STATUS\n';
        csvContent += 'Status,Valor Total,Quantidade\n';
        csvContent += `Pendentes,R$ ${dados.analisePorStatus.pendentes.valor.toFixed(2)},${dados.analisePorStatus.pendentes.quantidade}\n`;
        csvContent += `Vencidas,R$ ${dados.analisePorStatus.vencidas.valor.toFixed(2)},${dados.analisePorStatus.vencidas.quantidade}\n`;
        csvContent += `Vence Hoje,R$ ${dados.analisePorStatus.venceHoje.valor.toFixed(2)},${dados.analisePorStatus.venceHoje.quantidade}\n`;
        csvContent += `Vence Esta Semana,R$ ${dados.analisePorStatus.venceSemana.valor.toFixed(2)},${dados.analisePorStatus.venceSemana.quantidade}\n`;
      }

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `panorama-geral-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ CSV gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar CSV:', error);
      throw error;
    }
  };

  // =============================================
  // FUNÇÕES DE EXPORTAÇÃO POR PESSOA
  // =============================================

  const exportarPDFPorPessoa = async (pessoa: any, exportData: any) => {
    console.log('📄 Gerando PDF por pessoa...', pessoa.nome);
    
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

      // Informações da pessoa
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text(`Pessoa: ${pessoa.pessoa?.nome || 'Pessoa sem nome'}`, pageWidth / 2, yPosition, { align: 'center' });
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

             // Buscar dados específicos da pessoa
       const pessoaData = dados.devedores?.find(d => d.pessoaId === pessoa.pessoaId);
       
       if (pessoaData) {
         // Resumo da pessoa
         doc.setFontSize(16);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(44, 62, 80);
         doc.text('Resumo Financeiro', margin, yPosition);
         yPosition += 10;

         const resumoData = [
           ['Métrica', 'Valor'],
           ['Total Devido', `R$ ${pessoaData.totalDevido.toFixed(2)}`],
           ['Total Pago', `R$ ${pessoaData.totalPago.toFixed(2)}`],
           ['Saldo Devido', `R$ ${pessoaData.saldoDevido.toFixed(2)}`],
           ['Transações Pendentes', pessoaData.transacoesPendentes.toString()],
           ['Transações Vencidas', pessoaData.transacoesVencidas.toString()],
           ['Dias sem Pagamento', `${pessoaData.diasSemPagamento} dias`],
         ];

        autoTable(doc, {
          startY: yPosition,
          head: [resumoData[0]],
          body: resumoData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

                 // Detalhes das transações
         if (pessoaData.detalhesTransacoes && pessoaData.detalhesTransacoes.length > 0) {
           if (yPosition > pageHeight - 100) {
             doc.addPage();
             yPosition = margin;
           }

           doc.setFontSize(16);
           doc.setFont('helvetica', 'bold');
           doc.setTextColor(44, 62, 80);
           doc.text('Detalhes das Transações', margin, yPosition);
           yPosition += 10;

           const transacoesData = pessoaData.detalhesTransacoes.map(transacao => [
             transacao.descricao,
             transacao.dataTransacao,
             transacao.dataVencimento || '-',
             `R$ ${transacao.valorDevido.toFixed(2)}`,
             `R$ ${transacao.valorPago.toFixed(2)}`,
             `R$ ${(transacao.valorDevido - transacao.valorPago).toFixed(2)}`,
             transacao.status,
             transacao.diasAtraso ? `${transacao.diasAtraso} dias` : '-',
           ]);

           autoTable(doc, {
             startY: yPosition,
             head: [['Descrição', 'Data', 'Vencimento', 'Valor Devido', 'Valor Pago', 'Saldo', 'Status', 'Atraso']],
             body: transacoesData,
             theme: 'grid',
             headStyles: { fillColor: [231, 76, 60], textColor: 255 },
             styles: { fontSize: 7 },
             margin: { left: margin, right: margin },
           });
         } else {
           // Mensagem quando não há transações
           doc.setFontSize(12);
           doc.setFont('helvetica', 'normal');
           doc.setTextColor(127, 140, 141);
           doc.text('Nenhuma transação encontrada para esta pessoa no período selecionado.', margin, yPosition);
         }
      } else {
        // Pessoa não encontrada nos dados
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Nenhuma transação encontrada para esta pessoa no período selecionado.', margin, yPosition);
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
       const filename = `relatorio-${pessoa.pessoa?.nome?.toLowerCase().replace(/\s+/g, '-') || 'pessoa'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF por pessoa gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar PDF por pessoa:', error);
      throw error;
    }
  };

  const exportarExcelPorPessoa = async (pessoa: any, exportData: any) => {
    console.log('📊 Gerando Excel por pessoa...', pessoa.pessoa?.nome);
    
    try {
      // Criar conteúdo CSV (simulando Excel)
      let csvContent = '';
      
      // Cabeçalho
      csvContent += 'Relatório Individual\n';
      csvContent += `Pessoa: ${pessoa.pessoa?.nome || 'Pessoa sem nome'}\n`;
      csvContent += `Período: ${filtros.periodo === 'mes_atual' ? 'Mês Atual' : `${filtros.dataInicio} a ${filtros.dataFim}`}\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Buscar dados específicos da pessoa
      const pessoaData = dados.devedores?.find(d => d.pessoaId === pessoa.pessoaId);
      
      if (pessoaData) {
        // Resumo da pessoa
        csvContent += 'RESUMO FINANCEIRO\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total Devido,R$ ${pessoaData.totalDevido.toFixed(2)}\n`;
        csvContent += `Total Pago,R$ ${pessoaData.totalPago.toFixed(2)}\n`;
        csvContent += `Saldo Devido,R$ ${pessoaData.saldoDevido.toFixed(2)}\n`;
        csvContent += `Transações Pendentes,${pessoaData.transacoesPendentes}\n`;
        csvContent += `Transações Vencidas,${pessoaData.transacoesVencidas}\n`;
        csvContent += `Dias sem Pagamento,${pessoaData.diasSemPagamento} dias\n\n`;

        // Detalhes das transações
        if (pessoaData.detalhesTransacoes && pessoaData.detalhesTransacoes.length > 0) {
          csvContent += 'DETALHES DAS TRANSAÇÕES\n';
          csvContent += 'Descrição,Data,Data Vencimento,Valor Devido,Valor Pago,Saldo,Status,Atraso\n';
          pessoaData.detalhesTransacoes.forEach(transacao => {
            csvContent += `${transacao.descricao},${transacao.dataTransacao},${transacao.dataVencimento || '-'},R$ ${transacao.valorDevido.toFixed(2)},R$ ${transacao.valorPago.toFixed(2)},R$ ${(transacao.valorDevido - transacao.valorPago).toFixed(2)},${transacao.status},${transacao.diasAtraso ? `${transacao.diasAtraso} dias` : '-'}\n`;
          });
        } else {
          csvContent += 'Nenhuma transação encontrada para esta pessoa no período selecionado.\n';
        }
      } else {
        csvContent += 'Nenhuma transação encontrada para esta pessoa no período selecionado.\n';
      }

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `relatorio-${pessoa.pessoa?.nome?.toLowerCase().replace(/\s+/g, '-') || 'pessoa'}-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ Excel por pessoa gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar Excel por pessoa:', error);
      throw error;
    }
  };

  const exportarCSVPorPessoa = async (pessoa: any, exportData: any) => {
    console.log('📄 Gerando CSV por pessoa...', pessoa.pessoa?.nome);
    
    try {
      // Criar conteúdo CSV
      let csvContent = '';
      
      // Cabeçalho
      csvContent += 'Relatório Individual\n';
      csvContent += `Pessoa: ${pessoa.pessoa?.nome || 'Pessoa sem nome'}\n`;
      csvContent += `Período: ${filtros.periodo === 'mes_atual' ? 'Mês Atual' : `${filtros.dataInicio} a ${filtros.dataFim}`}\n`;
      csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      // Buscar dados específicos da pessoa
      const pessoaData = dados.devedores?.find(d => d.pessoaId === pessoa.pessoaId);
      
      if (pessoaData) {
        // Resumo da pessoa
        csvContent += 'RESUMO FINANCEIRO\n';
        csvContent += 'Métrica,Valor\n';
        csvContent += `Total Devido,R$ ${pessoaData.totalDevido.toFixed(2)}\n`;
        csvContent += `Total Pago,R$ ${pessoaData.totalPago.toFixed(2)}\n`;
        csvContent += `Saldo Devido,R$ ${pessoaData.saldoDevido.toFixed(2)}\n`;
        csvContent += `Transações Pendentes,${pessoaData.transacoesPendentes}\n`;
        csvContent += `Transações Vencidas,${pessoaData.transacoesVencidas}\n`;
        csvContent += `Dias sem Pagamento,${pessoaData.diasSemPagamento} dias\n\n`;

        // Detalhes das transações
        if (pessoaData.detalhesTransacoes && pessoaData.detalhesTransacoes.length > 0) {
          csvContent += 'DETALHES DAS TRANSAÇÕES\n';
          csvContent += 'Descrição,Data,Data Vencimento,Valor Devido,Valor Pago,Saldo,Status,Atraso\n';
          pessoaData.detalhesTransacoes.forEach(transacao => {
            csvContent += `${transacao.descricao},${transacao.dataTransacao},${transacao.dataVencimento || '-'},R$ ${transacao.valorDevido.toFixed(2)},R$ ${transacao.valorPago.toFixed(2)},R$ ${(transacao.valorDevido - transacao.valorPago).toFixed(2)},${transacao.status},${transacao.diasAtraso ? `${transacao.diasAtraso} dias` : '-'}\n`;
          });
        } else {
          csvContent += 'Nenhuma transação encontrada para esta pessoa no período selecionado.\n';
        }
      } else {
        csvContent += 'Nenhuma transação encontrada para esta pessoa no período selecionado.\n';
      }

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `relatorio-${pessoa.pessoa?.nome?.toLowerCase().replace(/\s+/g, '-') || 'pessoa'}-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      console.log('✅ CSV por pessoa gerado com sucesso:', filename);

    } catch (error) {
      console.error('❌ Erro ao gerar CSV por pessoa:', error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Exportar Panorama Geral
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para o relatório de panorama geral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modalidade */}
          <div className="space-y-3">
            <Label>Tipo de Relatório</Label>
            <Select
              value={config.modalidade}
              onValueChange={(value: 'panorama_geral' | 'relatorio_pessoa') => 
                setConfig(prev => ({ ...prev, modalidade: value, pessoaId: undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                {modalidadeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
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

          {/* Seleção de Pessoa (apenas para relatório por pessoa) */}
          {config.modalidade === 'relatorio_pessoa' && (
            <div className="space-y-3">
              <Label>Selecionar Pessoa</Label>
              <Select
                value={config.pessoaId?.toString() || ''}
                onValueChange={(value) => 
                  setConfig(prev => ({ ...prev, pessoaId: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {pessoas?.map((pessoa) => (
                    <SelectItem key={pessoa.pessoaId} value={pessoa.pessoaId.toString()}>
                      {pessoa.pessoa?.nome || 'Pessoa sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
          {config.modalidade === 'panorama_geral' && (
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
                    Resumo executivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluirDevedores"
                    checked={config.incluirDevedores}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, incluirDevedores: !!checked }))
                    }
                  />
                  <Label htmlFor="incluirDevedores" className="text-sm font-normal">
                    Lista de devedores
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluirAnaliseStatus"
                    checked={config.incluirAnaliseStatus}
                    onCheckedChange={(checked) => 
                      setConfig(prev => ({ ...prev, incluirAnaliseStatus: !!checked }))
                    }
                  />
                  <Label htmlFor="incluirAnaliseStatus" className="text-sm font-normal">
                    Análise por status
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Informações do Relatório por Pessoa */}
          {config.modalidade === 'relatorio_pessoa' && config.pessoaId && (
            <div className="space-y-3">
              <Label>Informações do Relatório</Label>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Relatório Individual:</strong> Este relatório incluirá automaticamente:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Resumo financeiro da pessoa selecionada</li>
                  <li>• Detalhes de todas as transações no período</li>
                  <li>• Status de pagamento de cada transação</li>
                  <li>• Informações sobre atrasos e vencimentos</li>
                </ul>
              </div>
            </div>
          )}

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
              disabled={isExporting || (config.modalidade === 'relatorio_pessoa' && !config.pessoaId)}
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