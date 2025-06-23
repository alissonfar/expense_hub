'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { TransacaoForm } from '@/components/forms/TransacaoForm'
import { TipoTransacao } from '@/types'

export default function NovaTransacaoPage() {
  const router = useRouter()
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoTransacao>('GASTO')

  const handleSuccess = (continuar = false) => {
    if (continuar) {
      // Permanecer na página para criar nova transação
      return
    }
    
    // Voltar para lista de transações
    router.push('/transacoes')
  }

  const handleCancel = () => {
    router.push('/transacoes')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/transacoes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Nova Transação</h1>
          <p className="text-muted-foreground">
            Registre um novo gasto ou receita no sistema
          </p>
        </div>
      </div>

      {/* Seletor de Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={tipoSelecionado} 
            onValueChange={(value) => setTipoSelecionado(value as TipoTransacao)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="GASTO" className="flex items-center gap-2">
                💸 Gasto
              </TabsTrigger>
              <TabsTrigger value="RECEITA" className="flex items-center gap-2">
                💰 Receita
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="GASTO" className="mt-0">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Gastos</strong> são despesas que você teve e podem ser divididas entre participantes.</p>
                  <p className="mt-1">Exemplos: supermercado, restaurante, combustível, cinema, etc.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="RECEITA" className="mt-0">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Receitas</strong> são valores que você recebeu (apenas proprietários podem registrar).</p>
                  <p className="mt-1">Exemplos: salário, freelance, venda, reembolso, etc.</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Formulário */}
      <TransacaoForm
        tipo={tipoSelecionado}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showQuickActions={true}
      />
    </div>
  )
} 