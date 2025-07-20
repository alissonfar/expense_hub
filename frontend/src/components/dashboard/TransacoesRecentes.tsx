'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TransacaoRecente } from '@/hooks/useDashboard';
import { motion } from 'framer-motion';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  ArrowRight,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TransacoesRecentesProps {
  transacoes: TransacaoRecente[];
  loading?: boolean;
}

export function TransacoesRecentes({ transacoes, loading = false }: TransacoesRecentesProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transacoes || transacoes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Transações Recentes
          </CardTitle>
          <CardDescription>Últimas movimentações do Hub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma transação encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              As transações aparecerão aqui assim que forem adicionadas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="w-full border-blue-100 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Transações Recentes
              </CardTitle>
              <CardDescription>Últimas movimentações do Hub</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/transacoes')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Ver todas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Vista Desktop - Tabela */}
          <div className="hidden md:block">
            <div className="space-y-1">
              {transacoes.map((transacao, index) => {
                let dataFormatada = 'Data não informada';
                if (transacao.data) {
                  try {
                    const data = parseISO(transacao.data);
                    dataFormatada = format(data, 'dd/MM/yyyy', { locale: ptBR });
                  } catch {
                    dataFormatada = 'Data inválida';
                  }
                }
                return (
                  <motion.div
                    key={transacao.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/transacoes/${transacao.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          transacao.tipo === 'RECEITA' 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        )}>
                          {transacao.tipo === 'RECEITA' 
                            ? <ArrowUpRight className="h-5 w-5" />
                            : <ArrowDownRight className="h-5 w-5" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {transacao.descricao}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {dataFormatada}
                            </span>
                            
                            {/* ✅ NOVO: Vencimento (apenas para gastos) */}
                            {transacao.tipo === 'GASTO' && transacao.data_vencimento && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <AlertCircle className="h-3 w-3" />
                                {(() => {
                                  const hoje = new Date();
                                  const vencimento = new Date(transacao.data_vencimento);
                                  const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                                  
                                  if (diasAteVencimento < 0) {
                                    return <span className="text-red-600 font-medium">Vencida</span>;
                                  } else if (diasAteVencimento === 0) {
                                    return <span className="text-orange-600 font-medium">Vence hoje</span>;
                                  } else if (diasAteVencimento <= 7) {
                                    return <span className="text-yellow-600 font-medium">Vence em {diasAteVencimento}d</span>;
                                  } else {
                                    return format(vencimento, 'dd/MM', { locale: ptBR });
                                  }
                                })()}
                              </span>
                            )}
                            
                            {/* ✅ NOVO: Forma de pagamento */}
                            {transacao.forma_pagamento && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CreditCard className="h-3 w-3" />
                                {transacao.forma_pagamento}
                              </span>
                            )}
                            
                            {transacao.tag && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${transacao.tag.cor}20`,
                                  color: transacao.tag.cor,
                                  borderColor: transacao.tag.cor
                                }}
                              >
                                {transacao.tag.nome}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          transacao.tipo === 'RECEITA' ? "text-green-600" : "text-red-600"
                        )}>
                          {transacao.tipo === 'RECEITA' ? '+' : '-'}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(transacao.valor ?? 0)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {transacoes.map((transacao, index) => {
              let dataFormatada = 'Data não informada';
              if (transacao.data) {
                try {
                  const data = parseISO(transacao.data);
                  dataFormatada = format(data, 'dd/MM/yyyy', { locale: ptBR });
                } catch {
                  dataFormatada = 'Data inválida';
                }
              }
              return (
                <motion.div
                  key={transacao.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer"
                  onClick={() => router.push(`/transacoes/${transacao.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      transacao.tipo === 'RECEITA' 
                        ? "bg-green-100 text-green-600" 
                        : "bg-red-100 text-red-600"
                    )}>
                      {transacao.tipo === 'RECEITA' 
                        ? <ArrowUpRight className="h-4 w-4" />
                        : <ArrowDownRight className="h-4 w-4" />
                      }
                    </div>
                    <p className={cn(
                      "font-semibold",
                      transacao.tipo === 'RECEITA' ? "text-green-600" : "text-red-600"
                    )}>
                      {transacao.tipo === 'RECEITA' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(transacao.valor ?? 0)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900 mb-2">
                    {transacao.descricao}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {dataFormatada}
                    </span>
                    
                    {/* ✅ NOVO: Vencimento (apenas para gastos) */}
                    {transacao.tipo === 'GASTO' && transacao.data_vencimento && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        {(() => {
                          const hoje = new Date();
                          const vencimento = new Date(transacao.data_vencimento);
                          const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (diasAteVencimento < 0) {
                            return <span className="text-red-600 font-medium">Vencida</span>;
                          } else if (diasAteVencimento === 0) {
                            return <span className="text-orange-600 font-medium">Vence hoje</span>;
                          } else if (diasAteVencimento <= 7) {
                            return <span className="text-yellow-600 font-medium">Vence em {diasAteVencimento}d</span>;
                          } else {
                            return format(vencimento, 'dd/MM', { locale: ptBR });
                          }
                        })()}
                      </span>
                    )}
                    
                    {/* ✅ NOVO: Forma de pagamento */}
                    {transacao.forma_pagamento && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        {transacao.forma_pagamento}
                      </span>
                    )}
                    
                    {transacao.tag && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${transacao.tag.cor}20`,
                          color: transacao.tag.cor,
                          borderColor: transacao.tag.cor
                        }}
                      >
                        {transacao.tag.nome}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 