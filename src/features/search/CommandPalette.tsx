"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/app-context";
import {
  Search,
  FolderKanban,
  CheckSquare,
  CreditCard,
  Building2,
  ScrollText,
  PlusCircle,
  X,
  FileText,
  Calendar,
  Settings,
  Users,
  BarChart3,
  LogOut,
  ArrowRight,
  Receipt,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";

interface SearchResultItem {
  id: string;
  category: "Navigation" | "Quick Actions" | "Projects" | "Clients" | "Invoices" | "Operations";
  title: string;
  subtitle?: string;
  badge?: string;
  icon: any;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setSelectedProjectId,
    state,
  } = useApp();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Build items catalog
  const items: SearchResultItem[] = [
    // Navigation pages
    {
      id: "nav-dashboard",
      category: "Navigation",
      title: "Dashboard",
      subtitle: "Operations overview & metrics",
      icon: FolderKanban,
      action: () => {
        router.push("/dashboard");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-projects",
      category: "Navigation",
      title: "Projects",
      subtitle: "Portfolio directory & active scopes",
      icon: FolderKanban,
      action: () => {
        router.push("/projects");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-clients",
      category: "Navigation",
      title: "Clients",
      subtitle: "Enterprise clients CRM & master agreements",
      icon: Building2,
      action: () => {
        router.push("/clients");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-files",
      category: "Navigation",
      title: "Deliverables",
      subtitle: "Cryptographically verified vault",
      icon: FileText,
      action: () => {
        router.push("/files");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-meetings",
      category: "Navigation",
      title: "Meetings",
      subtitle: "Agenda-bound review sessions",
      icon: Calendar,
      action: () => {
        router.push("/meetings");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-team",
      category: "Navigation",
      title: "Team & Scopes",
      subtitle: "Staff roster & ownership permissions",
      icon: Users,
      action: () => {
        router.push("/team");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-finance",
      category: "Navigation",
      title: "Finance & Invoices",
      subtitle: "GST invoices, payments & reconciliation",
      icon: CreditCard,
      action: () => {
        router.push("/finance");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-reports",
      category: "Navigation",
      title: "Executive Reports",
      subtitle: "Turnaround velocity & compliance audit",
      icon: BarChart3,
      action: () => {
        router.push("/reports");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-analytics",
      category: "Navigation",
      title: "Analytics & Velocity",
      subtitle: "Studio delivery throughput metrics",
      icon: TrendingUp,
      action: () => {
        router.push("/analytics");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-audit",
      category: "Navigation",
      title: "Audit Ledger",
      subtitle: "Immutable append-only event trail",
      icon: ScrollText,
      action: () => {
        router.push("/audit");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-settings",
      category: "Navigation",
      title: "Settings & Governance",
      subtitle: "Workspace policies & operational gates",
      icon: Settings,
      action: () => {
        router.push("/settings");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "nav-help",
      category: "Navigation",
      title: "Help & Governance Rules",
      subtitle: "Standard operating procedures",
      icon: HelpCircle,
      action: () => {
        router.push("/help");
        setIsCommandPaletteOpen(false);
      },
    },

    // Quick Actions
    {
      id: "action-new-project",
      category: "Quick Actions",
      title: "Create New Project",
      subtitle: "Initialize project engagement under client",
      icon: PlusCircle,
      action: () => {
        router.push("/projects");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "action-new-invoice",
      category: "Quick Actions",
      title: "Issue New Invoice",
      subtitle: "Generate milestone GST invoice with tax breakdown",
      icon: Receipt,
      action: () => {
        router.push("/finance");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "action-schedule-meeting",
      category: "Quick Actions",
      title: "Schedule Review Session",
      subtitle: "Book client decision sync",
      icon: Calendar,
      action: () => {
        router.push("/meetings");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "action-logout",
      category: "Quick Actions",
      title: "Sign Out",
      subtitle: "Terminate current authenticated session",
      icon: LogOut,
      action: () => {
        setIsCommandPaletteOpen(false);
        logoutAction();
      },
    },

    // Projects
    ...state.projects.map((p) => ({
      id: `proj-${p.id}`,
      category: "Projects" as const,
      title: p.name,
      subtitle: `Client: ${p.clientName} • PM: ${p.pmName}`,
      badge: p.status,
      icon: FolderKanban,
      action: () => {
        setSelectedProjectId(p.id);
        router.push(`/projects/${p.id}`);
        setIsCommandPaletteOpen(false);
      },
    })),

    // Clients
    {
      id: "client-mitti",
      category: "Clients" as const,
      title: "Mitti & Co.",
      subtitle: "Mitti Organic Living Pvt Ltd • Enterprise",
      badge: "ACTIVE",
      icon: Building2,
      action: () => {
        router.push("/clients");
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: "client-techsol",
      category: "Clients" as const,
      title: "Tech Solutions Inc.",
      subtitle: "Tech Solutions India Pvt Ltd • Growth",
      badge: "ACTIVE",
      icon: Building2,
      action: () => {
        router.push("/clients");
        setIsCommandPaletteOpen(false);
      },
    },

    // Invoices
    ...state.invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      category: "Invoices" as const,
      title: `Invoice ${inv.invoiceNumber}`,
      subtitle: `${inv.clientName} • ₹${(inv.amount / 100).toLocaleString("en-IN")}`,
      badge: inv.status,
      icon: Receipt,
      action: () => {
        router.push(`/finance/invoices/${inv.id}`);
        setIsCommandPaletteOpen(false);
      },
    })),

    // Operations / Tasks
    ...state.tasks.map((t) => ({
      id: `task-${t.id}`,
      category: "Operations" as const,
      title: t.name,
      subtitle: `Project: ${t.projectName} • Assignee: ${t.assigneeName ?? "Unassigned"}`,
      badge: t.isOverdue ? "OVERDUE" : t.status,
      icon: CheckSquare,
      action: () => {
        setSelectedProjectId(t.projectId);
        router.push(`/projects/${t.projectId}`);
        setIsCommandPaletteOpen(false);
      },
    })),
  ];

  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        current.action();
      }
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-modal flex items-start justify-center pt-20 px-4"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => setIsCommandPaletteOpen(false)}
      />

      <div className="relative z-10 w-full max-w-xl rounded-lg border border-white/[0.12] bg-[#060D0C] text-slate-100 shadow-elevation-4 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, jump to project, invoice, or client..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/[0.05]"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 text-xs">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <p className="font-medium text-slate-300">No matching commands or resources found</p>
              <p className="text-[11px]">Try searching for project name, client, invoice number, or navigation item.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors select-none",
                    isSelected
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-slate-300 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <Icon className={cn("h-4 w-4 flex-shrink-0", isSelected ? "text-amber-400" : "text-slate-500")} />
                    <div className="truncate">
                      <div className="font-medium truncate text-xs text-slate-200">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5 font-sans">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.02]">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Helper */}
        <div className="px-4 py-2 border-t border-white/[0.08] bg-[#030706] text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-[9px] text-slate-300">↑</kbd> <kbd className="bg-white/10 px-1 py-0.5 rounded text-[9px] text-slate-300">↓</kbd> to navigate</span>
            <span>•</span>
            <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-[9px] text-slate-300">Enter</kbd> to select</span>
          </div>
          <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-[9px] text-slate-300">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}


