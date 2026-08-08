"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Settings, ShieldCheck, Lock, Globe, Clock, Save, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SettingsView() {
  const { state } = useApp();
  const [enforcePaymentGate, setEnforcePaymentGate] = useState(state.currentWorkspace.enforcePaymentGate);
  const [enforceAgreementGate, setEnforceAgreementGate] = useState(state.currentWorkspace.enforceAgreementGate);
  const [timezone, setTimezone] = useState(state.currentWorkspace.timezone);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Workspace Settings & Governance</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
              Super Admin Control
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Configure system-wide policy enforcement, hard payment constraints, and audit retention rules.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleSave} className="text-xs">
          <Save className="h-3.5 w-3.5 mr-1" />
          <span>{isSaved ? "Settings Saved!" : "Save Configuration"}</span>
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4 max-w-3xl">
        {/* Workspace Identity */}
        <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-4">
          <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-cta" />
            <span>Workspace Identity & Region</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-brand-light block">Workspace Name</label>
              <input
                type="text"
                value={state.currentWorkspace.name}
                readOnly
                className="w-full rounded border border-white/10 bg-brand-main-dark p-2 text-brand-light opacity-80 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-brand-light block">System Timezone (Rule G-9)</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+05:30)</option>
                <option value="America/New_York">America/New_York (EST — UTC-05:00)</option>
                <option value="Europe/London">Europe/London (GMT — UTC+00:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gate Enforcements */}
        <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-4">
          <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>Operational Gate Policies</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-light block">
                  Enforce Payment Gate (Rule PAY-3)
                </span>
                <p className="text-[11px] text-brand-counter">
                  Constrains milestone delivery and subsequent task execution if overdue invoices exceed grace threshold.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enforcePaymentGate}
                onChange={(e) => setEnforcePaymentGate(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-cta cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-light block">
                  Enforce Signed Agreement Gate (Rule P-1)
                </span>
                <p className="text-[11px] text-brand-counter">
                  Locks milestone submissions until a formal client agreement has been executed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enforceAgreementGate}
                onChange={(e) => setEnforceAgreementGate(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-cta cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Retention */}
        <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-3">
          <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <span>Audit Log Immutability & Retention</span>
          </h2>
          <p className="text-xs text-brand-counter">
            Per Rule AL-3 and AL-4, audit logs are permanent and append-only. They cannot be truncated, purged, or disabled by any user role, including the Super Admin.
          </p>
          <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
            Status: Immutable Append-Only Active • 100% Traceability
          </div>
        </div>
      </div>
    </div>
  );
}
