'use client';

import { useRouter } from 'next/navigation';
import { useTransacao, useDeleteTransacao } from '@/hooks/useTransacoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, DollarSign, Users, Tag, Trash, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TransactionForm from '@/components/transacoes/TransactionForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

interface TransacaoDetalheClientProps {
  id: string;
}

export default function TransacaoDetalheClient({ id }: TransacaoDetalheClientProps) {
  const transacaoId = Number(id);
  const router = useRouter();
  const { toast } = useToast();
  const { data: transacao, isLoading } = useTransacao(transacaoId);
  const deleteMutation = useDeleteTransacao();
  const [editOpen, setEditOpen] = useState(false);

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
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
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
            <div className="space-y-2">
              {transacao.participantes.map((p) => (
                <div key={p.id} className="flex justify-between border-b py-1 text-sm">
                  <span>{p.pessoa?.nome || 'N/A'}</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor_individual || p.valor_devido)}
                    {p.quitado ? (
                      <Badge className="ml-2 bg-green-100 text-green-700" variant="secondary"><Check className="w-3 h-3" /></Badge>
                    ) : null}
                  </span>
                </div>
              ))}
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

      {/* Sheet de edição */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-lg overflow-auto">
          <SheetHeader>
            <SheetTitle>Editar Transação</SheetTitle>
          </SheetHeader>
          {/* Reutiliza TransactionForm em modo edição - passando defaultValues e override de onSubmit */}
          <TransactionForm /* futuro: aceitar props para edição */ />
        </SheetContent>
      </Sheet>
    </div>
  );
} 