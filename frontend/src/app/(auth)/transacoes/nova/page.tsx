import TransactionForm from '@/components/transacoes/TransactionForm';

export default function NovaTransacaoPage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Lançar Nova Transação</h1>
      <TransactionForm />
    </div>
  );
} 