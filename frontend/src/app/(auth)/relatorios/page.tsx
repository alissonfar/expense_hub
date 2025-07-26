'use client';

import { RelatoriosDashboard } from '@/components/relatorios/RelatoriosDashboard';

export default function RelatoriosPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise completa das suas finanças pessoais</p>
        </div>
      </div>
      <RelatoriosDashboard />
    </div>
  );
} 