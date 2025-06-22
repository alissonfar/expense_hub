'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Tag,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  User,
  LucideIcon
} from 'lucide-react'
import { SIDEBAR_NAVIGATION } from '@/lib/constants'
import { cn } from '@/lib/utils'

// Mapeamento de ícones
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Tag,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  User,
}

// Mock user data
const mockUser = {
  nome: 'Proprietário Sistema',
  email: 'admin@personalexpense.com',
  avatar: 'PS',
  tipo: 'PROPRIETARIO' as const
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            💰
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">Expense Hub</h1>
            <p className="text-xs text-muted-foreground">
              Controle de Gastos
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {SIDEBAR_NAVIGATION.map((group) => (
          <SidebarGroup key={group.grupo}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {group.grupo}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = Boolean(pathname === item.href || (pathname && pathname.startsWith(item.href + '/')))
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActive}
                        className={cn(
                          'w-full justify-start',
                          isActive && 'bg-primary/10 text-primary font-medium'
                        )}
                      >
                        <Link href={item.href as any}>
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{item.label}</span>
                          {(item as any).badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto h-5 px-1.5 text-xs"
                            >
                              {(item as any).badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={mockUser.nome} />
            <AvatarFallback className="text-xs">
              {mockUser.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {mockUser.nome}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {mockUser.email}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs"
            asChild
          >
            <Link href="/configuracoes">
              <Settings className="w-3 h-3 mr-2" />
              Configurações
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Sair
          </Button>
        </div>

        {/* Version Info */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            v1.0.0 - Protótipo
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
} 