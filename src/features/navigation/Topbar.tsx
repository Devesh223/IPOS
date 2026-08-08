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
    <header className="sticky top-0 z-sticky h-14 w-full border-b border-white/10 bg-brand-main-dark/95 backdrop-blur-md px-4 flex items-center justify-between shadow-sm">
      {/* Left: Brand Identity & Workspace Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-brand-cta to-amber-700 flex items-center justify-center shadow-amber-glow">
            <span className="font-heading font-bold text-black text-sm tracking-wider">IP</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-semibold text-xs tracking-tight text-brand-light">
              INDIAN PIXEL
            </span>
            <span className="text-[10px] text-brand-cta font-mono tracking-wider uppercase">
              OPERATING SYSTEM
            </span>
          </div>
        </div>

        {/* Workspace Boundary Indicator (Rule G-1) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-brand-counter">
          <Shield className="h-3 w-3 text-brand-cta" />
          <span className="font-medium text-brand-light">{workspaceName}</span>
          <span className="text-[10px] opacity-60 font-mono">(Asia/Kolkata)</span>
        </div>
      </div>

      {/* Center: Command Palette Launcher */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-brand-dark/70 border border-white/10 text-xs text-brand-counter hover:border-brand-cta/50 hover:text-brand-light transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-brand-cta" />
            <span>Search projects, tasks, invoices, or audit logs...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-brand-light">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Authenticated Identity & Secure Controls */}
      <div className="flex items-center gap-3">
        {/* Verified Server-Side Role Badge (Rule G-6: Zero Client Role Spoofing) */}
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
          <span className="font-mono text-[10px] uppercase font-semibold text-brand-cta">
            {resolvedRole.replace("_", " ")}
          </span>
        </div>

        {/* Global Notifications Bell */}
        <button
          type="button"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative p-2 rounded-md text-brand-counter hover:text-brand-light hover:bg-white/5 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-cta text-[10px] font-bold text-black ring-2 ring-brand-main-dark animate-pulse">
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
          className="p-2 rounded-md text-brand-counter hover:text-red-400 hover:bg-white/5 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
