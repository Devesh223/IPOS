import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer tracking-tight",
  {
    variants: {
      variant: {
        primary:
          "bg-amber-400 text-black font-semibold hover:bg-amber-300 active:scale-[0.98] shadow-xs",
        secondary:
          "border border-white/[0.10] bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:border-white/[0.18] active:bg-white/[0.10]",
        ghost:
          "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] active:bg-white/[0.08]",
        destructive:
          "border border-red-900/40 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-red-100 active:scale-[0.98]",
        outline:
          "border border-white/[0.12] text-slate-200 hover:bg-white/[0.04] hover:border-white/[0.20]",
        glass:
          "bg-[#060D0C]/90 backdrop-blur-md border border-white/[0.08] text-slate-200 hover:border-amber-500/30 hover:bg-[#081310]",
      },
      size: {
        sm: "h-7 px-2.5 text-xs rounded gap-1.5 min-w-[24px]",
        md: "h-8.5 px-3.5 text-xs rounded-md gap-2 min-w-[32px]",
        lg: "h-10 px-5 text-sm rounded-md gap-2 min-w-[40px]",
        icon: "h-8 w-8 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-current mr-1.5" />
            <span className="opacity-80">Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

