import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

const editTransactionSchema = z.object({
  descricao: z.string().min(3, 'Descrição obrigatória (mínimo 3 caracteres).'),
  local: z.string().optional(),
  observacoes: z.string().max(1000, 'Máximo 1000 caracteres.').optional(),
  tags: z.array(z.string()).max(5, 'Máximo de 5 tags por transação').optional(),
});

type EditTransactionFormValues = z.infer<typeof editTransactionSchema>;

interface EditTransactionFormProps {
  defaultValues: Partial<EditTransactionFormValues>;
  onSubmit: (data: EditTransactionFormValues) => Promise<void>;
  onCancel: () => void;
  availableTags?: { id: string; nome: string; cor: string }[];
  loadingTags?: boolean;
}

export default function EditTransactionForm({ defaultValues, onSubmit, onCancel, availableTags = [], loadingTags = false }: EditTransactionFormProps) {
  const form = useForm<EditTransactionFormValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      descricao: defaultValues.descricao || '',
      local: defaultValues.local || '',
      observacoes: defaultValues.observacoes || '',
      tags: defaultValues.tags || [],
    },
    mode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const toggleTag = (tagId: string) => {
    const tags = form.getValues('tags') || [];
    if (tags.includes(tagId)) {
      form.setValue('tags', tags.filter((id: string) => id !== tagId));
    } else if (tags.length < 5) {
      form.setValue('tags', [...tags, tagId]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Editar Transação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="descricao" className="font-medium">Descrição *</label>
            <Input id="descricao" {...form.register('descricao')} autoFocus />
            {form.formState.errors.descricao && <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="local" className="font-medium">Local/Fonte</label>
            <Input id="local" {...form.register('local')} />
          </div>
          <div className="space-y-2">
            <label htmlFor="observacoes" className="font-medium">Observações</label>
            <Textarea id="observacoes" {...form.register('observacoes')} className="min-h-[80px]" />
            {form.formState.errors.observacoes && <p className="text-sm text-red-500">{form.formState.errors.observacoes.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="font-medium">Tags</label>
            {loadingTags ? (
              <div className="text-muted-foreground">Carregando categorias...</div>
            ) : availableTags.length === 0 ? (
              <div className="text-muted-foreground">Nenhuma categoria cadastrada</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={form.watch('tags')?.includes(tag.id) ? 'secondary' : 'outline'}
                    style={{ borderColor: tag.cor, color: tag.cor }}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.nome}
                  </Badge>
                ))}
              </div>
            )}
            {form.formState.errors.tags && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mt-1">
                {form.formState.errors.tags.message as string}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="min-w-[140px]" disabled={!form.formState.isValid}>
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
} 