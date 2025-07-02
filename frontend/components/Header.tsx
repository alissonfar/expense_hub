"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useHubContext } from '@/lib/stores/auth-store';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserNav } from '@/components/ui/user-nav';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';

interface HeaderProps {
  onMenuClick: () => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { hubNome } = useHubContext();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathParts = pathname.split('/').filter(part => part);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (hubNome) {
      breadcrumbs.push({ id: 'hub', label: hubNome });
    }

    if (pathParts.length > 1) {
      const page = pathParts[1];
      breadcrumbs.push({ id: page, label: capitalize(page) });
    }
    
    return breadcrumbs;
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      
      <Breadcrumb items={generateBreadcrumbs()} showHome={false} className="hidden md:flex" />
      
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
        <span className="sr-only">Notificações</span>
      </Button>

      <UserNav />
    </header>
  );
} 