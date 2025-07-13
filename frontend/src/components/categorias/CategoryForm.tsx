'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateTag } from '@/hooks/useTags';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Tag, Palette, Smile } from 'lucide-react';

const categorySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hexadecimal válido').default('#6B7280'),
  icone: z.string().max(10, 'Máximo 10 caracteres').optional().or(z.literal('')),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const { toast } = useToast();
  const createTag = useCreateTag();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nome: '',
      cor: '#6B7280',
      icone: '',
    },
    mode: 'onChange',
  });

  const onSubmit = useCallback(async (values: CategoryFormValues) => {
    try {
      await createTag.mutateAsync(values);
      toast({ title: 'Categoria criada!', description: 'Sua categoria foi salva com sucesso.' });
      setShowSuccess(true);
      form.reset();
      onSuccess?.();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Erro ao criar categoria',
        description: err?.response?.data?.message || err?.message || 'Não foi possível criar a categoria.',
        variant: 'destructive',
      });
    }
  }, [createTag, toast, form, onSuccess]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (form.formState.isValid && !createTag.isPending) {
          form.handleSubmit(onSubmit)();
        }
      }
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, createTag.isPending, onSubmit, onCancel]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Nova Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nome" className="font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Nome *
            </label>
            <Input id="nome" {...form.register('nome')} autoFocus maxLength={50} />
            {form.formState.errors.nome && <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="cor" className="font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor
            </label>
            <div className="flex items-center gap-3">
              <Input id="cor" type="text" maxLength={7} {...form.register('cor')} className="w-32" />
              <input
                type="color"
                value={form.watch('cor')}
                onChange={e => form.setValue('cor', e.target.value)}
                className="w-8 h-8 border rounded"
                aria-label="Selecionar cor"
              />
              <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: form.watch('cor') || '#6B7280' }} />
            </div>
            {form.formState.errors.cor && <p className="text-sm text-red-500">{form.formState.errors.cor.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="icone" className="font-medium flex items-center gap-2">
              <Smile className="h-4 w-4" />
              Ícone (opcional)
            </label>
            <Input id="icone" {...form.register('icone')} maxLength={10} placeholder="Ex: casa, carro, etc." />
            {form.formState.errors.icone && <p className="text-sm text-red-500">{form.formState.errors.icone.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            )}
            <Button type="submit" className="min-w-[140px]" disabled={!form.formState.isValid || createTag.isPending}>
              <Check className="h-4 w-4 mr-2" /> Salvar Categoria
              <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl+↵</kbd>
            </Button>
          </div>
          {showSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 flex items-center gap-2 mt-2">
              <Check className="h-4 w-4" /> Categoria criada com sucesso!
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
} 