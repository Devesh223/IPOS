"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function SentDetails() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold font-heading text-slate-100">
        Recovery Instructions Dispatched
      </h2>
      <p className="text-slate-400 text-xs leading-relaxed">
        If an account matches <strong className="text-slate-200">{email}</strong>, a cryptographically signed reset token has been dispatched to your inbox.
      </p>
    </div>
  );
}

export default function ForgotPasswordSentPage() {
  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-5 text-center">
          <div className="mx-auto h-11 w-11 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center">
            <MailCheck className="h-5 w-5 text-emerald-400" />
          </div>

          <Suspense fallback={<div className="h-12 flex items-center justify-center text-xs text-slate-500">Verifying dispatch...</div>}>
            <SentDetails />
          </Suspense>

          <div className="p-3 rounded-md bg-[#030706] border border-white/[0.04] text-[11px] text-slate-400 font-mono">
            Check your spam folder if the link does not arrive within 60 seconds.
          </div>

          <div className="pt-2">
            <Link href="/auth/login">
              <Button variant="secondary" size="md" className="w-full text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Return to Studio Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
