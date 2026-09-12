import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-md border p-3.5 text-xs [&>svg~*]:pl-6 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-[#060D0C] border-white/[0.08] text-slate-200",
        danger:
          "border-rose-800/40 bg-rose-950/30 text-rose-200 [&>svg]:text-rose-400",
        warning:
          "border-amber-800/40 bg-amber-950/30 text-amber-200 [&>svg]:text-amber-400",
        success:
          "border-emerald-800/40 bg-emerald-950/30 text-emerald-200 [&>svg]:text-emerald-400",
        info: "border-sky-800/40 bg-sky-950/30 text-sky-200 [&>svg]:text-sky-400",
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
        <div className="space-y-0.5">
          {ruleId && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono font-medium tracking-wide uppercase mr-2 text-amber-400">
              Rule {ruleId}
            </span>
          )}
          {children}
        </div>
        {recoveryActionLabel && onRecoveryAction && (
          <button
            type="button"
            onClick={onRecoveryAction}
            className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4 text-amber-400 hover:text-amber-300 self-start sm:self-auto flex-shrink-0 cursor-pointer"
          >
            <span>{recoveryActionLabel}</span>
            <ArrowRight className="h-3 w-3" />
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
    className={cn("font-medium leading-tight tracking-tight font-heading text-slate-100", className)}
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
    className={cn("text-xs text-slate-300 [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };

