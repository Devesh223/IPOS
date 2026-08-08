"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/app-context";
import {
  Search,
  FolderKanban,
  CheckSquare,
  CreditCard,
  ScrollText,
  PlusCircle,
  CheckCircle,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setSelectedProjectId,
    state,
  } = useApp();

  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredProjects = state.projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.clientName.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTasks = state.tasks.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.assigneeName && t.assigneeName.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    router.push(`/projects/${projectId}`);
    setIsCommandPaletteOpen(false);
  };

  const handleSelectTask = (projectId: string) => {
    setSelectedProjectId(projectId);
    router.push(`/projects/${projectId}`);
    setIsCommandPaletteOpen(false);
  };

  const handleSelectAction = (path: string) => {
    router.push(`/${path}`);
    setIsCommandPaletteOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-modal flex items-start justify-center pt-24 px-4"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
        onClick={() => setIsCommandPaletteOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl rounded-lg border border-white/15 bg-brand-dark/95 text-brand-light shadow-elevation-4 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/5">
          <Search className="h-4 w-4 text-brand-cta" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, project, task, or search query..."
            className="w-full bg-transparent text-sm text-brand-light placeholder:text-brand-counter/50 focus:outline-none font-sans"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-brand-counter hover:text-brand-light text-xs"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-xs font-sans">
          {/* Quick Actions */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-brand-cta font-semibold">
              Quick Actions
            </span>
            <button
              onClick={() => handleSelectAction("projects")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/10 text-brand-light text-left transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-brand-cta" />
              <span>Create New Project (Draft State)</span>
            </button>
            <button
              onClick={() => handleSelectAction("audit")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/10 text-brand-light text-left transition-colors"
            >
              <ScrollText className="h-3.5 w-3.5 text-emerald-400" />
              <span>Inspect Immutable Audit Log (Rule AL-8)</span>
            </button>
            <button
              onClick={() => handleSelectAction("finance")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-white/10 text-brand-light text-left transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-amber-400" />
              <span>Review Overdue Invoices & Record Payments</span>
            </button>
          </div>

          {/* Projects Match */}
          {filteredProjects.length > 0 && (
            <div className="space-y-1 border-t border-white/5 pt-2">
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-brand-counter font-semibold">
                Projects
              </span>
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 text-brand-light text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FolderKanban className="h-3.5 w-3.5 text-brand-counter" />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-brand-counter">
                    {p.clientName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Tasks Match */}
          {filteredTasks.length > 0 && (
            <div className="space-y-1 border-t border-white/5 pt-2">
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-brand-counter font-semibold">
                Tasks & Deliverables
              </span>
              {filteredTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTask(t.projectId)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/10 text-brand-light text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <CheckSquare className="h-3.5 w-3.5 text-brand-counter" />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-brand-counter font-mono">
                    {t.assigneeName ?? "Unassigned"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-white/10 bg-brand-main-dark/80 text-[11px] text-brand-counter flex items-center justify-between">
          <span>Navigate with <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-[9px]">↑</kbd> <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-[9px]">↓</kbd></span>
          <span>Select with <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-[9px]">Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}
