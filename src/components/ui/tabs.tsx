import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center space-x-1 border-b border-white/[0.08] overflow-x-auto scrollbar-none",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-all duration-150 border-b-2 -mb-px whitespace-nowrap cursor-pointer",
              isActive
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20"
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono",
                  isActive
                    ? "bg-amber-500/20 text-amber-300 font-semibold"
                    : "bg-white/[0.06] text-slate-400"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

