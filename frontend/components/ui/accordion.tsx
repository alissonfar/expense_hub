import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Minus } from "lucide-react";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  type?: "single" | "multiple";
  defaultOpen?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  type = "single",
  defaultOpen = [],
  className,
}) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set(defaultOpen));

  const handleToggle = (itemId: string) => {
    if (type === "single") {
      setOpenItems(openItems.has(itemId) ? new Set() : new Set([itemId]));
    } else {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(itemId)) {
        newOpenItems.delete(itemId);
      } else {
        newOpenItems.add(itemId);
      }
      setOpenItems(newOpenItems);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "glass-effect rounded-lg border border-white/20 overflow-hidden transition-all duration-300",
            openItems.has(item.id) && "shadow-lg"
          )}
        >
          <button
            onClick={() => !item.disabled && handleToggle(item.id)}
            disabled={item.disabled}
            className={cn(
              "w-full flex items-center justify-between p-4 text-left transition-all duration-200",
              "hover:bg-white/5 focus:bg-white/5 focus:outline-none",
              item.disabled && "opacity-50 cursor-not-allowed",
              openItems.has(item.id) && "bg-white/10"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
              )}
              <span className="font-medium text-foreground">{item.title}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {openItems.has(item.id) ? (
                <Minus className="w-5 h-5 text-primary transition-transform duration-200" />
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
              )}
            </div>
          </button>
          
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              openItems.has(item.id) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="p-4 pt-0 border-t border-white/10">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 