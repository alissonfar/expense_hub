'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RelatoriosComparativo } from '@/hooks/useRelatorios';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface GraficoComparacaoProps {
  data?: RelatoriosComparativo;
  loading?: boolean;
  periodoAtual?: string;
  periodoAnterior?: string;
}

// Interface para dados do tooltip
interface TooltipData {
  name: string;
  atual: number;
  anterior: number;
  variacao: number;
}

// Componente customizado para tooltip
const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: TooltipData[]; 
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-blue-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">Período Atual:</span>
            <span className="text-sm font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.atual)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-600">Período Anterior:</span>
            <span className="text-sm font-bold text-gray-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.anterior)}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {data.variacao >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm text-gray-600">Variação:</span>
            <span className={`text-sm font-bold ${
              data.variacao >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {data.variacao >= 0 ? '+' : ''}{data.variacao.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};export const GraficoComparacao = React.memo(function GraficoComparacao({
  data,
  loading = false,
  periodoAtual = 'Período Atual',
  periodoAnterior = 'Período Anterior',
}: GraficoComparacaoProps) {
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

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Comparação entre Períodos
          </CardTitle>
          <CardDescription>Compare gastos e receitas entre diferentes períodos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Ainda não há dados para comparação</p>
              <p className="text-sm text-gray-400 mt-1">
                Selecione um período para visualizar a comparação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = [
    {
      name: 'Gastos',
      atual: Math.abs(data.gastos_variacao) * 1000, // Valor simulado baseado na variação
      anterior: Math.abs(data.gastos_variacao) * 800, // Valor simulado
      variacao: data.gastos_variacao,
    },
    {
      name: 'Receitas',
      atual: Math.abs(data.receitas_variacao) * 1200, // Valor simulado
      anterior: Math.abs(data.receitas_variacao) * 1000, // Valor simulado
      variacao: data.receitas_variacao,
    },
    {
      name: 'Transações',
      atual: Math.abs(data.transacoes_variacao) * 50, // Valor simulado
      anterior: Math.abs(data.transacoes_variacao) * 45, // Valor simulado
      variacao: data.transacoes_variacao,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Comparação entre Períodos
          </CardTitle>
          <CardDescription>
            {periodoAtual} vs {periodoAnterior}
          </CardDescription>
          
          {/* Badges de Variação */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2">
              {data.gastos_variacao >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm text-gray-600">Gastos:</span>
              <Badge variant={data.gastos_variacao >= 0 ? "destructive" : "default"}>
                {data.gastos_variacao >= 0 ? '+' : ''}{data.gastos_variacao.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {data.receitas_variacao >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-gray-600">Receitas:</span>
              <Badge variant={data.receitas_variacao >= 0 ? "default" : "destructive"}>
                {data.receitas_variacao >= 0 ? '+' : ''}{data.receitas_variacao.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {data.transacoes_variacao >= 0 ? (
                <TrendingUp className="h-4 w-4 text-blue-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm text-gray-600">Transações:</span>
              <Badge variant="secondary">
                {data.transacoes_variacao >= 0 ? '+' : ''}{data.transacoes_variacao.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  fontSize={12}
                  fontWeight={500}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                    }).format(value)
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="anterior" 
                  fill="#9CA3AF" 
                  name={periodoAnterior}
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="atual" 
                  fill="#3B82F6" 
                  name={periodoAtual}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});