"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import { Search, Bell, Shield, Command, LogOut, Settings, User, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/actions/auth";
import { SessionContext } from "@/lib/session";
import { cn } from "@/lib/utils";

export function Topbar({ session }: { session?: SessionContext | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    state,
    setIsCommandPaletteOpen,
    setIsNotificationOpen,
    isNotificationOpen,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = state.notifications.filter((n) => !n.isRead).length;
  const userName = session?.user.name || state.currentUser.name;
  const userEmail = session?.user.email || "krishna@indianpixel.com";
  const workspaceName = session?.workspaceName || state.currentWorkspace.name;
  const resolvedRole = session?.role || state.currentUser.globalRole;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute clean breadcrumb based on pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return { title: "Dashboard", section: "WORKSPACE" };
    if (pathname.startsWith("/projects/")) return { title: "Project Dossier", section: "PROJECTS" };
    if (pathname === "/projects") return { title: "Projects", section: "WORKSPACE" };
    if (pathname === "/clients") return { title: "Clients", section: "WORKSPACE" };
    if (pathname === "/files") return { title: "Deliverables", section: "OPERATIONS" };
    if (pathname === "/meetings") return { title: "Meetings", section: "OPERATIONS" };
    if (pathname === "/team") return { title: "Team", section: "OPERATIONS" };
    if (pathname.startsWith("/finance/invoices/")) return { title: "Invoice Dossier", section: "FINANCE" };
    if (pathname === "/finance") return { title: "Finance", section: "FINANCE" };
    if (pathname === "/reports") return { title: "Reports", section: "FINANCE" };
    if (pathname === "/analytics") return { title: "Analytics", section: "FINANCE" };
    if (pathname === "/audit") return { title: "Audit", section: "SYSTEM" };
    if (pathname === "/settings") return { title: "Settings", section: "SYSTEM" };
    if (pathname === "/help") return { title: "Help & Rules", section: "SYSTEM" };
    return { title: "Studio OS", section: "WORKSPACE" };
  };

  const pageInfo = getPageTitle();

  return (
    <header className="sticky top-0 z-sticky h-12 w-full border-b border-white/[0.07] bg-[#020504]/95 backdrop-blur-md px-4 flex items-center justify-between shadow-xs select-none">
      {/* Left: Current Page Context & Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold hidden sm:inline-block">
          {pageInfo.section}
        </span>
        <span className="text-white/20 hidden sm:inline-block">/</span>
        <h2 className="text-xs font-semibold text-slate-200 font-heading truncate">
          {pageInfo.title}
        </h2>
      </div>

      {/* Center: Command Palette Launcher */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-[#030706] border border-white/[0.08] text-xs text-slate-400 hover:border-amber-500/30 hover:text-slate-200 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-amber-400/80" />
            <span className="text-[11px]">Type ⌘K to search or run commands...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-300">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Workspace Context, Notification Bell, User Menu */}
      <div className="flex items-center gap-3">
        {/* Workspace Boundary Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#030706] border border-white/[0.07] text-xs">
          <Shield className="h-3 w-3 text-amber-400/90" />
          <span className="font-medium text-slate-200 text-[11px]">{workspaceName}</span>
          <span className="text-[9px] text-slate-500 font-mono">• Production</span>
        </div>

        {/* Global Notifications Bell */}
        <button
          type="button"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-black ring-2 ring-[#020504]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded hover:bg-white/[0.04] transition-colors"
            aria-expanded={isUserMenuOpen}
            aria-label="User account menu"
          >
            <Avatar name={userName} size="sm" />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-none">{userName}</span>
              <span className="text-[9px] font-mono text-amber-400/90 uppercase mt-0.5">{resolvedRole.replace("_", " ")}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/[0.08] bg-[#060D0C] p-1 text-slate-200 shadow-elevation-4 animate-in fade-in-80 zoom-in-95 z-dropdown">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <div className="text-xs font-semibold text-slate-100">{userName}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{userEmail}</div>
                <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-amber-400 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{resolvedRole.replace("_", " ")} Role</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-white/[0.04] rounded transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-400" />
                  <span>Workspace Settings</span>
                </Link>
                <Link
                  href="/help"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-white/[0.04] rounded transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span>Operational Governance</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logoutAction();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

