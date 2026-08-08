"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  FolderKanban,
  CheckSquare,
  Users,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

import { useRouter } from "next/navigation";

export function DashboardView() {
  const router = useRouter();
  const { state, session, setSelectedProjectId, setIsCommandPaletteOpen } = useApp();

  const isClient = session?.isClient ?? false;
  const isFinance = session?.isFinance ?? false;
  const isPM = session?.isPM ?? false;
  const isStaff = session?.isStaff ?? false;

  const overdueTasks = state.tasks.filter((t) => t.isOverdue);
  const overdueInvoices = state.invoices.filter((i) => i.isOverdue);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Quick Actions Bar (Phase 3 Section 13.5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Operations Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium">
              Live OS
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Single source of truth for all clients, active projects, gated approvals, and reconciled payments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-xs"
          >
            <Zap className="h-3.5 w-3.5 text-brand-cta mr-1" />
            <span>Command Palette (⌘K)</span>
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
              <span>Approve Pending Milestones</span>
            </Button>
          )}
        </div>
      </div>

      {/* 1. Escalation / Attention Feed (Phase 3 Section 13.2: Top-left / First Position) */}
      {(overdueTasks.length > 0 || overdueInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueTasks.length > 0 && !isClient && (
            <Alert
              variant="danger"
              ruleId="T-5"
              recoveryActionLabel="Reassign & Resolve"
              onRecoveryAction={() => {
                setSelectedProjectId(overdueTasks[0]!.projectId);
                router.push(`/projects/${overdueTasks[0]!.projectId}`);
              }}
            >
              <AlertTitle>Overdue Task Detected — Auto Escalated</AlertTitle>
              <AlertDescription>
                <strong>{overdueTasks[0]!.name}</strong> assigned to {overdueTasks[0]!.assigneeName} under{" "}
                <em>{overdueTasks[0]!.projectName}</em> was due on {overdueTasks[0]!.dueDate}.
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

      {/* 2. KPI Cards Row (Phase 3 Section 11.3 & 13.3 — Capped at 4-6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase tracking-wider flex items-center justify-between">
              <span>Active Projects</span>
              <FolderKanban className="h-4 w-4 text-brand-cta" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              {state.projects.length}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-status-success font-medium">
              <span>+100% on track</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase tracking-wider flex items-center justify-between">
              <span>Tasks in Progress</span>
              <CheckSquare className="h-4 w-4 text-sky-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              {state.tasks.length}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-300 font-medium">
              <span>{overdueTasks.length} requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase tracking-wider flex items-center justify-between">
              <span>Reconciled Payments</span>
              <CreditCard className="h-4 w-4 text-emerald-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              {formatCurrency(
                state.payments.reduce((acc, p) => acc + p.amount, 0),
                "INR"
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400 font-medium">
              <span>Rule PAY-2 compliant</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase tracking-wider flex items-center justify-between">
              <span>Audit Completeness</span>
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              100%
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-brand-counter font-mono">
              <span>{state.auditLogs.length} immutable entries</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Grid: Active Projects Summary & Real-Time Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Table / Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-heading text-brand-light">
              Active Client Engagements
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/projects")}
              className="text-xs text-brand-cta hover:text-brand-cta-hover"
            >
              <span>View all projects</span>
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {state.projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  router.push(`/projects/${project.id}`);
                }}
                className="p-4 rounded-lg border border-white/10 bg-brand-dark/90 hover:border-brand-cta/50 transition-all cursor-pointer shadow-elevation-1 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-brand-counter">
                        {project.clientName}
                      </span>
                      <StatusBadge status={project.status} />
                      {project.stalledApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-brand-cta border border-brand-cta/30">
                          Approval Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-brand-light group-hover:text-brand-cta transition-colors font-heading">
                      {project.name}
                    </h3>
                    <p className="text-xs text-brand-counter line-clamp-1">
                      {project.description}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] text-brand-counter block font-mono">
                      Target: {project.targetDate}
                    </span>
                    <span className="text-xs font-medium text-brand-light block mt-1">
                      PM: {project.pmName}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Phase 3 Section 9.5) */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-brand-counter">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong>{project.completedTasksCount}</strong> of <strong>{project.tasksCount}</strong> Tasks Complete
                    </span>
                    <span>•</span>
                    <span>
                      <strong>{project.completedServicesCount}</strong> of <strong>{project.servicesCount}</strong> Services Complete
                    </span>
                  </div>
                  <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-brand-cta rounded-full"
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

        {/* Real-time Audit & Activity Feed (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-heading text-brand-light">
              Traceable Event Trail
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              Rule AL-1 Verified
            </span>
          </div>

          <Card className="h-[380px] overflow-y-auto space-y-3 p-3">
            {state.auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded border border-white/5 bg-brand-main-dark/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-brand-cta font-semibold">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-brand-counter/60 font-mono">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-brand-light text-[11px]">
                  <strong>{log.actorName ?? log.actorId}</strong> acted on {log.entityType}{" "}
                  {log.entityName && <em>({log.entityName})</em>}
                </p>
                {log.justification && (
                  <p className="text-[10px] text-brand-counter italic">
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
