 'use client';

import React, { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TransactionParticipantsProps {
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
  participantesAtivos: Array<{ id: number; nome: string; email: string }>;
}

export const TransactionParticipants = React.memo(function TransactionParticipants({ 
  form 
}: TransactionParticipantsProps) {
  const participantes = useMemo(() => form.watch('participantes') || [], [form]);
  const participantesMemo = useMemo(() => participantes, [participantes]);

  const addParticipante = useCallback(() => {
    const atuais = Array.isArray(participantesMemo) ? participantesMemo : [];
    const novoParticipante = { nome: '', valor_devido: 0, pessoa_id: null };
    form.setValue('participantes', [...atuais, novoParticipante]);
  }, [participantesMemo, form]);

  const removeParticipante = useCallback((index: number) => {
    const atuais = Array.isArray(participantesMemo) ? participantesMemo : [];
    const novosParticipantes = [...atuais];
    novosParticipantes.splice(index, 1);
    form.setValue('participantes', novosParticipantes);
  }, [participantesMemo, form]);

  const updateParticipante = useCallback((index: number, field: string, value: string | number) => {
    const atuais = Array.isArray(participantesMemo) ? participantesMemo : [];
    const novosParticipantes = [...atuais];
    novosParticipantes[index] = { ...novosParticipantes[index], [field]: value };
    form.setValue('participantes', novosParticipantes);
  }, [participantesMemo, form]);

  if (!Array.isArray(participantes) || participantes.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Participantes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {participantes.map((participante, index) => (
            <div key={index} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
              <div className="flex-1">
                <Input
                  placeholder="Nome do participante"
                  value={participante.nome || ''}
                  onChange={(e) => updateParticipante(index, 'nome', e.target.value)}
                  className="mb-2"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor devido"
                  value={participante.valor_devido || ''}
                  onChange={(e) => updateParticipante(index, 'valor_devido', Number(e.target.value))}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeParticipante(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addParticipante}
            className="w-full border-dashed border-2 border-gray-300 hover:border-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Participante
          </Button>
        </div>
        
        {form.formState.errors.participantes && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {form.formState.errors.participantes.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
});