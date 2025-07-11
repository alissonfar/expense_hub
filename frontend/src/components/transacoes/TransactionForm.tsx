'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, FileText, Users, Tag, Calculator, Check, X } from 'lucide-react';

// Estrutura visual inicial baseada no design do formulário antigo
export default function TransactionForm() {
  const [activeTab, setActiveTab] = useState('basico');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Painel de Atalhos */}
      {showShortcuts && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Atalhos de Teclado
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd>
                  <span>Salvar transação</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                  <span>Cancelar</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F1</kbd>
                  <span>Mostrar/ocultar atalhos</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+←/→</kbd>
                  <span>Navegar entre abas</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+D</kbd>
                  <span>Dividir igualmente</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                  <span>Novo participante</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback de Sucesso */}
      {showSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">Transação salva com sucesso!</h3>
                  <p className="text-sm text-green-600">
                    Formulário será resetado em alguns segundos...
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSuccess(false)}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Check className="h-4 w-4 mr-2" />
                Nova Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abas principais do formulário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Transação
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="text-xs ml-2"
            >
              <Keyboard className="h-3 w-3 mr-1" />
              F1
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="participantes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes
                <Badge variant="secondary" className="ml-1">0</Badge>
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
                <Badge variant="secondary" className="ml-1">0</Badge>
              </TabsTrigger>
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Resumo
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das abas - placeholders para próxima etapa */}
            <TabsContent value="basico" className="space-y-4 mt-6">
              <div className="text-muted-foreground">[Campos básicos do formulário aqui]</div>
            </TabsContent>
            <TabsContent value="participantes" className="space-y-4 mt-6">
              <div className="text-muted-foreground">[Gestão de participantes aqui]</div>
            </TabsContent>
            <TabsContent value="tags" className="space-y-4 mt-6">
              <div className="text-muted-foreground">[Seleção de tags aqui]</div>
            </TabsContent>
            <TabsContent value="resumo" className="space-y-4 mt-6">
              <div className="text-muted-foreground">[Resumo da transação aqui]</div>
            </TabsContent>
          </Tabs>
          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" className="min-w-[140px]">
              <Check className="h-4 w-4 mr-2" />
              Salvar Transação
              <kbd className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl+↵</kbd>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 