'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { usePessoas } from '@/hooks/usePessoas'
import { apiPost, apiPut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Pessoa } from '@/types'

interface PessoaFormModalProps {
  onSuccess?: () => void
  pessoa?: Pessoa // Para edição
}

export function PessoaFormModal({ onSuccess, pessoa }: PessoaFormModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: pessoa?.nome || '',
    email: pessoa?.email || '',
    telefone: pessoa?.telefone || '',
    eh_proprietario: pessoa?.eh_proprietario || false
  })

  const isEdit = !!pessoa

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações básicas
      if (!formData.nome.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "O nome da pessoa é obrigatório",
          variant: "destructive"
        })
        return
      }

      if (!formData.email.trim()) {
        toast({
          title: "Email obrigatório", 
          description: "O email da pessoa é obrigatório",
          variant: "destructive"
        })
        return
      }

      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido",
          variant: "destructive"
        })
        return
      }

      // Validação de telefone (se fornecido)
      if (formData.telefone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone)) {
        toast({
          title: "Telefone inválido",
          description: "Use o formato: (11) 99999-9999",
          variant: "destructive"
        })
        return
      }

      const requestData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.trim() || null,
        eh_proprietario: formData.eh_proprietario
      }

      const response = isEdit
        ? await apiPut(`/pessoas/${pessoa.id}`, requestData)
        : await apiPost('/pessoas', requestData)

      const data = response.data

      toast({
        title: `Pessoa ${isEdit ? 'atualizada' : 'criada'} com sucesso!`,
        description: `${formData.nome} foi ${isEdit ? 'atualizada' : 'criada'} com sucesso.`
      })

      onSuccess?.()

    } catch (error) {
      console.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} pessoa:`, error)
      toast({
        title: `Erro ao ${isEdit ? 'atualizar' : 'criar'} pessoa`,
        description: error instanceof Error ? error.message : `Erro desconhecido ao ${isEdit ? 'atualizar' : 'criar'} pessoa`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Formatação do telefone
  const formatTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return value
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value)
    handleInputChange('telefone', formatted)
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Editar Pessoa' : 'Nova Pessoa'}
        </DialogTitle>
        <DialogDescription>
          {isEdit 
            ? 'Atualize as informações da pessoa aqui. Clique em salvar quando terminar.'
            : 'Adicione uma nova pessoa ao sistema. Preencha as informações abaixo.'
          }
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            type="text"
            placeholder="Ex: João Silva"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Ex: joao@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            type="tel"
            placeholder="Ex: (11) 99999-9999"
            value={formData.telefone}
            onChange={handleTelefoneChange}
            disabled={loading}
            maxLength={15}
          />
        </div>

        {user?.eh_proprietario && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="eh_proprietario"
              checked={formData.eh_proprietario}
              onCheckedChange={(checked) => handleInputChange('eh_proprietario', checked)}
              disabled={loading}
            />
            <Label htmlFor="eh_proprietario" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              É proprietário do sistema
            </Label>
          </div>
        )}

        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Pessoa')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
} 