'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelatoriosDashboard } from '@/components/relatorios/RelatoriosDashboard';
import { PanoramaGeralHub } from '@/components/relatorios/PanoramaGeralHub';
import { BarChart3, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { getPageVariant } from '@/lib/pageTheme';

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <PageHeader 
        title="Relatórios" 
        subtitle="Análise completa das suas finanças pessoais" 
        icon={<BarChart3 className="w-6 h-6" />} 
        variant={getPageVariant('relatorios')}
        backHref="/dashboard"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Relatórios' }]}
      />
      
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