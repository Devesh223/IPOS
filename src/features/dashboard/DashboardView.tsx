"use client";

import React, { useMemo } from "react";
import { useApp } from "@/lib/app-context";
import { DashboardMetrics } from "@/domain/dashboard/queries";
import {
  CreditCard,
  FolderKanban,
  CheckSquare,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Zap,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function DashboardView({ metrics }: { metrics?: DashboardMetrics }) {
  const router = useRouter();
  const { state, session, setSelectedProjectId, setIsCommandPaletteOpen } = useApp();

  const isClient = session?.isClient ?? false;
  const isFinance = session?.isFinance ?? false;
  const isStaff = session?.isStaff ?? false;
  const userName = session?.user.name || state.currentUser.name;

  // Real authoritative data from PostgreSQL with state fallback
  const activeProjectsCount = metrics?.activeProjectsCount ?? state.projects.length;
  const tasksInProgressCount = metrics?.tasksInProgressCount ?? state.tasks.length;
  const reconciledAmount = metrics?.reconciledPaymentsAmountPaise ?? state.payments.reduce((acc, p) => acc + p.amount, 0);
  const auditCount = metrics?.totalAuditEntriesCount ?? state.auditLogs.length;

  const overdueTasks = metrics?.overdueTasks ?? state.tasks.filter((t) => t.isOverdue).map((t) => ({
    id: t.id,
    name: t.name,
    projectId: t.projectId,
    projectName: t.projectName,
    assigneeName: t.assigneeName,
    dueDate: t.dueDate,
  }));

  const overdueInvoices = metrics?.overdueInvoices ?? state.invoices.filter((i) => i.isOverdue).map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    projectId: i.projectId,
    projectName: i.projectName,
    amount: i.amount,
    paidAmount: i.paidAmount,
    remainingBalance: i.remainingBalance,
    dueDate: i.dueDate,
  }));

  const pendingApprovals = state.projects.filter((p) => p.stalledApprovalsCount > 0);
  const rawProjects = metrics?.projectsSummary ?? state.projects;
  const auditLogs = metrics?.recentAuditLogs ?? state.auditLogs;

  // Prioritize projects: Stalled/Approvals > Active > Others
  const sortedProjects = useMemo(() => {
    return [...rawProjects].sort((a, b) => {
      const aPriority = (a.stalledApprovalsCount || 0) > 0 ? 3 : a.status === "ACTIVE" ? 2 : 1;
      const bPriority = (b.stalledApprovalsCount || 0) > 0 ? 3 : b.status === "ACTIVE" ? 2 : 1;
      return bPriority - aPriority;
    });
  }, [rawProjects]);

  // Contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const totalAttentionCount = overdueTasks.length + overdueInvoices.length + pendingApprovals.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Studio Operating System
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-heading">
            {getGreeting()}, {userName.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {totalAttentionCount > 0
              ? `${totalAttentionCount} operational item${totalAttentionCount > 1 ? "s" : ""} require your decision. All remaining scopes are active.`
              : "All milestone deliverables are progressing within SLA and financial accounts are reconciled."}
          </p>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-xs"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 mr-1.5" />
            <span>Command (⌘K)</span>
          </Button>

          {!isClient && !isStaff && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/projects")}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Create Project</span>
            </Button>
          )}

          {isClient && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/projects")}
              className="text-xs"
            >
              <FileCheck className="h-3.5 w-3.5 mr-1" />
              <span>Review Milestones</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. LEVEL 1: ATTENTION REQUIRED OR EVERYTHING ON TRACK */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
            {totalAttentionCount > 0 ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400">Attention Required</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Everything is on Track</span>
              </>
            )}
          </div>
          {totalAttentionCount > 0 && (
            <span className="text-[10px] text-slate-500 font-mono">
              {totalAttentionCount} action item{totalAttentionCount > 1 ? "s" : ""} pending
            </span>
          )}
        </div>

        {totalAttentionCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Overdue Invoice Alert */}
            {overdueInvoices.length > 0 && (isFinance || !isStaff) && (
              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/25 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300 font-mono text-[11px] uppercase">
                    Payment Overdue
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Rule PAY-3
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Invoice <strong className="text-slate-100">{overdueInvoices[0]!.invoiceNumber}</strong> ({formatCurrency(overdueInvoices[0]!.remainingBalance)}) for <em>{overdueInvoices[0]!.projectName}</em> requires settlement.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => router.push("/finance")}
                    className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <span>Review Invoice</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Overdue Task SLA Alert */}
            {overdueTasks.length > 0 && !isClient && (
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-300 font-mono text-[11px] uppercase">
                    Task Past Due Date
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Rule T-5
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong className="text-slate-100">{overdueTasks[0]!.name}</strong> assigned to {overdueTasks[0]!.assigneeName} under <em>{overdueTasks[0]!.projectName}</em> is past target SLA.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedProjectId(overdueTasks[0]!.projectId);
                      router.push(`/projects/${overdueTasks[0]!.projectId}`);
                    }}
                    className="text-[11px] font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <span>Reassign / Resolve</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Milestone Approval Alert */}
            {pendingApprovals.length > 0 && (
              <div className="p-3.5 rounded-lg bg-sky-950/20 border border-sky-500/25 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-300 font-mono text-[11px] uppercase">
                    Pending Approval Sign-Off
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                    Rule A-1
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <em>{pendingApprovals[0]!.name}</em> has a submitted milestone deliverable package waiting for client sign-off.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedProjectId(pendingApprovals[0]!.id);
                      router.push(`/projects/${pendingApprovals[0]!.id}`);
                    }}
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <span>Inspect Package</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-emerald-500/20 bg-[#060D0C] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-100 font-heading">
                  Operational state is calm and compliant
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No overdue invoices, blocked milestone gates, or SLA escalations detected in the current workspace.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0 hidden sm:inline-block">
              Rule AL-1 Verified
            </span>
          </div>
        )}
      </section>

      {/* 3. LEVEL 2: EXECUTIVE METRICS (Compact, Quiet, Institutional) */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Projects</span>
            <FolderKanban className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-heading text-slate-100">
            {activeProjectsCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            All Scopes Contained (Rule P-1)
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Tasks In Progress</span>
            <CheckSquare className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-heading text-slate-100">
            {tasksInProgressCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Single Assignee (Rule T-1)
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Reconciled Collections</span>
            <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-heading text-slate-100">
            {formatCurrency(reconciledAmount, "INR")}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            PostgreSQL Verified (Rule PAY-2)
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Audit Trail Entries</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-heading text-slate-100">
            {auditCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Append-Only (Rule AL-3)
          </div>
        </div>
      </section>

      {/* 4. LEVEL 3: ACTIVE ENGAGEMENTS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 font-semibold">
              Active Engagements
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live client project scopes, delivery velocity, and milestone completion state
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/projects")}
            className="text-xs text-amber-400 hover:text-amber-300 p-0 h-auto font-mono cursor-pointer"
          >
            <span>View All Projects</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* Clean Scannable Engagements List */}
        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] divide-y divide-white/[0.04] overflow-hidden">
          {sortedProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <FolderKanban className="h-6 w-6 mx-auto text-slate-600 mb-1" />
              <p className="font-medium text-slate-300">No active engagements found</p>
              <p className="text-[11px]">Initialize a new project under an existing client account.</p>
            </div>
          ) : (
            sortedProjects.map((project) => {
              const progressPct = Math.round(
                (project.completedTasksCount / Math.max(1, project.tasksCount)) * 100
              );

              return (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    router.push(`/projects/${project.id}`);
                  }}
                  className="p-3.5 sm:p-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Project identity & Client */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {project.clientName}
                      </span>
                      <StatusBadge status={project.status} />
                      {project.stalledApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono">
                          Review Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-amber-400 transition-colors font-heading truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Progress & Metadata */}
                  <div className="flex items-center gap-6 sm:text-right flex-shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center sm:justify-end gap-2 text-[11px] font-mono text-slate-400">
                        <span>{project.completedTasksCount}/{project.tasksCount} Tasks</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-200">{progressPct}%</span>
                      </div>
                      <div className="w-28 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right hidden md:block min-w-[100px]">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Target: {project.targetDate ?? "Flexible"}
                      </span>
                      <span className="text-[11px] text-slate-300 block font-sans">
                        PM: {project.pmName}
                      </span>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors hidden sm:block" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 5. LEVEL 4: FINANCIAL SNAPSHOT & LEVEL 5: RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
        {/* Financial Snapshot */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">
              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
              <span>Financial Snapshot</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/finance")}
              className="text-xs text-amber-400 hover:text-amber-300 p-0 h-auto font-mono cursor-pointer"
            >
              <span>View Ledger</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-4">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/[0.04]">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Settled Revenue</span>
                <div className="text-base font-bold font-heading text-slate-100 mt-0.5">
                  {formatCurrency(reconciledAmount, "INR")}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Outstanding Invoices</span>
                <div className="text-base font-bold font-heading text-amber-400 mt-0.5">
                  {overdueInvoices.length > 0
                    ? formatCurrency(overdueInvoices.reduce((acc, i) => acc + i.remainingBalance, 0), "INR")
                    : "₹0"}
                </div>
              </div>
            </div>

            {/* Active Invoices mini-list */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Recent Invoices
              </div>
              {state.invoices.slice(0, 3).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/finance/invoices/${inv.id}`)}
                  className="flex items-center justify-between p-2 rounded bg-[#030706] border border-white/[0.04] text-xs hover:border-white/[0.12] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-200 text-xs">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{inv.clientName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-200 text-xs font-mono">{formatCurrency(inv.amount)}</span>
                    <div className="mt-0.5">
                      <StatusBadge status={inv.status} showIcon={false} className="text-[8px] px-1 py-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Activity Audit Log Stream */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span>Recent Activity Stream</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/audit")}
              className="text-xs text-amber-400 hover:text-amber-300 p-0 h-auto font-mono cursor-pointer"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="p-3 rounded-lg border border-white/[0.07] bg-[#060D0C] max-h-[300px] overflow-y-auto space-y-2">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent operational events logged.
              </div>
            ) : (
              auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-[#030706] border border-white/[0.04] text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-amber-400 font-semibold uppercase">
                      {log.action}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[10px]">
                    <strong className="text-slate-100">{log.actorId}</strong> acted on {log.entityType}{" "}
                    {log.entityId && <span className="text-slate-500 font-mono">({log.entityId})</span>}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 6. QUICK ACTIONS FOOTER STRIP */}
      <section className="pt-2">
        <div className="p-3.5 rounded-lg border border-white/[0.06] bg-[#060D0C]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span className="text-slate-200 font-medium font-heading">Studio Shortcuts:</span> Jump directly to key operations
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/projects")}
              className="text-[11px] h-7 px-2.5"
            >
              <FolderKanban className="h-3 w-3 mr-1 text-slate-400" />
              <span>Projects</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/finance")}
              className="text-[11px] h-7 px-2.5"
            >
              <CreditCard className="h-3 w-3 mr-1 text-slate-400" />
              <span>Invoices & GST</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/files")}
              className="text-[11px] h-7 px-2.5"
            >
              <FileText className="h-3 w-3 mr-1 text-slate-400" />
              <span>Deliverables Vault</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/meetings")}
              className="text-[11px] h-7 px-2.5"
            >
              <Calendar className="h-3 w-3 mr-1 text-slate-400" />
              <span>Review Sessions</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


