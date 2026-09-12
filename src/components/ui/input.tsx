import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-200"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-none focus-visible:border-amber-500/50 focus-visible:ring-1 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40",
            error && "border-rose-500/60 focus-visible:border-rose-500 focus-visible:ring-rose-500/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-rose-400 font-sans">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 font-sans">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

