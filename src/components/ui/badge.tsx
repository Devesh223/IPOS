import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Clock, CircleDot, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider transition-colors select-none",
  {
    variants: {
      variant: {
        success: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-950/40 text-amber-300 border border-amber-500/20",
        danger: "bg-rose-950/40 text-rose-300 border border-rose-500/20",
        info: "bg-sky-950/40 text-sky-300 border border-sky-500/20",
        neutral: "bg-white/[0.03] text-slate-400 border border-white/[0.07]",
        primary: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export type StatusType =
  | "APPROVED"
  | "COMPLETED"
  | "PAID"
  | "RECONCILED"
  | "ACTIVE"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "SUBMITTED"
  | "SUBMITTED_FOR_APPROVAL"
  | "SUBMITTED_FOR_VERIFICATION"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "OVERDUE"
  | "BLOCKED"
  | "VOID"
  | "DISPUTED"
  | "DRAFT"
  | "PENDING"
  | "NOT_STARTED"
  | "CANCELLED"
  | "ARCHIVED"
  | "SUPERSEDED"
  | "ON_HOLD";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true, className, ...props }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  let variant: "success" | "warning" | "danger" | "info" | "neutral" = "neutral";
  let IconComponent = CircleDot;
  let label = status;

  if (["APPROVED", "COMPLETED", "PAID", "RECONCILED"].includes(norm)) {
    variant = "success";
    IconComponent = CheckCircle2;
    label = norm.replace("_", " ");
  } else if (["SUBMITTED_FOR_APPROVAL", "SUBMITTED_FOR_VERIFICATION", "CHANGES_REQUESTED", "ON_HOLD"].includes(norm)) {
    variant = "warning";
    IconComponent = AlertTriangle;
    label = norm.replace(/_/g, " ");
  } else if (["REJECTED", "OVERDUE", "BLOCKED", "VOID", "DISPUTED"].includes(norm)) {
    variant = "danger";
    IconComponent = XCircle;
    label = norm.replace("_", " ");
  } else if (["ACTIVE", "IN_PROGRESS", "UNDER_REVIEW", "SUBMITTED"].includes(norm)) {
    variant = "info";
    IconComponent = Clock;
    label = norm.replace("_", " ");
  } else {
    variant = "neutral";
    IconComponent = norm === "CANCELLED" || norm === "ARCHIVED" || norm === "SUPERSEDED" ? MinusCircle : CircleDot;
    label = norm.replace("_", " ");
  }

  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {showIcon && <IconComponent className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

export { badgeVariants };

