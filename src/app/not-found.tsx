import React from "react";
import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-main-dark flex flex-col items-center justify-center p-6 text-center text-xs font-sans relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="max-w-md w-full p-8 rounded-xl bg-brand-dark/95 border border-white/10 shadow-elevation-3 backdrop-blur-md space-y-6 z-10">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-cta/20 border border-brand-cta/30 flex items-center justify-center">
          <Compass className="h-6 w-6 text-brand-cta" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading text-brand-light">
            404 — Page Not Found
          </h2>
          <p className="text-brand-counter text-xs">
            The studio resource or route you requested could not be located in this workspace.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" size="md" className="w-full">
              <Home className="h-4 w-4 mr-1.5" />
              <span>Return to Operations Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
