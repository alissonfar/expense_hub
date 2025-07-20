import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula o progresso temporal do mês atual
 * @returns Porcentagem do mês que já decorreu (0-100)
 */
export function calcularProgressoTemporal(): number {
  const now = new Date();
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diaAtual = now.getDate();
  const totalDiasMes = fimMes.getDate();
  
  return Math.round((diaAtual / totalDiasMes) * 100);
}
