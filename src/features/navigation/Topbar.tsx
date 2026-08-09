"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { Search, Bell, Shield, Command, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/actions/auth";
import { SessionContext } from "@/lib/session";

export function Topbar({ session }: { session?: SessionContext | null }) {
  const {
    state,
    setIsCommandPaletteOpen,
    setIsNotificationOpen,
    isNotificationOpen,
  } = useApp();

  const unreadCount = state.notifications.filter((n) => !n.isRead).length;
  const userName = session?.user.name || state.currentUser.name;
  const workspaceName = session?.workspaceName || state.currentWorkspace.name;
  const resolvedRole = session?.role || state.currentUser.globalRole;

  return (
    <header className="sticky top-0 z-sticky h-13 w-full border-b border-white/[0.07] bg-[#030807]/90 backdrop-blur-md px-4 flex items-center justify-between shadow-sm">
      {/* Left: Brand Identity & Workspace Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm">
            <span className="font-heading font-bold text-black text-xs tracking-wider">IP</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-semibold text-xs tracking-tight text-slate-100">
              INDIAN PIXEL
            </span>
            <span className="text-[9px] text-amber-400/90 font-mono tracking-widest uppercase">
              STUDIO OS
            </span>
          </div>
        </div>

        {/* Workspace Boundary Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.07] text-xs text-slate-400">
          <Shield className="h-3 w-3 text-amber-500/80" />
          <span className="font-medium text-slate-200">{workspaceName}</span>
          <span className="text-[10px] text-slate-500 font-mono">(Asia/Kolkata)</span>
        </div>
      </div>

      {/* Center: Command Palette Launcher */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-[#07100e] border border-white/[0.07] text-xs text-slate-400 hover:border-amber-500/30 hover:text-slate-200 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3 w-3 text-amber-500/70" />
            <span className="text-[11px]">Search commands, projects, invoices...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-300">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Authenticated Identity & Secure Controls */}
      <div className="flex items-center gap-2.5">
        {/* Verified Server-Side Role Badge */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded px-2.5 py-0.5 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="font-mono text-[9px] uppercase font-semibold text-amber-400">
            {resolvedRole.replace("_", " ")}
          </span>
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
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black ring-2 ring-[#030807]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <Avatar name={userName} size="sm" />

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => logoutAction()}
          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
