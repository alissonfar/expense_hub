import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import type { Transacao } from '@/lib/types';

interface TransacoesRecentesProps {
  transacoes: Transacao[];
  isLoading?: boolean;
}

export function TransacoesRecentes({ transacoes, isLoading }: TransacoesRecentesProps) {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      const agora = new Date();
      const diffEmDias = Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffEmDias === 0) {
        return 'Hoje';
      } else if (diffEmDias === 1) {
        return 'Ontem';
      } else if (diffEmDias < 7) {
        return `${diffEmDias} dias atrás`;
      } else {
        return format(data, 'dd/MM/yyyy', { locale: ptBR });
      }
    } catch {
      return dataStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO_TOTAL':
        return 'bg-green-100 text-green-800';
      case 'PAGO_PARCIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDENTE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas transações registradas no hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transacoes || transacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas transações registradas no hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma transação encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>
          Últimas transações registradas no hub
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transacoes.map((transacao) => (
            <div key={transacao.id} className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                transacao.tipo === 'RECEITA' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium truncate">
                    {transacao.descricao}
                  </p>
                  {transacao.tipo === 'RECEITA' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatarValor(transacao.valor_total)}
                  </p>
                  {transacao.local && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground truncate">
                        {transacao.local}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(transacao.status_pagamento)}`}
                >
                  {transacao.status_pagamento.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatarData(transacao.data_transacao)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 