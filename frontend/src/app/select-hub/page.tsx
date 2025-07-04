'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRequirePartialAuth } from '@/hooks/useAuth';

export default function SelectHubPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { hubsDisponiveis, selectHub, isLoading: authLoading } = useAuth();

  // Garante que o usuário está autenticado
  useRequirePartialAuth();

  const handleSelectHub = async (hubId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await selectHub(hubId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao selecionar hub:', error);
      setError('Erro ao selecionar hub. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (hubsDisponiveis.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Nenhum Hub Disponível
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Você não tem acesso a nenhum hub no momento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Selecione um Hub
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Escolha o hub que você deseja acessar
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {hubsDisponiveis.map((hub) => (
            <button
              key={hub.id}
              onClick={() => handleSelectHub(hub.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Selecionando...
                </div>
              ) : (
                hub.nome
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 