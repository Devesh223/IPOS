"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  FileText,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  TrendingUp,
  ScrollText,
  Settings,
  HelpCircle,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  show: boolean;
  count?: number;
  badge?: string;
  badgeType?: "danger" | "warning";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Sidebar({ role }: { role?: GlobalRole }) {
  const pathname = usePathname();
  const { state } = useApp();

  const isSuperAdminOrAdmin = role === GlobalRole.SUPER_ADMIN || role === GlobalRole.ADMIN;
  const isFinance = role === GlobalRole.FINANCE || isSuperAdminOrAdmin;
  const isPM = role === GlobalRole.STAFF || isSuperAdminOrAdmin;

  const overdueTaskCount = state.tasks.filter((t) => t.isOverdue).length;
  const overdueInvoiceCount = state.invoices.filter((i) => i.isOverdue).length;

  const navGroups: NavGroup[] = [
    {
      title: "WORKSPACE",
      items: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          show: true,
        },
        {
          href: "/projects",
          label: "Projects",
          icon: FolderKanban,
          show: true,
          count: state.projects.length,
        },
        {
          href: "/clients",
          label: "Clients",
          icon: Building2,
          show: isSuperAdminOrAdmin || isFinance || isPM,
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          href: "/files",
          label: "Deliverables",
          icon: FileText,
          show: true,
        },
        {
          href: "/meetings",
          label: "Meetings",
          icon: Calendar,
          show: true,
        },
        {
          href: "/team",
          label: "Team",
          icon: Users,
          show: isSuperAdminOrAdmin,
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          href: "/finance",
          label: "Finance",
          icon: CreditCard,
          show: isFinance || isSuperAdminOrAdmin,
          badge: overdueInvoiceCount > 0 ? `${overdueInvoiceCount} due` : undefined,
          badgeType: "warning",
        },
        {
          href: "/reports",
          label: "Reports",
          icon: BarChart3,
          show: isSuperAdminOrAdmin || isFinance,
        },
        {
          href: "/analytics",
          label: "Analytics",
          icon: TrendingUp,
          show: isSuperAdminOrAdmin,
        },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        {
          href: "/audit",
          label: "Audit",
          icon: ScrollText,
          show: isSuperAdminOrAdmin,
        },
        {
          href: "/settings",
          label: "Settings",
          icon: Settings,
          show: isSuperAdminOrAdmin,
        },
        {
          href: "/help",
          label: "Help",
          icon: HelpCircle,
          show: true,
        },
      ],
    },
  ];

  return (
    <aside className="w-56 lg:w-58 flex-shrink-0 border-r border-white/[0.07] bg-[#020504] flex flex-col justify-between p-3 select-none">
      <div className="space-y-4 overflow-y-auto pr-0.5">
        {/* Brand Header */}
        <div className="px-2.5 py-2 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <span className="font-heading font-bold text-amber-400 text-xs tracking-wider">IP</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-[11px] tracking-tight text-slate-100 leading-none">
                INDIAN PIXEL
              </span>
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">
                STUDIO OS
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
            v1.0
          </span>
        </div>

        {/* Navigation Groups */}
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((i) => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 py-0.5 text-[9px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                {group.title}
              </div>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-all duration-150 group relative",
                        isActive
                          ? "bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shadow-xs"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                            isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold flex-shrink-0",
                            item.badgeType === "danger"
                              ? "bg-rose-950/80 text-rose-300 border border-rose-800/40"
                              : "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {typeof item.count === "number" && !item.badge && item.count > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: SLA Escalation indicator */}
      <div className="pt-3 border-t border-white/[0.06] space-y-2">
        {overdueTaskCount > 0 && isSuperAdminOrAdmin && (
          <div className="p-2 rounded bg-rose-950/20 border border-rose-800/30 text-[11px] text-rose-300 flex items-start gap-2">
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[10px] uppercase tracking-wider text-rose-400">SLA Escalation</span>
              <span className="text-[10px] text-rose-300/90">{overdueTaskCount} task past due date</span>
            </div>
          </div>
        )}

        <div className="px-2.5 py-1 text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <span>Status: Protected</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </aside>
  );
}


