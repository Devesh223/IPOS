import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-drawer flex justify-end overflow-hidden"
        >
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 h-full w-full border-l border-white/[0.08] bg-[#060D0C] p-6 text-slate-100 shadow-elevation-4 flex flex-col justify-between overflow-y-auto",
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
                  className="rounded-md p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
