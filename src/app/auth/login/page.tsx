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
    <div className="min-h-screen bg-[#030706] text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Left Editorial Brand & Value Showcase Panel */}
      <div className="lg:w-1/2 bg-[#060D0C] border-r border-white/[0.07] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <span className="font-heading font-bold text-amber-400 text-base tracking-wider">IP</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm tracking-tight text-slate-100 uppercase">
                Indian Pixel OS
              </h1>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                Agency Studio Infrastructure
              </span>
            </div>
          </div>
        </div>

        {/* Editorial Value Pitch */}
        <div className="relative z-10 my-12 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Cryptographic Milestone Gates & GST Settlement</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-slate-100 tracking-tight leading-tight">
            The Operating System for Premier Digital Studios.
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            Unify client contracts, GST milestone gating, deliverable versioning, Razorpay settlement, and forensic audit logs into a single authoritative workspace.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06]">
            <div>
              <div className="text-lg font-bold font-mono text-amber-400 tracking-tight tabular-nums">100%</div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">Automated Gate Verification</div>
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-emerald-400 tracking-tight tabular-nums">GST Ready</div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">CGST / SGST / IGST Calculation</div>
            </div>
          </div>
        </div>

        {/* Footer Proof / Quote */}
        <div className="relative z-10 pt-6 border-t border-white/[0.06] text-xs text-slate-500 font-mono">
          <span>Enterprise Security • RBAC Policy Enforced</span>
        </div>
      </div>

      {/* Right Authenticated Form Card Container */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-left">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Enter your verified credentials to access studio operations.
            </p>
          </div>

          <div className="bg-[#060D0C] p-6 sm:p-7 border border-white/[0.08] rounded-xl shadow-elevation-3">
            <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-slate-500">Loading authentication...</div>}>
              <LoginForm />
            </Suspense>

            <div className="mt-6 pt-4 border-t border-white/[0.06] text-center space-y-2">
              <p className="text-[11px] text-slate-400 font-mono">
                Demo Admin: <code className="text-amber-400 font-semibold">krishna@indianpixel.com</code>
              </p>
              <div className="text-xs text-slate-400">
                <span>New Agency Studio? </span>
                <Link href="/auth/signup" className="text-amber-400 font-semibold hover:underline">
                  Initialize Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

