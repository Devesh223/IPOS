"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/actions/auth";
import { Mail, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-brand-main-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="glow-ambient" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <h2 className="text-2xl font-bold font-heading text-brand-light tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-brand-counter font-sans">
          Enter your registered work email to receive an authorized security reset link.
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
                Account Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3.5 py-2.5 text-brand-light placeholder:text-brand-counter/40 focus:outline-none focus:ring-1 focus:ring-brand-cta text-xs"
                />
                <Mail className="h-4 w-4 text-brand-counter/60 absolute right-3 top-3 pointer-events-none" />
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

          <div className="pt-4 border-t border-white/10 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-brand-counter hover:text-brand-light font-mono"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Return to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
