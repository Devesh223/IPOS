"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmailAction } from "@/actions/auth";
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

function EmailVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [isVerifying, setIsVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && email) {
      verifyEmailAction(token, email).then((res) => {
        setIsVerifying(false);
        if (res.success && res.redirectTo) {
          setSuccess(true);
          setTimeout(() => {
            router.push(res.redirectTo!);
          }, 2000);
        } else {
          setError(res.error || "Verification failed.");
        }
      });
    } else {
      setIsVerifying(false);
    }
  }, [token, email, router]);

  if (isVerifying) {
    return (
      <div className="py-8 text-center space-y-3 text-xs text-slate-400">
        <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full mx-auto" />
        <p>Verifying your studio email identity...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-100">Email Successfully Verified!</h3>
        <p className="text-xs text-slate-400">Redirecting you to the studio authentication gateway...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-md bg-red-950/60 border border-red-800/40 text-red-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <div className="text-center">
          <Link href="/auth/login" className="text-xs text-amber-400 font-mono hover:underline">
            Return to Studio Sign-in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-2 text-xs">
      <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
        <Mail className="h-6 w-6 text-amber-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">Verify Your Email Address</h3>
      <p className="text-xs text-slate-400">
        A verification link has been sent to <strong className="text-slate-200">{email || "your email address"}</strong>. Please click the link in your inbox to confirm your account.
      </p>
      <div className="pt-2">
        <Link href="/auth/login" className="text-xs text-amber-400 font-mono hover:underline">
          Return to Studio Sign-in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Email Verification
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-6">
          <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-slate-500">Loading verification...</div>}>
            <EmailVerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
