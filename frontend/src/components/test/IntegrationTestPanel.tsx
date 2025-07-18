 'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export function IntegrationTestPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { isAuthenticated, hubAtual, isSwitchingHub } = useAuth();
  const { toast } = useToast();

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      {
        name: 'Autenticação',
        fn: () => Promise.resolve(isAuthenticated)
      },
      {
        name: 'Seleção de Hub',
        fn: () => Promise.resolve(!!hubAtual)
      },
      {
        name: 'Bloqueio Durante Troca',
        fn: () => Promise.resolve(!isSwitchingHub)
      },
      {
        name: 'Validação de Tokens',
        fn: () => Promise.resolve(!!localStorage.getItem('@PersonalExpenseHub:accessToken'))
      }
    ];

    const newResults: TestResult[] = [];

    for (const test of tests) {
      try {
        const passed = await test.fn();
        newResults.push({ name: test.name, passed });
      } catch (error) {
        newResults.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
      setResults([...newResults]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);

    const passedCount = newResults.filter(r => r.passed).length;
    const totalCount = newResults.length;

    toast({
      title: 'Testes Concluídos',
      description: `${passedCount}/${totalCount} testes passaram`,
      variant: passedCount === totalCount ? 'default' : 'destructive'
    });
  };

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Painel de Testes de Integração Multi-Hub
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Execute testes manuais para validar o funcionamento do sistema multi-hub
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-700">Autenticado</div>
            <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
              {isAuthenticated ? 'Sim' : 'Não'}
            </Badge>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-700">Hub Selecionado</div>
            <Badge variant={hubAtual ? 'default' : 'secondary'}>
              {hubAtual ? hubAtual.nome : 'Não'}
            </Badge>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm font-medium text-orange-700">Trocando Hub</div>
            <Badge variant={isSwitchingHub ? 'destructive' : 'secondary'}>
              {isSwitchingHub ? 'Sim' : 'Não'}
            </Badge>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm font-medium text-purple-700">Testes</div>
            <Badge variant="outline">
              {passedCount}/{totalCount}
            </Badge>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="min-w-[200px]"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Todos os Testes
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Resultados dos Testes</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{result.name}</span>
                </div>
                <Badge variant={result.passed ? 'default' : 'destructive'}>
                  {result.passed ? 'PASSOU' : 'FALHOU'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Instruções para Testes Manuais</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Abra múltiplas abas do sistema para testar sincronização</li>
            <li>• Faça login em uma aba e verifique se sincroniza nas outras</li>
            <li>• Troque de hub e observe o comportamento em todas as abas</li>
            <li>• Teste o logout e verifique se limpa todas as abas</li>
            <li>• Verifique se as ações são bloqueadas durante troca de hub</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}