"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  FolderKanban,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Filter,
  User,
  CreditCard,
  Layers,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { createProjectAction } from "@/actions/projects";
import { formatCurrency } from "@/lib/utils";

export function ProjectsDirectoryView({
  initialData,
}: {
  initialData?: { projects: any[]; tasks: any[]; invoices: any[] };
}) {
  const router = useRouter();
  const { state, setSelectedProjectId, session } = useApp();

  const isSuperAdminOrAdmin = session?.isAdmin ?? true;
  const isClient = session?.isClient ?? false;

  const rawProjects = (initialData?.projects && initialData.projects.length > 0)
    ? initialData.projects
    : state.projects;

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New Project Form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState(rawProjects[0]?.clientId || "client-mitti");
  const [newProjectTargetDate, setNewProjectTargetDate] = useState("2026-09-30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sort by priority: Blocked/Stalled (1), Under Review (2), Active (3), Completed (4)
  const prioritizedProjects = useMemo(() => {
    return [...rawProjects].sort((a, b) => {
      const getPriorityScore = (p: typeof rawProjects[0]) => {
        if (p.stalledApprovalsCount > 0) return 4;
        if (p.status === "SUBMITTED_FOR_APPROVAL" || p.status === "UNDER_REVIEW") return 3;
        if (p.status === "ACTIVE" || p.status === "IN_PROGRESS") return 2;
        if (p.status === "COMPLETED") return 1;
        return 0;
      };
      return getPriorityScore(b) - getPriorityScore(a);
    });
  }, [rawProjects]);

  const filteredProjects = prioritizedProjects.filter((p) => {
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "IN_PROGRESS" && (p.status === "IN_PROGRESS" || p.status === "ACTIVE")) ||
      (statusFilter === "SUBMITTED" && (p.stalledApprovalsCount > 0 || p.status === "UNDER_REVIEW" || p.status === "SUBMITTED_FOR_APPROVAL")) ||
      (statusFilter === "COMPLETED" && p.status === "COMPLETED");

    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pmName && p.pmName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchQuery;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setErrorMessage("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("name", newProjectName);
      formData.set("description", newProjectDescription);
      formData.set("clientId", newProjectClientId);

      const res = await createProjectAction(formData);

      setIsSubmitting(false);
      if (res.success && res.project) {
        setIsCreateModalOpen(false);
        setSelectedProjectId(res.project.id);
        router.push(`/projects/${res.project.id}`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const statusTabs = [
    { id: "ALL", label: "All Engagements", count: rawProjects.length },
    {
      id: "IN_PROGRESS",
      label: "Active & In Progress",
      count: rawProjects.filter((p) => p.status === "IN_PROGRESS" || p.status === "ACTIVE").length,
    },
    {
      id: "SUBMITTED",
      label: "Review Pending",
      count: rawProjects.filter((p) => p.stalledApprovalsCount > 0 || p.status === "UNDER_REVIEW" || p.status === "SUBMITTED_FOR_APPROVAL").length,
    },
    {
      id: "COMPLETED",
      label: "Completed",
      count: rawProjects.filter((p) => p.status === "COMPLETED").length,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono border border-amber-500/25 uppercase tracking-wider">
              Rule P-1 Scope Containment
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {rawProjects.length} Portfolio Engagements
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-heading">
            Projects & Scopes Directory
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Institutional project portfolio. Every scope is client-contained with single PM ownership and milestone audit gates.
          </p>
        </div>

        {!isClient && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setErrorMessage(null);
              setIsCreateModalOpen(true);
            }}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Create Project</span>
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by name, client, or PM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-white/[0.04]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dense Scannable Portfolio Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects match your current filters"
          description="Try adjusting your search query or status filter to see other studio engagements."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <div className="col-span-4">Project & Client</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-3">Progress & Velocity</div>
            <div className="col-span-2">PM / Owner</div>
            <div className="col-span-1 text-right">Target</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filteredProjects.map((project) => {
              const completionPct = Math.round(
                (project.completedTasksCount / Math.max(1, project.tasksCount)) * 100
              );

              return (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    router.push(`/projects/${project.id}`);
                  }}
                  className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center"
                >
                  {/* Col 1: Project & Client */}
                  <div className="col-span-4 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {project.clientName}
                      </span>
                      {project.stalledApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 font-mono">
                          Review Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-amber-400 transition-colors font-heading truncate">
                      {project.name}
                    </h3>
                  </div>

                  {/* Col 2: Status */}
                  <div className="col-span-2 lg:text-center">
                    <StatusBadge status={project.status} className="text-[9px] px-1.5 py-0.5" />
                  </div>

                  {/* Col 3: Progress & Velocity */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{project.completedTasksCount}/{project.tasksCount} Tasks</span>
                      <span className="font-semibold text-slate-200">{completionPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Col 4: PM / Owner */}
                  <div className="col-span-2 text-xs text-slate-300 truncate">
                    <span className="lg:hidden text-[10px] text-slate-500 font-mono block">PM:</span>
                    <span className="font-medium truncate">{project.pmName}</span>
                  </div>

                  {/* Col 5: Target Date & Jump */}
                  <div className="col-span-1 flex items-center justify-between lg:justify-end gap-2 text-right">
                    <span className="text-[11px] font-mono text-slate-400">
                      {project.targetDate ?? "Flexible"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 transition-colors hidden sm:block flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create New Project */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize New Project Engagement"
        description="Creates a contained project entity bound to an authenticated client account pursuant to Rule P-1."
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Project Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. Artisanal Packaging Redesign & 3D Motion Identity"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Select Client Account (Rule P-1):</label>
            <select
              value={newProjectClientId}
              onChange={(e) => setNewProjectClientId(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs"
            >
              <option value="client-mitti">Mitti & Co. (Mitti Organic Living Pvt Ltd)</option>
              <option value="client-techsol">Tech Solutions Inc. (TechSol Pvt Ltd)</option>
              <option value="client-vally">Vally & Hound Outdoors</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Target Completion Date:</label>
            <input
              type="date"
              required
              value={newProjectTargetDate}
              onChange={(e) => setNewProjectTargetDate(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Scope Brief & Objectives:</label>
            <textarea
              rows={3}
              placeholder="Brief outline of agreed creative scope and deliverables..."
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3.5 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
            >
              <span>Initialize Project</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

