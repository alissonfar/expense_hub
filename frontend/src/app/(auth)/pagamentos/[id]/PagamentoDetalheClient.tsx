'use client';

import { useRouter } from 'next/navigation';
import { usePagamento, useDeletePagamento } from '@/hooks/usePagamentos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Trash, Edit2, AlertCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import { getPageVariant } from '@/lib/pageTheme';
import LoadingState from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/empty-state';

// Sistema de debug condicional (só em desenvolvimento)
const isDevelopment = process.env.NODE_ENV === 'development';
const debugLog = isDevelopment ? console.log : () => {};

interface PagamentoDetalheClientProps {
  id: string;
}

export default function PagamentoDetalheClient({ id }: PagamentoDetalheClientProps) {
  const pagamentoId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { data: pagamento, isLoading } = usePagamento(pagamentoId);
  debugLog('DEBUG pagamento detalhes:', pagamento);
  const deleteMutation = useDeletePagamento();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(pagamentoId);
      toast({ title: 'Pagamento excluído', description: 'Movido para a lixeira.' });
      router.push('/pagamentos');
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  if (isLoading || !pagamento) {
    return <div className="p-6"><LoadingState message="Carregando pagamento..." /></div>;
  }

  const valorDisplay = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    pagamento.valor_total
  );

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <PageHeader 
        title="Detalhes do Pagamento"
        icon={<DollarSign className="w-6 h-6" />}
        variant={getPageVariant('pagamentos')}
        backHref="/pagamentos"
        breadcrumbs={[
          { label: 'Pagamentos', href: '/pagamentos' },
          { label: `#${pagamento.id}` }
        ]}
        rightActions={
          <>
            <Button variant="outline" onClick={() => {}}>
              <Edit2 className="h-4 w-4 mr-2" /> Editar
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={deleteMutation.isPending}>
              <Trash className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </>
        }
      />

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">ID do Pagamento:</span>
            <div className="font-medium">#{pagamento.id}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Valor Total:</span>
            <div className="font-medium">{valorDisplay}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Pessoa que Pagou:</span>
            <div className="font-medium">{pagamento.pessoa?.nome || 'Pessoa não identificada'}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Data do Pagamento:</span>
            <div className="font-medium">{new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Forma de Pagamento:</span>
            <div className="font-medium">
              <Badge variant="secondary">
                {pagamento.forma_pagamento}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Processar Excedente:</span>
            <div className="font-medium">
              <Badge variant={pagamento.processar_excedente ? "default" : "secondary"}>
                {pagamento.processar_excedente ? "Sim" : "Não"}
              </Badge>
            </div>
          </div>
          {pagamento.observacoes && (
            <div className="md:col-span-2">
              <span className="text-sm text-muted-foreground">Observações:</span>
              <div className="font-medium">{pagamento.observacoes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transações Pagas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Transações Pagas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pagamento.transacoes && pagamento.transacoes.length > 0 ? (
            <div className="space-y-3">
              {pagamento.transacoes.map((transacao) => (
                <div key={transacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {transacao.tipo === 'GASTO' ? 'G' : 'R'}
                    </div>
                    <div>
                      <div className="font-medium">{transacao.descricao || `Transação ${transacao.id}`}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      R$ {transacao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {transacao.status_pagamento}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Sem transações"
              description="Este pagamento ainda não está associado a nenhuma transação."
            />
          )}
        </CardContent>
      </Card>

      {/* Excedente */}
      {pagamento.valor_excedente && pagamento.valor_excedente > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Excedente Processado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">Valor Excedente</div>
                  <div className="text-sm text-muted-foreground">
                    Valor pago maior que o devido
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  R$ {pagamento.valor_excedente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {pagamento.receita_excedente && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Receita Criada</div>
                    <div className="text-sm text-muted-foreground">
                      {pagamento.receita_excedente.descricao}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    R$ {pagamento.receita_excedente.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    #{pagamento.receita_excedente.id}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Tem certeza que deseja excluir este pagamento? Esta ação não poderá ser desfeita.
            <br /><br />
            <strong>Atenção:</strong> A exclusão irá reverter os status das transações pagas.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={async () => { setConfirmDeleteOpen(false); await handleDelete(); }} disabled={deleteMutation.isPending}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 