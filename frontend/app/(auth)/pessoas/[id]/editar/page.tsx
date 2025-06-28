'use client'

<<<<<<< HEAD
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
=======
import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Crown,
  AlertCircle,
  X
} from 'lucide-react'
import { usePessoa, usePessoaMutations } from '@/hooks/usePessoas'
import { useAuth } from '@/lib/auth'
import { toast } from '@/hooks/use-toast'

// Schema de validação para edição
const editPessoaSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal(''))
})

type EditPessoaFormData = z.infer<typeof editPessoaSchema>

export default function EditarPessoaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { user } = useAuth()
  const { pessoa, loading: loadingPessoa, error, refetch } = usePessoa(Number(id))
  const { editarPessoa, loading: loadingMutation } = usePessoaMutations()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset
  } = useForm<EditPessoaFormData>({
    resolver: zodResolver(editPessoaSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: ''
    }
  })

  // Carregar dados da pessoa no formulário
  useEffect(() => {
    if (pessoa) {
      reset({
        nome: pessoa.nome,
        email: pessoa.email,
        telefone: pessoa.telefone || ''
      })
    }
  }, [pessoa, reset])

  // Verificar permissões
  useEffect(() => {
    if (!user?.eh_proprietario) {
      toast({
        title: "Acesso negado",
        description: "Apenas proprietários podem editar pessoas.",
        variant: "destructive",
      })
      router.push('/pessoas')
    }
  }, [user, router])

  // Formatar telefone automaticamente
  const formatTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    
    if (cleaned.length <= 2) {
      return cleaned.length > 0 ? `(${cleaned}` : ''
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
    }
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value)
    setValue('telefone', formatted, { shouldDirty: true })
  }

  const onSubmit = async (data: EditPessoaFormData) => {
    if (!pessoa) return

    try {
      // Limpar telefone se vazio e preparar dados
      const dadosLimpos = {
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone?.trim() || undefined
      }

      // Verificar se houve mudanças
      const houveMudancas = 
        dadosLimpos.nome !== pessoa.nome ||
        dadosLimpos.email !== pessoa.email ||
        dadosLimpos.telefone !== pessoa.telefone

      if (!houveMudancas) {
        toast({
          title: "Nenhuma alteração",
          description: "Nenhuma mudança foi detectada nos dados.",
        })
        return
      }

      await editarPessoa(pessoa.id, dadosLimpos)
      router.push(`/pessoas/${id}`)
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao editar pessoa:', error)
    }
  }

  const cancelar = () => {
    if (isDirty) {
      const confirmacao = window.confirm(
        'Você tem alterações não salvas. Tem certeza que deseja cancelar?'
      )
      if (!confirmacao) return
    }
    router.push(`/pessoas/${id}`)
  }

  if (loadingPessoa) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
>>>>>>> transacoesFront
          </CardContent>
        </Card>
      </div>
    )
  }

<<<<<<< HEAD
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
=======
  if (error || !pessoa) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pessoas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Pessoa não encontrada</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar pessoa</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'A pessoa solicitada não foi encontrada.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => refetch()}>
                  Tentar Novamente
                </Button>
                <Button asChild>
                  <Link href="/pessoas">Voltar à Lista</Link>
>>>>>>> transacoesFront
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

<<<<<<< HEAD
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
=======
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={cancelar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Pessoa</h1>
            <p className="text-muted-foreground">
              Atualize as informações de {pessoa.nome}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={cancelar}
            disabled={loadingMutation}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={loadingMutation || !isDirty}
          >
            <Save className="h-4 w-4 mr-2" />
            {loadingMutation ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Informações Atuais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Atuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nome atual:</span>
              <p className="font-medium">{pessoa.nome}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email atual:</span>
              <p className="font-medium">{pessoa.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Telefone atual:</span>
              <p className="font-medium">{pessoa.telefone || 'Não informado'}</p>
            </div>
          </div>
          
          {pessoa.eh_proprietario && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Crown className="w-4 h-4" />
                <span className="font-medium">Proprietário do Sistema</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Esta pessoa tem privilégios de proprietário. Para alterar esse status, 
                entre em contato com o administrador do sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Edição */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: João Silva"
                {...register('nome')}
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.nome.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: joao@email.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ⚠️ Certifique-se de que o email está correto, pois é usado para identificação no sistema.
              </p>
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone (opcional)
              </Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                {...register('telefone')}
                onChange={handleTelefoneChange}
                className={errors.telefone ? 'border-red-500' : ''}
              />
              {errors.telefone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.telefone.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Aviso sobre mudanças */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Importante:</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Alterações no email podem afetar o login da pessoa no sistema</li>
                <li>Todas as mudanças são registradas para auditoria</li>
                <li>As alterações entram em vigor imediatamente após salvar</li>
                {pessoa.eh_proprietario && (
                  <li>Status de proprietário não pode ser alterado por esta interface</li>
                )}
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Ações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <Link href={`/pessoas/${id}`}>
                <User className="w-4 h-4 mr-2" />
                Ver Perfil Completo
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href={`/transacoes?pessoa_id=${id}`}>
                Ver Transações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
>>>>>>> transacoesFront
    </div>
  )
} 