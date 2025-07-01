import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="w-4 h-4 text-muted-foreground" />,
  showHome = true,
  className,
}) => {
  const allItems = showHome 
    ? [{ id: "home", label: "Início", icon: <Home className="w-4 h-4" />, href: "/" }, ...items]
    : items;

  return (
    <nav className={cn("flex items-center space-x-1", className)} aria-label="Breadcrumb">
      {allItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <div className="flex items-center">
            {index > 0 && (
              <span className="mx-2 animate-fade-in">
                {separator}
              </span>
            )}
            
            <div className="flex items-center gap-2">
              {item.icon && (
                <span className="flex-shrink-0">{item.icon}</span>
              )}
              
              {index === allItems.length - 1 ? (
                // Current page
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                // Clickable link
                <button
                  onClick={item.onClick}
                  className={cn(
                    "text-sm text-muted-foreground hover:text-foreground transition-colors duration-200",
                    "hover:bg-white/5 px-2 py-1 rounded-md",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20"
                  )}
                >
                  {item.label}
                </button>
              )}
            </div>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}; 