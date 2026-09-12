import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/[0.04]", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-3", className)}>
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function TableSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2 rounded-lg border border-white/[0.07] bg-[#060D0C] p-4", className)}>
      <div className="flex justify-between pb-2 border-b border-white/[0.04]">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.02]">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, CardSkeleton, TableSkeleton };


