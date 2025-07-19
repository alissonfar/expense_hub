 'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, MapPin, DollarSign, Calendar } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface TransactionBasicInfoProps {
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
}

export const TransactionBasicInfo = React.memo(function TransactionBasicInfo({ 
  form, 
  tipoTransacao 
}: TransactionBasicInfoProps) {
  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="descricao" className="flex items-center gap-2 font-medium">
            <FileText className="h-4 w-4" /> Descrição *
          </label>
          <Input id="descricao" {...form.register('descricao')} autoFocus />
          {form.formState.errors.descricao && (
            <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="local" className="flex items-center gap-2 font-medium">
            <MapPin className="h-4 w-4" /> {tipoTransacao === 'GASTO' ? 'Local' : 'Fonte'}
          </label>
          <Input id="local" {...form.register('local')} />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="valor" className="flex items-center gap-2 font-medium">
            <DollarSign className="h-4 w-4" /> 
            {tipoTransacao === 'GASTO' ? 'Valor Total' : 'Valor Recebido'} *
          </label>
          <Input 
            id="valor" 
            type="number" 
            step="0.01" 
            min="0.01" 
            {...form.register(tipoTransacao === 'GASTO' ? 'valor_total' : 'valor_recebido', { 
              valueAsNumber: true 
            })} 
          />
          {form.formState.errors[tipoTransacao === 'GASTO' ? 'valor_total' : 'valor_recebido'] && (
            <p className="text-sm text-red-500">
              {form.formState.errors[tipoTransacao === 'GASTO' ? 'valor_total' : 'valor_recebido']?.message}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="data" className="flex items-center gap-2 font-medium">
            <Calendar className="h-4 w-4" /> Data *
          </label>
          <Input id="data" type="date" {...form.register('data_transacao')} />
          {form.formState.errors.data_transacao && (
            <p className="text-sm text-red-500">{form.formState.errors.data_transacao.message}</p>
          )}
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="observacoes" className="font-medium">Observações</label>
          <Textarea id="observacoes" {...form.register('observacoes')} className="min-h-[80px]" />
        </div>
      </CardContent>
    </Card>
  );
});