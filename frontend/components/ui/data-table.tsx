import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  pagination?: {
    pageSize: number;
    currentPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchable = true,
  filterable = true,
  selectable = true,
  pagination,
  onSort,
  sortColumn,
  sortDirection,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedRows, setSelectedRows] = React.useState<Set<string | number>>(new Set());
  const [showFilters, setShowFilters] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      columns.some(column =>
        String(column.accessor(item))
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, columns]);

  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(item => item.id || '')));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    const direction = sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, direction);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        <div className="flex gap-2">
          {filterable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          )}
          
          {selectable && selectedRows.size > 0 && (
            <Button variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              {selectedRows.size} selecionado(s)
            </Button>
          )}
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && filterable && (
        <div className="glass-effect rounded-lg p-4 border border-white/20 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select className="w-full p-2 rounded-md border bg-background">
                <option>Todos</option>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select className="w-full p-2 rounded-md border bg-background">
                <option>Todos</option>
                <option>Receita</option>
                <option>Despesa</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <input type="date" className="w-full p-2 rounded-md border bg-background" />
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="glass-effect rounded-lg border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-muted/30">
                {selectable && (
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "p-4 text-left font-medium text-muted-foreground",
                      column.sortable && "cursor-pointer hover:text-foreground",
                      column.width
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortColumn === column.key && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-4 text-left w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={cn(
                    "border-b border-white/5 hover:bg-muted/20 transition-colors",
                    selectedRows.has(item.id || '') && "bg-primary/5"
                  )}
                >
                  {selectable && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(item.id || '')}
                        onChange={() => handleSelectRow(item.id || '')}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="p-4">
                      {column.accessor(item)}
                    </td>
                  ))}
                  <td className="p-4">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagination.currentPage - 1) * pagination.pageSize) + 1} a{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} de{' '}
            {pagination.total} resultados
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === Math.ceil(pagination.total / pagination.pageSize) ||
                  Math.abs(page - pagination.currentPage) <= 1
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 py-1">...</span>
                    )}
                    <Button
                      variant={page === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => pagination.onPageChange(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 