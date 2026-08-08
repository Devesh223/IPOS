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
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { inviteClientAction } from "@/actions/onboarding";

export function ClientsView({ initialClients = [] }: { initialClients?: any[] }) {
  const router = useRouter();
  const { session, setSelectedProjectId } = useApp();

  const isPMOrAdmin = session?.isAdmin || session?.isPM || true;

  const [selectedClientId, setSelectedClientId] = useState<string>(initialClients[0]?.id || "");
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

  const selectedClient = initialClients.find((c) => c.id === selectedClientId) || initialClients[0];

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Client Directory & Stakeholders</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium border border-brand-cta/30">
              {initialClients.length} Live Accounts
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Centralized client accounts, verified contact signatories, Master Agreement compliance (Rule AG-3), and live financials.
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

      {/* Main Grid: Client List & Selected Client Detail */}
      {initialClients.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-xl space-y-3">
          <Building2 className="h-8 w-8 text-brand-cta mx-auto" />
          <h3 className="text-sm font-semibold text-brand-light">No Client Accounts Registered</h3>
          <p className="text-xs text-brand-counter">Click &ldquo;Invite New Client&rdquo; to initiate client onboarding with a signed Master Agreement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Client List */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-brand-counter font-semibold">
              Client Accounts ({initialClients.length})
            </h2>

            <div className="space-y-2">
              {initialClients.map((client) => {
                const isSelected = client.id === selectedClient?.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer text-xs space-y-2 ${
                      isSelected
                        ? "border-brand-cta bg-brand-dark shadow-amber-glow"
                        : "border-white/10 bg-brand-dark/70 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-brand-light font-heading text-sm">
                          {client.companyName || client.name}
                        </h3>
                        <span className="text-[10px] text-brand-counter font-mono">
                          {client.tier}
                        </span>
                      </div>
                      <StatusBadge status={client.status} />
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-brand-counter">
                      <span>{client.activeProjectsCount} Active Projects</span>
                      <span className={client.hasActiveAgreement ? "text-emerald-400 font-mono" : "text-amber-400 font-mono"}>
                        {client.hasActiveAgreement ? "MSA Signed" : "MSA Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Client Profile & Governance */}
          {selectedClient && (
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-heading text-brand-light">
                        {selectedClient.companyName || selectedClient.name}
                      </h2>
                      <StatusBadge status={selectedClient.status} />
                    </div>
                    <span className="text-xs text-brand-cta font-mono mt-0.5 block">
                      Tier: {selectedClient.tier}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                      selectedClient.hasActiveAgreement
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                    }`}>
                      <FileSignature className="h-3.5 w-3.5" />
                      <span>{selectedClient.hasActiveAgreement ? "Rule AG-3 Active" : "Agreement Pending"}</span>
                    </span>
                  </div>
                </div>

                {/* Contact & Governance Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-2 p-3 rounded-lg bg-brand-main-dark/80 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-brand-counter block">
                      Authorized Contact Signatory
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-brand-light flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-brand-cta" />
                        <span>{selectedClient.contactName}</span>
                      </p>
                      <p className="text-brand-counter flex items-center gap-1.5 font-mono text-[11px]">
                        <Mail className="h-3 w-3" />
                        <span>{selectedClient.email}</span>
                      </p>
                      <p className="text-brand-counter flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="h-3 w-3" />
                        <span>{selectedClient.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-lg bg-brand-main-dark/80 border border-white/5">
                    <span className="text-[10px] font-mono uppercase text-brand-counter block">
                      Financial Standing (Rule PAY-2)
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-brand-counter">Total Invoiced:</span>
                        <span className="font-mono text-brand-light font-semibold">{formatCurrency(selectedClient.totalInvoiced)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-brand-counter">Reconciled Collections:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(selectedClient.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-white/10">
                        <span className="text-brand-counter">Outstanding Balance:</span>
                        <span className={`font-mono font-bold ${selectedClient.outstandingBalance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {formatCurrency(selectedClient.outstandingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Master Agreement Summary */}
                <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-light flex items-center gap-1.5">
                      <FileSignature className="h-3.5 w-3.5 text-purple-400" />
                      <span>{selectedClient.agreementTitle}</span>
                    </span>
                    <StatusBadge status={selectedClient.agreementStatus} />
                  </div>
                  <p className="text-[11px] text-brand-counter">
                    Status: {selectedClient.hasActiveAgreement ? "Legally signed and binding. Projects under this account can leave Draft status." : "Awaiting signature. Project activations are blocked under Rule AG-3."}
                  </p>
                </div>
              </Card>

              {/* Projects Under Client */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold font-heading text-brand-light">
                  Active Client Projects ({selectedClient.projects.length})
                </h3>

                {selectedClient.projects.length === 0 ? (
                  <div className="p-6 rounded-lg border border-dashed border-white/10 text-center text-xs text-brand-counter">
                    No projects registered under this client yet.
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
                        className="p-3.5 rounded-lg border border-white/10 bg-brand-dark/90 hover:border-brand-cta/50 transition-all cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-brand-light font-heading">{proj.name}</h4>
                          <p className="text-[11px] text-brand-counter">{proj.servicesCount} Services Configured</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={proj.status} />
                          <ExternalLink className="h-3.5 w-3.5 text-brand-counter" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Invite New Client */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Client Account"
        description="Registers a corporate client account, provisions Master Service Agreement terms, and dispatches secure onboarding invite."
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
              <label className="font-semibold text-brand-light block">Direct Onboarding Link (for testing / manual distribution):</label>
              <input
                type="text"
                readOnly
                value={inviteSuccessUrl}
                className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-cta font-mono text-[11px] select-all"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <Button variant="primary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
                <span>Done</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs font-sans">
            {errorMessage && (
              <div className="p-3 rounded bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-brand-light block mb-1">Client / Brand Name:</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Mitti & Co."
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-brand-light block mb-1">Company Legal Entity:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Mitti Organic Living Pvt Ltd"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-brand-light block mb-1">Primary Representative Name:</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Devika Sen"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-brand-light block mb-1">Representative Email:</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. devika@mitti.in"
                  className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-brand-light block mb-1">Master Service Agreement (MSA) Terms:</label>
              <textarea
                rows={3}
                value={agreementTerms}
                onChange={(e) => setAgreementTerms(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
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
