"use client";

import React, { useState } from "react";
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
  ExternalLink,
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
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { inviteClientAction } from "@/actions/onboarding";

export function ClientsView({ initialClients = [] }: { initialClients?: any[] }) {
  const router = useRouter();
  const { session, setSelectedProjectId, state } = useApp();

  const isPMOrAdmin = session?.isAdmin || session?.isPM;

  const clients = initialClients;

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite Form State
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 ");
  const [agreementTerms, setAgreementTerms] = useState(
    "Standard Indian Pixel Studio Professional Services Terms: Milestone delivery subject to Rule PAY-2 & Rule AG-3 verified sign-off."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteSuccessUrl, setInviteSuccessUrl] = useState<string | null>(null);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono border border-amber-500/20">
              Rule AG-3 Master Governance
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {clients.length} Institutional Accounts
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100">
            Clients CRM & Institutional Dossiers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified enterprise signatories, Master Agreement compliance, unified billing ledgers, and project scopes.
          </p>
        </div>

        {isPMOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setInviteSuccessUrl(null);
              setIsInviteModalOpen(true);
            }}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Invite New Client</span>
          </Button>
        )}
      </div>

      {/* Main Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Selector & Search */}
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clients or signatories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060D0C] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
            />
          </div>

          <div className="space-y-2">
            {filteredClients.map((client) => {
              const isSelected = client.id === selectedClient?.id;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer text-xs space-y-2.5 select-none ${
                    isSelected
                      ? "border-amber-500/30 bg-[#071410] shadow-sm"
                      : "border-white/[0.07] bg-[#060D0C] hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`font-semibold font-heading text-xs truncate ${isSelected ? "text-amber-400" : "text-slate-200"}`}>
                        {client.companyName || client.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        Tier: {client.tier}
                      </span>
                    </div>
                    <StatusBadge status={client.status} />
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{client.activeProjectsCount} Project(s)</span>
                    <span className={client.hasActiveAgreement ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                      {client.hasActiveAgreement ? "MSA Active" : "MSA Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Client Dossier */}
        {selectedClient && (
          <div className="lg:col-span-2 space-y-4">
            {/* Dossier Card Header */}
            <div className="p-5 rounded-lg border border-white/[0.08] bg-[#060D0C] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold font-heading text-slate-100">
                      {selectedClient.companyName || selectedClient.name}
                    </h2>
                    <StatusBadge status={selectedClient.status} />
                  </div>
                  <span className="text-xs text-amber-400/90 font-mono mt-0.5 block">
                    Account ID: {selectedClient.id} • Tier: {selectedClient.tier}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[11px] font-mono px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                      selectedClient.hasActiveAgreement
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    <FileSignature className="h-3.5 w-3.5" />
                    <span>{selectedClient.hasActiveAgreement ? "Rule AG-3 Verified" : "MSA Signature Pending"}</span>
                  </span>
                </div>
              </div>

              {/* Grid: Contact & Financial Standing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Authorized Signatory */}
                <div className="space-y-2 p-3.5 rounded-lg bg-[#030706] border border-white/[0.04]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Authorized Signatory & Contact
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                      <span>{selectedClient.contactName}</span>
                    </p>
                    <p className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span>{selectedClient.email}</span>
                    </p>
                    <p className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Phone className="h-3 w-3 text-slate-500" />
                      <span>{selectedClient.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Financial Standing */}
                <div className="space-y-2 p-3.5 rounded-lg bg-[#030706] border border-white/[0.04]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Institutional Standing (Rule PAY-2)
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Total Billed:</span>
                      <span className="font-mono text-slate-200 font-semibold">{formatCurrency(selectedClient.totalInvoiced)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Reconciled Received:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(selectedClient.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1.5 border-t border-white/[0.04]">
                      <span className="text-slate-400">Outstanding Balance:</span>
                      <span className={`font-mono font-bold ${selectedClient.outstandingBalance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                        {formatCurrency(selectedClient.outstandingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Agreement Banner */}
              <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.04] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <FileSignature className="h-3.5 w-3.5 text-amber-400" />
                    <span>{selectedClient.agreementTitle}</span>
                  </span>
                  <StatusBadge status={selectedClient.agreementStatus} />
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedClient.hasActiveAgreement
                    ? "Legally executed Master Service Agreement. Project delivery and invoicing gates are fully active."
                    : "Awaiting execution. Under Rule AG-3, projects cannot transition out of Draft status until signed."}
                </p>
              </div>
            </div>

            {/* Active Projects under Client */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold font-heading text-slate-200">
                  Project Scopes ({selectedClient.projects?.length || 0})
                </h3>
              </div>

              {!selectedClient.projects || selectedClient.projects.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-white/[0.07] text-center text-xs text-slate-500">
                  No active projects currently provisioned for this account.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedClient.projects.map((proj: any) => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        router.push(`/projects/${proj.id}`);
                      }}
                      className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between text-xs group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors font-heading truncate">
                          {proj.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Target: {proj.targetDate ?? "Flexible"} • PM: {proj.pmName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusBadge status={proj.status} />
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Invite New Client */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Client Account"
        description="Registers an institutional client account, provisions Master Agreement terms, and issues onboarding access (Rule AG-3)."
        size="md"
      >
        {inviteSuccessUrl ? (
          <div className="space-y-4 py-3 text-xs font-sans">
            <div className="p-3.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <strong className="block">Client Invitation Successfully Created!</strong>
                <span>Invitation email dispatched with onboarding wizard link.</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-200 block">Direct Onboarding Link (for testing / manual distribution):</label>
              <input
                type="text"
                readOnly
                value={inviteSuccessUrl}
                className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2 text-amber-400 font-mono text-[11px] select-all"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.08]">
              <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
                <span>Done</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs font-sans">
            {errorMessage && (
              <div className="p-3 rounded bg-red-950/60 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Client / Brand Name:</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Mitti & Co."
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Company Legal Entity:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Mitti Organic Living Pvt Ltd"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Primary Representative Name:</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Devika Sen"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Representative Email:</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. devika@mitti.in"
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">Master Service Agreement (MSA) Terms:</label>
              <textarea
                rows={3}
                value={agreementTerms}
                onChange={(e) => setAgreementTerms(e.target.value)}
                className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
                <Send className="h-3 w-3 mr-1" />
                <span>Issue Invitation & Provision Agreement</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

