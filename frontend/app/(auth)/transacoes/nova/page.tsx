'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { TransacaoFormAvancado } from '@/components/forms/TransacaoFormAvancado'
import { TipoTransacaoSelector } from '@/components/forms/TipoTransacaoSelector'
import { TipoTransacao } from '@/types'

export default function NovaTransacaoPage() {
  const router = useRouter()
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoTransacao>('GASTO')

  const handleSuccess = () => {
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
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Escolha o Tipo de Transação</h2>
          <p className="text-sm text-muted-foreground">
            Selecione se você quer registrar um gasto ou uma receita
          </p>
        </div>
        
        <TipoTransacaoSelector
          value={tipoSelecionado}
          onChange={setTipoSelecionado}
        />
      </div>

      {/* Formulário */}
      <TransacaoFormAvancado
        tipo={tipoSelecionado}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
} 