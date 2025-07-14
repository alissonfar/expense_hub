import { DollarSign } from 'lucide-react';

export default function PagamentosPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <DollarSign className="w-16 h-16 text-green-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Pagamentos</h1>
      <p className="text-muted-foreground mb-4">A página de pagamentos estará disponível em breve.<br />Acompanhe as novidades!</p>
    </div>
  );
} 