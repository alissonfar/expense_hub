'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Tag, Plus, Edit, Trash, Palette, Smile } from 'lucide-react';
import { useTags, useDeleteTag } from '@/hooks/useTags';
import CategoryForm from '@/components/categorias/CategoryForm';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Tag as TagType } from '@/lib/types';
import type { Row } from '@tanstack/react-table';

export default function CategoriasPage() {
  const router = useRouter();
  const { data: categorias = [], isLoading } = useTags();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editTag, setEditTag] = useState<TagType | null>(null);
  const deleteTag = useDeleteTag();

  // Colunas da tabela
  const columns = [
    {
      id: 'nome',
      header: 'Nome',
      accessorKey: 'nome',
      cell: ({ row }: { row: Row<TagType> }) => (
        <div className="font-medium flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" />
          {row.original.nome}
        </div>
      ),
    },
    {
      id: 'cor',
      header: 'Cor',
      accessorKey: 'cor',
      cell: ({ row }: { row: Row<TagType> }) => (
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" />
          <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: row.original.cor }} />
          <span className="text-xs font-mono">{row.original.cor}</span>
        </div>
      ),
    },
    {
      id: 'icone',
      header: 'Ícone',
      accessorKey: 'icone',
      cell: ({ row }: { row: Row<TagType> }) => (
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-gray-400" />
          <span>{row.original.icone || '-'}</span>
        </div>
      ),
    },
    {
      id: 'ativo',
      header: 'Status',
      accessorKey: 'ativo',
      cell: ({ row }: { row: Row<TagType> }) => (
        <Badge variant={row.original.ativo ? 'secondary' : 'outline'} className={row.original.ativo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'criado_em',
      header: 'Criado em',
      accessorKey: 'criado_em',
      cell: ({ row }: { row: Row<TagType> }) => (
        <span className="text-xs text-gray-500">{format(new Date(row.original.criado_em), 'dd/MM/yyyy')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: Row<TagType> }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setEditTag(row.original)} title="Editar">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => {
            if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
              try {
                await deleteTag.mutateAsync(row.original.id);
                toast({ title: 'Categoria excluída', description: 'A categoria foi removida.' });
              } catch (error: unknown) {
                let message = 'Não foi possível excluir.';
                if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                  message = (error.response.data as { message?: string }).message || message;
                } else if (error && typeof error === 'object' && 'message' in error) {
                  message = (error as { message?: string }).message || message;
                }
                toast({ title: 'Erro ao excluir', description: message, variant: 'destructive' });
              }
            }
          }} title="Excluir">
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button variant="default" className="gap-2" onClick={() => router.push('/categorias/nova')}>
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Formulário de criação/edição centralizado */}
      {showForm && !editTag && (
        <div className="max-w-xl mx-auto">
          <CategoryForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {/* Formulário de edição */}
      {editTag && (
        <div className="max-w-xl mx-auto">
          <CategoryForm
            onSuccess={() => { setEditTag(null); setShowForm(false); }}
            onCancel={() => setEditTag(null)}
            key={editTag.id}
            defaultValues={{
              nome: editTag.nome,
              cor: editTag.cor,
              icone: editTag.icone || '',
            }}
            modoEdicao={true}
            tagId={editTag.id}
          />
        </div>
      )}

      {/* Tabela de categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando...</div>
          ) : categorias.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Nenhuma categoria encontrada"
              description="Crie categorias para organizar suas transações."
              action={{ label: 'Nova Categoria', onClick: () => router.push('/categorias/nova') }}
            />
          ) : (
            <DataTable columns={columns} data={categorias} />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 