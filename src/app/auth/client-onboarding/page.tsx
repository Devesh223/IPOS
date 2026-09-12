"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getClientOnboardingDataAction,
  signClientAgreementAction,
  completeClientOnboardingAction,
} from "@/actions/onboarding";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSignature,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function ClientOnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [clientData, setClientData] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Managing Director / Authorized Signatory");
  const [agreementAgreed, setAgreementAgreed] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) {
      getClientOnboardingDataAction(token).then((res) => {
        setIsLoading(false);
        if (res.success && res.client) {
          setClientData(res.client);
          setCompanyName(res.client.companyName || res.client.name);
          setSignerName(res.client.contact?.name || "");
          if (res.client.onboardingStatus === "AGREEMENT_SIGNED") {
            setStep(3);
          }
        } else {
          setErrorMessage(res.error || "Invalid or expired invitation token.");
        }
      });
    } else {
      setIsLoading(false);
      setErrorMessage("No invitation token provided. Please check your invitation email link.");
    }
  }, [token]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleStep2Sign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementAgreed) {
      setErrorMessage("You must accept and agree to the Master Service Agreement terms.");
      return;
    }
    if (!signerName.trim() || !signerTitle.trim()) {
      setErrorMessage("Signer full name and title are required for execution.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await signClientAgreementAction({
      token,
      signerName,
      signerTitle,
    });

    setIsSubmitting(false);
    if (res.success) {
      setStep(3);
    } else {
      setErrorMessage(res.error || "Failed to sign master agreement.");
    }
  };

  const handleStep3Finalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await completeClientOnboardingAction({
      token,
      password,
      companyName,
    });

    if (res.success && res.redirectTo) {
      router.push(res.redirectTo);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || "Failed to complete onboarding.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center space-y-3 text-xs text-slate-400">
        <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full mx-auto" />
        <p>Verifying invitation token and loading onboarding profile...</p>
      </div>
    );
  }

  if (errorMessage && !clientData) {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
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
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 text-xs font-mono">
        <div className={`flex items-center gap-1.5 ${step === 1 ? "text-amber-400 font-bold" : "text-slate-500"}`}>
          <span className="h-5 w-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
          <span>Company Profile</span>
        </div>
        <span className="text-white/20">→</span>
        <div className={`flex items-center gap-1.5 ${step === 2 ? "text-amber-400 font-bold" : "text-slate-500"}`}>
          <span className="h-5 w-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
          <span>Master Agreement</span>
        </div>
        <span className="text-white/20">→</span>
        <div className={`flex items-center gap-1.5 ${step === 3 ? "text-amber-400 font-bold" : "text-slate-500"}`}>
          <span className="h-5 w-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
          <span>Portal Access</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Company Profile */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="font-semibold text-slate-200 block mb-1">Company / Brand Legal Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Primary Signatory Name</label>
            <input
              type="text"
              disabled
              value={clientData?.contact?.name || ""}
              className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-slate-400 text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Registered Contact Email</label>
            <input
              type="email"
              disabled
              value={clientData?.contact?.email || ""}
              className="w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-slate-400 text-xs cursor-not-allowed font-mono"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full h-10 text-xs font-semibold mt-2">
            <span>Continue to Master Agreement Review</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </form>
      )}

      {/* Step 2: Master Service Agreement Review & E-Signature */}
      {step === 2 && (
        <form onSubmit={handleStep2Sign} className="space-y-4 text-xs font-sans">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FileSignature className="h-4 w-4 text-amber-400" />
              <span>{clientData?.agreement?.title || "Master Service Agreement (MSA)"}</span>
            </h3>
            <div className="h-44 overflow-y-auto p-3.5 rounded-md border border-white/[0.08] bg-[#030706] font-mono text-[11px] text-slate-400 leading-relaxed space-y-2">
              <p className="font-bold text-slate-200">1. ENGAGEMENT & SCOPE COMMITMENT</p>
              <p>
                Indian Pixel Studio will deliver agreed digital design, brand refresh, packaging, and development assets according to milestone specifications.
              </p>
              <p className="font-bold text-slate-200">2. GATED DELIVERY & PAYMENT SCHEDULE</p>
              <p>
                Milestone releases and production die-lines are subject to verification and settlement of milestone-linked invoices pursuant to Rule PAY-2.
              </p>
              <p className="font-bold text-slate-200">3. INTELLECTUAL PROPERTY & JURISDICTION</p>
              <p>
                All final deliverable rights transfer unconditionally to {companyName} upon full settlement of project milestone accounts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-200 block mb-1">Signer Legal Name</label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-200 block mb-1">Designation / Title</label>
              <input
                type="text"
                required
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 text-xs"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-md bg-white/[0.03] border border-white/[0.08] cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreementAgreed}
              onChange={(e) => setAgreementAgreed(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-[#030706] text-amber-500 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-300 leading-normal">
              I certify that I am an authorized corporate officer and legally execute this Master Agreement on behalf of <strong>{companyName}</strong>.
            </span>
          </label>

          <div className="flex gap-2.5 pt-1">
            <Button type="button" variant="secondary" size="md" onClick={() => setStep(1)} className="text-xs">
              Back
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="flex-1 text-xs font-semibold">
              <span>E-Sign & Proceed to Password Setup</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 3: Portal Password Creation */}
      {step === 3 && (
        <form onSubmit={handleStep3Finalize} className="space-y-4 text-xs font-sans">
          <div className="p-3 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Master Agreement Signed & Active in PostgreSQL!</span>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Create Portal Password (Min. 8 Characters)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
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
            <label className="font-semibold text-slate-200 block mb-1">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full h-10 text-xs font-semibold mt-2"
          >
            <span>Activate Account & Enter Client Portal</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ClientOnboardingPage() {
  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-amber-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Client Portal Onboarding
        </h1>
        <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
          Verify corporate profile, review Master Agreement terms, and establish your authenticated client portal access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-[#060D0C] py-8 px-6 shadow-xl border border-white/[0.08] rounded-xl sm:px-10 space-y-6">
          <Suspense fallback={<div className="h-36 flex items-center justify-center text-xs text-slate-500">Loading onboarding profile...</div>}>
            <ClientOnboardingWizard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
