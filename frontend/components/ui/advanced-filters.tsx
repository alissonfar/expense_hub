import React from "react";
import { Button } from "@/components/ui/button";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface AdvancedFiltersProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  categories?: Option[];
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
  statusOptions?: Option[];
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  valueMin?: string;
  valueMax?: string;
  onValueMinChange?: (v: string) => void;
  onValueMaxChange?: (v: string) => void;
  onClear?: () => void;
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  categories = [],
  selectedCategory,
  onCategoryChange,
  statusOptions = [],
  selectedStatus,
  onStatusChange,
  valueMin,
  valueMax,
  onValueMinChange,
  onValueMaxChange,
  onClear,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap gap-3 items-end bg-white/60 dark:bg-gray-900/60 p-4 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 ${className}`}>
      <div>
        <span className="block text-xs font-semibold mb-1">Período</span>
        <DateRangePicker value={dateRange!} onChange={onDateRangeChange!} months={1} />
      </div>
      <div>
        <span className="block text-xs font-semibold mb-1">Categoria</span>
        <Dropdown
          trigger={<Button variant="outline">{selectedCategory ? categories.find(c => c.value === selectedCategory)?.label : "Todas"}</Button>}
          items={categories.map(c => ({ id: c.value, label: c.label, onClick: () => onCategoryChange?.(c.value) }))}
        />
      </div>
      <div>
        <span className="block text-xs font-semibold mb-1">Status</span>
        <Dropdown
          trigger={<Button variant="outline">{selectedStatus ? statusOptions.find(s => s.value === selectedStatus)?.label : "Todos"}</Button>}
          items={statusOptions.map(s => ({ id: s.value, label: s.label, onClick: () => onStatusChange?.(s.value) }))}
        />
      </div>
      <div className="flex gap-2 items-end">
        <div>
          <span className="block text-xs font-semibold mb-1">Valor Mín.</span>
          <Input type="number" value={valueMin} onChange={e => onValueMinChange?.(e.target.value)} placeholder="0,00" className="w-24" />
        </div>
        <div>
          <span className="block text-xs font-semibold mb-1">Valor Máx.</span>
          <Input type="number" value={valueMax} onChange={e => onValueMaxChange?.(e.target.value)} placeholder="0,00" className="w-24" />
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClear} className="ml-2"><X className="w-4 h-4" /></Button>
    </div>
  );
}; 