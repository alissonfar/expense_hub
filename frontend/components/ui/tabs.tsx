import * as React from "react";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "default" | "card";
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
}) => {
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className={cn(
        "flex gap-1 mb-6",
        variant === "card" && "bg-muted/30 rounded-lg p-1 glass-effect"
      )}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all relative",
              variant === "default" && "hover:text-primary",
              variant === "card" && "flex-1",
              activeTab === tab.id
                ? variant === "default"
                  ? "text-primary border-b-2 border-primary"
                  : "bg-white text-primary shadow-sm"
                : variant === "card"
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {variant === "default" && activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/50 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative">
        <div
          className="transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${activeTabIndex * 100}%)`,
          }}
        >
          <div className="flex">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="w-full flex-shrink-0 animate-fade-in"
              >
                {tab.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 