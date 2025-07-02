"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useHubContext } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Receipt,
  Tag,
  BarChart3,
  Settings,
  Beaker,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  requiredRoles?: string[];
}

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ className, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { hubId, role } = useHubContext();
  const { currentHub, availableHubs, selectHub } = useAuth();

  const navigationItems: NavItem[] = [
    { name: "Dashboard", href: `/${hubId}/dashboard`, icon: LayoutDashboard },
    { name: "Transações", href: `/${hubId}/transactions`, icon: Receipt },
    { name: "Pagamentos", href: `/${hubId}/payments`, icon: CreditCard },
    { name: "Tags", href: `/${hubId}/tags`, icon: Tag, requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR", "COLABORADOR"] },
    { name: "Relatórios", href: `/${hubId}/reports`, icon: BarChart3 },
    { name: "Membros", href: `/${hubId}/members`, icon: Users, requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR"] },
  ];
  const settingsNav: NavItem = { name: "Configurações", href: `/${hubId}/settings`, icon: Settings, requiredRoles: ["PROPRIETARIO", "ADMINISTRADOR"] };

  if (process.env.NODE_ENV === 'development') {
    navigationItems.push({ name: 'Test Elements', href: `/${hubId}/test-elements`, icon: Beaker });
  }

  const isVisible = (item: NavItem) => !item.requiredRoles || item.requiredRoles.includes(role || "");

  const renderLink = (item: NavItem) => {
    const isActive = pathname.startsWith(item.href);
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary",
          isCollapsed && "h-9 w-9 justify-center p-0"
        )}
      >
        <item.icon className={cn("h-5 w-5", isCollapsed && "h-6 w-6")} />
        <span className={cn("truncate", isCollapsed && "sr-only")}>{item.name}</span>
      </Link>
    );

    return isCollapsed ? (
      <Tooltip content={item.name} position="right">{linkContent}</Tooltip>
    ) : (
      linkContent
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-full lg:w-20" : "w-72 lg:w-60",
        className
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
          <div className={cn(!isCollapsed && "flex-1")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("w-full justify-start p-2", isCollapsed && "justify-center")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground", isCollapsed && "h-9 w-9")}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className={cn("font-semibold truncate", isCollapsed && "hidden")}>{currentHub?.nome || "Hub"}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground ml-auto", isCollapsed && "hidden")} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Trocar de Hub</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableHubs?.map((hub) => (
                  <DropdownMenuItem key={hub.id} onClick={() => selectHub(hub.id)}>
                    {hub.nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button variant="ghost" onClick={onToggleCollapse} className="hidden h-9 w-9 p-0 lg:flex items-center justify-center">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            <span className="sr-only">{isCollapsed ? 'Expandir' : 'Recolher'}</span>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigationItems.filter(isVisible).map((item) => (
            <div key={item.name}>{renderLink(item)}</div>
          ))}
        </nav>

        <div className="mt-auto border-t">
          <div className="space-y-1 p-2">
            {isVisible(settingsNav) && <div>{renderLink(settingsNav)}</div>}
          </div>
        </div>
      </div>
    </aside>
  );
} 