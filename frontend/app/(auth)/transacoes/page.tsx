import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Receipt, Plus } from 'lucide-react'

export default function TransacoesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie todos os gastos e receitas do sistema
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Página em Construção</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade será implementada na Fase 4.3
            </p>
            <p className="text-sm text-muted-foreground">
              Aqui você poderá visualizar, criar e editar todas as transações,
              incluindo gastos e receitas com participantes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 