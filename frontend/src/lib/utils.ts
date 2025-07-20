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
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const diasDecorridos = hoje.getDate();
  const diasNoMes = fimMes.getDate();
  
  return Math.min(Math.round((diasDecorridos / diasNoMes) * 100), 100);
}
