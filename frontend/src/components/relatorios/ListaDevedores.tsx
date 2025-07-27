import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { Devedor } from '@/hooks/usePanoramaGeral';
import { useState } from 'react';

interface ListaDevedoresProps {
  devedores?: Devedor[];
  loading?: boolean;
  incluirDetalhes?: boolean;
}

export function ListaDevedores({ devedores, loading = false, incluirDetalhes = false }: ListaDevedoresProps) {
  const [mostrarDetalhes, setMostrarDetalhes] = useState<Record<number, boolean>>({});

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!devedores || devedores.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">Nenhum devedor encontrado</p>
            <p className="text-sm mt-1">
              Não há dívidas pendentes no período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleDetalhes = (pessoaId: number) => {
    setMostrarDetalhes(prev => ({
      ...prev,
      [pessoaId]: !prev[pessoaId]
    }));
  };

  return (
    <div className="space-y-4">
      {devedores.map((devedor) => (
        <Card key={devedor.pessoaId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{devedor.nome}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {devedor.transacoesPendentes} pendente(s)
                  </Badge>
                  {devedor.transacoesVencidas > 0 && (
                    <Badge variant="destructive">
                      {devedor.transacoesVencidas} vencida(s)
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  R$ {devedor.saldoDevido.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Deve no total
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Devido:</span>
                <div className="font-medium">R$ {devedor.totalDevido.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Pago:</span>
                <div className="font-medium">R$ {devedor.totalPago.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Último Pagamento:</span>
                <div className="font-medium">
                  {devedor.ultimoPagamento || 'Nunca'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Dias sem Pagamento:</span>
                <div className="font-medium">{devedor.diasSemPagamento} dias</div>
              </div>
            </div>

            {incluirDetalhes && devedor.detalhesTransacoes && devedor.detalhesTransacoes.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDetalhes(devedor.pessoaId)}
                  className="mb-3"
                >
                  {mostrarDetalhes[devedor.pessoaId] ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {mostrarDetalhes[devedor.pessoaId] ? 'Ocultar' : 'Ver'} Detalhes
                </Button>

                {mostrarDetalhes[devedor.pessoaId] && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Transações Pendentes:</h4>
                    <div className="space-y-2">
                      {devedor.detalhesTransacoes.map((transacao) => (
                        <div key={transacao.transacaoId} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{transacao.descricao}</div>
                            <div className="text-muted-foreground">
                              {transacao.dataTransacao}
                              {transacao.dataVencimento && ` • Vence: ${transacao.dataVencimento}`}
                              {transacao.diasAtraso && transacao.diasAtraso > 0 && (
                                <span className="text-red-600 ml-2">
                                  ({transacao.diasAtraso} dias atraso)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              R$ {(transacao.valorDevido - transacao.valorPago).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transacao.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}