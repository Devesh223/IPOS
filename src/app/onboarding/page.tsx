"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/actions/onboarding";
import {
  Building2,
  Shield,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [studioName, setStudioName] = useState("Indian Pixel Design Studio");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [enforcePaymentGate, setEnforcePaymentGate] = useState(true);
  const [enforceAgreementGate, setEnforceAgreementGate] = useState(true);
  const [teamInvites, setTeamInvites] = useState([
    { email: "aarav@indianpixel.com", role: "PROJECT_MANAGER" },
    { email: "rohan@indianpixel.com", role: "DESIGNER" },
  ]);

  const handleAddInvite = () => {
    setTeamInvites([...teamInvites, { email: "", role: "DESIGNER" }]);
  };

  const handleRemoveInvite = (idx: number) => {
    setTeamInvites(teamInvites.filter((_, i) => i !== idx));
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await completeOnboardingAction({
        studioName,
        timezone,
        enforcePaymentGate,
        enforceAgreementGate,
        teamInvites: teamInvites.filter((t) => t.email.trim() !== ""),
      });

      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || "Failed to complete onboarding.");
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("An unexpected error occurred during onboarding finalization.");
    }
  };

  return (
    <div className="min-h-screen bg-[#030706] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2 z-10">
        <div className="mx-auto h-11 w-11 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <span className="font-heading font-bold text-amber-400 text-lg tracking-wider">IP</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
          Studio Launch Setup
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Establish multi-tenancy boundaries, operational governance gates, and core team permissions.
        </p>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center font-mono font-bold transition-all text-xs ${
                  step === s
                    ? "bg-amber-400 text-black ring-2 ring-amber-400/40"
                    : step > s
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/[0.04] text-slate-500 border border-white/[0.08]"
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500/40" : "bg-white/[0.08]"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl z-10">
        <div className="bg-[#060D0C] p-6 sm:p-8 shadow-xl border border-white/[0.08] rounded-xl space-y-6">
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Workspace Identity */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-3">
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Step 1: Workspace Identity & Timezone
                </h2>
                <p className="text-slate-400 mt-0.5 text-xs">
                  Establishes the primary multi-tenancy boundary (Rule G-1) and system timestamp baseline (Rule G-9).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Studio Name</label>
                  <input
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Primary Studio Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST — Standard)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Governance Gate Switches */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-3">
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Step 2: Operational Gate Policies
                </h2>
                <p className="text-slate-400 mt-0.5 text-xs">
                  Automated constraint switches that prevent delivery without settled invoices or signed agreements.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 rounded-md bg-[#030706] border border-white/[0.04] gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">
                      Enforce Overdue Payment Gate (Rule PAY-3)
                    </span>
                    <p className="text-slate-400">
                      Blocks subsequent milestone task creation whenever an overdue invoice is pending reconciliation.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforcePaymentGate}
                    onChange={(e) => setEnforcePaymentGate(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-3 rounded-md bg-[#030706] border border-white/[0.04] gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">
                      Enforce Executed Agreement Gate (Rule AG-3)
                    </span>
                    <p className="text-slate-400">
                      Locks milestone submission until a digital contract or Master Service Agreement has been signed.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceAgreementGate}
                    onChange={(e) => setEnforceAgreementGate(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Core Team */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h2 className="text-sm font-semibold font-heading text-slate-100">
                    Step 3: Core Team Invitations
                  </h2>
                  <p className="text-slate-400 mt-0.5 text-xs">
                    Invite key Project Managers and senior design leads with strictly scoped roles (Rule G-6).
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={handleAddInvite} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1 text-amber-400" />
                  <span>Add Role</span>
                </Button>
              </div>

              <div className="space-y-2.5">
                {teamInvites.map((invite, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="teammate@agency.com"
                      value={invite.email}
                      onChange={(e) => {
                        const updated = [...teamInvites];
                        updated[idx]!.email = e.target.value;
                        setTeamInvites(updated);
                      }}
                      className="flex-1 rounded-md border border-white/[0.10] bg-[#030706] px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono"
                    />
                    <select
                      value={invite.role}
                      onChange={(e) => {
                        const updated = [...teamInvites];
                        updated[idx]!.role = e.target.value;
                        setTeamInvites(updated);
                      }}
                      className="rounded-md border border-white/[0.10] bg-[#030706] px-2.5 py-1.5 text-slate-100 focus:outline-none text-xs font-mono"
                    >
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="DESIGNER">Designer</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="FINANCE">Finance Lead</option>
                    </select>
                    {teamInvites.length > 1 && (
                      <button
                        onClick={() => handleRemoveInvite(idx)}
                        className="p-1.5 rounded text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Final Launch */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-white/[0.08] pb-3">
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Step 4: Review & Deploy Workspace
                </h2>
                <p className="text-slate-400 mt-0.5 text-xs">
                  Confirm your studio parameters. An immutable onboarding event will be logged in PostgreSQL.
                </p>
              </div>

              <div className="space-y-2.5 p-4 rounded-lg bg-[#030706] border border-white/[0.04]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Studio Name:</span>
                  <span className="font-semibold text-slate-100">{studioName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timezone:</span>
                  <span className="font-mono text-slate-200">{timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Gate (Rule PAY-3):</span>
                  <span className={enforcePaymentGate ? "text-emerald-400 font-bold font-mono" : "text-slate-500 font-mono"}>
                    {enforcePaymentGate ? "ENFORCED" : "OFF"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agreement Gate (Rule AG-3):</span>
                  <span className={enforceAgreementGate ? "text-emerald-400 font-bold font-mono" : "text-slate-500 font-mono"}>
                    {enforceAgreementGate ? "ENFORCED" : "OFF"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/[0.06] pt-2">
                  <span className="text-slate-400">Team Members:</span>
                  <span className="font-mono text-amber-400">
                    {teamInvites.filter((t) => t.email.trim()).length} Pending Invites
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Stepper Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            {step > 1 ? (
              <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)} className="text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back</span>
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button size="sm" variant="primary" onClick={() => setStep(step + 1)} className="text-xs">
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                size="md"
                variant="primary"
                isLoading={isLoading}
                onClick={handleFinishOnboarding}
                className="font-semibold text-xs h-9"
              >
                <span>Launch Operating System</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
