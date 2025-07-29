'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { 
  User, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { usePessoas } from '@/hooks/usePessoas';
import { useRelatorioPessoa, RelatorioPessoaParams } from '@/hooks/useRelatorioPessoa';
import { ExportacaoRelatorioPessoa } from './ExportacaoRelatorioPessoa';
import { cn } from '@/lib/utils';

interface RelatorioPorPessoaProps {
  className?: string;
}

export function RelatorioPorPessoa({ className }: RelatorioPorPessoaProps) {
  const [pessoaSelecionada, setPessoaSelecionada] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<RelatorioPessoaParams>({
    pessoaId: 0,
    periodo: 'mes_atual',
    incluirDetalhes: true,
  });

  const { data: pessoas, isLoading: loadingPessoas } = usePessoas();
  const { data: dadosPessoa, isLoading: loadingDados, error, refetch } = useRelatorioPessoa(
    pessoaSelecionada ? { ...filtros, pessoaId: pessoaSelecionada } : { ...filtros, pessoaId: 0 }
  );

  const handlePessoaChange = (pessoaId: string) => {
    const id = parseInt(pessoaId);
    setPessoaSelecionada(id);
    setFiltros(prev => ({ ...prev, pessoaId: id }));
  };

  const handlePeriodoChange = (periodo: 'mes_atual' | 'personalizado') => {
    setFiltros(prev => ({ ...prev, periodo }));
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente novamente em alguns instantes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatório por Pessoa</h2>
          <p className="text-gray-600">
            Gere relatórios detalhados individuais para compartilhar
          </p>
        </div>
        {dadosPessoa && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loadingDados}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loadingDados && "animate-spin")} />
              Atualizar
            </Button>
            <ExportacaoRelatorioPessoa 
              dados={dadosPessoa}
              filtros={filtros}
            />
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações do Relatório</CardTitle>
          <CardDescription>
            Selecione a pessoa e o período para gerar o relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seleção de Pessoa */}
            <div className="space-y-2">
              <Label htmlFor="pessoa">Pessoa</Label>
              <Select
                value={pessoaSelecionada?.toString() || ''}
                onValueChange={handlePessoaChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {loadingPessoas ? (
                    <SelectItem value="" disabled>
                      Carregando pessoas...
                    </SelectItem>
                  ) : (
                    pessoas?.map((pessoa) => (
                      <SelectItem key={pessoa.pessoaId} value={pessoa.pessoaId.toString()}>
                        {pessoa.pessoa?.nome || 'Nome não disponível'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label htmlFor="periodo">Período</Label>
              <Select
                value={filtros.periodo}
                onValueChange={(value: 'mes_atual' | 'personalizado') => 
                  handlePeriodoChange(value)
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
          </div>
        </CardContent>
      </Card>

      {/* Dados da Pessoa */}
      {pessoaSelecionada && (
        <>
          {loadingDados ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : dadosPessoa ? (
            <div className="space-y-6">
              {/* Resumo do Saldo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Resumo do Saldo - {dadosPessoa.saldo.pessoaNome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        R$ {dadosPessoa.saldo.totalDeve.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Devido</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {dadosPessoa.saldo.totalPago.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Pago</div>
                    </div>
                    <div className="text-center">
                      <div className={cn(
                        "text-2xl font-bold",
                        dadosPessoa.saldo.saldoFinal > 0 ? "text-green-600" : 
                        dadosPessoa.saldo.saldoFinal < 0 ? "text-red-600" : "text-gray-600"
                      )}>
                        R$ {dadosPessoa.saldo.saldoFinal.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Saldo Final</div>
                      <Badge 
                        variant={dadosPessoa.saldo.status === 'DEVEDOR' ? 'destructive' : 
                                dadosPessoa.saldo.status === 'CREDOR' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {dadosPessoa.saldo.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo das Transações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resumo das Transações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {dadosPessoa.resumo.totalTransacoes}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {dadosPessoa.resumo.transacoesPendentes}
                      </div>
                      <div className="text-sm text-muted-foreground">Pendentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {dadosPessoa.resumo.transacoesPagas}
                      </div>
                      <div className="text-sm text-muted-foreground">Pagas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        R$ {dadosPessoa.resumo.valorMedioTransacao.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Média</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Transações */}
              {dadosPessoa.transacoes && dadosPessoa.transacoes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Transações ({dadosPessoa.transacoes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dadosPessoa.transacoes.map((transacao) => (
                        <div key={transacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{transacao.descricao}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transacao.dataTransacao).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              R$ {transacao.valorTotal.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Devido: R$ {transacao.valorDevido.toFixed(2)} | Pago: R$ {transacao.valorPago.toFixed(2)}
                            </div>
                          </div>
                          <Badge 
                            variant={transacao.statusPagamento === 'PENDENTE' ? 'destructive' : 
                                    transacao.statusPagamento === 'PAGO' ? 'default' : 'secondary'}
                            className="ml-3"
                          >
                            {transacao.statusPagamento}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mensagem quando não há transações */}
              {(!dadosPessoa.transacoes || dadosPessoa.transacoes.length === 0) && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Nenhuma transação encontrada</p>
                      <p className="text-sm mt-1">
                        Não há transações para {dadosPessoa.saldo.pessoaNome} no período selecionado
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Selecione uma pessoa</p>
                  <p className="text-sm mt-1">
                    Escolha uma pessoa acima para visualizar o relatório detalhado
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}