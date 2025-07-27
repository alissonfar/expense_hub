'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelatoriosDashboard } from '@/components/relatorios/RelatoriosDashboard';
import { PanoramaGeralHub } from '@/components/relatorios/PanoramaGeralHub';
import { BarChart3, Users } from 'lucide-react';

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise completa das suas finanças pessoais</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard Geral
          </TabsTrigger>
          <TabsTrigger value="panorama">
            <Users className="h-4 w-4 mr-2" />
            Panorama do HUB
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <RelatoriosDashboard />
        </TabsContent>
        
        <TabsContent value="panorama" className="mt-6">
          <PanoramaGeralHub />
        </TabsContent>
      </Tabs>
    </div>
  );
} 