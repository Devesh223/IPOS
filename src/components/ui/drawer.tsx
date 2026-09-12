import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-drawer flex justify-end"
    >
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          "relative z-10 h-full w-full border-l border-white/[0.08] bg-[#060D0C] p-6 text-slate-100 shadow-elevation-4 animate-in slide-in-from-right duration-200 flex flex-col justify-between overflow-y-auto",
          sizeClasses[size]
        )}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-white/[0.06] gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-tight font-heading text-slate-100">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded p-1 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
