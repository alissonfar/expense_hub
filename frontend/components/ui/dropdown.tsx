import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
  children?: DropdownItem[];
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "start",
  side = "bottom",
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    if (item.children && item.children.length > 0) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      item.onClick?.();
      setIsOpen(false);
      setActiveSubmenu(null);
    }
  };

  const renderItem = (item: DropdownItem, level = 0) => {
    if (item.separator) {
      return (
        <div key={item.id} className="h-px bg-white/10 my-1" />
      );
    }

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200",
            "hover:bg-white/10 focus:bg-white/10 focus:outline-none",
            item.disabled && "opacity-50 cursor-not-allowed",
            level > 0 && "pl-8",
            activeSubmenu === item.id && "bg-white/10"
          )}
          onMouseEnter={() => {
            if (item.children && item.children.length > 0) {
              setActiveSubmenu(item.id);
            }
          }}
        >
          {item.icon && (
            <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
          )}
          <span className="flex-1 text-left">{item.label}</span>
          {item.children && item.children.length > 0 && (
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              activeSubmenu === item.id && "rotate-180"
            )} />
          )}
        </button>
        
        {item.children && item.children.length > 0 && activeSubmenu === item.id && (
          <div className={cn(
            "absolute z-50 min-w-48 glass-effect rounded-lg border border-white/20 shadow-xl backdrop-blur-md animate-fade-in",
            side === "bottom" && "top-0 left-full ml-1",
            side === "top" && "bottom-0 left-full ml-1",
            side === "left" && "top-0 right-full mr-1",
            side === "right" && "top-0 left-full ml-1"
          )}>
            <div className="p-2">
              {item.children.map(child => renderItem(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={cn(
          "absolute z-50 min-w-48 glass-effect rounded-lg border border-white/20 shadow-xl backdrop-blur-md animate-fade-in",
          side === "bottom" && "top-full mt-1",
          side === "top" && "bottom-full mb-1",
          side === "left" && "right-full mr-1",
          side === "right" && "left-full ml-1",
          align === "start" && "left-0",
          align === "center" && "left-1/2 transform -translate-x-1/2",
          align === "end" && "right-0"
        )}>
          <div className="p-2">
            {items.map(item => renderItem(item))}
          </div>
        </div>
      )}
    </div>
  );
}; 