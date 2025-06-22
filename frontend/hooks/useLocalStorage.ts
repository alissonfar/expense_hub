import { useState, useEffect } from 'react'
import { getFromLocalStorage, setToLocalStorage } from '@/lib/utils'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Efeito para carregar o valor do localStorage na inicialização
  useEffect(() => {
    try {
      const item = getFromLocalStorage(key, initialValue)
      setStoredValue(item)
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])

  // Função para atualizar o valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que o valor seja uma função para ter a mesma API do useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Salvar no state
      setStoredValue(valueToStore)
      
      // Salvar no localStorage
      setToLocalStorage(key, valueToStore)
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Função para remover o valor
  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue] as const
} 