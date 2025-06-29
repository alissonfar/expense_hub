'use client'

import { useState } from 'react'
import { apiPost, apiPut, apiDelete } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { toast } from '@/hooks/use-toast'
import { Pessoa } from '@/types'

// =============================================
// TIPOS PARA OPERAÇÕES DE PESSOAS
// =============================================

interface CreatePessoaData {
  nome: string
  email: string
  telefone?: string
  eh_proprietario?: boolean
}

interface UpdatePessoaData {
  nome?: string
  email?: string
  telefone?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  timestamp: string
}

// =============================================
// HOOK DE MUTATIONS PARA PESSOAS
// =============================================

export function usePessoaMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =============================================
  // CRIAR PESSOA
  // =============================================
  const createPessoa = async (
    data: CreatePessoaData,
    options?: {
      onSuccess?: (pessoa: Pessoa) => void
      onError?: (error: string) => void
      showToast?: boolean
    }
  ): Promise<{ success: boolean; data?: Pessoa; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiPost<ApiResponse<Pessoa>>(
        API_ENDPOINTS.PESSOAS.CREATE,
        data
      )

      if (response.data.success && response.data.data) {
        const novaPessoa = response.data.data

        // Toast de sucesso
        if (options?.showToast !== false) {
          toast({
            title: 'Pessoa criada!',
            description: novaPessoa.eh_proprietario 
              ? `Proprietário ${novaPessoa.nome} criado com sucesso`
              : `${novaPessoa.nome} foi adicionado como participante`,
          })
        }

        // Callback de sucesso
        options?.onSuccess?.(novaPessoa)

        return { success: true, data: novaPessoa }
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar pessoa'
      setError(errorMessage)

      // Toast de erro
      if (options?.showToast !== false) {
        toast({
          title: 'Erro ao criar pessoa',
          description: errorMessage,
          variant: 'destructive',
        })
      }

      // Callback de erro
      options?.onError?.(errorMessage)

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // ATUALIZAR PESSOA
  // =============================================
  const updatePessoa = async (
    id: number,
    data: UpdatePessoaData,
    options?: {
      onSuccess?: (pessoa: Pessoa) => void
      onError?: (error: string) => void
      showToast?: boolean
    }
  ): Promise<{ success: boolean; data?: Pessoa; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiPut<ApiResponse<Pessoa>>(
        API_ENDPOINTS.PESSOAS.UPDATE(id),
        data
      )

      if (response.data.success && response.data.data) {
        const pessoaAtualizada = response.data.data

        // Toast de sucesso
        if (options?.showToast !== false) {
          toast({
            title: 'Pessoa atualizada!',
            description: `Dados de ${pessoaAtualizada.nome} foram atualizados`,
          })
        }

        // Callback de sucesso
        options?.onSuccess?.(pessoaAtualizada)

        return { success: true, data: pessoaAtualizada }
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar pessoa'
      setError(errorMessage)

      // Toast de erro
      if (options?.showToast !== false) {
        toast({
          title: 'Erro ao atualizar pessoa',
          description: errorMessage,
          variant: 'destructive',
        })
      }

      // Callback de erro
      options?.onError?.(errorMessage)

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // DESATIVAR PESSOA
  // =============================================
  const deletePessoa = async (
    id: number,
    options?: {
      onSuccess?: (pessoa: Pessoa) => void
      onError?: (error: string) => void
      showToast?: boolean
    }
  ): Promise<{ success: boolean; data?: Pessoa; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiDelete<ApiResponse<Pessoa>>(
        API_ENDPOINTS.PESSOAS.DELETE(id)
      )

      if (response.data.success && response.data.data) {
        const pessoaDesativada = response.data.data

        // Toast de sucesso
        if (options?.showToast !== false) {
          toast({
            title: 'Pessoa desativada',
            description: `${pessoaDesativada.nome} foi removido do sistema`,
          })
        }

        // Callback de sucesso
        options?.onSuccess?.(pessoaDesativada)

        return { success: true, data: pessoaDesativada }
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao desativar pessoa'
      setError(errorMessage)

      // Toast de erro
      if (options?.showToast !== false) {
        toast({
          title: 'Erro ao desativar pessoa',
          description: errorMessage,
          variant: 'destructive',
        })
      }

      // Callback de erro
      options?.onError?.(errorMessage)

      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // LIMPAR ESTADO DE ERRO
  // =============================================
  const clearError = () => {
    setError(null)
  }

  return {
    // Estados
    loading,
    error,
    
    // Ações
    createPessoa,
    updatePessoa,
    deletePessoa,
    clearError
  }
} 