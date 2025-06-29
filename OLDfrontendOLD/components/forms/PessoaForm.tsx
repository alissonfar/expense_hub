'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Crown, User, Loader2, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
// Form components inline - shadcn Form não instalado

import { usePessoaMutations } from '@/hooks/usePessoaMutations'
import { Pessoa } from '@/types'

// =============================================
// SCHEMA DE VALIDAÇÃO
// =============================================

const pessoaFormSchema = z.object({
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
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  
  eh_proprietario: z.boolean().default(false)
})

type PessoaFormData = z.infer<typeof pessoaFormSchema>

// =============================================
// PROPS DO COMPONENTE
// =============================================

interface PessoaFormProps {
  pessoa?: Pessoa // Para edição
  onSuccess?: (pessoa: Pessoa) => void
  onCancel?: () => void
  showQuickActions?: boolean
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export function PessoaForm({ 
  pessoa, 
  onSuccess, 
  onCancel,
  showQuickActions = false 
}: PessoaFormProps) {
  const { createPessoa, updatePessoa, loading, error, clearError } = usePessoaMutations()
  const [showProprietarioWarning, setShowProprietarioWarning] = useState(false)

  const isEditing = !!pessoa

  // Configurar formulário
  const form = useForm<PessoaFormData>({
    resolver: zodResolver(pessoaFormSchema),
    defaultValues: {
      nome: pessoa?.nome || '',
      email: pessoa?.email || '',
      telefone: pessoa?.telefone || '',
      eh_proprietario: pessoa?.eh_proprietario || false
    }
  })

  // Limpar erro quando formulário muda
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [form.watch(), clearError, error])

  // Watch eh_proprietario para mostrar warning
  const watchEhProprietario = form.watch('eh_proprietario')
  useEffect(() => {
    setShowProprietarioWarning(watchEhProprietario && !isEditing)
  }, [watchEhProprietario, isEditing])

  // =============================================
  // HANDLERS
  // =============================================

  const onSubmit = async (data: PessoaFormData) => {
    try {
      let result

      if (isEditing && pessoa) {
        // Edição - não permitir alterar eh_proprietario
        const updateData = {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || undefined
        }
        
        result = await updatePessoa(pessoa.id, updateData, {
          onSuccess: (pessoaAtualizada) => {
            onSuccess?.(pessoaAtualizada)
          }
        })
      } else {
        // Criação
        result = await createPessoa(data, {
          onSuccess: (novaPessoa) => {
            onSuccess?.(novaPessoa)
          }
        })
      }

      if (result.success && showQuickActions) {
        // Reset para nova pessoa
        form.reset({
          nome: '',
          email: '',
          telefone: '',
          eh_proprietario: false
        })
      }

    } catch (err) {
      console.error('Erro no formulário:', err)
    }
  }

  const handleCancel = () => {
    form.reset()
    onCancel?.()
  }

  // Função para formatar telefone automaticamente
  const formatTelefone = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '')
    
    // Aplica máscara
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <User className="h-5 w-5" />
              Editar Pessoa
            </>
          ) : (
            <>
              <User className="h-5 w-5" />
              Nova Pessoa
            </>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              placeholder="Ex: João Silva Santos"
              {...form.register('nome')}
              disabled={loading}
            />
            {form.formState.errors.nome && (
              <p className="text-sm text-red-600">{form.formState.errors.nome.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Nome completo da pessoa (apenas letras e espaços)
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@email.com"
              {...form.register('email')}
              disabled={loading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Email único no sistema {isEditing && '(pode ser alterado)'}
            </p>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (Opcional)</Label>
            <Input
              id="telefone"
              placeholder="(11) 99999-9999"
              {...form.register('telefone')}
              disabled={loading}
              onChange={(e) => {
                const formatted = formatTelefone(e.target.value)
                form.setValue('telefone', formatted)
              }}
              maxLength={15}
            />
            {form.formState.errors.telefone && (
              <p className="text-sm text-red-600">{form.formState.errors.telefone.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Formato: (XX) XXXXX-XXXX ou deixe vazio
            </p>
          </div>

          {/* Proprietário - Apenas na criação */}
          {!isEditing && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="eh_proprietario"
                checked={form.watch('eh_proprietario')}
                onCheckedChange={(checked) => form.setValue('eh_proprietario', !!checked)}
                disabled={loading}
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="eh_proprietario" className="flex items-center gap-2 cursor-pointer">
                  <Crown className="h-4 w-4" />
                  Definir como Proprietário
                </Label>
                <p className="text-sm text-muted-foreground">
                  Proprietários têm controle total do sistema. Apenas um proprietário é permitido.
                </p>
              </div>
            </div>
          )}

            {/* Warning para proprietário */}
            {showProprietarioWarning && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Atenção: Criando Proprietário</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Proprietários têm acesso total ao sistema e podem:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Criar, editar e desativar pessoas</li>
                      <li>Gerenciar todas as transações</li>
                      <li>Configurar o sistema</li>
                      <li>Acessar todos os relatórios</li>
                    </ul>
                    <p className="text-sm text-yellow-700 mt-2 font-medium">
                      Apenas um proprietário é permitido no sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status atual (apenas na edição) */}
            {isEditing && pessoa && (
              <div className="p-4 bg-gray-50 border rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Status Atual</h4>
                <div className="flex items-center gap-2">
                  {pessoa.eh_proprietario ? (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Crown className="h-3 w-3 mr-1" />
                      Proprietário
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      Participante
                    </Badge>
                  )}
                  <span className="text-sm text-gray-600">
                    (não pode ser alterado)
                  </span>
                </div>
              </div>
            )}

            {/* Erro geral */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Pessoa'}
              </Button>

              {showQuickActions && !isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={loading}
                >
                  Limpar Formulário
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>

            {/* Atalhos de teclado */}
            {showQuickActions && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p><strong>Atalhos:</strong> Ctrl+Enter (salvar), Escape (cancelar)</p>
              </div>
            )}
        </form>
      </CardContent>
    </Card>
  )
} 