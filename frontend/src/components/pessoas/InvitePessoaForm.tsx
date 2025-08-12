import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useInvitePessoa } from '@/hooks/usePessoas';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';

const inviteSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR'], { required_error: 'Papel obrigatório' }),
  dataAccessPolicy: z.enum(['GLOBAL', 'INDIVIDUAL']).optional(),
}).refine((data) => {
  if (data.role === 'COLABORADOR') return !!data.dataAccessPolicy;
  return true;
}, {
  message: 'Política de acesso obrigatória para colaborador',
  path: ['dataAccessPolicy'],
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InvitePessoaForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const { toast } = useToast();
  const invitePessoa = useInvitePessoa();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      nome: '',
      email: '',
      role: 'COLABORADOR',
      dataAccessPolicy: undefined,
    },
    mode: 'onChange',
  });

  const role = form.watch('role');

  const onSubmit = async (values: InviteFormValues) => {
    try {
      await invitePessoa.mutateAsync({
        email: values.email,
        role: values.role,
        dataAccessPolicy: values.role === 'COLABORADOR' ? values.dataAccessPolicy : undefined,
        nome: values.nome,
      });
      toast({ title: 'Convite enviado!', description: 'A pessoa receberá um email para ativar a conta.' });
      setShowSuccess(true);
      form.reset();
      onSuccess?.();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Erro ao convidar',
        description: err?.response?.data?.message || err?.message || 'Não foi possível enviar o convite.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-none border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" /> Convidar Pessoa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Nome completo"
              {...form.register('nome')}
              autoFocus
              disabled={invitePessoa.isPending}
            />
            {form.formState.errors.nome && (
              <span className="text-xs text-red-500">{form.formState.errors.nome.message}</span>
            )}
          </div>
          <div>
            <Input
              placeholder="Email"
              type="email"
              {...form.register('email')}
              disabled={invitePessoa.isPending}
            />
            {form.formState.errors.email && (
              <span className="text-xs text-red-500">{form.formState.errors.email.message}</span>
            )}
          </div>
          <div>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value as InviteFormValues['role'])}
              disabled={invitePessoa.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <span className="text-xs text-red-500">{form.formState.errors.role.message}</span>
            )}
          </div>
          {role === 'COLABORADOR' && (
            <div>
              <Select
                value={form.watch('dataAccessPolicy')}
                onValueChange={(value) => form.setValue('dataAccessPolicy', value as InviteFormValues['dataAccessPolicy'])}
                disabled={invitePessoa.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Política de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Acesso Global</SelectItem>
                  <SelectItem value="INDIVIDUAL">Acesso Individual</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.dataAccessPolicy && (
                <span className="text-xs text-red-500">{form.formState.errors.dataAccessPolicy.message}</span>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button type="submit" className="flex-1" disabled={invitePessoa.isPending}>
              {invitePessoa.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Convidar
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={invitePessoa.isPending}>
                Cancelar
              </Button>
            )}
          </div>
          {showSuccess && (
            <div className="text-green-600 text-sm">Convite enviado com sucesso!</div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 