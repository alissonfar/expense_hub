import { ROLES, TRANSACTION_TYPES } from '@/lib/constants';
import type { Pessoa, Transacao } from '@/lib/types';

export default function TestPage() {
  const pessoa: Pessoa = {
    id: 1,
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    ehAdministrador: false,
    ativo: true,
    data_cadastro: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };

  const transacao: Transacao = {
    id: 1,
    tipo: TRANSACTION_TYPES.GASTO,
    descricao: 'Teste de transação',
    valor_total: 100.50,
    data_transacao: new Date().toISOString(),
    eh_parcelado: false,
    parcela_atual: 1,
    total_parcelas: 1,
    valor_parcela: 100.50,
    status_pagamento: 'PENDENTE',
    proprietario_id: 1,
    criado_por: 1,
    hubId: 1,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Página de Teste</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Pessoa:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(pessoa, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Transação:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(transacao, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Roles:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(ROLES, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 