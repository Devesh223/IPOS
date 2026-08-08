"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

import { useRouter } from "next/navigation";

export function ClientsView() {
  const router = useRouter();
  const { state, setSelectedProjectId } = useApp();
  const [selectedClientId, setSelectedClientId] = useState<string>("client-mitti");

  const clients = [
    {
      id: "client-mitti",
      name: "Mitti & Co.",
      tier: "Enterprise Retainer",
      contactName: "Devika Sen",
      email: "devika@mitti.in",
      phone: "+91 98201 44512",
      activeProjectsCount: 1,
      totalInvoiced: 15000000,
      paymentStatus: "HEALTHY",
      slaCompliance: "98.4%",
      notes: "Artisanal organic skincare & ayurvedic lifestyle brand based in Jaipur.",
    },
    {
      id: "client-vally",
      name: "Vally & Hound",
      tier: "Project Contract",
      contactName: "Kabir Mehra",
      email: "kabir@vallyhound.co",
      phone: "+91 97110 88231",
      activeProjectsCount: 1,
      totalInvoiced: 30000000,
      paymentStatus: "PAID_IN_FULL",
      slaCompliance: "100%",
      notes: "Luxury outdoors & adventure lifestyle brand in Himachal.",
    },
    {
      id: "client-tech-sol",
      name: "Tech Solutions Inc.",
      tier: "Growth Startup",
      contactName: "Siddharth Rao",
      email: "siddharth@techsol.io",
      phone: "+91 80412 99011",
      activeProjectsCount: 1,
      totalInvoiced: 22000000,
      paymentStatus: "OVERDUE_ALERT",
      slaCompliance: "92.0%",
      notes: "B2B SaaS analytics platform scaling across APAC & US.",
    },
  ];

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0]!;
  const clientProjects = state.projects.filter((p) => p.clientId === selectedClient.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Client Directory & Engagements</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium border border-brand-cta/30">
              {clients.length} Active Accounts
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Centralized stakeholder management, contract bounds, and client-level financial standing.
          </p>
        </div>

        <Button variant="primary" size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>Onboard Client</span>
        </Button>
      </div>

      {/* Grid: Client Cards + Client Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Client List */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-brand-counter font-semibold">
            Select Client
          </h2>
          <div className="space-y-2.5">
            {clients.map((c) => {
              const isSelected = c.id === selectedClientId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-brand-cta bg-brand-dark/95 shadow-amber-glow"
                      : "border-white/10 bg-brand-dark/70 hover:border-white/20 hover:bg-brand-dark/90"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold font-heading text-brand-light">
                        {c.name}
                      </h3>
                      <span className="text-[11px] text-brand-counter font-mono">
                        {c.tier}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        c.paymentStatus === "OVERDUE_ALERT"
                          ? "bg-red-950/80 text-red-300 border border-status-danger/30"
                          : c.paymentStatus === "PAID_IN_FULL"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/5 text-brand-counter border border-white/10"
                      }`}
                    >
                      {c.paymentStatus.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-brand-counter">
                    <span>{c.activeProjectsCount} Project Active</span>
                    <span className="font-mono text-brand-light font-semibold">
                      {formatCurrency(c.totalInvoiced)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Client Details & Engagements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-cta" />
                  <h2 className="text-lg font-bold font-heading text-brand-light">
                    {selectedClient.name}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-brand-counter">
                    {selectedClient.tier}
                  </span>
                </div>
                <p className="text-xs text-brand-counter mt-1">{selectedClient.notes}</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-brand-counter font-mono uppercase block">SLA Score</span>
                  <span className="font-bold text-emerald-400 text-sm font-mono">{selectedClient.slaCompliance}</span>
                </div>
              </div>
            </div>

            {/* Stakeholder Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-md bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-brand-counter block">Primary POC</span>
                <span className="font-semibold text-brand-light block">{selectedClient.contactName}</span>
                <div className="flex items-center gap-1.5 text-brand-counter text-[11px] mt-1">
                  <Mail className="h-3 w-3 text-brand-cta" />
                  <span>{selectedClient.email}</span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase text-brand-counter block">Direct Escalation</span>
                <span className="font-semibold text-brand-light block">VIP WhatsApp / Phone</span>
                <div className="flex items-center gap-1.5 text-brand-counter text-[11px] mt-1">
                  <Phone className="h-3 w-3 text-emerald-400" />
                  <span>{selectedClient.phone}</span>
                </div>
              </div>
            </div>

            {/* Client Projects List */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-brand-counter font-semibold">
                Active Projects Under {selectedClient.name}
              </h3>

              <div className="space-y-2.5">
                {clientProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-lg border border-white/10 bg-brand-main-dark/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={proj.status} />
                        <span className="font-semibold text-brand-light text-sm font-heading">
                          {proj.name}
                        </span>
                      </div>
                      <p className="text-brand-counter text-[11px]">{proj.description}</p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        router.push(`/projects/${proj.id}`);
                      }}
                      className="text-xs flex-shrink-0"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="h-3 w-3 ml-1 text-brand-cta" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
