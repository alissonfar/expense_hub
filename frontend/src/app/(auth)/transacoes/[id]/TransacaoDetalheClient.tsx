'use client';

import { useRouter } from 'next/navigation';
import { useTransacao, useDeleteTransacao, useUpdateTransacao } from '@/hooks/useTransacoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, DollarSign, Users, Tag, Trash, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import EditTransactionForm from '@/components/transacoes/EditTransactionForm';
import { useTags } from '@/hooks/useTags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface TransacaoDetalheClientProps {
  id: string;
}

export default function TransacaoDetalheClient({ id }: TransacaoDetalheClientProps) {
  const transacaoId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { data: transacao, isLoading } = useTransacao(transacaoId);
  console.log('DEBUG transacao detalhes:', transacao);
  const deleteMutation = useDeleteTransacao();
  const updateMutation = useUpdateTransacao();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { data: tagsData = [], isLoading: loadingTags } = useTags({ ativo: true });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(transacaoId);
      toast({ title: 'Transação excluída', description: 'Movida para a lixeira.' });
      router.push('/transacoes');
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  if (isLoading || !transacao) {
    return <div className="p-6">Carregando...</div>;
  }

  const valorDisplay = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    transacao.eh_parcelado ? transacao.valor_parcela : transacao.valor_total
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detalhes da Transação</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)} disabled={deleteMutation.isPending}>
            <Trash className="h-4 w-4 mr-2" /> Excluir
          </Button>
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">Descrição:</span>
            <div className="font-medium">{transacao.descricao}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Valor:</span>
            <div className="font-medium">{valorDisplay}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Data:</span>
            <div className="font-medium">{new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}</div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Status Pagamento:</span>
            <Badge variant="secondary">{transacao.status_pagamento}</Badge>
          </div>
          {transacao.eh_parcelado && (
            <div>
              <span className="text-sm text-muted-foreground">Parcelamento:</span>
              <div className="font-medium">{transacao.parcela_atual}/{transacao.total_parcelas}</div>
            </div>
          )}
          {transacao.local && (
            <div>
              <span className="text-sm text-muted-foreground">Local/Fonte:</span>
              <div className="font-medium">{transacao.local}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transacao.participantes?.length ? (
            <div className="space-y-3">
              {transacao.participantes.map((p) => {
                return (
                  <div key={p.id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b py-2 gap-2">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {p.pessoas?.nome || 'N/A'}
                        {p.pessoa?.email && (
                          <span className="text-xs text-muted-foreground">({p.pessoa.email})</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor devido: <span className="font-semibold text-black dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.valor_devido ?? 0))}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor pago: <span className="font-semibold text-black dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.valor_pago ?? 0))}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end min-w-[120px]">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${p.quitado ? 'bg-green-100 text-green-700' : p.valor_pago > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                        {p.quitado ? 'Quitado' : p.valor_pago > 0 ? 'Parcial' : 'Pendente'}
                      </span>
                      {p.quitado && <Check className="w-4 h-4 text-green-600 mt-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sem participantes</div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {transacao.tags && transacao.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" /> Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {transacao.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" style={{ borderColor: tag.cor, color: tag.cor }}>
                {tag.nome}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pagamentos */}
      {transacao.pagamentos && transacao.pagamentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transacao.pagamentos.map((pg) => {
                console.log('DEBUG pagamento real:', pg.pagamentos);
                // Badge de status
                return (
                  <div key={pg.id} className="border-b pb-2 mb-2">
                    {/* Frase explicativa do pagamento */}
                    {(() => {
                      const pagador = transacao.participantes?.find(p => p.pessoa_id === pg.pagamentos?.pessoa_id);
                      const nome = pagador?.pessoas?.nome || 'N/A';
                      const valorDevido = Number(pagador?.valor_devido ?? 0);
                      const valorPago = Number(pg.valor_aplicado ?? 0);
                      if (!pagador) return null;
                      if (valorPago >= valorDevido) {
                        return (
                          <div className="mb-2 text-sm text-green-700 font-medium">
                            {nome} devia {valorDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} nesta transação e pagou {valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, liquidando sua dívida.
                          </div>
                        );
                      } else {
                        const saldo = valorDevido - valorPago;
                        return (
                          <div className="mb-2 text-sm text-yellow-700 font-medium">
                            {nome} devia {valorDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e pagou {valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, restando {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em aberto.
                          </div>
                        );
                      }
                    })()}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {(() => {
                            const pagador = transacao.participantes?.find(p => p.pessoa_id === pg.pagamentos?.pessoa_id);
                            return pagador?.pessoas?.nome || 'N/A';
                          })()}
                          {pg.pagamentos?.pessoa?.email && (
                            <span className="text-xs text-muted-foreground">({pg.pagamentos.pessoa.email})</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Valor: <span className="font-semibold text-black dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pg.pagamentos?.valor_total ?? 0))}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Data: <span className="font-semibold text-black dark:text-white">{new Date(pg.pagamentos?.data_pagamento).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Forma: <span className="font-semibold text-black dark:text-white">{pg.pagamentos?.forma_pagamento}</span>
                        </div>
                        {pg.pagamentos?.observacoes && (
                          <div className="text-xs text-muted-foreground">
                            Observações: <span className="font-normal">{pg.pagamentos.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Participantes/transações beneficiados, se disponível */}
                    {pg.transacoes && pg.transacoes.length > 0 && (
                      <div className="mt-2 ml-2">
                        <div className="text-xs font-semibold mb-1">Valor aplicado em:</div>
                        <ul className="list-disc ml-4">
                          {pg.transacoes.map((t) => (
                            <li key={t.id} className="text-xs">
                              {t.participantes && t.participantes.length > 0
                                ? t.participantes.map((p) => `${p.pessoa?.nome || 'N/A'}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.valor_pago ?? 0))}`).join(', ')
                                : `Transação #${t.id}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-col items-end min-w-[120px]">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${pg.quitado ? 'bg-green-100 text-green-700' : pg.valor_pago > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                        {pg.quitado ? 'Quitado' : pg.valor_pago > 0 ? 'Parcial' : 'Pendente'}
                      </span>
                      {pg.quitado && <Check className="w-4 h-4 text-green-600 mt-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sheet de edição */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-lg overflow-auto">
          <SheetHeader>
            <SheetTitle>Editar Transação</SheetTitle>
          </SheetHeader>
          <EditTransactionForm
            defaultValues={{
              descricao: transacao.descricao,
              local: transacao.local,
              observacoes: transacao.observacoes,
              tags: (transacao.tags || []).map(tag => String(tag.id)),
            }}
            availableTags={tagsData.map(tag => ({ id: String(tag.id), nome: tag.nome, cor: tag.cor }))}
            loadingTags={loadingTags}
            onSubmit={async (payload) => {
              try {
                await updateMutation.mutateAsync({
                  id: transacao.id,
                  data: {
                    ...payload,
                    tags: (payload.tags || []).map(Number),
                  },
                });
                toast({ title: 'Transação atualizada', description: 'Alterações salvas com sucesso.' });
                setEditOpen(false);
                router.refresh();
              } catch {
                toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' });
              }
            }}
            onCancel={() => setEditOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta transação? Esta ação não poderá ser desfeita.
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