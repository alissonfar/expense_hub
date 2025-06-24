'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PessoaForm } from '@/components/forms/PessoaForm'

import { usePessoas } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'
import { Pessoa } from '@/types'

interface EditarPessoaPageProps {
  params: {
    id: string
  }
}

export default function EditarPessoaPage({ params }: EditarPessoaPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { pessoas, loading, error, refetch } = usePessoas()

  const pessoaId = parseInt(params.id)
  const pessoa = pessoas.find(p => p.id === pessoaId)

  // Verificar se usuário pode gerenciar pessoas
  const canManage = user?.eh_proprietario

  const handleSuccess = (pessoaAtualizada: Pessoa) => {
    // Redirecionar para detalhes da pessoa
    router.push(`/pessoas/${pessoaAtualizada.id}`)
  }

  const handleCancel = () => {
    router.back()
  }

  // Verificar permissões
  if (!canManage) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">
                Você não tem permissão para editar pessoas.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">Erro ao carregar pessoa: {error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={refetch}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pessoa) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold">Editar Pessoa</h1>
          <p className="text-muted-foreground">
            Altere as informações de {pessoa.nome}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <PessoaForm
        pessoa={pessoa}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showQuickActions={false}
      />
    </div>
  )
} 