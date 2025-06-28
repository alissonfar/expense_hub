'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Sun,
  Moon,
  Computer,
  User,
  Settings,
  LogOut,
  Bell,
  Palette,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import type { ConfiguracaoInterface, Theme } from '@/types'

// Mapeamento de rotas para breadcrumbs
const routeMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pessoas': 'Pessoas',
  '/tags': 'Tags',
  '/transacoes': 'Transações',
  '/pagamentos': 'Pagamentos',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
}

// Mapeamento de ícones para temas
const themeIcons: Record<string, any> = {
  light: Sun,
  dark: Moon,
  system: Computer,
  blue: Palette,
  green: Palette,
  purple: Palette,
  orange: Palette,
}

// Cores de preview para os temas
const themeColors: Record<string, string> = {
  light: '#ffffff',
  dark: '#0a0a0a',
  system: '#64748b',
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f59e0b',
}

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [temasDisponiveis, setTemasDisponiveis] = useState<Record<string, any>>({})
  const [isLoadingTheme, setIsLoadingTheme] = useState(false)

  // Carregar temas disponíveis
  useEffect(() => {
    const carregarTemas = async () => {
      try {
        const response = await api.get<ConfiguracaoInterface>('/configuracoes/interface')
        if (response.data.temas_disponíveis) {
          setTemasDisponiveis(response.data.temas_disponíveis)
        }
      } catch (error) {
        console.error('Erro ao carregar temas:', error)
      }
    }

    carregarTemas()
  }, [])

  // Gerar iniciais do usuário
  const getUserInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Gerar breadcrumbs baseado na rota atual
  const generateBreadcrumbs = () => {
    if (!pathname) return [{ label: 'Início', href: '/', active: true }]
    
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    // Home sempre primeiro
    breadcrumbs.push({
      label: 'Início',
      href: '/',
      active: segments.length === 0
    })

    // Adicionar segmentos da rota atual
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      
      breadcrumbs.push({
        label: routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
        active: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  const ThemeIcon = themeIcons[theme as string] || Computer

  // Alterar tema e salvar no backend
  const handleThemeChange = async (newTheme: Theme) => {
    if (isLoadingTheme) return

    setIsLoadingTheme(true)
    
    try {
      // Aplicar tema imediatamente na UI
      setTheme(newTheme)

      // Salvar no backend (apenas se for proprietário)
      if (user?.eh_proprietario) {
        await api.put('/configuracoes/interface', {
          theme_interface: newTheme
        })

        const temaNome = temasDisponiveis[newTheme]?.nome || newTheme
        toast({
          title: "Tema alterado!",
          description: `Tema "${temaNome}" aplicado com sucesso.`,
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Erro ao alterar tema:', error)
      toast({
        title: "Erro ao alterar tema",
        description: "Não foi possível salvar a preferência de tema.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoadingTheme(false)
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={breadcrumb.href}>
                <BreadcrumbItem className="hidden md:block">
                  {breadcrumb.active ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto px-3">
        <div className="flex items-center gap-2 px-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                disabled={isLoadingTheme}
              >
                <ThemeIcon className="h-4 w-4" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Escolher Tema</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Temas Padrão */}
              <div className="space-y-1">
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('light')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.light }}
                    />
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                  </div>
                  {theme === 'light' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('dark')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.dark }}
                    />
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Escuro</span>
                  </div>
                  {theme === 'dark' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('system')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.system }}
                    />
                    <Computer className="mr-2 h-4 w-4" />
                    <span>Sistema</span>
                  </div>
                  {theme === 'system' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Temas Personalizados</DropdownMenuLabel>
              
              {/* Temas Personalizados */}
              <div className="space-y-1">
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('blue')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.blue }}
                    />
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Azul</span>
                  </div>
                  {theme === 'blue' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('green')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.green }}
                    />
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Verde</span>
                  </div>
                  {theme === 'green' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('purple')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.purple }}
                    />
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Roxo</span>
                  </div>
                  {theme === 'purple' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleThemeChange('orange')}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3 border border-border"
                      style={{ backgroundColor: themeColors.orange }}
                    />
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Laranja</span>
                  </div>
                  {theme === 'orange' && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              </div>
              
              {!user?.eh_proprietario && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    💡 Apenas proprietários podem salvar preferências
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
            <span className="sr-only">Notificações</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.nome ? getUserInitials(user.nome) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 