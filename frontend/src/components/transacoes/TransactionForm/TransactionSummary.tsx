 'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Calculator, Users } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TransactionSummaryProps {
  form: UseFormReturn<{
    descricao: string;
    local?: string;
    valor_total?: number;
    valor_recebido?: number;
    data_transacao: string;
    eh_parcelado?: boolean;
    total_parcelas?: number;
    observacoes?: string;
    participantes?: Array<{ nome: string; valor_devido: number; pessoa_id?: number | null }>;
    tags?: string[];
  }>;
  tipoTransacao: 'GASTO' | 'RECEITA';
  availableTags: Array<{ id: string; nome: string; cor: string }>;
}

export const TransactionSummary = React.memo(function TransactionSummary({ 
  form, 
  tipoTransacao, 
  availableTags 
}: TransactionSummaryProps) {
  const participantes = form.watch('participantes') || [];
  const selectedTags = form.watch('tags') || [];
  const participantesArr = Array.isArray(participantes) ? participantes : [];

  return (
    <div className="space-y-4">
      {/* Informações Básicas */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-100">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Resumo da Transação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Descrição:</span>
              <div className="font-medium">{form.watch('descricao')}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Valor:</span>
              <div className="font-medium">
                R$ {Number(form.watch(tipoTransacao === 'GASTO' ? 'valor_total' : 'valor_recebido') || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Data:</span>
              <div className="font-medium">{form.watch('data_transacao')}</div>
            </div>
            {tipoTransacao === 'GASTO' && (
              <div>
                <span className="text-sm text-muted-foreground">Parcelamento:</span>
                <div className="font-medium">
                  {form.watch('eh_parcelado') ? `${form.watch('total_parcelas')}x` : 'À vista'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participantes e Tags */}
      {tipoTransacao === 'GASTO' && (
        <Card className="bg-white border-0 shadow-lg rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes e Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Participantes:</span>
              <div className="space-y-1 mt-1">
                {participantesArr.map((participante, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{participante.nome}</span>
                    <span className="font-medium">R$ {Number(participante.valor_devido).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedTags.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor }} />
                      {tag.nome}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Observações:</span>
              <div className="text-sm bg-muted p-2 rounded mt-1">{form.watch('observacoes')}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de validação */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-green-700 font-medium">Pronto para salvar</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});