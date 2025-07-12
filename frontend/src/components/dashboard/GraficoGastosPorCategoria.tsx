'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { GastoPorCategoria } from '@/hooks/useDashboard';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GraficoGastosPorCategoriaProps {
  data: GastoPorCategoria[];
  loading?: boolean;
  periodo?: string;
}

// Interface para dados do tooltip
interface TooltipData {
  name: string;
  value: number;
  payload: { cor: string; total: number };
}

// Componente customizado para tooltip
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipData[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.cor }}
          />
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
        </div>
        <p className="text-sm text-blue-600 font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(data.value)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {((data.value / data.payload.total) * 100).toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};



export function GraficoGastosPorCategoria({
  data,
  loading = false,
  periodo = '30_dias',
}: GraficoGastosPorCategoriaProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-blue-600" />
            Gastos por Categoria
          </CardTitle>
          <CardDescription>Distribuição dos seus gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Ainda não há dados para exibir neste período</p>
              <p className="text-sm text-gray-400 mt-1">
                Adicione transações categorizadas para visualizar o gráfico
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular total e adicionar ao payload
  const total = data.reduce((sum, item) => sum + item.valor, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  // Ordenar por valor (maior para menor)
  const sortedData = [...dataWithTotal].sort((a, b) => b.valor - a.valor);

  const handleCategoryClick = (categoria: string) => {
    router.push(`/transacoes?periodo=${periodo}&tag=${encodeURIComponent(categoria)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="w-full border-blue-100 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
                Gastos por Categoria
              </CardTitle>
              <CardDescription>Distribuição dos seus gastos</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total gasto</p>
              <p className="text-xl font-bold text-blue-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(total)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dataWithTotal}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                    animationBegin={0}
                    animationDuration={800}
                    onClick={(data) => handleCategoryClick(data.nome)}
                    style={{ cursor: 'pointer' }}
                  >
                    {dataWithTotal.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cor}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de categorias */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Detalhamento por categoria
              </h4>
              {sortedData.map((categoria, index) => (
                <motion.div
                  key={`${categoria.nome}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleCategoryClick(categoria.nome)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: categoria.cor }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {categoria.nome}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(categoria.valor)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((categoria.valor / total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 