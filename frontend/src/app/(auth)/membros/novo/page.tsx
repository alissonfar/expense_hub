'use client';

import PageHeader from '@/components/ui/PageHeader';
import { getPageVariant } from '@/lib/pageTheme';
import { Users } from 'lucide-react';
import { InvitePessoaForm } from '@/components/pessoas/InvitePessoaForm';
import { useRouter } from 'next/navigation';

export default function NovoMembroPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <PageHeader
        title="Convidar Membro"
        subtitle="Adicione um novo membro ao seu hub"
        icon={<Users className="w-6 h-6" />}
        variant={getPageVariant('membros')}
        backHref="/membros"
        breadcrumbs={[{ label: 'Membros', href: '/membros' }, { label: 'Novo' }]}
      />
      <InvitePessoaForm onSuccess={() => router.push('/membros')} onCancel={() => router.push('/membros')} />
    </div>
  );
}
