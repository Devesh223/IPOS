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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State
  const [studioName, setStudioName] = useState("Indian Pixel Studio");
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
    }
  };

  return (
    <div className="min-h-screen bg-brand-main-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-xs font-sans">
      <div className="glow-ambient" />

      {/* Header Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-2 z-10">
        <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-br from-brand-cta to-amber-700 flex items-center justify-center shadow-amber-glow">
          <span className="font-heading font-bold text-black text-xl tracking-wider">IP</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-brand-light">
          Studio Launch Sequence
        </h1>
        <p className="text-brand-counter">
          Configure multi-tenancy bounds, governance gates, and core team permissions.
        </p>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center font-mono font-bold transition-all ${
                  step === s
                    ? "bg-brand-cta text-black ring-2 ring-brand-cta/50"
                    : step > s
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/5 text-brand-counter/60 border border-white/10"
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500/40" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl z-10">
        <div className="bg-brand-dark/95 p-6 sm:p-8 shadow-elevation-3 border border-white/10 rounded-xl backdrop-blur-md space-y-6">
          {/* STEP 1: Workspace Identity */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold font-heading text-brand-light">
                  Step 1: Workspace Identity & Timezone
                </h2>
                <p className="text-brand-counter mt-0.5">
                  Establishes the primary multi-tenancy boundary (Rule G-1) and system timestamp baseline (Rule G-9).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-brand-light block mb-1">Studio Name</label>
                  <input
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className="w-full rounded border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-cta"
                  />
                </div>

                <div>
                  <label className="font-semibold text-brand-light block mb-1">Primary Studio Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:outline-none"
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
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold font-heading text-brand-light">
                  Step 2: Operational Gate Policies
                </h2>
                <p className="text-brand-counter mt-0.5">
                  Automated constraint switches that prevent delivery without settled invoices or signed agreements.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 rounded bg-white/5 border border-white/5 gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-brand-light block">
                      Enforce Overdue Payment Gate (Rule PAY-3)
                    </span>
                    <p className="text-brand-counter">
                      Blocks subsequent milestone task creation whenever an overdue invoice is pending reconciliation.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforcePaymentGate}
                    onChange={(e) => setEnforcePaymentGate(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand-cta cursor-pointer mt-1"
                  />
                </div>

                <div className="flex items-start justify-between p-3 rounded bg-white/5 border border-white/5 gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-brand-light block">
                      Enforce Executed Agreement Gate (Rule AG-3)
                    </span>
                    <p className="text-brand-counter">
                      Locks milestone submission until a digital contract or Master Service Agreement has been signed.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceAgreementGate}
                    onChange={(e) => setEnforceAgreementGate(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand-cta cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Core Team */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-semibold font-heading text-brand-light">
                    Step 3: Core Team Invitations
                  </h2>
                  <p className="text-brand-counter mt-0.5">
                    Invite your Project Manager and senior design leads with strictly scoped roles (Rule G-6).
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={handleAddInvite}>
                  <Plus className="h-3.5 w-3.5 mr-1 text-brand-cta" />
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
                      className="flex-1 rounded border border-white/10 bg-brand-main-dark px-3 py-1.5 text-brand-light focus:outline-none"
                    />
                    <select
                      value={invite.role}
                      onChange={(e) => {
                        const updated = [...teamInvites];
                        updated[idx]!.role = e.target.value;
                        setTeamInvites(updated);
                      }}
                      className="rounded border border-white/10 bg-brand-main-dark px-2.5 py-1.5 text-brand-light focus:outline-none"
                    >
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="DESIGNER">Designer</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="FINANCE">Finance Lead</option>
                    </select>
                    {teamInvites.length > 1 && (
                      <button
                        onClick={() => handleRemoveInvite(idx)}
                        className="p-1.5 rounded text-brand-counter hover:text-red-400"
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
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold font-heading text-brand-light">
                  Step 4: Review & Deploy Workspace
                </h2>
                <p className="text-brand-counter mt-0.5">
                  Confirm your studio parameters. An immutable onboarding event will be logged in the Audit Trail.
                </p>
              </div>

              <div className="space-y-2.5 p-4 rounded-lg bg-white/5 border border-white/5">
                <div className="flex justify-between">
                  <span className="text-brand-counter">Studio Name:</span>
                  <span className="font-semibold text-brand-light">{studioName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-counter">Timezone:</span>
                  <span className="font-mono text-brand-light">{timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-counter">Payment Gate (Rule PAY-3):</span>
                  <span className={enforcePaymentGate ? "text-emerald-400 font-bold" : "text-brand-counter"}>
                    {enforcePaymentGate ? "ENFORCED" : "OFF"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-counter">Agreement Gate (Rule AG-3):</span>
                  <span className={enforceAgreementGate ? "text-emerald-400 font-bold" : "text-brand-counter"}>
                    {enforceAgreementGate ? "ENFORCED" : "OFF"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2">
                  <span className="text-brand-counter">Team Members:</span>
                  <span className="font-mono text-brand-cta">
                    {teamInvites.filter((t) => t.email.trim()).length} Pending Invites
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Stepper Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {step > 1 ? (
              <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Back</span>
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button size="sm" variant="primary" onClick={() => setStep(step + 1)}>
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                size="md"
                variant="primary"
                isLoading={isLoading}
                onClick={handleFinishOnboarding}
                className="font-semibold"
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
