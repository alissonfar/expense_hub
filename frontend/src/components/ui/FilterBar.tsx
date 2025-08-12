import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search } from 'lucide-react';

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  rightActions?: React.ReactNode;
  showAdvancedToggle?: boolean;
  advancedOpen?: boolean;
  onToggleAdvanced?: () => void;
  children?: React.ReactNode; // conteúdo dos filtros avançados
}

export default function FilterBar({
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  rightActions,
  showAdvancedToggle = false,
  advancedOpen = false,
  onToggleAdvanced,
  children,
}: FilterBarProps) {
  return (
    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-12 pr-4 py-3 border-0 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all duration-200"
              />
            </div>
            {showAdvancedToggle && (
              <Button variant="outline" className={`gap-2 px-4 py-3 rounded-xl border-gray-200 ${advancedOpen ? 'bg-gray-50' : ''}`} onClick={onToggleAdvanced}>
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        </div>
      </CardHeader>
      {advancedOpen && (
        <CardContent className="border-t">
          {children}
        </CardContent>
      )}
    </Card>
  );
} 