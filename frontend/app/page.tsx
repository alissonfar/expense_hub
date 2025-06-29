'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, needsHubSelection } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (needsHubSelection) {
        router.push('/select-hub')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, needsHubSelection, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          Carregando...
        </p>
      </div>
    </div>
  )
}
