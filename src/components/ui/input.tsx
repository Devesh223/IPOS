import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-white/10 bg-brand-main-dark/70 px-3 py-1 text-sm text-brand-light shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-counter/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-cta focus-visible:border-brand-cta disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-danger focus-visible:ring-status-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-status-danger font-sans">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
