"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("krishna@indianpixel.com");
  const [password, setPassword] = useState("StudioLeader2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    try {
      const res = await loginAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred. Please retry.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
      {errorMessage && (
        <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="font-semibold text-slate-200 block mb-1">
          Work Email Address
        </label>
        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@agency.com"
            className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
          />
          <Mail className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-semibold text-slate-200 block">Password</label>
          <Link
            href="/auth/forgot-password"
            className="text-[11px] text-amber-400 hover:underline font-mono"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
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

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        className="w-full h-10 text-xs font-semibold mt-2"
      >
        <span>Authenticate & Enter Studio</span>
        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <span className="font-heading font-bold text-amber-400 text-lg tracking-wider">IP</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Indian Pixel Operating System
        </h2>
        <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
          Single source of truth for digital agency project delivery, gated approvals, and financial settlement.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-6">
          <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-slate-500">Loading authentication...</div>}>
            <LoginForm />
          </Suspense>

          <div className="pt-4 border-t border-white/[0.06] text-center space-y-2">
            <p className="text-[11px] text-slate-400 font-mono">
              Demo Founder: <code className="text-amber-400 font-semibold">krishna@indianpixel.com</code>
            </p>
            <div className="text-xs text-slate-400">
              <span>New Agency Studio? </span>
              <Link href="/auth/signup" className="text-amber-400 font-semibold hover:underline">
                Create Workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

