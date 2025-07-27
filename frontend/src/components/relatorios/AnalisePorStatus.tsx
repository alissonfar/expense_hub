import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  AlertTriangle, 
  Calendar,
  CheckCircle
} from 'lucide-react';
import { AnalisePorStatus as AnaliseData } from '@/hooks/usePanoramaGeral';
import { cn } from '@/lib/utils';

interface AnalisePorStatusProps {
  analise?: AnaliseData;
  loading?: boolean;
}

export function AnalisePorStatus({ analise, loading = false }: AnalisePorStatusProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analise) return null;

  const statusCards = [
    {
      title: "Pendentes",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      valor: analise.pendentes.valor,
      quantidade: analise.pendentes.quantidade,
      description: "Sem vencimento ou futuras"
    },
    {
      title: "Vencidas",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      valor: analise.vencidas.valor,
      quantidade: analise.vencidas.quantidade,
      description: "Já passaram do vencimento"
    },
    {
      title: "Vence Hoje",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      valor: analise.venceHoje.valor,
      quantidade: analise.venceHoje.quantidade,
      description: "Vencem hoje"
    },
    {
      title: "Vence Esta Semana",
      icon: CheckCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      valor: analise.venceSemana.valor,
      quantidade: analise.venceSemana.quantidade,
      description: "Vencem nos próximos 7 dias"
    }
  ];

  const totalValor = statusCards.reduce((sum, card) => sum + card.valor, 0);

  return (
    <div className="space-y-6">
      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => (
          <Card key={index} className={cn("border-2", card.borderColor)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={cn("p-2 rounded-full", card.bgColor)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  R$ {card.valor.toFixed(2)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {card.quantidade} transação(ões)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
                {totalValor > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {((card.valor / totalValor) * 100).toFixed(1)}% do total
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Análise por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                R$ {totalValor.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statusCards.reduce((sum, card) => sum + card.quantidade, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Transações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analise.vencidas.quantidade + analise.venceHoje.quantidade}
              </div>
              <div className="text-sm text-muted-foreground">Críticas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalValor > 0 ? ((analise.pendentes.valor / totalValor) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {(analise.vencidas.quantidade > 0 || analise.venceHoje.quantidade > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analise.vencidas.quantidade > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                  <div>
                    <div className="font-medium text-red-800">
                      {analise.vencidas.quantidade} transação(ões) vencida(s)
                    </div>
                    <div className="text-sm text-red-600">
                      Total: R$ {analise.vencidas.valor.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant="destructive">Urgente</Badge>
                </div>
              )}
              {analise.venceHoje.quantidade > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                  <div>
                    <div className="font-medium text-orange-800">
                      {analise.venceHoje.quantidade} transação(ões) vence(m) hoje
                    </div>
                    <div className="text-sm text-orange-600">
                      Total: R$ {analise.venceHoje.valor.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    Atenção
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}