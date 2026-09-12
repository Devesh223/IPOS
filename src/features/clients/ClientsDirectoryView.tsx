"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowRight,
  ShieldCheck,
  FileText,
  UserPlus,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { inviteClientAction } from "@/actions/onboarding";

export function ClientsDirectoryView({ initialClients = [] }: { initialClients?: any[] }) {
  const router = useRouter();
  const { session, state } = useApp();

  const isPMOrAdmin = session?.isAdmin || session?.isPM;

  const rawClients = initialClients;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Guided Wizard Form State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tier, setTier] = useState("ENTERPRISE");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 ");
  const [agreementTerms, setAgreementTerms] = useState(
    "Standard Indian Pixel Studio Professional Services Terms: Milestone delivery subject to Rule PAY-2 & Rule AG-3 verified sign-off."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteSuccessUrl, setInviteSuccessUrl] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    return rawClients.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && c.status === "ACTIVE") ||
        (statusFilter === "PENDING" && (c.status === "ONBOARDING_PENDING" || !c.hasActiveAgreement)) ||
        (statusFilter === "COMPLIANT" && c.hasActiveAgreement && c.outstandingBalance === 0);

      return matchSearch && matchStatus;
    });
  }, [rawClients, searchQuery, statusFilter]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInviteSuccessUrl(null);

    try {
      const res = await inviteClientAction({
        clientName,
        companyName: companyName || clientName,
        contactName,
        contactEmail,
        contactPhone,
        initialAgreementTerms: agreementTerms,
      });

      setIsLoading(false);
      if (res.success && res.onboardingUrl) {
        setInviteSuccessUrl(res.onboardingUrl);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to invite client.");
    }
  };

  const resetInviteModal = () => {
    setIsInviteModalOpen(false);
    setWizardStep(1);
    setClientName("");
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("+91 ");
    setErrorMessage(null);
    setInviteSuccessUrl(null);
  };

  const statusTabs = [
    { id: "ALL", label: "All Clients", count: rawClients.length },
    { id: "ACTIVE", label: "Active", count: rawClients.filter((c) => c.status === "ACTIVE").length },
    { id: "PENDING", label: "Pending Agreement / Onboarding", count: rawClients.filter((c) => c.status === "ONBOARDING_PENDING" || !c.hasActiveAgreement).length },
    { id: "COMPLIANT", label: "Fully Compliant", count: rawClients.filter((c) => c.hasActiveAgreement && c.outstandingBalance === 0).length },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono border border-amber-500/25 uppercase tracking-wider">
              Rule AG-3 Master Governance
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {rawClients.length} Institutional Accounts
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Clients Directory
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Enterprise client accounts, verified signatories, active Master Agreements, and consolidated billing ledgers.
          </p>
        </div>

        {isPMOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetInviteModal();
              setIsInviteModalOpen(true);
            }}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add / Invite Client</span>
          </Button>
        )}
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by name, company, signatory, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-white/[0.04]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Institutional Directory Table */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients match your filter criteria"
          description="Adjust your search query or status filter to see other enterprise client accounts."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <div className="col-span-4">Client & Entity</div>
            <div className="col-span-3">Primary Signatory & Contact</div>
            <div className="col-span-2 text-center">Governance (MSA)</div>
            <div className="col-span-2 text-right">Financial Standing</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center"
              >
                {/* Col 1: Client & Entity */}
                <div className="col-span-4 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-100 group-hover:text-amber-400 transition-colors font-heading truncate">
                      {client.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {client.tier || "ENTERPRISE"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans truncate">
                    {client.companyName || client.name}
                  </p>
                </div>

                {/* Col 2: Primary Signatory */}
                <div className="col-span-3 space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-200">
                    <UserCheck className="h-3 w-3 text-amber-400 flex-shrink-0" />
                    <span className="font-medium truncate">{client.contactName}</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {client.email}
                  </p>
                </div>

                {/* Col 3: Governance (MSA) */}
                <div className="col-span-2 lg:text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                      client.hasActiveAgreement
                        ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/25"
                        : "bg-amber-950/50 text-amber-300 border-amber-500/25"
                    }`}
                  >
                    <FileSignature className="h-2.5 w-2.5" />
                    <span>{client.hasActiveAgreement ? "Rule AG-3 Verified" : "MSA Pending"}</span>
                  </span>
                </div>

                {/* Col 4: Financial Standing */}
                <div className="col-span-2 lg:text-right space-y-0.5">
                  <span className="text-xs font-mono font-bold text-slate-200 block">
                    {formatCurrency(client.totalInvoiced)} Billed
                  </span>
                  <span
                    className={`text-[10px] font-mono block ${
                      client.outstandingBalance > 0 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {client.outstandingBalance > 0
                      ? `${formatCurrency(client.outstandingBalance)} Due`
                      : "Fully Reconciled"}
                  </span>
                </div>

                {/* Col 5: Jump Trigger */}
                <div className="col-span-1 flex items-center justify-between lg:justify-end gap-2 text-right">
                  <span className="lg:hidden text-[10px] text-slate-500 font-mono">
                    {client.activeProjectsCount} Active Project(s)
                  </span>
                  <div className="flex items-center text-xs text-slate-400 group-hover:text-amber-400 transition-colors font-mono">
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Guided Client Invitation Flow (Wizard) */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={resetInviteModal}
        title="Invite New Institutional Client"
        description="Guided provisioning wizard: Registers the client entity, assigns primary representative, and provisions Master Agreement terms (Rule AG-3)."
        size="md"
      >
        {inviteSuccessUrl ? (
          <div className="space-y-4 py-2 text-xs font-sans">
            <div className="p-3.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div>
                <strong className="block font-heading text-sm">Client Account Provisioned</strong>
                <span className="text-xs text-emerald-200/90">
                  Invitation email dispatched to <strong>{contactEmail}</strong> with one-time onboarding link.
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 block">
                Direct Onboarding URL (for testing or manual delivery):
              </label>
              <input
                type="text"
                readOnly
                value={inviteSuccessUrl}
                className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2 text-amber-300 font-mono text-[11px] select-all"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.08]">
              <Button variant="primary" size="sm" onClick={resetInviteModal}>
                <span>Done</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs font-sans">
            {errorMessage && (
              <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step Indicators */}
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-white/[0.06] text-center font-mono text-[10px]">
              <div className={`p-1.5 rounded border ${wizardStep >= 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
                1. Identity
              </div>
              <div className={`p-1.5 rounded border ${wizardStep >= 2 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
                2. Contact
              </div>
              <div className={`p-1.5 rounded border ${wizardStep === 3 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
                3. Agreement
              </div>
            </div>

            {/* Wizard Step 1: Identity */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Brand / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Mitti & Co."
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Company Legal Entity</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mitti Organic Living Pvt Ltd"
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Account Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
                  >
                    <option value="ENTERPRISE">ENTERPRISE (Full Retainer & Multi-Scope)</option>
                    <option value="GROWTH">GROWTH (Milestone-Gated Engagements)</option>
                    <option value="BOUTIQUE">BOUTIQUE (Standard Delivery)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Wizard Step 2: Contact */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Authorized Representative Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Devika Sen"
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Representative Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. devika@mitti.in"
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98201 22334"
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>
            )}

            {/* Wizard Step 3: Agreement */}
            {wizardStep === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">
                    Master Services Agreement (MSA) Terms Provisioning (Rule AG-3)
                  </label>
                  <textarea
                    rows={4}
                    value={agreementTerms}
                    onChange={(e) => setAgreementTerms(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono text-[11px] leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    The client will be required to legally e-sign this agreement before project scopes can transition to execution.
                  </span>
                </div>
              </div>
            )}

            {/* Wizard Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  if (wizardStep === 1) resetInviteModal();
                  else setWizardStep((prev) => (prev - 1) as any);
                }}
              >
                {wizardStep === 1 ? "Cancel" : "Back"}
              </Button>

              {wizardStep < 3 ? (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1 && !clientName.trim()) {
                      setErrorMessage("Brand / Client name is required.");
                      return;
                    }
                    if (wizardStep === 2 && (!contactName.trim() || !contactEmail.trim())) {
                      setErrorMessage("Representative name and email are required.");
                      return;
                    }
                    setErrorMessage(null);
                    setWizardStep((prev) => (prev + 1) as any);
                  }}
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
                  <Send className="h-3 w-3 mr-1" />
                  <span>Issue Invitation</span>
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
