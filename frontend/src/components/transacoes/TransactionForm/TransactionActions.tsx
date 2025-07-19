 'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface TransactionActionsProps {
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
  isPending: boolean;
  onSubmit: () => void;
}

export const TransactionActions = React.memo(function TransactionActions({ 
  form, 
  tipoTransacao, 
  isPending, 
  onSubmit 
}: TransactionActionsProps) {
  const router = useRouter();

  return (
    <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
      <Button type="button" variant="outline" onClick={() => router.back()}>
        <X className="h-4 w-4 mr-2" />
        Cancelar
      </Button>
      <Button 
        type="submit" 
        className="min-w-[140px]" 
        disabled={!form.formState.isValid || isPending}
        onClick={onSubmit}
      >
        <Check className="h-4 w-4 mr-2" />
        {tipoTransacao === 'GASTO' ? 'Salvar Transação' : 'Salvar Receita'}
        <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl+↵</kbd>
      </Button>
    </div>
  );
});