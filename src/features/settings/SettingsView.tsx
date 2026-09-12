"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  Settings,
  ShieldCheck,
  Lock,
  Globe,
  Clock,
  Save,
  AlertTriangle,
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  KeyRound,
  Database,
  CheckCircle2,
  Sparkles,
  Shield,
  FileCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { updateWorkspaceSettingsAction } from "@/actions/settings";

interface WorkspaceSettingsData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    enforcePaymentGate: boolean;
    enforceAgreementGate: boolean;
    onboardingStatus: string;
    setupStep: number;
    createdAt: string;
    memberCount: number;
    projectCount: number;
    invoiceCount: number;
    auditLogCount: number;
  };
  systemDiagnostics: {
    environment: string;
    databaseEngine: string;
    auditEngine: string;
    storageEngine: string;
    emailEngine: string;
    paymentEngine: string;
  };
}

export function SettingsView({ initialData }: { initialData?: WorkspaceSettingsData }) {
  const router = useRouter();
  const { session } = useApp();

  const isClient = session?.isClient ?? false;
  const isSuperAdminOrAdmin = session?.isAdmin ?? false;

  const defaultData: WorkspaceSettingsData = {
    workspace: {
      id: "ws_indian_pixel",
      name: "Indian Pixel Design Studio",
      slug: "indian-pixel",
      timezone: "Asia/Kolkata",
      enforcePaymentGate: true,
      enforceAgreementGate: true,
      onboardingStatus: "COMPLETED",
      setupStep: 4,
      createdAt: "2026-06-01T10:00:00Z",
      memberCount: 5,
      projectCount: 3,
      invoiceCount: 4,
      auditLogCount: 42,
    },
    systemDiagnostics: {
      environment: "production",
      databaseEngine: "PostgreSQL (Supabase Direct)",
      auditEngine: "Append-Only Immutable (PostgreSQL Trigger Protected)",
      storageEngine: "Cloudflare R2 / S3-Compatible Storage Provider",
      emailEngine: "Resend Production Gateway",
      paymentEngine: "Razorpay / Stripe Dual Provider Gateway",
    },
  };

  const data = initialData || defaultData;

  const [activeCategory, setActiveCategory] = useState<string>("workspace");
  const [workspaceName, setWorkspaceName] = useState(data.workspace.name);
  const [timezone, setTimezone] = useState(data.workspace.timezone);
  const [enforcePaymentGate, setEnforcePaymentGate] = useState(data.workspace.enforcePaymentGate);
  const [enforceAgreementGate, setEnforceAgreementGate] = useState(data.workspace.enforceAgreementGate);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Policy confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const categories = [
    { id: "workspace", label: "Workspace & Identity", icon: Globe },
    { id: "governance", label: "Governance & Gates", icon: Lock },
    { id: "team_access", label: "Team & Access Policies", icon: Users },
    { id: "finance_gst", label: "Finance & GST Ledger", icon: DollarSign },
    { id: "project_ops", label: "Project Operations", icon: Briefcase },
    { id: "communication", label: "Communication & Alerts", icon: Bell },
    { id: "security", label: "Security & Retention", icon: ShieldCheck },
    { id: "system", label: "System Diagnostics", icon: Database },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await updateWorkspaceSettingsAction({
        name: workspaceName,
        timezone,
        enforcePaymentGate,
        enforceAgreementGate,
      });

      setIsLoading(false);
      if (res.success) {
        setIsSaved(true);
        setIsConfirmModalOpen(false);
        setTimeout(() => setIsSaved(false), 3000);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to update settings.");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/25 uppercase tracking-wider">
              Super Admin Authority
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Workspace Policies & Controls
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Workspace Governance & Settings
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {isClient
              ? "Account preferences and engagement configuration."
              : "System-wide policy enforcement, hard financial constraints, and operational diagnostics."}
          </p>
        </div>

        {isSuperAdminOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsConfirmModalOpen(true)}
            className="text-xs self-start sm:self-auto"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            <span>{isSaved ? "Configuration Saved!" : "Save Changes"}</span>
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Split: Left Nav + Right Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Navigation */}
        <div className="md:col-span-4 lg:col-span-3 space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25 shadow-sm"
                    : "bg-[#060D0C] text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-white/[0.04]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Contextual Panel */}
        <div className="md:col-span-8 lg:col-span-9 p-5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-5 shadow-elevation-1">
          {/* CATEGORY 1: WORKSPACE & IDENTITY */}
          {activeCategory === "workspace" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Workspace Identity & Regional Defaults
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Core studio profile and canonical multi-tenant routing identifier.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Studio Name:</label>
                  <input
                    type="text"
                    value={workspaceName}
                    disabled={!isSuperAdminOrAdmin}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full rounded border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Workspace Slug (Immutable):</label>
                  <input
                    type="text"
                    value={data.workspace.slug}
                    readOnly
                    className="w-full rounded border border-white/[0.06] bg-[#030706] px-3 py-2 text-slate-400 opacity-80 cursor-not-allowed text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Canonical Timezone (Rule G-9):</label>
                  <select
                    value={timezone}
                    disabled={!isSuperAdminOrAdmin}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40 font-mono"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+05:30)</option>
                    <option value="America/New_York">America/New_York (EST — UTC-05:00)</option>
                    <option value="Europe/London">Europe/London (GMT — UTC+00:00)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Onboarding Provisioning State:</label>
                  <div className="p-2 rounded bg-[#030706] border border-white/[0.06] text-emerald-400 font-mono text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{data.workspace.onboardingStatus} (Phase {data.workspace.setupStep}/4)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 2: GOVERNANCE & GATES */}
          {activeCategory === "governance" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Operational & Financial Gate Policies
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Automated runtime constraints preventing out-of-order execution or deliverable leakages.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between p-3.5 rounded bg-[#030706] border border-white/[0.06] gap-4">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200 block text-xs">
                      Enforce Payment Delivery Gate (Rule PAY-3)
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Constrains milestone deliverable releases and subsequent task completion if overdue milestone invoices exceed grace thresholds.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforcePaymentGate}
                    disabled={!isSuperAdminOrAdmin}
                    onChange={(e) => setEnforcePaymentGate(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer mt-0.5"
                  />
                </div>

                <div className="flex items-start justify-between p-3.5 rounded bg-[#030706] border border-white/[0.06] gap-4">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200 block text-xs">
                      Enforce Signed Master Agreement Gate (Rule AG-3)
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Prohibits project activation and milestone submissions until a formal client master services agreement (MSA) is verified active.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceAgreementGate}
                    disabled={!isSuperAdminOrAdmin}
                    onChange={(e) => setEnforceAgreementGate(e.target.checked)}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer mt-0.5"
                  />
                </div>

                <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                  <span>Rule AL-3 Forensic immutability actively protects all gate state modifications.</span>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 3: TEAM & ACCESS */}
          {activeCategory === "team_access" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Role-Based Access Control Policies (Rule G-6)
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Pre-configured hierarchical role permissions with absolute cross-client containment.
                </p>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-amber-300 font-semibold">SUPER_ADMIN</span>
                  <span className="text-slate-400">Full Global Authority & Policy Overrides</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-slate-200 font-semibold">ADMIN / PM</span>
                  <span className="text-slate-400">Project Operations, Milestone Approvals, Team Management</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold">FINANCE</span>
                  <span className="text-slate-400">Invoice Generation, Payment Reconciliations, Credit Notes</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">STAFF</span>
                  <span className="text-slate-400">Task Execution, Deliverable Version Uploads, Reviews</span>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 4: FINANCE & GST */}
          {activeCategory === "finance_gst" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Financial Ledger & Statutory GST Parameters
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Statutory tax configuration for domestic Indian studio operations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Base Currency</span>
                  <span className="font-mono font-bold text-slate-200 block text-sm">INR (₹ — Indian Rupee)</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Standard GST Basis</span>
                  <span className="font-mono font-bold text-emerald-400 block text-sm">18.00% (1800 BPS)</span>
                </div>
              </div>

              <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
                  Studio Remittance Bank Profile
                </span>
                <p className="text-slate-300 font-mono text-[11px]">
                  HDFC Bank • Account: 50200084920194 • IFSC: HDFC0000084 • Branch: Bangalore Central
                </p>
              </div>
            </div>
          )}

          {/* CATEGORY 5: COMMUNICATION */}
          {activeCategory === "communication" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Communication & Notification Dispatchers (Rule N-1)
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Transactional email delivery and in-app alert priority queues.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">Critical Milestone & Payment Alerts</span>
                    <span className="text-[11px] text-slate-400">Immediate email dispatch + in-app priority banner</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[10px]">ENABLED</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">Active Email Gateway Provider</span>
                    <span className="text-[11px] text-slate-400 font-mono">{data.systemDiagnostics.emailEngine}</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[10px]">HEALTHY</span>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 6: SECURITY */}
          {activeCategory === "security" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Security, Tenancy Isolation & Non-Destructive Lifecycle
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Zero-leakage guarantees and non-destructive offboarding mechanisms.
                </p>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-slate-200 font-semibold block">Multi-Tenant Isolation (Rule G-1)</span>
                  <p className="text-slate-400 text-[11px]">
                    Every query strictly bound by session workspaceId. No cross-tenant bleeding possible.
                  </p>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-slate-200 font-semibold block">Non-Destructive Offboarding (Rule G-7)</span>
                  <p className="text-slate-400 text-[11px]">
                    Suspended users preserved in database to maintain historical attribution integrity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY 7: SYSTEM DIAGNOSTICS */}
          {activeCategory === "system" && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <h2 className="text-sm font-semibold font-heading text-slate-100">
                  Operational System Diagnostics
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Runtime engine configurations without exposing raw secrets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Database Engine</span>
                  <span className="text-slate-200 font-bold block">{data.systemDiagnostics.databaseEngine}</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Audit Engine</span>
                  <span className="text-emerald-400 font-bold block">{data.systemDiagnostics.auditEngine}</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Storage Provider</span>
                  <span className="text-slate-200 font-bold block">{data.systemDiagnostics.storageEngine}</span>
                </div>
                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Payment Provider</span>
                  <span className="text-amber-400 font-bold block">{data.systemDiagnostics.paymentEngine}</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
                Security Guarantee: Zero raw credentials (DATABASE_URL, SESSION_SECRET, API Keys) exposed in client bundle.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Policy Changes */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Workspace Policy Updates"
        description="Changing governance switches will immediately affect active milestone submissions and payment delivery gates."
        size="sm"
      >
        <div className="space-y-3 text-xs font-sans">
          <div className="p-3 rounded bg-[#030706] border border-white/[0.08] space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Delivery Gate:</span>
              <strong className={enforcePaymentGate ? "text-emerald-400" : "text-amber-400"}>
                {enforcePaymentGate ? "ENFORCED" : "BYPASSED"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Master Agreement Gate:</span>
              <strong className={enforceAgreementGate ? "text-emerald-400" : "text-amber-400"}>
                {enforceAgreementGate ? "ENFORCED" : "BYPASSED"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Timezone:</span>
              <strong className="text-slate-200">{timezone}</strong>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleSave}>
              <span>Confirm & Save</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
