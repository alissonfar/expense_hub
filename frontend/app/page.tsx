import { redirect } from 'next/navigation'

export default function HomePage() {
  // Por enquanto, redirecionar diretamente para o dashboard
  // Em produção, aqui seria verificado se o usuário está autenticado
  redirect('/dashboard')
} 