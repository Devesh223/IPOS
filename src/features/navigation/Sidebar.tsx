"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
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
      label: "Clients",
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
      label: "Payments & Invoices",
      icon: CreditCard,
      show: isFinance || isSuperAdminOrAdmin,
      badge: overdueInvoiceCount > 0 ? `${overdueInvoiceCount} alert` : undefined,
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
      label: "Team & Contractors",
      icon: Users,
      show: isSuperAdminOrAdmin,
    },
    {
      href: "/audit",
      label: "Audit Log",
      icon: ScrollText,
      show: isSuperAdminOrAdmin,
    },
    {
      href: "/settings",
      label: "Governance Settings",
      icon: Settings,
      show: isSuperAdminOrAdmin,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-brand-main-dark/95 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        {/* Navigation Item List */}
        <nav className="space-y-0.5">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-brand-cta/15 text-brand-cta font-semibold border border-brand-cta/30"
                      : "text-brand-counter hover:text-brand-light hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-brand-cta" : "text-brand-counter group-hover:text-brand-light"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold",
                        item.badgeType === "danger"
                          ? "bg-status-danger/20 text-status-danger"
                          : "bg-status-warning/20 text-status-warning"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {typeof item.count === "number" && !item.badge && (
                    <span className="text-[11px] text-brand-counter/60 font-mono">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Bottom Section: Help & Escalation Notice */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        {overdueTaskCount > 0 && isSuperAdminOrAdmin && (
          <div className="p-2.5 rounded-md bg-red-950/40 border border-status-danger/30 text-[11px] text-red-200 flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 text-status-danger flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Escalation Alert</span>
              <span>1 task is past due date (Rule T-5).</span>
            </div>
          </div>
        )}

        <Link
          href="/help"
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-brand-counter hover:text-brand-light transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Operational Rule Book</span>
        </Link>
      </div>
    </aside>
  );
}
