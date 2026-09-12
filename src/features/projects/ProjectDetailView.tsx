"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Lock,
  Unlock,
  Plus,
  FileCheck,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Receipt,
  Download,
  Eye,
  FileText,
  CreditCard,
  Shield,
  Layers,
  History,
  CheckSquare,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

export function ProjectDetailView({
  projectId,
  initialData,
}: {
  projectId?: string;
  initialData?: { projects: any[]; tasks: any[]; invoices: any[] };
}) {
  const {
    state,
    selectedProjectId,
    recordApprovalDecision,
    overrideProjectInvoiceGate,
    reassignTask,
    session,
  } = useApp();

  const [activeTab, setActiveTab] = useState("overview");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<"APPROVED" | "REJECTED" | "CHANGES_REQUESTED">("APPROVED");
  const [approvalComment, setApprovalComment] = useState("");
  const [overrideJustification, setOverrideJustification] = useState("");
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Task Inspection / Reassignment Drawer state
  const [inspectedTask, setInspectedTask] = useState<any>(null);
  const [newAssigneeId, setNewAssigneeId] = useState("user-designer-1");
  const [newAssigneeName, setNewAssigneeName] = useState("Rohan Verma");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const effectiveProjects = initialData?.projects && initialData.projects.length > 0 ? initialData.projects : state.projects;
  const effectiveTasks = initialData?.tasks && initialData.tasks.length > 0 ? initialData.tasks : state.tasks;
  const effectiveInvoices = initialData?.invoices && initialData.invoices.length > 0 ? initialData.invoices : state.invoices;

  const effectiveId = projectId || selectedProjectId;
  const project = effectiveProjects.find((p) => p.id === effectiveId) || effectiveProjects[0]!;
  const projectTasks = effectiveTasks.filter((t) => t.projectId === project.id);
  const projectInvoices = effectiveInvoices.filter((i) => i.projectId === project.id);
  const projectAuditLogs = state.auditLogs.filter((l) => l.entityId === project.id || l.action.includes("project") || l.action.includes("milestone"));

  const isClient = session?.isClient ?? false;
  const isSuperAdminOrAdmin = session?.isAdmin ?? true;

  const completionPct = Math.round(
    (project.completedTasksCount / Math.max(1, project.tasksCount)) * 100
  );

  const totalInvoiced = projectInvoices.reduce((acc, i) => acc + i.amount, 0);
  const totalPaid = projectInvoices.reduce((acc, i) => acc + (i.paidAmount || (i.status === "PAID" ? i.amount : 0)), 0);
  const remainingBalance = Math.max(0, totalInvoiced - totalPaid);

  const handleRecordApproval = () => {
    recordApprovalDecision({
      milestoneId: "ms-packaging",
      decision: approvalDecision,
      comment: approvalComment,
    });
    setIsApprovalModalOpen(false);
    setApprovalComment("");
  };

  const handleApplyOverride = () => {
    overrideProjectInvoiceGate(project.id, overrideJustification);
    setIsOverrideModalOpen(false);
    setOverrideJustification("");
  };

  const handleConfirmReassign = () => {
    if (inspectedTask) {
      reassignTask(inspectedTask.id, newAssigneeId, newAssigneeName);
      setInspectedTask(null);
    }
  };

  const filteredTasks = projectTasks.filter((t) =>
    t.name.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
    t.assigneeName.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
    t.status.toLowerCase().includes(taskSearchQuery.toLowerCase())
  );

  const tabsList = [
    { id: "overview", label: "Overview" },
    { id: "milestones", label: "Milestones", count: project.servicesCount },
    { id: "tasks", label: "Tasks", count: projectTasks.length },
    { id: "deliverables", label: "Deliverables", count: 2 },
    { id: "finance", label: "Finance", count: projectInvoices.length },
    { id: "activity", label: "Activity", count: projectAuditLogs.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back to Directory Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center text-xs text-slate-400 hover:text-amber-400 font-mono transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span>Back to Projects Directory</span>
        </Link>
        <span className="text-[10px] font-mono text-slate-500">
          ID: {project.id}
        </span>
      </div>

      {/* Executive Project Dossier Header */}
      <div className="p-5 sm:p-6 rounded-lg border border-white/[0.08] bg-[#060D0C] shadow-elevation-1 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[11px] font-mono text-slate-300 border border-white/[0.06]">
                {project.clientName}
              </span>
              <StatusBadge status={project.status} />
              {project.stalledApprovalsCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono">
                  Review Pending
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-heading text-slate-100 truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed font-sans">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start md:self-auto flex-shrink-0">
            {isSuperAdminOrAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOverrideModalOpen(true)}
                className="text-xs"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1 text-amber-400" />
                <span>Admin Override (Rule P-4)</span>
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsApprovalModalOpen(true)}
              className="text-xs"
            >
              <FileCheck className="h-3.5 w-3.5 mr-1" />
              <span>Review & Sign-Off</span>
            </Button>
          </div>
        </div>

        {/* Header Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/[0.04] text-xs text-slate-400">
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Project Manager
            </span>
            <span className="font-medium text-slate-200 mt-0.5 block truncate">
              {project.pmName ?? "Aarav Sharma"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Target Completion
            </span>
            <span className="font-mono text-slate-200 mt-0.5 block">
              {project.targetDate ?? "Flexible"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Tasks Rollup
            </span>
            <span className="font-medium text-slate-200 mt-0.5 block">
              {project.completedTasksCount}/{project.tasksCount} Complete ({completionPct}%)
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Financial Status
            </span>
            <span className="font-mono text-emerald-400 mt-0.5 block font-medium">
              {remainingBalance === 0 ? "Fully Reconciled" : `${formatCurrency(remainingBalance)} Outstanding`}
            </span>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure Navigation Tabs */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h2 className="text-sm font-semibold font-heading text-slate-200">
                Engagement Scope & Architecture
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {project.description || "Comprehensive creative delivery engagement spanning brand refresh, packaging die-line generation, pantone foil separations, and physical proofing."}
              </p>
              <div className="pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Governance Master Contract</span>
                  <span className="text-emerald-400 font-mono font-medium block mt-0.5">Active Master Agreement (Rule AG-3)</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Payment Delivery Gate</span>
                  <span className="text-slate-300 font-mono font-medium block mt-0.5">
                    {remainingBalance === 0 ? "Rule PAY-3 Clear" : "Pending Invoice Settlement"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h3 className="text-sm font-semibold font-heading text-slate-200">
                Active Service Scope
              </h3>
              <div className="p-3 rounded bg-[#030706] border border-white/[0.04] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200">Service: Packaging & Print Identity</span>
                  <p className="text-[11px] text-slate-400">Milestone: Primary Box Packaging Design</p>
                </div>
                <StatusBadge status="SUBMITTED_FOR_APPROVAL" />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Studio Leadership
              </h3>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="h-8 w-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  {project.pmName ? project.pmName.charAt(0) : "A"}
                </div>
                <div>
                  <span className="font-medium text-slate-200 block">{project.pmName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Assigned Project Manager</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3 bg-[#060D0C] border-white/[0.07]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Client Stakeholder
              </h3>
              <div className="space-y-1 text-xs font-sans">
                <span className="font-semibold text-slate-200 block">{project.clientName}</span>
                <span className="text-[11px] text-slate-400 block">Authorized Signatory: Devika Sen</span>
                <span className="text-[11px] text-slate-400 font-mono block">devika@mitti.in</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONES (Roadmap View) */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Delivery Roadmap & Milestone Gates
            </h2>
            <StatusBadge status="IN_PROGRESS" />
          </div>

          <div className="p-5 rounded-lg border border-white/[0.07] bg-[#060D0C] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    Milestone 01
                  </span>
                  <StatusBadge status="SUBMITTED_FOR_APPROVAL" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100 font-heading mt-0.5">
                  Primary Box Packaging Design
                </h3>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsApprovalModalOpen(true)}
                className="text-xs"
              >
                <span>Record Formal Approval (Rule A-1)</span>
              </Button>
            </div>

            {/* Attached Deliverable Package */}
            <div className="p-3.5 rounded bg-[#030706] border border-white/[0.04] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  Attached Deliverable: Matte Gold Die-Lines v2.0
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  Version 2 (Preserved v1)
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Vector die-lines with pantone metallic gold foil separations for artisanal tea boxes. Verified against physical print parameters.
              </p>
            </div>

            {/* Gating Tasks */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Gating Tasks ({projectTasks.length})
              </span>
              <div className="divide-y divide-white/[0.03] rounded border border-white/[0.04] bg-[#030706]">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={task.status} className="text-[9px]" />
                      <span className="text-slate-200 font-medium">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>{task.assigneeName}</span>
                      {task.isOverdue && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 font-semibold uppercase text-[9px] border border-rose-800/40">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TASKS (Linear-Style Clean Table) */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Assigned Workload (Rule T-1 Single Ownership)
            </h2>
            <div className="relative max-w-xs w-full">
              <Search className="h-3 w-3 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter tasks or assignees..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] divide-y divide-white/[0.04] overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tasks match your search filter.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} className="text-[9px]" />
                      <span className="text-xs font-semibold text-slate-200">{task.name}</span>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 font-sans">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 justify-between sm:justify-end flex-shrink-0">
                    <div className="text-right">
                      <span className="font-medium text-slate-200 block text-xs">{task.assigneeName}</span>
                      <span className="font-mono text-[10px] text-slate-500 block">Due: {task.dueDate ?? "Flexible"}</span>
                    </div>
                    {isSuperAdminOrAdmin && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInspectedTask(task)}
                        className="h-7 text-xs px-2.5"
                      >
                        <span>Reassign</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERABLES (Asset Vault) */}
      {activeTab === "deliverables" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Version-Locked Deliverables Vault (Rule S-4)
            </h2>
            <span className="text-[10px] font-mono text-slate-500">
              Preserved & Immutable
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100">Mitti_Matte_Gold_DieLines_v2.0.ai</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300">v2.0</span>
                  <StatusBadge status="UNDER_REVIEW" />
                </div>
                <p className="text-slate-400 text-[11px]">Primary Box Packaging Design • 48.2 MB • Vector CMYK + Pantone 871C</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="secondary" className="text-xs h-7">
                  <Eye className="h-3 w-3 mr-1 text-amber-400" />
                  <span>Inspect</span>
                </Button>
                <Button size="sm" variant="primary" className="text-xs h-7">
                  <Download className="h-3 w-3 mr-1" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100">Mitti_Amber_Glass_Studio_Render_4K.png</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-400">v1.0</span>
                  <StatusBadge status="APPROVED" />
                </div>
                <p className="text-slate-400 text-[11px]">3D Jar Mockup • 18.6 MB • 3840 x 2160 (16:9)</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="secondary" className="text-xs h-7">
                  <Eye className="h-3 w-3 mr-1 text-amber-400" />
                  <span>Inspect</span>
                </Button>
                <Button size="sm" variant="primary" className="text-xs h-7">
                  <Download className="h-3 w-3 mr-1" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCE */}
      {activeTab === "finance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Project Financial Dossier & Invoices
            </h2>
            <Link href="/finance">
              <Button variant="secondary" size="sm" className="text-xs">
                <span>View Full Finance Hub</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border border-white/[0.07] bg-[#060D0C] text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Invoiced</span>
              <span className="text-sm font-bold font-mono text-slate-100 block mt-0.5">{formatCurrency(totalInvoiced)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Settled Collections</span>
              <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">{formatCurrency(totalPaid)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Outstanding Balance</span>
              <span className="text-sm font-bold font-mono text-amber-400 block mt-0.5">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {projectInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-lg border border-white/[0.07] bg-[#060D0C] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{inv.invoiceNumber}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-slate-400 text-[11px]">Due Date: {inv.dueDate}</p>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <span className="font-mono font-bold">{formatCurrency(inv.amount)}</span>
                  <Link href={`/finance/invoices/${inv.id}`}>
                    <Button size="sm" variant="secondary" className="h-7 text-xs">
                      <span>Inspect Invoice</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVITY (Forensic Audit Trail) */}
      {activeTab === "activity" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Forensic Project Audit Log (Rule AL-1 Immutable)
            </h2>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
              PostgreSQL Verified
            </span>
          </div>

          <div className="space-y-2">
            {projectAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg border border-white/[0.04] bg-[#060D0C] text-xs space-y-1 font-sans"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  <strong>{log.actorName || log.actorId}</strong> acted on {log.entityType}
                </p>
                {log.justification && (
                  <p className="text-[11px] text-slate-400 italic">
                    &ldquo;{log.justification}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Milestone Approval */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Milestone Formal Approval Decision"
        description="Every decision is immutable, permanently logged in the Audit Log, and gates project delivery."
        size="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <Alert variant="warning" ruleId="A-1">
            <AlertTitle>Immutable Decision Notice</AlertTitle>
            <AlertDescription>
              Your decision cannot be deleted or casually altered. If subsequent defects are found, a formal Reopen must be recorded.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="font-semibold text-slate-200 block">
              Approval Decision:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setApprovalDecision("APPROVED")}
                className={`p-2.5 rounded border text-center font-medium transition-all cursor-pointer ${
                  approvalDecision === "APPROVED"
                    ? "border-emerald-500 bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                }`}
              >
                Approve (Accept)
              </button>
              <button
                type="button"
                onClick={() => setApprovalDecision("CHANGES_REQUESTED")}
                className={`p-2.5 rounded border text-center font-medium transition-all cursor-pointer ${
                  approvalDecision === "CHANGES_REQUESTED"
                    ? "border-amber-500 bg-amber-950/80 text-amber-300 ring-1 ring-amber-500"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                }`}
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={() => setApprovalDecision("REJECTED")}
                className={`p-2.5 rounded border text-center font-medium transition-all cursor-pointer ${
                  approvalDecision === "REJECTED"
                    ? "border-rose-500 bg-rose-950/80 text-rose-300 ring-1 ring-rose-500"
                    : "border-white/[0.08] bg-white/[0.03] text-slate-400"
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">
              Decision Reason & Feedback:
            </label>
            <textarea
              rows={3}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="State clear reasons or instructions for the design team..."
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2.5 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRecordApproval}>
              <span>Confirm & Write Audit Log</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Admin Override */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Admin Project Completion Override"
        description="Authorized for Super Admin & Admin only. Unsettled invoice gates will be overridden with logged justification."
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          <Alert variant="danger" ruleId="AL-6">
            <AlertTitle>Audit Justification Required</AlertTitle>
            <AlertDescription>
              This override allows project completion despite unpaid invoices. A justification string is mandatory and cannot be left blank.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">
              Override Justification:
            </label>
            <textarea
              rows={3}
              value={overrideJustification}
              onChange={(e) => setOverrideJustification(e.target.value)}
              placeholder="e.g. Client agreed to settle invoice on annual retainer cycle..."
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2.5 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!overrideJustification.trim()}
              onClick={handleApplyOverride}
            >
              <span>Record Justified Override</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Drawer: Task Reassignment */}
      <Drawer
        isOpen={!!inspectedTask}
        onClose={() => setInspectedTask(null)}
        title="Task Workload & Ownership"
        description="Reassigns task execution pursuant to Rule T-1 single ownership."
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="p-3.5 rounded bg-[#030706] border border-white/[0.06] space-y-1.5">
            <span className="font-semibold text-slate-200 block text-xs">{inspectedTask?.name}</span>
            <p className="text-slate-400 text-[11px]">{inspectedTask?.description}</p>
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Current Assignee: {inspectedTask?.assigneeName}</span>
              <span>Due: {inspectedTask?.dueDate ?? "Flexible"}</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Select New Assignee:</label>
            <select
              value={newAssigneeId}
              onChange={(e) => {
                setNewAssigneeId(e.target.value);
                setNewAssigneeName(e.target.options[e.target.selectedIndex]?.text || "Assignee");
              }}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            >
              <option value="user-designer-1">Rohan Verma (Senior Designer)</option>
              <option value="user-dev-1">Ananya Iyer (Frontend Engineer)</option>
              <option value="user-pm-1">Aarav Sharma (Project Manager)</option>
              <option value="user-freelance-1">Vikram Sengupta (3D Motion)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setInspectedTask(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmReassign}>
              <span>Confirm Reassignment</span>
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}


