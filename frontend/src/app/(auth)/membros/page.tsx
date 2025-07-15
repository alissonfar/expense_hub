'use client';

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Plus, MoreHorizontal, Info, Mail, Phone, UserCheck, ShieldCheck, Shield, Eye, Edit, Trash, RefreshCw, Copy } from 'lucide-react';
import { usePessoas } from '@/hooks/usePessoas';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InvitePessoaForm } from '@/components/pessoas/InvitePessoaForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { PessoaHub } from '@/lib/types';
import { CellContext } from '@tanstack/react-table';

export default function PessoasPage() {
  const { data: pessoas = [], isLoading } = usePessoas();
  const { toast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const getInviteLink = (token: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/ativar-convite?token=${token}`;

  // Colunas da tabela
  const columns = [
    {
      id: 'nome',
      accessorFn: (row: PessoaHub) => row.pessoa?.nome,
      header: 'Nome',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const pessoa = cell.row.original.pessoa;
        return (
          <div className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            {pessoa?.nome || '-'}
          </div>
        );
      },
    },
    {
      id: 'email',
      accessorFn: (row: PessoaHub) => row.pessoa?.email,
      header: 'Email',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const pessoa = cell.row.original.pessoa;
        return (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            {pessoa?.email || '-'}
          </div>
        );
      },
    },
    {
      id: 'telefone',
      accessorFn: (row: PessoaHub) => row.pessoa?.telefone,
      header: 'Telefone',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const pessoa = cell.row.original.pessoa;
        return (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            {pessoa?.telefone || '-'}
          </div>
        );
      },
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Papel',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const role = cell.row.original.role;
        const roleMap: { [key: string]: { label: string; icon: React.ReactElement } } = {
          PROPRIETARIO: { label: 'Proprietário', icon: <ShieldCheck className="w-4 h-4 text-green-600" /> },
          ADMINISTRADOR: { label: 'Administrador', icon: <Shield className="w-4 h-4 text-blue-600" /> },
          COLABORADOR: { label: 'Colaborador', icon: <UserCheck className="w-4 h-4 text-indigo-600" /> },
          VISUALIZADOR: { label: 'Visualizador', icon: <Eye className="w-4 h-4 text-gray-500" /> },
        };
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            {roleMap[role]?.icon}
            {roleMap[role]?.label || role}
          </Badge>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'ativo',
      header: 'Status',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const ativo = cell.row.original.ativo;
        return (
          <Badge variant={ativo ? 'default' : 'secondary'} className={ativo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        );
      },
    },
    {
      id: 'joinedAt',
      accessorKey: 'joinedAt',
      header: 'Entrou em',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const joinedAt = cell.row.original.joinedAt;
        return (
          <span className="text-xs text-muted-foreground">
            {joinedAt ? format(new Date(joinedAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
          </span>
        );
      },
    },
    {
      id: 'convite',
      accessorKey: 'pessoa.conviteToken',
      header: 'Convite',
      cell: (cell: CellContext<PessoaHub, unknown>) => {
        const pessoa = cell.row.original.pessoa;
        const conviteAtivo = !pessoa?.ativo && !!pessoa?.conviteToken;
        const conviteToken = pessoa?.conviteToken;
        if (conviteAtivo && conviteToken) {
          const link = getInviteLink(conviteToken);
          return (
            <div className="flex items-center gap-2">
              <Input value={link} readOnly className="w-[180px] text-xs" onClick={e => (e.target as HTMLInputElement).select()} />
              <Button size="icon" variant="ghost" onClick={() => {navigator.clipboard.writeText(link); toast({ title: 'Link copiado!', description: 'O link de ativação foi copiado para a área de transferência.' });}}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {}}>
              <Edit className="mr-2 h-4 w-4" /> Editar Papel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reenviar Convite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Membros do Hub</h1>
        <div className="flex gap-2">
          <Button variant={showInvite ? 'secondary' : 'default'} className="gap-2" onClick={() => setShowInvite((v) => !v)}>
            <Plus className="w-4 h-4" /> {showInvite ? 'Fechar' : 'Convidar Membro'}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowHelp(true)}>
            <Info className="w-4 h-4" /> Fluxo do Sistema
          </Button>
        </div>
      </div>

      {/* Formulário de convite centralizado */}
      {showInvite && (
        <div className="max-w-xl mx-auto">
          <InvitePessoaForm onSuccess={() => setShowInvite(false)} />
        </div>
      )}

      {/* Tabela de membros */}
      {!showInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando...</div>
            ) : pessoas.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum membro encontrado"
                description="Convide pessoas para colaborar no seu Hub."
                action={{ label: 'Convidar Membro', onClick: () => setShowInvite(true) }}
              />
            ) : (
              <DataTable columns={columns} data={pessoas} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog centralizado para o Fluxo do Sistema */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como funciona o módulo de membros?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 text-sm text-muted-foreground">
            <p>O módulo de membros permite convidar pessoas para colaborar no seu Hub, atribuindo papéis e controlando o acesso de cada um.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><b>Convide membros</b> informando nome, email, papel e política de acesso (para colaborador).</li>
              <li><b>Edite o papel</b> de um membro a qualquer momento (exceto o proprietário).</li>
              <li><b>Remova membros</b> (soft delete) para revogar o acesso sem perder o histórico.</li>
              <li><b>Reenvie convites</b> para membros que ainda não ativaram a conta.</li>
              <li><b>Papéis:</b> Proprietário, Administrador, Colaborador, Visualizador.</li>
              <li><b>Política de acesso:</b> Colaboradores podem ter acesso GLOBAL (todo o hub) ou INDIVIDUAL (apenas o que criaram).</li>
            </ul>
            <p>Para mais detalhes, consulte a documentação ou fale com o suporte.</p>
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="w-full mt-4">Fechar</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
} 