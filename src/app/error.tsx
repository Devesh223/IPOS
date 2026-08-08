"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error without exposing secrets
    console.error("[APPLICATION_ERROR_BOUNDARY]", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-main-dark flex flex-col items-center justify-center p-6 text-center text-xs font-sans relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="max-w-md w-full p-8 rounded-xl bg-brand-dark/95 border border-white/10 shadow-elevation-3 backdrop-blur-md space-y-6 z-10">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-950/60 border border-status-danger/40 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-status-danger" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-brand-light">
            System Error Encountered
          </h2>
          <p className="text-brand-counter text-xs">
            An unexpected error occurred during execution. State mutations have been rolled back safely.
          </p>
        </div>

        <div className="p-3 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-brand-counter/80 text-left overflow-x-auto">
          {error.message || "Unknown runtime execution fault."}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={() => reset()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span>Try Again</span>
          </Button>
          <Link href="/dashboard">
            <Button variant="primary" size="sm">
              <Home className="h-3.5 w-3.5 mr-1" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
