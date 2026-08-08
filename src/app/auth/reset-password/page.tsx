"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
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
      <div className="text-center space-y-4">
        <div className="p-3.5 rounded-md bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-status-danger flex-shrink-0 mt-0.5" />
          <span>Invalid password reset link. Please request a new link.</span>
        </div>
        <Link href="/auth/forgot-password" className="text-xs text-brand-cta font-mono hover:underline inline-block">
          Request Password Reset
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
      {errorMessage && (
        <div className="p-3.5 rounded-md bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-status-danger flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="font-semibold text-brand-light block mb-1">Account Email</label>
        <input
          type="email"
          disabled
          value={email}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-brand-counter text-xs cursor-not-allowed"
        />
      </div>

      <div>
        <label className="font-semibold text-brand-light block mb-1">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-brand-counter/60 hover:text-brand-light absolute right-3 top-3"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="font-semibold text-brand-light block mb-1">Confirm New Password</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
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
    <div className="min-h-screen bg-brand-main-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-br from-brand-cta to-amber-700 flex items-center justify-center shadow-amber-glow">
          <Lock className="h-6 w-6 text-black" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-brand-light tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-brand-counter font-sans">
          Enter your new password below to secure your Indian Pixel Studio account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-brand-dark/95 py-8 px-6 shadow-elevation-3 border border-white/10 rounded-xl sm:px-10 backdrop-blur-md space-y-6">
          <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-brand-counter">Loading reset link...</div>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="pt-4 border-t border-white/10 text-center">
            <Link href="/auth/login" className="text-xs text-brand-cta font-mono hover:underline">
              Return to Studio Sign-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
