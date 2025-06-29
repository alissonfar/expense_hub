import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// 🔧 FORMATAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Formatar valor monetário em Real brasileiro
 */
export function formatCurrency(value: any): string {
  let num: number | undefined = undefined;
  if (typeof value === 'string') {
    num = Number(value.replace(',', '.'));
  } else if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    // Suporte para Decimal do Prisma
    num = Number(value.toNumber());
  }
  if (typeof num !== 'number' || isNaN(num)) {
    if (process.env.NODE_ENV !== 'production') {
      // Só loga no dev
      console.warn('[formatCurrency] Valor inválido recebido:', value, 'Tipo:', typeof value);
    }
    return 'R$ 0,00';
  }
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formatar data relativa (ex: "há 2 dias")
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: ptBR,
  })
}

/**
 * Formatar data absoluta
 */
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Formatar data com hora
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Formatar porcentagem
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Validar CPF
 */
export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '')
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  
  return remainder === parseInt(cpf.charAt(10))
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// 🎨 HELPERS DE UI
// ============================================================================

/**
 * Obter cor para status
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    ATIVO: 'bg-green-100 text-green-800',
    INATIVO: 'bg-gray-100 text-gray-800',
    PAGO: 'bg-green-100 text-green-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    VENCIDO: 'bg-red-100 text-red-800',
    CANCELADO: 'bg-gray-100 text-gray-800',
  }
  
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Gerar cor de avatar baseada no nome
 */
export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ]
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Obter iniciais do nome
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(part => part.length > 0)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Truncar texto
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ============================================================================
// 💾 HELPERS DE STORAGE
// ============================================================================

/**
 * Salvar no localStorage de forma segura
 */
export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
}

/**
 * Recuperar do localStorage de forma segura
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

/**
 * Remover do localStorage
 */
export function removeFromLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }
}

// ============================================================================
// 🧮 HELPERS MATEMÁTICOS
// ============================================================================

/**
 * Calcular porcentagem de mudança
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Arredondar para 2 casas decimais
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Somar array de números
 */
export function sumArray(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0)
}

/**
 * Calcular média
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return sumArray(numbers) / numbers.length
}
