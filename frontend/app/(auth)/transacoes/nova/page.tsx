import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NovaTransacaoPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={"/transacoes" as any}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Transação</h1>
            <p className="text-muted-foreground">
              Crie um novo gasto ou receita
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Plus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Formulário em Construção</h3>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade será implementada na Fase 4.3
            </p>
            <p className="text-sm text-muted-foreground">
              Aqui você poderá criar novas transações com participantes,
              divisão de valores e parcelamento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 