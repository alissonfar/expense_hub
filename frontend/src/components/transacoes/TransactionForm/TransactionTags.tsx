 'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Check, X, AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface TransactionTagsProps {
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
  availableTags: Array<{ id: string; nome: string; cor: string }>;
  loadingTags: boolean;
}

export const TransactionTags = React.memo(function TransactionTags({ 
  form, 
  availableTags, 
  loadingTags 
}: TransactionTagsProps) {
  const router = useRouter();
  const selectedTags = form.watch('tags') || [];

  const toggleTag = (tagId: string) => {
    const tags = selectedTags;
    if (tags.includes(tagId)) {
      form.setValue('tags', tags.filter((id: string) => id !== tagId));
    } else if (tags.length < 5) {
      form.setValue('tags', [...tags, tagId]);
    }
  };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-600" />
          Tags e Categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Selecione até 5 tags para categorizar esta transação
        </p>
        
        {loadingTags ? (
          <div className="text-center text-muted-foreground">Carregando categorias...</div>
        ) : availableTags.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Nenhuma categoria cadastrada</p>
            <Button variant="default" onClick={() => router.push('/categorias/nova')}>
              Cadastrar Categoria
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableTags.map(tag => (
              <Card
                key={tag.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTags.includes(tag.id)
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleTag(tag.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                    <span className="text-sm font-medium">{tag.nome}</span>
                    {selectedTags.includes(tag.id) && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Badges de tags selecionadas */}
        {selectedTags.length > 0 && (
          <div className="space-y-2 mt-4">
            <label className="font-medium">Tags Selecionadas:</label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tagId => {
                const tag = availableTags.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor }} />
                    {tag.nome}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => toggleTag(tagId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
        
        {/* Feedback de erro */}
        {form.formState.errors.tags && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mt-4">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            {form.formState.errors.tags.message as string}
          </div>
        )}
      </CardContent>
    </Card>
  );
});