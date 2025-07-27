'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { usePanoramaGeral, PanoramaGeralParams } from '@/hooks/usePanoramaGeral';
import { PanoramaGeralResumo } from './PanoramaGeralResumo';
import { ListaDevedores } from './ListaDevedores';
import { AnalisePorStatus } from './AnalisePorStatus';
import { FiltrosPanoramaGeral } from './FiltrosPanoramaGeral';
import { cn } from '@/lib/utils';

interface PanoramaGeralHubProps {
  className?: string;
}

export function PanoramaGeralHub({ className }: PanoramaGeralHubProps) {
  const [filtros, setFiltros] = useState<PanoramaGeralParams>({
    periodo: 'mes_atual',
    statusPagamento: 'TODOS',
    ordenarPor: 'valor_devido',
    ordem: 'desc',
    incluirDetalhes: false,
  });
  const [activeTab, setActiveTab] = useState('devedores');

  const { data, isLoading, error, refetch } = usePanoramaGeral(filtros);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Erro ao carregar panorama geral</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente novamente em alguns instantes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panorama Geral do HUB</h2>
          <p className="text-gray-600">
            Visão completa das dívidas e saldos em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          {data && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <FiltrosPanoramaGeral 
        filtros={filtros} 
        onFiltrosChange={setFiltros}
      />

      {/* Resumo Executivo */}
      <PanoramaGeralResumo 
        resumo={data?.resumo}
        loading={isLoading}
      />

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devedores">
            <Users className="h-4 w-4 mr-2" />
            Devedores
          </TabsTrigger>
          <TabsTrigger value="status">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Por Status
          </TabsTrigger>
          <TabsTrigger value="tendencias">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devedores" className="mt-6">
          <ListaDevedores 
            devedores={data?.devedores}
            loading={isLoading}
            incluirDetalhes={filtros.incluirDetalhes}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <AnalisePorStatus 
            analise={data?.analisePorStatus}
            loading={isLoading}
          />
        </TabsContent>

        <TabsContent value="tendencias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Dívidas</CardTitle>
              <CardDescription>
                Tendência dos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Gráfico de evolução temporal (em desenvolvimento)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}