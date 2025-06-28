'use client'

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
    .regex(/^[a-zA-ZÀ-ÿ\\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  
  telefone: z
    .string()
    .regex(/^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal(''))
})

type EditPessoaFormData = z.infer<typeof editPessoaSchema>

export default function EditarPessoaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  
  // ✅ LÓGICA DE AUTENTICAÇÃO ATUALIZADA
  const { selectedHub } = useAuth()
  const canManage = selectedHub?.role === 'PROPRIETARIO' || selectedHub?.role === 'ADMINISTRADOR'

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
    // A verificação é feita no carregamento. Se a role mudar, um refresh da página é necessário.
    if (!canManage) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar membros.",
        variant: "destructive",
      })
      router.push('/pessoas') // Redireciona para a lista de membros/pessoas
    }
  }, [canManage, router])

  // Formatar telefone automaticamente
  const formatTelefone = (value: string) => {
    const cleaned = value.replace(/\\D/g, '')
    
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

    // Re-verificar permissão antes da submissão
    if (!canManage) {
      toast({ title: "Acesso negado", variant: "destructive" });
      return;
    }

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

  if (!canManage) {
     return (
       <div className="container mx-auto py-6 flex items-center justify-center">
         <Card className="w-full max-w-lg">
           <CardHeader>
             <CardTitle className="text-center text-destructive">Acesso Negado</CardTitle>
           </CardHeader>
           <CardContent className="text-center">
             <p>Você não tem permissão para visualizar esta página.</p>
             <Button onClick={() => router.push('/dashboard')} className="mt-4">
               Voltar para o Dashboard
             </Button>
           </CardContent>
         </Card>
       </div>
     );
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
          <CardContent className="pt-6 space-y-6">
             <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-10 w-full" />
             </div>
             <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-10 w-full" />
             </div>
             <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-10 w-full" />
             </div>
             <Separator />
             <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
             </div>
           </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center text-red-500">
            <p>Erro ao carregar dados da pessoa. Tente novamente.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Recarregar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pessoa) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Pessoa não encontrada.</p>
            <Link href="/pessoas">
              <Button variant="outline" className="mt-4">
                Voltar para a Lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={cancelar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Membro</h1>
            <p className="text-muted-foreground">
              Modifique os dados de {pessoa.nome}
            </p>
          </div>
        </div>
        {pessoa.eh_proprietario && (
            <div className="flex items-center gap-2 text-yellow-500">
              <Crown className="h-5 w-5" />
              <span className="font-semibold">Proprietário</span>
            </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Nome Completo
              </Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Telefone (Opcional)
              </Label>
              <Input 
                id="telefone" 
                {...register('telefone')} 
                onChange={handleTelefoneChange} 
                placeholder="(XX) XXXXX-XXXX"
              />
              {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
            </div>
            
            <Separator />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={cancelar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isDirty || loadingMutation}>
                {loadingMutation ? 'Salvando...' : 'Salvar Alterações'}
                <Save className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 