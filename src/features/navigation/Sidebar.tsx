"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CreditCard,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  ScrollText,
  Settings,
  HelpCircle,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRole } from "@prisma/client";

export function Sidebar({ role }: { role?: GlobalRole }) {
  const pathname = usePathname();
  const { state } = useApp();

  const isSuperAdminOrAdmin = role === GlobalRole.SUPER_ADMIN || role === GlobalRole.ADMIN;
  const isFinance = role === GlobalRole.FINANCE || isSuperAdminOrAdmin;

  const overdueTaskCount = state.tasks.filter((t) => t.isOverdue).length;
  const overdueInvoiceCount = state.invoices.filter((i) => i.isOverdue).length;

  const navItems: Array<{
    href: string;
    label: string;
    icon: any;
    show: boolean;
    count?: number;
    badge?: string;
    badgeType?: "danger" | "warning";
  }> = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: "/clients",
      label: "Clients CRM",
      icon: Building2,
      show: isSuperAdminOrAdmin || isFinance,
      count: state.projects.length,
    },
    {
      href: "/projects",
      label: "Projects & Scopes",
      icon: FolderKanban,
      show: true,
      count: state.projects.length,
    },
    {
      href: "/finance",
      label: "Finance & Invoices",
      icon: CreditCard,
      show: isFinance || isSuperAdminOrAdmin,
      badge: overdueInvoiceCount > 0 ? `${overdueInvoiceCount} due` : undefined,
      badgeType: "warning",
    },
    {
      href: "/files",
      label: "Deliverables Vault",
      icon: FileText,
      show: true,
    },
    {
      href: "/meetings",
      label: "Review Sessions",
      icon: Calendar,
      show: true,
    },
    {
      href: "/reports",
      label: "Executive Reports",
      icon: BarChart3,
      show: isSuperAdminOrAdmin || isFinance,
    },
    {
      href: "/analytics",
      label: "Studio Velocity",
      icon: TrendingUp,
      show: isSuperAdminOrAdmin,
    },
    {
      href: "/team",
      label: "Team & Roster",
      icon: Users,
      show: isSuperAdminOrAdmin,
    },
    {
      href: "/audit",
      label: "Audit Ledger",
      icon: ScrollText,
      show: isSuperAdminOrAdmin,
    },
    {
      href: "/settings",
      label: "Governance & Keys",
      icon: Settings,
      show: isSuperAdminOrAdmin,
    },
  ];

  return (
    <aside className="w-60 flex-shrink-0 border-r border-white/[0.07] bg-[#040908] flex flex-col justify-between p-3 select-none">
      <div className="space-y-4">
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-150 group",
                      isActive
                        ? "bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/25 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold",
                          item.badgeType === "danger"
                            ? "bg-red-950/80 text-red-400 border border-red-800/40"
                            : "bg-amber-950/80 text-amber-400 border border-amber-800/40"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {typeof item.count === "number" && !item.badge && item.count > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Rule Book & Overdue Alert */}
      <div className="pt-3 border-t border-white/[0.07] space-y-2">
        {overdueTaskCount > 0 && isSuperAdminOrAdmin && (
          <div className="p-2 rounded bg-red-950/30 border border-red-800/30 text-[11px] text-red-300 flex items-start gap-2">
            <AlertOctagon className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[10px] uppercase tracking-wider text-red-400">Escalation</span>
              <span className="text-[10px] text-red-300/90">{overdueTaskCount} task past due date</span>
            </div>
          </div>
        )}

        <Link
          href="/help"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>Operational Rule Book</span>
        </Link>
      </div>
    </aside>
  );
}
