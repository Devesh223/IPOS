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
      <div className="py-8 text-center space-y-3 text-xs text-brand-counter">
        <div className="animate-spin h-6 w-6 border-2 border-brand-cta border-t-transparent rounded-full mx-auto" />
        <p>Verifying your studio email identity...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-brand-light">Email Successfully Verified!</h3>
        <p className="text-xs text-brand-counter">Redirecting you to the studio authentication gateway...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3.5 rounded-md bg-red-950/60 border border-status-danger/40 text-red-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-status-danger flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <div className="text-center">
          <Link href="/auth/login" className="text-xs text-brand-cta font-mono hover:underline">
            Return to Studio Sign-in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-2 text-xs">
      <div className="mx-auto h-12 w-12 rounded-full bg-brand-cta/20 border border-brand-cta/30 flex items-center justify-center">
        <Mail className="h-6 w-6 text-brand-cta" />
      </div>
      <h3 className="text-base font-semibold text-brand-light">Verify Your Email Address</h3>
      <p className="text-xs text-brand-counter">
        A verification link has been sent to <strong className="text-brand-light">{email || "your email address"}</strong>. Please click the link in your inbox to confirm your account.
      </p>
      <div className="pt-2">
        <Link href="/auth/login" className="text-xs text-brand-cta font-mono hover:underline">
          Return to Studio Sign-in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-brand-main-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-br from-brand-cta to-amber-700 flex items-center justify-center shadow-amber-glow">
          <ShieldCheck className="h-6 w-6 text-black" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-brand-light tracking-tight">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-brand-dark/95 py-8 px-6 shadow-elevation-3 border border-white/10 rounded-xl sm:px-10 backdrop-blur-md space-y-6">
          <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-brand-counter">Loading verification...</div>}>
            <EmailVerifyContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
