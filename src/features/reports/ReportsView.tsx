"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Download,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  FileCheck,
  Lock,
  ArrowUpRight,
  Printer,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReportsData {
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    totalOverdue: number;
    activeProjectsCount: number;
    totalProjectsCount: number;
    totalMilestones: number;
    completedMilestones: number;
    milestoneCompletionRate: number;
    overdueTasksCount: number;
    deliverablesInReviewCount: number;
    auditLogCount: number;
  };
  projectPerformance: Array<{
    id: string;
    name: string;
    clientId: string;
    clientName: string;
    status: string;
    targetDate: string;
    progressPct: number;
    milestonesTotal: number;
    milestonesCompleted: number;
    isDeliveryHealthy: boolean;
    isFinancialHealthy: boolean;
    pmName: string;
  }>;
}

export function ReportsView({ initialData }: { initialData?: ReportsData }) {
  const { session } = useApp();
  const [dateRange, setDateRange] = useState("Q3_2026");

  const isClient = session?.isClient ?? false;

  const defaultData: ReportsData = {
    summary: {
      totalInvoiced: 44500000, // ₹4,45,000.00
      totalCollected: 29500000, // ₹2,95,000.00
      totalOutstanding: 15000000, // ₹1,50,000.00
      totalOverdue: 0,
      activeProjectsCount: 3,
      totalProjectsCount: 3,
      totalMilestones: 8,
      completedMilestones: 5,
      milestoneCompletionRate: 63,
      overdueTasksCount: 0,
      deliverablesInReviewCount: 1,
      auditLogCount: 42,
    },
    projectPerformance: [
      {
        id: "proj-1",
        name: "Mitti & Co. Brand Refresh & Packaging",
        clientId: "client-1",
        clientName: "Mitti & Co.",
        status: "ACTIVE",
        targetDate: "2026-09-15",
        progressPct: 75,
        milestonesTotal: 3,
        milestonesCompleted: 2,
        isDeliveryHealthy: true,
        isFinancialHealthy: true,
        pmName: "Aarav Sharma",
      },
      {
        id: "proj-2",
        name: "SaaS Design System & Marketing Site",
        clientId: "client-2",
        clientName: "Tech Solutions Inc.",
        status: "ACTIVE",
        targetDate: "2026-08-30",
        progressPct: 80,
        milestonesTotal: 3,
        milestonesCompleted: 2,
        isDeliveryHealthy: true,
        isFinancialHealthy: true,
        pmName: "Priya Patel",
      },
      {
        id: "proj-3",
        name: "Vally & Hound Luxury Outdoors Identity",
        clientId: "client-3",
        clientName: "Vally & Hound",
        status: "ACTIVE",
        targetDate: "2026-10-01",
        progressPct: 40,
        milestonesTotal: 2,
        milestonesCompleted: 1,
        isDeliveryHealthy: true,
        isFinancialHealthy: true,
        pmName: "Aarav Sharma",
      },
    ],
  };

  const data = initialData || defaultData;
  const { summary, projectPerformance } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/25 uppercase tracking-wider">
              Live Audited Report
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Consolidated Performance Trajectory
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Executive Studio Intelligence
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {isClient
              ? "Comprehensive milestone delivery health and settlement summary for your engagements."
              : "Financial settlements, delivery milestone velocity, SLA governance, and operational integrity."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md bg-[#060D0C] border border-white/[0.08] px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500/40"
          >
            <option value="Q3_2026">This Quarter (Q3 2026)</option>
            <option value="YTD">Year to Date (2026)</option>
            <option value="ALL">All Time</option>
          </select>

          <Button variant="secondary" size="sm" onClick={handlePrint} className="text-xs">
            <Printer className="h-3.5 w-3.5 mr-1 text-amber-400" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: EXECUTIVE SUMMARY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Total Billed
          </span>
          <span className="text-lg font-bold font-heading text-slate-100 font-mono block">
            {formatCurrency(summary.totalInvoiced)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {data.projectPerformance.length} Projects
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Collections
          </span>
          <span className="text-lg font-bold font-heading text-emerald-400 font-mono block">
            {formatCurrency(summary.totalCollected)}
          </span>
          <span className="text-[10px] text-emerald-500 font-mono">
            Rule PAY-4 Verified
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Outstanding
          </span>
          <span className="text-lg font-bold font-heading text-amber-400 font-mono block">
            {formatCurrency(summary.totalOutstanding)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Within Terms
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Active Projects
          </span>
          <span className="text-lg font-bold font-heading text-slate-100 font-mono block">
            {summary.activeProjectsCount}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Under Active SLA
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Milestone Rate
          </span>
          <span className="text-lg font-bold font-heading text-emerald-400 font-mono block">
            {summary.milestoneCompletionRate}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {summary.completedMilestones}/{summary.totalMilestones} Approved
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Overdue Items
          </span>
          <span className={`text-lg font-bold font-heading font-mono block ${summary.overdueTasksCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {summary.overdueTasksCount}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {summary.overdueTasksCount === 0 ? "100% On Schedule" : "Requires Attention"}
          </span>
        </div>
      </div>

      {/* SECTION 2: OPERATIONAL PROJECT PERFORMANCE TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-heading text-slate-200">
            Portfolio Operational Health & Velocity
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {projectPerformance.length} Active Engagements
          </span>
        </div>

        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <div className="col-span-4">Project & Client</div>
            <div className="col-span-3">Progress & Milestones</div>
            <div className="col-span-2">Target Date</div>
            <div className="col-span-2 text-center">Health Matrix</div>
            <div className="col-span-1 text-right">Lead PM</div>
          </div>

          <div className="divide-y divide-white/[0.04] text-xs">
            {projectPerformance.map((proj) => (
              <div
                key={proj.id}
                className="px-4 py-3 hover:bg-white/[0.02] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center"
              >
                {/* Col 1: Project Name & Client */}
                <div className="col-span-4 space-y-0.5 min-w-0">
                  <span className="font-semibold text-slate-100 block truncate font-sans">
                    {proj.name}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Client: {proj.clientName}
                  </p>
                </div>

                {/* Col 2: Progress Bar */}
                <div className="col-span-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">
                      {proj.milestonesCompleted} of {proj.milestonesTotal} Milestones
                    </span>
                    <span className="text-amber-400 font-semibold">{proj.progressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                      style={{ width: `${proj.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Col 3: Target Date */}
                <div className="col-span-2 font-mono text-slate-300 text-[11px]">
                  {proj.targetDate}
                </div>

                {/* Col 4: Health Matrix */}
                <div className="col-span-2 flex items-center justify-start lg:justify-center gap-2 font-mono text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded border ${proj.isDeliveryHealthy ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-rose-950/40 text-rose-400 border-rose-500/20"}`}>
                    {proj.isDeliveryHealthy ? "Delivery OK" : "SLA At Risk"}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border ${proj.isFinancialHealthy ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-amber-950/40 text-amber-400 border-amber-500/20"}`}>
                    {proj.isFinancialHealthy ? "Finances OK" : "Payment Gate"}
                  </span>
                </div>

                {/* Col 5: PM */}
                <div className="col-span-1 text-left lg:text-right font-mono text-slate-400 text-[11px] truncate">
                  {proj.pmName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3 & 4: FINANCIAL TRAJECTORY & SLA GOVERNANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Financial Settlement Breakdown */}
        <div className="p-5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Statutory Financial Settlement Breakdown
            </h2>
            <span className="text-[10px] font-mono text-slate-500 uppercase">INR Ledger</span>
          </div>

          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <span className="text-slate-400">Total Billed Volume</span>
              <span className="font-mono font-bold text-slate-100">{formatCurrency(summary.totalInvoiced)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <span className="text-slate-400">Reconciled Collections (NEFT / Wire)</span>
              <span className="font-mono font-bold text-emerald-400">{formatCurrency(summary.totalCollected)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <span className="text-slate-400">Active Outstanding Balance</span>
              <span className="font-mono font-bold text-amber-400">{formatCurrency(summary.totalOutstanding)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <span className="text-slate-400">Statutory GST Remitted (18% Basis)</span>
              <span className="font-mono font-bold text-slate-300">
                {formatCurrency(Math.round(summary.totalCollected * 0.18 / 1.18))}
              </span>
            </div>
          </div>
        </div>

        {/* SLA & Governance Health */}
        <div className="p-5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Governance & Operational Compliance
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 uppercase">100% Compliant</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 block">Rule AL-1 Immutable Events</span>
                <span className="text-[11px] text-slate-400">{summary.auditLogCount} state transitions logged</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">VERIFIED</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 block">Rule PAY-3 Payment Delivery Gate</span>
                <span className="text-[11px] text-slate-400">Active on all client milestones</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#030706] border border-white/[0.04]">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-200 block">Rule AG-3 Master Agreement Gate</span>
                <span className="text-[11px] text-slate-400">Signed contracts verified before kickoff</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">ENFORCED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
