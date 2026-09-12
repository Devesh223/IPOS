import * as React from "react";
import { getInitials, cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  isSuspended?: boolean;
}

export function Avatar({
  name,
  avatarUrl,
  size = "md",
  isSuspended = false,
  className,
  ...props
}: AvatarProps) {
  const sizeClasses = {
    xs: "h-4 w-4 text-[9px]",
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs font-semibold",
    lg: "h-12 w-12 text-sm font-semibold",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 overflow-hidden select-none flex-shrink-0",
        sizeClasses[size],
        isSuspended && "opacity-40 grayscale",
        className
      )}
      title={name + (isSuspended ? " (Suspended)" : "")}
      {...props}
    >
      {avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
