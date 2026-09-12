"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("token", token);
    formData.set("email", email);
    formData.set("password", password);

    try {
      const res = await resetPasswordAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("An unexpected error occurred while resetting your password.");
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center space-y-4 text-xs">
        <div className="p-3.5 rounded-md bg-red-950/60 border border-red-800/40 text-red-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>Invalid or expired password reset link. Please request a new security link.</span>
        </div>
        <Link href="/auth/forgot-password" className="text-xs text-amber-400 font-mono hover:underline inline-block">
          Request Password Reset
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
      {errorMessage && (
        <div className="p-3.5 rounded-md bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="font-semibold text-slate-200 block mb-1">Account Email</label>
        <input
          type="email"
          disabled
          value={email}
          className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-slate-400 text-xs cursor-not-allowed font-mono"
        />
      </div>

      <div>
        <label className="font-semibold text-slate-200 block mb-1">New Security Password (Min 8 Chars)</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-500 hover:text-slate-300 absolute right-3 top-3"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="font-semibold text-slate-200 block mb-1">Confirm New Password</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        className="w-full h-10 text-xs font-semibold mt-2"
      >
        <span>Update Password & Re-authenticate</span>
        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <KeyRound className="h-5 w-5 text-amber-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Reset Account Password
        </h1>
        <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
          Enter your new password below to secure your Indian Pixel Studio credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-6">
          <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-slate-500">Loading reset link...</div>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="pt-4 border-t border-white/[0.06] text-center">
            <Link href="/auth/login" className="text-xs text-slate-400 hover:text-slate-200 font-mono">
              Return to Studio Sign-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
