"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/actions/auth";
import { Mail, ArrowRight, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("email", email);

    try {
      const res = await forgotPasswordAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Could not send recovery link. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <KeyRound className="h-5 w-5 text-amber-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Recover Access Credentials
        </h1>
        <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
          Enter your registered studio email to receive an authorized security reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                Account Email Address
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-10 text-xs font-semibold mt-2"
            >
              <span>Send Recovery Link</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-white/[0.06] text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Return to Studio Sign-in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
