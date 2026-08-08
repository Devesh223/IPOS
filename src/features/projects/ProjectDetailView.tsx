"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

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
    session,
  } = useApp();

  const [activeTab, setActiveTab] = useState("milestones");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<"APPROVED" | "REJECTED" | "CHANGES_REQUESTED">("APPROVED");
  const [approvalComment, setApprovalComment] = useState("");
  const [overrideJustification, setOverrideJustification] = useState("");
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const effectiveProjects = initialData?.projects && initialData.projects.length > 0 ? initialData.projects : state.projects;
  const effectiveTasks = initialData?.tasks && initialData.tasks.length > 0 ? initialData.tasks : state.tasks;
  const effectiveInvoices = initialData?.invoices && initialData.invoices.length > 0 ? initialData.invoices : state.invoices;

  const effectiveId = projectId || selectedProjectId;
  const project = effectiveProjects.find((p) => p.id === effectiveId) || effectiveProjects[0]!;
  const projectTasks = effectiveTasks.filter((t) => t.projectId === project.id);
  const projectInvoices = effectiveInvoices.filter((i) => i.projectId === project.id);

  const isClient = session?.isClient ?? false;
  const isSuperAdminOrAdmin = session?.isAdmin ?? true;

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

  const tabsList = [
    { id: "overview", label: "Overview" },
    { id: "milestones", label: "Services & Milestones", count: project.servicesCount },
    { id: "tasks", label: "Tasks", count: projectTasks.length },
    { id: "deliverables", label: "Deliverables", count: 2 },
    { id: "payments", label: "Payments & Invoices", count: projectInvoices.length },
    { id: "agreements", label: "Agreements", count: 1 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumbs (Phase 2 Section 2.6) */}
      <Breadcrumb
        items={[
          { label: "Clients", href: "#" },
          { label: project.clientName, href: "#" },
          { label: project.name },
        ]}
      />

      {/* Project Header Banner */}
      <div className="p-6 rounded-lg border border-white/10 bg-brand-dark/95 backdrop-blur-md shadow-elevation-1 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-white/5 text-xs font-mono text-brand-counter border border-white/5">
                {project.clientName}
              </span>
              <StatusBadge status={project.status} />
              <span className="text-xs text-brand-counter font-mono">
                Rule P-1 Bound
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-heading text-brand-light">
              {project.name}
            </h1>
            <p className="text-xs text-brand-counter max-w-2xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isSuperAdminOrAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOverrideModalOpen(true)}
                className="text-xs"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-brand-cta" />
                <span>Admin Override (Rule P-4)</span>
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsApprovalModalOpen(true)}
              className="text-xs"
            >
              <FileCheck className="h-3.5 w-3.5 mr-1.5" />
              <span>Review & Approve Milestone</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/5 text-xs text-brand-counter">
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-60">
              Assigned PM (Rule P-2)
            </span>
            <span className="font-medium text-brand-light mt-0.5 block">
              {project.pmName ?? "Aarav Sharma"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-60">
              Target Completion
            </span>
            <span className="font-medium text-brand-light mt-0.5 block font-mono">
              {project.targetDate}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-60">
              Task Rollup (Rule S-2)
            </span>
            <span className="font-medium text-brand-light mt-0.5 block">
              {project.completedTasksCount} / {project.tasksCount} Completed
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-60">
              Invoiced Balance
            </span>
            <span className="font-medium text-emerald-400 mt-0.5 block font-mono">
              ₹1,50,000 Issued
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Services & Milestones (Core Containment Chain) */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-brand-light">
              Service 1: Packaging & Print Identity
            </h2>
            <StatusBadge status="IN_PROGRESS" />
          </div>

          {/* Milestone Card */}
          <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-cta">
                    Milestone 01
                  </span>
                  <StatusBadge status="SUBMITTED_FOR_APPROVAL" />
                </div>
                <h3 className="text-base font-semibold text-brand-light font-heading mt-1">
                  Primary Box Packaging Design
                </h3>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsApprovalModalOpen(true)}
              >
                <span>Record Formal Approval (Rule A-1)</span>
              </Button>
            </div>

            {/* Deliverable Under Review Box */}
            <div className="p-4 rounded-md bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-light">
                  Attached Deliverable: Matte Gold Die-Lines v2.0
                </span>
                <span className="text-[11px] font-mono text-brand-cta">
                  Version 2 (Preserved v1)
                </span>
              </div>
              <p className="text-xs text-brand-counter">
                Vector die-lines with pantone metallic gold foil separations for artisanal tea boxes.
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-brand-counter">
                <span>Submitted by Rohan Verma (Designer)</span>
                <span>Requires Client Sign-off</span>
              </div>
            </div>

            {/* Tasks under this Milestone */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-brand-counter font-semibold">
                Gating Tasks ({projectTasks.length})
              </span>
              <div className="space-y-2">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded border border-white/5 bg-brand-main-dark/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={task.status} />
                      <span className="text-brand-light font-medium">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-brand-counter">
                      <span>{task.assigneeName}</span>
                      {task.isOverdue && (
                        <span className="px-1.5 py-0.2 rounded bg-status-danger/20 text-status-danger font-semibold uppercase">
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

      {/* Tab 2: Tasks View */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-brand-light">
              Assigned Project Tasks (Rule T-1 Single Ownership)
            </h2>
          </div>
          <div className="space-y-2">
            {projectTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border border-white/10 bg-brand-dark/90 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <span className="text-sm font-semibold text-brand-light">{task.name}</span>
                  </div>
                  <p className="text-xs text-brand-counter">{task.description}</p>
                </div>
                <div className="text-right text-xs text-brand-counter">
                  <span className="font-medium text-brand-light block">{task.assigneeName}</span>
                  <span className="font-mono text-[11px] block mt-0.5">Due: {task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Milestone Approval (Phase 2 Section 4.4, Rule A-1, A-3, A-4) */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Milestone Formal Approval Decision"
        description="Every decision is immutable, permanently logged in the Audit Log, and gates project delivery."
        size="md"
      >
        <div className="space-y-4 text-xs">
          <Alert variant="warning" ruleId="A-1">
            <AlertTitle>Immutable Decision Notice</AlertTitle>
            <AlertDescription>
              Your decision cannot be deleted or casually altered. If subsequent defects are found, a formal Reopen must be recorded.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="font-semibold text-brand-light block">
              Approval Decision:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setApprovalDecision("APPROVED")}
                className={`p-2.5 rounded-md border text-center font-medium transition-all ${
                  approvalDecision === "APPROVED"
                    ? "border-status-success bg-emerald-950/80 text-emerald-300 ring-1 ring-status-success"
                    : "border-white/10 bg-white/5 text-brand-counter"
                }`}
              >
                Approve (Accept)
              </button>
              <button
                type="button"
                onClick={() => setApprovalDecision("CHANGES_REQUESTED")}
                className={`p-2.5 rounded-md border text-center font-medium transition-all ${
                  approvalDecision === "CHANGES_REQUESTED"
                    ? "border-brand-cta bg-amber-950/80 text-amber-300 ring-1 ring-brand-cta"
                    : "border-white/10 bg-white/5 text-brand-counter"
                }`}
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={() => setApprovalDecision("REJECTED")}
                className={`p-2.5 rounded-md border text-center font-medium transition-all ${
                  approvalDecision === "REJECTED"
                    ? "border-status-danger bg-red-950/80 text-red-300 ring-1 ring-status-danger"
                    : "border-white/10 bg-white/5 text-brand-counter"
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-brand-light block">
              Decision Reason & Feedback (Mandatory for Changes / Rejection per Rule AL-5):
            </label>
            <textarea
              rows={3}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="State clear reasons or instructions for the design team..."
              className="w-full rounded-md border border-white/10 bg-brand-main-dark/80 p-2.5 text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-cta"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRecordApproval}>
              <span>Confirm & Write Audit Log</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Admin Override (Rule P-4 / AL-6) */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Admin Project Completion Override"
        description="Authorized for Super Admin & Admin only. Unsettled invoice gates will be overridden with logged justification."
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <Alert variant="danger" ruleId="AL-6">
            <AlertTitle>Audit Justification Required</AlertTitle>
            <AlertDescription>
              This override allows project completion despite unpaid invoices. A justification string is mandatory and cannot be left blank.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <label className="font-semibold text-brand-light block">
              Override Justification:
            </label>
            <textarea
              rows={3}
              value={overrideJustification}
              onChange={(e) => setOverrideJustification(e.target.value)}
              placeholder="e.g. Client agreed to settle invoice on annual retainer cycle..."
              className="w-full rounded-md border border-white/10 bg-brand-main-dark/80 p-2.5 text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-cta"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
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
    </div>
  );
}
