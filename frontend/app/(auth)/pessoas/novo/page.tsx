'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PessoaForm } from '@/components/forms/PessoaForm'
import { Pessoa } from '@/types'

export default function NovaPessoaPage() {
  const router = useRouter()

  const handleSuccess = (pessoa: Pessoa) => {
    // Redirecionar para a lista com sucesso
    router.push('/pessoas')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Pessoa</h1>
          <p className="text-muted-foreground">
            Adicione um novo proprietário ou participante ao sistema
          </p>
        </div>
      </div>

      {/* Formulário */}
      <PessoaForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showQuickActions={true}
      />
    </div>
  )
} 