import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, Clock, CircleDot, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium tracking-wide uppercase transition-colors select-none",
  {
    variants: {
      variant: {
        success: "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30",
        warning: "bg-amber-950/80 text-amber-300 border border-amber-500/30",
        danger: "bg-red-950/80 text-red-300 border border-red-500/30",
        info: "bg-sky-950/80 text-sky-300 border border-sky-500/30",
        neutral: "bg-white/5 text-brand-counter border border-white/10",
        primary: "bg-amber-500/20 text-brand-cta border border-brand-cta/30",
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
      {showIcon && <IconComponent className="h-3 w-3 flex-shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

export { badgeVariants };
