import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1.5 text-xs", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-3 w-3 text-brand-counter/40 flex-shrink-0" />}
            {isLast || !item.href ? (
              <span
                aria-current={isLast ? "page" : undefined}
                className="font-medium text-brand-light truncate max-w-[200px]"
              >
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-brand-counter hover:text-brand-cta transition-colors truncate max-w-[160px]"
              >
                {item.label}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
