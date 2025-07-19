'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GastoPorDia } from '@/hooks/useDashboard';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';

interface GraficoGastosPorDiaProps {
  data: GastoPorDia[];
  loading?: boolean;
  chartType?: 'line' | 'bar';
  onDayClick?: (date: string) => void;
}

// Componente customizado para tooltip
interface TooltipPayload {
  value: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (active && payload && payload.length && label) {
    const dateString = label;
    let date: Date | null = null;
    try {
      date = dateString ? parseISO(dateString) : null;
    } catch {
      date = null;
    }
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-100">
        <p className="text-sm font-medium text-gray-900">
          {date && !isNaN(date.getTime())
            ? format(date, "d 'de' MMMM", { locale: ptBR })
            : 'Data inválida'}
        </p>
        <p className="text-sm text-blue-600 font-bold mt-1">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format((payload[0].value as number) ?? 0)}
        </p>
      </div>
    );
  }
  return null;
};

export const GraficoGastosPorDia = React.memo(function GraficoGastosPorDia({
  data,
  loading = false,
  chartType = 'line',
  onDayClick,
}: GraficoGastosPorDiaProps) {
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Evolução de Gastos
          </CardTitle>
          <CardDescription>Acompanhe seus gastos diários</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Ainda não há dados para exibir neste período</p>
              <p className="text-sm text-gray-400 mt-1">
                Adicione transações para visualizar o gráfico
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formatar dados para o gráfico
  const formattedData = data.map(item => {
    let date: Date | null = null;
    try {
      date = item.data ? parseISO(item.data) : null;
    } catch {
      date = null;
    }
    return {
      ...item,
      dataFormatada: date && !isNaN(date.getTime()) ? format(date, 'dd/MM', { locale: ptBR }) : 'Data inválida',
      diaSemana: date && !isNaN(date.getTime()) ? format(date, 'EEE', { locale: ptBR }) : '',
    };
  });

  // Calcular valores para estatísticas
  const totalGasto = data.reduce((sum, item) => sum + item.valor, 0);
  const mediaGasto = totalGasto / data.length;
  const maxGasto = Math.max(...data.map(item => item.valor));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="w-full border-blue-100 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Evolução de Gastos
              </CardTitle>
              <CardDescription>Acompanhe seus gastos diários</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total do período</p>
              <p className="text-xl font-bold text-blue-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalGasto ?? 0)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart
                data={formattedData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                onClick={(e) => {
                  if (e && e.activeLabel && onDayClick) {
                    const clickedData = data.find(d => 
                      format(parseISO(d.data), 'dd/MM', { locale: ptBR }) === e.activeLabel
                    );
                    if (clickedData) {
                      onDayClick(clickedData.data);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="dataFormatada" 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#colorGastos)"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={formattedData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                onClick={(e) => {
                  if (e && e.activeLabel && onDayClick) {
                    const clickedData = data.find(d => 
                      format(parseISO(d.data), 'dd/MM', { locale: ptBR }) === e.activeLabel
                    );
                    if (clickedData) {
                      onDayClick(clickedData.data);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="dataFormatada" 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="valor" 
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Estatísticas resumidas */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Média diária</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(mediaGasto ?? 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Maior gasto</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(maxGasto ?? 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Dias analisados</p>
              <p className="text-lg font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}); 