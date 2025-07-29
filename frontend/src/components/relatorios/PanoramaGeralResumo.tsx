import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Users, 
  TrendingUp,
  User
} from 'lucide-react';
import { PanoramaGeralResumo as ResumoData } from '@/hooks/usePanoramaGeral';
import { cn } from '@/lib/utils';

interface PanoramaGeralResumoProps {
  resumo?: ResumoData;
  loading?: boolean;
}

export function PanoramaGeralResumo({ resumo, loading = false }: PanoramaGeralResumoProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumo) return null;

  const cards = [
    {
      title: "Total Dívidas Pendentes",
      value: resumo.totalDividasPendentes,
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Valor total em dívidas",
      format: "currency"
    },
    {
      title: "Pessoas com Dívidas",
      value: resumo.pessoasComDividas,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Quantidade de devedores",
      format: "number"
    },
    {
      title: "Média por Pessoa",
      value: resumo.mediaDividaPorPessoa,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Média de dívida por devedor",
      format: "currency"
    },
    {
      title: "Maior Devedor",
      value: resumo.valorMaiorDivida,
      icon: User,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: resumo.pessoaMaiorDevedora,
      format: "currency"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("p-2 rounded-full", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.format === "currency" 
                ? `R$ ${card.value.toFixed(2)}`
                : card.value.toString()
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}