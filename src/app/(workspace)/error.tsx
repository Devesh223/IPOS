"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WORKSPACE_ERROR_BOUNDARY]", error.message);
  }, [error]);

  return (
    <div className="p-8 rounded-xl border border-status-danger/30 bg-red-950/20 text-center space-y-4 max-w-lg mx-auto my-12">
      <div className="mx-auto h-10 w-10 rounded-full bg-red-950/60 border border-status-danger/40 flex items-center justify-center">
        <AlertTriangle className="h-5 w-5 text-status-danger" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold font-heading text-brand-light">
          Workspace View Error
        </h3>
        <p className="text-xs text-brand-counter">
          Unable to render this operations view. Your workspace data remains safe and consistent.
        </p>
      </div>

      <div className="p-2.5 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-brand-counter/80 text-left">
        {error.message || "An unexpected error occurred."}
      </div>

      <Button variant="secondary" size="sm" onClick={() => reset()} className="text-xs">
        <RefreshCw className="h-3.5 w-3.5 mr-1" />
        <span>Reload View</span>
      </Button>
    </div>
  );
}
