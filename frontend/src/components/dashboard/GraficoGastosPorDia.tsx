import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GraficoGastosPorDiaProps {
  data: Array<{
    data: string;
    valor: number;
  }>;
  isLoading?: boolean;
}

export function GraficoGastosPorDia({ data, isLoading }: GraficoGastosPorDiaProps) {
  const formatarData = (dataStr: string) => {
    try {
      return format(new Date(dataStr), 'dd/MM', { locale: ptBR });
    } catch {
      return dataStr;
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Nenhum dado disponível</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="data" 
              tickFormatter={formatarData}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatarValor}
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number) => [formatarValor(value), 'Valor']}
              labelFormatter={formatarData}
            />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 