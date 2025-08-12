import TransactionForm from '@/components/transacoes/TransactionForm';
import PageHeader from '@/components/ui/PageHeader';
import { getPageVariant } from '@/lib/pageTheme';
import { DollarSign } from 'lucide-react';

export default function NovaTransacaoPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <PageHeader 
        title="Lançar Nova Transação" 
        subtitle="Cadastre uma nova transação no hub" 
        icon={<DollarSign className="w-6 h-6" />} 
        variant={getPageVariant('transacoes')}
        backHref="/transacoes"
        breadcrumbs={[
          { label: 'Transações', href: '/transacoes' },
          { label: 'Nova' }
        ]}
      />
      <TransactionForm />
    </div>
  );
} 