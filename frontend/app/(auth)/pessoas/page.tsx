import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'

export default function PessoasPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
          <p className="text-muted-foreground">
            Gerencie participantes e proprietários do sistema
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Pessoa
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Página em Construção</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade será implementada na Fase 4.1
            </p>
            <p className="text-sm text-muted-foreground">
              Aqui você poderá gerenciar todas as pessoas do sistema,
              adicionar novos participantes e visualizar suas dívidas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 