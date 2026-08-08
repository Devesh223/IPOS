"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function SentDetails() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="space-y-1.5">
      <h2 className="text-xl font-bold font-heading text-brand-light">
        Recovery Link Dispatched
      </h2>
      <p className="text-brand-counter leading-relaxed">
        If an account matches <strong>{email}</strong>, a cryptographically signed reset token has been sent to your inbox.
      </p>
    </div>
  );
}

export default function ForgotPasswordSentPage() {
  return (
    <div className="min-h-screen bg-brand-main-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-brand-dark/95 py-8 px-6 shadow-elevation-3 border border-white/10 rounded-xl sm:px-10 backdrop-blur-md space-y-6 text-center text-xs">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>

          <Suspense fallback={<div className="h-12 flex items-center justify-center text-xs text-brand-counter">Verifying dispatch...</div>}>
            <SentDetails />
          </Suspense>

          <div className="p-3 rounded-md bg-white/5 border border-white/5 text-[11px] text-brand-counter font-mono">
            Check your spam folder if the link does not arrive within 60 seconds.
          </div>

          <div className="pt-2">
            <Link href="/auth/login">
              <Button variant="secondary" size="md" className="w-full text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back to Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
