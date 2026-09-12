import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-white/[0.08] bg-[#030706]/40 space-y-3 animate-in fade-in duration-150",
        className
      )}
    >
      {Icon && (
        <div className="h-10 w-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-400 mb-0.5 shadow-inner">
          <Icon className="h-4.5 w-4.5 text-amber-400/90" />
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-xs font-semibold text-slate-200 tracking-tight font-heading">
          {title}
        </h3>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-1.5">
          <Button
            size="sm"
            variant="primary"
            onClick={onAction}
            className="text-xs"
          >
            {actionLabel}
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}

