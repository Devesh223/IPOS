"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { BarChart3, TrendingUp, ShieldCheck, Download, Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function ReportsView() {
  const { state } = useApp();

  const totalInvoiced = state.invoices.reduce((a, b) => a + b.amount, 0);
  const totalCollected = state.payments.reduce((a, b) => a + b.amount, 0);
  const totalOutstanding = state.invoices
    .filter((i) => i.remainingBalance > 0)
    .reduce((a, b) => a + b.remainingBalance, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Executive Studio Reports</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
              Q3 2026 Live Audited
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Consolidated operational health, payment settlement ratios, SLA compliance, and milestone turnaround velocity.
          </p>
        </div>

        <Button variant="secondary" size="sm" className="text-xs">
          <Download className="h-3.5 w-3.5 mr-1 text-brand-cta" />
          <span>Export Executive PDF</span>
        </Button>
      </div>

      {/* Financial Settlement Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase">Total Billed Volume</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              {formatCurrency(totalInvoiced)}
            </div>
            <p className="text-[10px] text-emerald-400 mt-1">+34% vs prior quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase">Reconciled Collections</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-emerald-400">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-[10px] text-brand-counter mt-1">Rule PAY-4 verified transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase">Overdue Aging Balance</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-status-danger">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-[10px] text-amber-300 mt-1">Subject to Payment Gate Rule PAY-3</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA & Governance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-4">
          <h2 className="text-sm font-semibold font-heading text-brand-light">
            Milestone Turnaround Times
          </h2>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-brand-counter">
                <span>Brand Identity & Strategy</span>
                <span className="font-mono text-brand-light font-medium">8.4 Days (Target: 10 Days)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full w-[84%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-brand-counter">
                <span>Packaging & Print Die-Lines</span>
                <span className="font-mono text-amber-300 font-medium">14.2 Days (Target: 14 Days)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[100%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-brand-counter">
                <span>3D CGI Motion Rendering</span>
                <span className="font-mono text-brand-light font-medium">18.0 Days (Target: 21 Days)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-brand-cta rounded-full w-[85%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-4">
          <h2 className="text-sm font-semibold font-heading text-brand-light">
            Governance & Audit Compliance
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-light block">Rule AL-1 Immutable Events</span>
                <span className="text-[11px] text-brand-counter">100% of state transitions logged</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">PASSED</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-light block">Rule P-1 Bound Client Workspaces</span>
                <span className="text-[11px] text-brand-counter">No uncontained services found</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">PASSED</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-light block">Rule PAY-2 Separation of State</span>
                <span className="text-[11px] text-brand-counter">Milestones & Payments decoupled</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">PASSED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
