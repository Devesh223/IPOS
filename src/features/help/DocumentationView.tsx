"use client";

import React, { useState } from "react";
import { BookOpen, Shield, CheckCircle2, Lock, AlertTriangle, Search, Filter } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function DocumentationView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const ruleCategories = [
    { id: "ALL", label: "All Operational Rules" },
    { id: "GOVERNANCE", label: "Governance (G-1 to G-9)" },
    { id: "PROJECTS", label: "Projects & Scopes (P-1 to P-4)" },
    { id: "TASKS", label: "Task Execution (T-1 to T-5)" },
    { id: "APPROVALS", label: "Client Approvals (A-1 to A-6)" },
    { id: "PAYMENTS", label: "Payments & Invoicing (PAY-1 to PAY-4)" },
    { id: "AUDIT", label: "Audit Log (AL-1 to AL-8)" },
  ];

  const rules = [
    {
      id: "G-1",
      category: "GOVERNANCE",
      title: "Workspace Multi-Tenancy Containment",
      summary: "All operations, projects, tasks, deliverables, and invoices belong strictly to an isolated Workspace.",
      detail: "No cross-tenant data leakage is permitted. All queries, mutations, and audit streams must include workspaceId.",
    },
    {
      id: "G-6",
      category: "GOVERNANCE",
      title: "Scoped Role Enforcement",
      summary: "Contractors, freelancers, and clients operate under strictly scoped role-based access control.",
      detail: "Freelancers only see their assigned project/task. Clients only see their engagement. Internal staff operate with PM or Admin authority.",
    },
    {
      id: "G-9",
      category: "GOVERNANCE",
      title: "Explicit Timestamp & Timezone Standard",
      summary: "All system events are logged in ISO-8601 UTC and rendered in workspace timezone (Asia/Kolkata).",
      detail: "Relative timestamps must always provide absolute datetime tooltips for precision.",
    },
    {
      id: "P-1",
      category: "PROJECTS",
      title: "Project Containment Hierarchy",
      summary: "Services and Milestones must be strictly nested under an Active Client Project.",
      detail: "Orphaned services or uncontained tasks are disallowed. Project status transitions gate milestone deliveries.",
    },
    {
      id: "P-2",
      category: "PROJECTS",
      title: "Single Project Manager Ownership",
      summary: "Every project must have exactly one primary Project Manager assigned at all times.",
      detail: "PM reassignments must be justified and recorded in the audit trail.",
    },
    {
      id: "P-4",
      category: "PROJECTS",
      title: "Admin Project Completion Override",
      summary: "Super Admin or Admin may override blocked gates with mandatory written justification.",
      detail: "The justification string cannot be empty and is permanently stamped into the immutable audit record (Rule AL-6).",
    },
    {
      id: "T-1",
      category: "TASKS",
      title: "Single Task Assignee Responsibility",
      summary: "Every task has exactly one primary assignee to eliminate diffuse responsibility.",
      detail: "Collaborators can be tagged, but accountability rests with the designated assignee.",
    },
    {
      id: "T-3",
      category: "TASKS",
      title: "Reassignment Justification",
      summary: "Task reassignments trigger an automated audit log entry with PM operational rationale.",
      detail: "Ensures transparent workload balancing across internal design and development staff.",
    },
    {
      id: "T-5",
      category: "TASKS",
      title: "Automated Overdue Escalation",
      summary: "Tasks past due date automatically enter an escalated state on the Operations Dashboard.",
      detail: "Provides prominent visual cues and quick-action resolution links for the Project Manager.",
    },
    {
      id: "A-1",
      category: "APPROVALS",
      title: "Immutable Client Approval Decisions",
      summary: "Formal milestone approval decisions (APPROVED, REJECTED, CHANGES_REQUESTED) cannot be deleted.",
      detail: "State transitions are permanent. Reverting an approved milestone requires a formal Reopen event (Rule A-3).",
    },
    {
      id: "A-3",
      category: "APPROVALS",
      title: "Formal Reopen Protocol",
      summary: "Reopening a signed-off milestone creates a distinct audit record and notification to leadership.",
      detail: "Prevents silent scope creep and ensures client change requests are documented.",
    },
    {
      id: "PAY-1",
      category: "PAYMENTS",
      title: "Independent Payment Recording",
      summary: "Payments are recorded with Bank UTR/reference numbers and verified by the Finance Lead.",
      detail: "Supports partial payments, full settlements, and multi-currency recording.",
    },
    {
      id: "PAY-2",
      category: "PAYMENTS",
      title: "Separation of Milestone Delivery & Payment Settlement",
      summary: "Milestone completion and invoice settlement remain decoupled data structures.",
      detail: "Delivery velocity can be measured independently of client accounts receivable reconciliation.",
    },
    {
      id: "PAY-3",
      category: "PAYMENTS",
      title: "Overdue Invoice Payment Gate",
      summary: "Overdue invoices trigger a hard gate warning on subsequent milestone creation.",
      detail: "Protects studio cashflow while providing Admin override capabilities when contractually necessary.",
    },
    {
      id: "PAY-4",
      category: "PAYMENTS",
      title: "Payment Immutability",
      summary: "Recorded payments cannot be deleted. Adjustments require corrective debit/credit entries.",
      detail: "Guarantees forensic accounting accuracy and reconciliation integrity.",
    },
    {
      id: "AL-1",
      category: "AUDIT",
      title: "Immutable System-Wide Event Trail",
      summary: "All state transitions across all entities are permanently recorded in the Audit Log.",
      detail: "Events include actor ID, actor role, entity type, action, prior state, new state, and justification.",
    },
    {
      id: "AL-3",
      category: "AUDIT",
      title: "Append-Only Storage",
      summary: "Audit log table is strictly append-only. Update and delete operations are structurally blocked.",
      detail: "Ensures legal and operational defensibility of all studio transactions.",
    },
    {
      id: "AL-5",
      category: "AUDIT",
      title: "Mandatory Decision Justification",
      summary: "Rejections, change requests, and overrides require non-empty explanatory feedback.",
      detail: "Guarantees that negative decisions are transparent and actionable for designers.",
    },
  ];

  const filteredRules = rules.filter((r) => {
    const matchCat = selectedCategory === "ALL" || r.category === selectedCategory;
    const matchQuery =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Operational Rule Book & Architecture</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium border border-brand-cta/30">
              Interactive Rule Matrix
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Formal operating standards governing the Indian Pixel Digital Agency Operating System.
          </p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="p-4 rounded-lg border border-white/10 bg-brand-dark/95 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="h-4 w-4 text-brand-cta flex-shrink-0" />
          <input
            type="text"
            placeholder="Search operational rules, IDs, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-white/10 bg-brand-main-dark px-3 py-1.5 text-brand-light placeholder:text-brand-counter/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {ruleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                selectedCategory === cat.id
                  ? "bg-brand-cta text-black font-semibold"
                  : "bg-white/5 text-brand-counter hover:text-brand-light hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-2.5 hover:border-brand-cta/40 transition-all shadow-elevation-1"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-brand-cta/20 text-brand-cta font-mono text-xs font-bold border border-brand-cta/30">
                Rule {rule.id}
              </span>
              <span className="text-[10px] font-mono text-brand-counter uppercase">
                {rule.category}
              </span>
            </div>

            <h3 className="text-sm font-semibold font-heading text-brand-light">
              {rule.title}
            </h3>

            <p className="text-xs text-brand-light/90 font-medium">
              {rule.summary}
            </p>

            <p className="text-[11px] text-brand-counter leading-relaxed border-t border-white/5 pt-2">
              {rule.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
