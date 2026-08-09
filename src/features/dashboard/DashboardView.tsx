"use client";

import React from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function DashboardView({ metrics }: { metrics?: DashboardMetrics }) {
  const router = useRouter();
  const { state, session, setSelectedProjectId, setIsCommandPaletteOpen } = useApp();

  const isClient = session?.isClient ?? false;
  const isFinance = session?.isFinance ?? false;
  const isStaff = session?.isStaff ?? false;

  // Use authoritative server metrics when provided, with clean state fallback
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

  const projects = metrics?.projectsSummary ?? state.projects;
  const auditLogs = metrics?.recentAuditLogs ?? state.auditLogs;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-100 flex items-center gap-2.5">
            <span>Operations Dashboard</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
              Live PostgreSQL
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Single source of truth for active projects, gated approvals, and reconciled financials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-xs bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-slate-300"
          >
            <Zap className="h-3 w-3 text-amber-400 mr-1.5" />
            <span>Command Palette (⌘K)</span>
          </Button>

          {!isClient && !isStaff && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/projects")}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-sm"
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
              className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              <span>Approve Pending Milestones</span>
            </Button>
          )}
        </div>
      </div>

      {/* 1. Escalation / Attention Alerts */}
      {(overdueTasks.length > 0 || overdueInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueTasks.length > 0 && !isClient && (
            <Alert
              variant="danger"
              ruleId="T-5"
              recoveryActionLabel="Reassign & Resolve"
              onRecoveryAction={() => {
                const target = overdueTasks[0]!;
                setSelectedProjectId(target.projectId);
                router.push(`/projects/${target.projectId}`);
              }}
            >
              <AlertTitle>Overdue Task Detected — Auto Escalated</AlertTitle>
              <AlertDescription>
                <strong>{overdueTasks[0]!.name}</strong> assigned to {overdueTasks[0]!.assigneeName} under{" "}
                <em>{overdueTasks[0]!.projectName}</em> was due on {overdueTasks[0]!.dueDate ?? "scheduled date"}.
              </AlertDescription>
            </Alert>
          )}

          {overdueInvoices.length > 0 && (isFinance || !isStaff) && (
            <Alert
              variant="warning"
              ruleId="PAY-3"
              recoveryActionLabel="View Invoice & Settle"
              onRecoveryAction={() => router.push("/finance")}
            >
              <AlertTitle>Payment Gate Warning: Overdue Invoice</AlertTitle>
              <AlertDescription>
                Invoice <strong>{overdueInvoices[0]!.invoiceNumber}</strong> ({formatCurrency(overdueInvoices[0]!.remainingBalance)}) is overdue. Subsequent milestone task creation is constrained.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* 2. KPI Cards Row with Authoritative Data */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-[#07100e] border-white/[0.07] hover:border-amber-500/25 transition-all">
          <CardHeader className="p-4 pb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Active Projects</span>
              <FolderKanban className="h-3.5 w-3.5 text-amber-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-slate-100">
              {activeProjectsCount}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium font-mono">
              <span>Live Database Records</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#07100e] border-white/[0.07] hover:border-amber-500/25 transition-all">
          <CardHeader className="p-4 pb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tasks in Progress</span>
              <CheckSquare className="h-3.5 w-3.5 text-sky-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-slate-100">
              {tasksInProgressCount}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400/90 font-medium font-mono">
              <span>{overdueTasks.length} overdue flagged</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#07100e] border-white/[0.07] hover:border-amber-500/25 transition-all">
          <CardHeader className="p-4 pb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Reconciled Collections</span>
              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-slate-100">
              {formatCurrency(reconciledAmount, "INR")}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium font-mono">
              <span>Rule PAY-2 Reconciled</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#07100e] border-white/[0.07] hover:border-amber-500/25 transition-all">
          <CardHeader className="p-4 pb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Audit Entries</span>
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-slate-100">
              {auditCount}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono">
              <span>PostgreSQL Immutable</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Grid: Active Projects & Real-Time Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Active Client Engagements
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/projects")}
              className="text-xs text-amber-400 hover:text-amber-300 p-0 h-auto"
            >
              <span>View all projects</span>
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2.5">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  router.push(`/projects/${project.id}`);
                }}
                className="p-3.5 rounded bg-[#07100e] border border-white/[0.07] hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {project.clientName}
                      </span>
                      <StatusBadge status={project.status} />
                      {project.stalledApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Approval Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Target: {project.targetDate ?? "Flexible"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-300 block mt-0.5">
                      PM: {project.pmName}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>
                      <strong className="text-slate-200">{project.completedTasksCount}</strong> of <strong className="text-slate-200">{project.tasksCount}</strong> Tasks Complete
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-200">{project.completedServicesCount}</strong> of <strong className="text-slate-200">{project.servicesCount}</strong> Services Complete
                    </span>
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.round((project.completedTasksCount / Math.max(1, project.tasksCount)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Audit & Activity Feed */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Audit Event Trail
            </h2>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
              Rule AL-1 Immutable
            </span>
          </div>

          <Card className="h-[380px] overflow-y-auto space-y-2 p-2.5 bg-[#07100e] border-white/[0.07]">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded border border-white/[0.04] bg-[#040908] text-xs space-y-1"
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
                  {log.entityId && <em className="text-slate-400">({log.entityId})</em>}
                </p>
                {log.justification && (
                  <p className="text-[9px] text-slate-400 italic">
                    &ldquo;{log.justification}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
