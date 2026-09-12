"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/actions/auth";
import { Lock, Mail, User, Building2, ArrowRight, AlertCircle, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("workspaceName", workspaceName);
    formData.set("password", password);

    try {
      const res = await signupAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Registration failed due to network or server error. Please retry.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <span className="font-heading font-bold text-amber-400 text-lg tracking-wider">IP</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Studio Founder Setup
        </h1>
        <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
          Initialize your studio workspace. Team members and clients should use their invitation email links.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                Founder Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Krishna Mishra"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                />
                <User className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                Agency Studio Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Indian Pixel Studio"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                />
                <Building2 className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

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
                  placeholder="krishna@indianpixel.com"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs font-mono"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">
                Master Password (Min. 8 Characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-10 text-xs font-semibold mt-2"
            >
              <span>Initialize Studio Workspace</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-slate-400">
            <span>Already have an active account? </span>
            <Link href="/auth/login" className="text-amber-400 font-semibold hover:underline font-mono">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
