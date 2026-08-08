import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-md border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-brand-dark border-white/10 text-brand-light",
        danger:
          "border-status-danger/40 bg-red-950/40 text-red-200 [&>svg]:text-status-danger",
        warning:
          "border-brand-cta/40 bg-amber-950/40 text-amber-200 [&>svg]:text-brand-cta",
        success:
          "border-status-success/40 bg-emerald-950/40 text-emerald-200 [&>svg]:text-status-success",
        info: "border-status-info/40 bg-sky-950/40 text-sky-200 [&>svg]:text-status-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      recoveryActionLabel?: string;
      onRecoveryAction?: () => void;
      ruleId?: string;
    }
>(({ className, variant, recoveryActionLabel, onRecoveryAction, ruleId, children, ...props }, ref) => {
  let Icon = Info;
  if (variant === "danger") Icon = AlertCircle;
  if (variant === "warning") Icon = AlertTriangle;
  if (variant === "success") Icon = CheckCircle2;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          {ruleId && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-medium tracking-wide uppercase mr-2 text-brand-cta">
              Rule {ruleId}
            </span>
          )}
          {children}
        </div>
        {recoveryActionLabel && onRecoveryAction && (
          <button
            type="button"
            onClick={onRecoveryAction}
            className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4 text-brand-cta hover:text-brand-cta-hover self-start sm:self-auto flex-shrink-0"
          >
            <span>{recoveryActionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight font-heading text-brand-light", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-brand-light/90 [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
