"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/actions/auth";
import { Lock, Mail, User, Building2, ArrowRight, AlertCircle } from "lucide-react";
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
      setErrorMessage("Signup failed due to network or server error. Please retry.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-main-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-br from-brand-cta to-amber-700 flex items-center justify-center shadow-amber-glow">
          <span className="font-heading font-bold text-black text-xl tracking-wider">IP</span>
        </div>
        <h2 className="text-2xl font-bold font-heading text-brand-light tracking-tight">
          Initialize Agency Workspace
        </h2>
        <p className="text-xs text-brand-counter font-sans">
          Deploy your studio’s single source of truth for projects, team scoping, and gated approvals.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-brand-dark/95 py-8 px-6 shadow-elevation-3 border border-white/10 rounded-xl sm:px-10 backdrop-blur-md space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-md bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-status-danger flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="font-semibold text-brand-light block mb-1">
                Your Full Name (Studio Founder)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Krishna Mishra"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
                />
                <User className="h-4 w-4 text-brand-counter/60 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-brand-light block mb-1">
                Agency Studio Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Indian Pixel Studio"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
                />
                <Building2 className="h-4 w-4 text-brand-counter/60 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-brand-light block mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="krishna@indianpixel.com"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
                />
                <Mail className="h-4 w-4 text-brand-counter/60 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-brand-light block mb-1">
                Master Security Password (Min 8 Characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
                />
                <Lock className="h-4 w-4 text-brand-counter/60 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-10 text-xs font-semibold mt-2"
            >
              <span>Create Studio & Begin Onboarding</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-brand-counter">
            <span>Already have an active account? </span>
            <Link href="/auth/login" className="text-brand-cta font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
