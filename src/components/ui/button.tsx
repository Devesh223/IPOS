import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-cta text-black font-semibold hover:bg-brand-cta-hover active:opacity-90 shadow-sm",
        secondary:
          "border border-white/15 bg-white/5 text-brand-light hover:bg-white/10 hover:border-white/25 active:bg-white/15",
        ghost:
          "text-brand-counter hover:text-brand-light hover:bg-white/5 active:bg-white/10",
        destructive:
          "bg-status-danger text-white hover:bg-red-600 active:opacity-90 shadow-sm",
        glass:
          "bg-brand-dark/80 backdrop-blur-md border border-white/10 text-brand-light hover:border-brand-cta/50 hover:bg-brand-dark",
      },
      size: {
        sm: "h-7 px-3 text-xs rounded-sm gap-1.5 min-w-[24px]",
        md: "h-9 px-4 text-sm rounded-md gap-2 min-w-[36px]",
        lg: "h-11 px-6 text-base rounded-md gap-2.5 min-w-[44px]",
        icon: "h-9 w-9 p-0 rounded-md",
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
            <Loader2 className="h-4 w-4 animate-spin text-current" />
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
