"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { TrendingUp, Activity, CheckCircle, AlertOctagon, Users, Zap } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function AnalyticsView() {
  const { state } = useApp();

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((t) => t.status === "COMPLETE").length;
  const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : null;

  const totalProjects = state.projects.length;
  const activeProjects = state.projects.filter((p) => p.status === "ACTIVE").length;

  const totalAuditEntries = state.auditLogs.length;

  const hasData = totalTasks > 0 || totalProjects > 0 || totalAuditEntries > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono border border-amber-500/20">
              Live Velocity Tracking
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Sprint Throughput
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100">
            Studio Velocity & Operations Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Authoritative throughput metrics, PM milestone cadence, and sprint delivery health.
          </p>
        </div>
      </div>

      {!hasData ? (
        <Card className="bg-[#060D0C] border-white/[0.07] p-8 text-center">
          <CardContent className="space-y-3">
            <Activity className="h-8 w-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">No Analytics Data Available Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Production analytics calculate automatically as workspace projects, milestones, tasks, and audit logs record live activity.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Analytics KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="bg-[#060D0C] border-white/[0.07]">
              <CardHeader className="p-4 pb-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Task Completion Rate</span>
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold font-heading text-slate-100 font-mono">
                  {taskCompletionRate !== null ? `${taskCompletionRate}%` : "N/A"}
                </div>
                <p className="text-[10px] text-emerald-400 mt-1 font-mono">{completedTasks} of {totalTasks} tasks completed</p>
              </CardContent>
            </Card>

            <Card className="bg-[#060D0C] border-white/[0.07]">
              <CardHeader className="p-4 pb-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Active Projects</span>
                  <CheckCircle className="h-3.5 w-3.5 text-amber-400" />
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold font-heading text-slate-100 font-mono">
                  {activeProjects}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{totalProjects} total projects in workspace</p>
              </CardContent>
            </Card>

            <Card className="bg-[#060D0C] border-white/[0.07]">
              <CardHeader className="p-4 pb-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Audit Trail Logged</span>
                  <Zap className="h-3.5 w-3.5 text-sky-400" />
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold font-heading text-slate-100 font-mono">
                  {totalAuditEntries}
                </div>
                <p className="text-[10px] text-sky-400 mt-1 font-mono">Immutable audit records</p>
              </CardContent>
            </Card>

            <Card className="bg-[#060D0C] border-white/[0.07]">
              <CardHeader className="p-4 pb-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Invoices</span>
                  <AlertOctagon className="h-3.5 w-3.5 text-purple-400" />
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold font-heading text-slate-100 font-mono">
                  {state.invoices.length}
                </div>
                <p className="text-[10px] text-purple-400 mt-1 font-mono">Ledger invoices</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

