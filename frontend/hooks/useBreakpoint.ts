import { useState, useEffect } from 'react'
import type { Breakpoint } from '@/types'

const breakpoints = {
  mobile: 768,
  tablet: 1024,
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>({
    mobile: false,
    tablet: false,
    desktop: false,
  })

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      setBreakpoint({
        mobile: width < breakpoints.mobile,
        tablet: width >= breakpoints.mobile && width < breakpoints.tablet,
        desktop: width >= breakpoints.tablet,
      })
    }

    // Atualizar na inicialização
    updateBreakpoint()

    // Listener para mudanças de tamanho
    window.addEventListener('resize', updateBreakpoint)

    // Cleanup
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

export function useIsDesktop(): boolean {
  const { desktop } = useBreakpoint()
  return desktop
} 