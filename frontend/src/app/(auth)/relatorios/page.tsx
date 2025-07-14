import { FileText } from 'lucide-react';

export default function RelatoriosPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <FileText className="w-16 h-16 text-blue-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Relatórios</h1>
      <p className="text-muted-foreground mb-4">A página de relatórios estará disponível em breve.<br />Acompanhe as novidades!</p>
    </div>
  );
} 