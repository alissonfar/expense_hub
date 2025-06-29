'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { Tag } from '@/types'

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiGet<{
        success: boolean
        data: Tag[]
      }>(API_ENDPOINTS.TAGS.LIST)

      if (response.data.success && response.data.data) {
        // Filtrar apenas tags ativas
        const tagsAtivas = response.data.data.filter(t => t.ativo)
        setTags(tagsAtivas)
      } else {
        throw new Error('Erro ao carregar tags')
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tags')
      setTags([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Funções utilitárias
  const getTagById = useCallback((id: number) => {
    return tags.find(t => t.id === id)
  }, [tags])

  const getTagsByIds = useCallback((ids: number[]) => {
    return tags.filter(t => ids.includes(t.id))
  }, [tags])

  const searchTags = useCallback((termo: string) => {
    return tags.filter(t => 
      t.nome.toLowerCase().includes(termo.toLowerCase())
    )
  }, [tags])

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
    getTagById,
    getTagsByIds,
    searchTags
  }
} 