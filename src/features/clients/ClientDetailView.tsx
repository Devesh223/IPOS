"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  Building2,
  FolderKanban,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Mail,
  Phone,
  Shield,
  FileSignature,
  Send,
  UserCheck,
  Search,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { createProjectAction } from "@/actions/projects";

export function ClientDetailView({
  clientId,
  initialClient,
}: {
  clientId?: string;
  initialClient?: any;
}) {
  const router = useRouter();
  const { session, state, setSelectedProjectId } = useApp();

  const isPMOrAdmin = session?.isAdmin || session?.isPM;

  const client = initialClient;

  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectTargetDate, setNewProjectTargetDate] = useState("2026-10-31");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientProjects = state.projects.filter(
    (p) => p.clientId === client.id || p.clientName.toLowerCase().includes(client.name.toLowerCase())
  );

  const clientInvoices = state.invoices.filter((inv) =>
    clientProjects.some((p) => p.id === inv.projectId)
  );

  const clientAuditLogs = state.auditLogs.filter(
    (l) =>
      l.entityId === client.id ||
      l.action.includes("client") ||
      clientProjects.some((p) => p.id === l.entityId)
  );

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setErrorMessage("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("name", newProjectName);
      formData.set("description", newProjectDescription);
      formData.set("clientId", client.id);

      const res = await createProjectAction(formData);

      setIsSubmitting(false);
      if (res.success && res.project) {
        setIsCreateProjectModalOpen(false);
        setSelectedProjectId(res.project.id);
        router.push(`/projects/${res.project.id}`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const tabsList = [
    { id: "overview", label: "Overview" },
    { id: "projects", label: "Projects", count: clientProjects.length },
    { id: "finance", label: "Finance", count: clientInvoices.length },
    { id: "agreement", label: "Agreement (MSA)", count: client.agreements?.length || 1 },
    { id: "contacts", label: "Contacts", count: client.contacts?.length || 1 },
    { id: "activity", label: "Activity", count: clientAuditLogs.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back to Clients Directory Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="inline-flex items-center text-xs text-slate-400 hover:text-amber-400 font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span>Back to Clients Directory</span>
        </Link>
        <span className="text-[10px] font-mono text-slate-500">
          Account ID: {client.id}
        </span>
      </div>

      {/* Executive Client Dossier Header */}
      <div className="p-5 sm:p-6 rounded-lg border border-white/[0.08] bg-[#060D0C] shadow-elevation-1 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold font-heading text-slate-100 truncate">
                {client.companyName || client.name}
              </h1>
              <StatusBadge status={client.status} />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                Tier: {client.tier || "ENTERPRISE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Primary Signatory: <strong className="text-slate-200">{client.contactName}</strong> ({client.email})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start md:self-auto flex-shrink-0">
            {isPMOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setErrorMessage(null);
                  setIsCreateProjectModalOpen(true);
                }}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Initialize Project Scope</span>
              </Button>
            )}
          </div>
        </div>

        {/* Key Governance & Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/[0.04] text-xs text-slate-400">
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Governance Status
            </span>
            <span
              className={`font-mono font-medium mt-0.5 block ${
                client.hasActiveAgreement ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {client.hasActiveAgreement ? "Rule AG-3 Verified" : "MSA Draft Pending"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Active Scopes
            </span>
            <span className="font-mono text-slate-200 mt-0.5 block font-medium">
              {clientProjects.length} Project(s) Provisioned
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Total Invoiced
            </span>
            <span className="font-mono text-slate-200 mt-0.5 block font-medium">
              {formatCurrency(client.totalInvoiced)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Outstanding Balance
            </span>
            <span
              className={`font-mono font-medium mt-0.5 block ${
                client.outstandingBalance > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {client.outstandingBalance > 0
                ? formatCurrency(client.outstandingBalance)
                : "Fully Reconciled"}
            </span>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure Tabs */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h2 className="text-sm font-semibold font-heading text-slate-200">
                Institutional Relationship & Standing
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {client.companyName || client.name} is an active studio engagement account operating under Master Services Agreement terms. All project milestones are cryptographically versioned and gated against invoice settlement per Rule PAY-2.
              </p>
              <div className="pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Agreement Compliance</span>
                  <span className="text-emerald-400 font-mono font-medium block mt-0.5">
                    {client.hasActiveAgreement ? "MSA Legally Executed" : "Pending Client Signature"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Payment Compliance</span>
                  <span className="text-slate-300 font-mono font-medium block mt-0.5">
                    {client.outstandingBalance === 0 ? "Rule PAY-3 Clear (Zero Overdue)" : `${formatCurrency(client.outstandingBalance)} Outstanding`}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold font-heading text-slate-200">
                  Active Project Engagements
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  {clientProjects.length} Active
                </span>
              </div>
              {clientProjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No active projects assigned yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        router.push(`/projects/${proj.id}`);
                      }}
                      className="p-3 rounded bg-[#030706] border border-white/[0.04] hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between text-xs group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate block">
                          {proj.name}
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono">
                          PM: {proj.pmName} • Target: {proj.targetDate ?? "Flexible"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={proj.status} />
                        <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Authorized Signatory
              </h3>
              <div className="space-y-1 text-xs font-sans">
                <span className="font-semibold text-slate-200 block">{client.contactName}</span>
                <span className="text-[11px] text-slate-400 font-mono block">{client.email}</span>
                <span className="text-[11px] text-slate-400 font-mono block">{client.phone}</span>
              </div>
            </Card>

            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Master Service Agreement
              </h3>
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-200 block text-xs truncate">
                  {client.agreementTitle || "Master Services Agreement"}
                </span>
                <StatusBadge status={client.agreementStatus} />
                <p className="text-[11px] text-slate-400 pt-1">
                  Enforces Rule AG-3 milestone gate verification and IP release protocols.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Client Project Scopes ({clientProjects.length})
            </h2>
            {isPMOrAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Initialize Scope</span>
              </Button>
            )}
          </div>

          {clientProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#060D0C] rounded-lg border border-white/[0.07]">
              No projects have been provisioned for this client yet.
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] divide-y divide-white/[0.04] overflow-hidden">
              {clientProjects.map((proj) => {
                const completionPct = Math.round(
                  (proj.completedTasksCount / Math.max(1, proj.tasksCount)) * 100
                );
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      router.push(`/projects/${proj.id}`);
                    }}
                    className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors font-heading truncate">
                          {proj.name}
                        </span>
                        <StatusBadge status={proj.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Assigned PM: {proj.pmName} • Target: {proj.targetDate ?? "Flexible"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 justify-between sm:justify-end flex-shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-slate-200 font-semibold">{completionPct}% Done</span>
                        <span className="text-[10px] text-slate-500 block">
                          {proj.completedTasksCount}/{proj.tasksCount} Tasks
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FINANCE */}
      {activeTab === "finance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Financial Summary & Billing History
            </h2>
            <Link href="/finance">
              <Button variant="secondary" size="sm" className="text-xs">
                <span>Full Studio Finance</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Invoiced</span>
              <span className="text-sm font-bold font-mono text-slate-100 block mt-0.5">{formatCurrency(client.totalInvoiced)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Reconciled Collections</span>
              <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">{formatCurrency(client.totalPaid)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Outstanding Balance</span>
              <span className="text-sm font-bold font-mono text-amber-400 block mt-0.5">{formatCurrency(client.outstandingBalance)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {clientInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#060D0C] rounded-lg border border-white/[0.07]">
                No invoices issued for this client yet.
              </div>
            ) : (
              clientInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100">{inv.invoiceNumber}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-slate-400 text-[11px]">Due Date: {inv.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300">
                    <span className="font-mono font-bold">{formatCurrency(inv.amount)}</span>
                    <Link href={`/finance/invoices/${inv.id}`}>
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        <span>Inspect Invoice</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AGREEMENT */}
      {activeTab === "agreement" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Master Services Agreement (MSA) Governance
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                client.hasActiveAgreement
                  ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-950/50 text-amber-300 border-amber-500/30"
              }`}
            >
              {client.hasActiveAgreement ? "Rule AG-3 Legally Executed" : "Signature Pending"}
            </span>
          </div>

          <div className="p-5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-heading text-slate-100">
                {client.agreementTitle || "Master Services Agreement"}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Legally executed master governance framework binding {client.companyName || client.name} to Indian Pixel Studio delivery terms.
              </p>
            </div>

            <div className="p-4 rounded bg-[#030706] border border-white/[0.04] space-y-2 text-xs font-mono">
              <span className="text-[10px] uppercase text-slate-500 block">Governance Terms Summary:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {client.agreements?.[0]?.terms ||
                  "Standard Indian Pixel Studio Professional Services Terms: Milestone delivery subject to Rule PAY-2 & Rule AG-3 verified sign-off."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONTACTS */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Authorized Representatives & Stakeholders
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(client.contacts || [
              { id: "c-primary", name: client.contactName, email: client.email, phone: client.phone, isPrimary: true },
            ]).map((contact: any) => (
              <div
                key={contact.id}
                className="p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-slate-100">{contact.name}</span>
                  </div>
                  {contact.isPrimary && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      Authorized Signatory
                    </span>
                  )}
                </div>

                <div className="space-y-1 font-mono text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-500" />
                    <span>{contact.email}</span>
                  </p>
                  {contact.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-500" />
                      <span>{contact.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Client Audit Log (Rule AL-1 Immutable)
            </h2>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
              PostgreSQL Verified
            </span>
          </div>

          <div className="space-y-2">
            {clientAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#060D0C] rounded-lg border border-white/[0.07]">
                No audit events recorded for this client.
              </div>
            ) : (
              clientAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-white/[0.04] bg-[#060D0C] text-xs space-y-1 font-sans"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    <strong>{log.actorName || log.actorId}</strong> acted on {log.entityType}
                  </p>
                  {log.justification && (
                    <p className="text-[11px] text-slate-400 italic">
                      &ldquo;{log.justification}&rdquo;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Initialize Project Scope for this Client */}
      <Modal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        title={`Initialize Project Scope for ${client.name}`}
        description="Creates a contained project entity bound to this client account pursuant to Rule P-1."
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Project Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. 3D Spatial Identity & Campaign Collateral"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Target Completion Date:</label>
            <input
              type="date"
              required
              value={newProjectTargetDate}
              onChange={(e) => setNewProjectTargetDate(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Scope Brief & Objectives:</label>
            <textarea
              rows={3}
              placeholder="Brief outline of agreed creative scope and deliverables..."
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsCreateProjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
            >
              <span>Initialize Project</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
