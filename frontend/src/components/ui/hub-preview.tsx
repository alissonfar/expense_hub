import { Users, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface HubPreviewProps {
  nomeHub: string;
  nomeUsuario: string;
  isVisible: boolean;
}

export const HubPreview = ({ nomeHub, nomeUsuario, isVisible }: HubPreviewProps) => {
  if (!isVisible || !nomeHub.trim()) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 transition-all duration-500 ease-in-out">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Users size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{nomeHub}</h3>
          <p className="text-sm text-gray-600">Seu novo hub de despesas</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <TrendingUp size={14} />
          <span>Dashboard completo</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={14} />
          <span>Controle mensal</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign size={14} />
          <span>Relatórios detalhados</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={14} />
          <span>Compartilhável</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-gray-500">
          <span className="font-medium">{nomeUsuario}</span> será o proprietário deste hub
        </p>
      </div>
    </div>
  );
}; 