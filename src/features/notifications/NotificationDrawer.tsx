"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { X, CheckCheck, AlertCircle, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function NotificationDrawer() {
  const router = useRouter();
  const {
    isNotificationOpen,
    setIsNotificationOpen,
    state,
    markNotificationRead,
    setSelectedProjectId,
  } = useApp();

  if (!isNotificationOpen) return null;

  const handleAction = (item: (typeof state.notifications)[0]) => {
    markNotificationRead(item.id);
    if (item.entityType === "Milestone" || item.entityType === "Task" || item.entityType === "Approval") {
      setSelectedProjectId("proj-mitti");
      router.push("/projects");
    } else if (item.entityType === "Invoice" || item.entityType === "Payment") {
      router.push("/finance");
    }
    setIsNotificationOpen(false);
  };

  const handleMarkAllRead = () => {
    state.notifications.forEach((n) => {
      if (!n.isRead) markNotificationRead(n.id);
    });
  };

  const highPriority = state.notifications.filter(
    (n) => n.priority === "CRITICAL" || n.priority === "HIGH"
  );
  const recentNotifications = state.notifications.filter(
    (n) => n.priority !== "CRITICAL" && n.priority !== "HIGH"
  );

  const unreadCount = state.notifications.filter((n) => !n.isRead).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-drawer flex justify-end"
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => setIsNotificationOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md bg-[#060D0C] border-l border-white/[0.08] text-slate-100 shadow-elevation-4 flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-heading text-slate-100">
              Notification Center
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-slate-400 hover:text-amber-400 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
              aria-label="Close notification drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.notifications.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 space-y-2">
              <CheckCheck className="h-8 w-8 mx-auto text-emerald-400 mb-1 opacity-70" />
              <p className="font-medium text-slate-300">You are all caught up</p>
              <p className="text-[11px] text-slate-500">No pending alerts or review notifications.</p>
            </div>
          ) : (
            <>
              {/* HIGH PRIORITY SECTION */}
              {highPriority.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono tracking-wider uppercase text-amber-400 font-semibold flex items-center gap-1.5 px-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>High Priority Action Items</span>
                  </div>
                  <div className="space-y-2">
                    {highPriority.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-3 rounded-lg border text-xs transition-all space-y-1.5",
                          item.priority === "CRITICAL"
                            ? "border-rose-900/40 bg-rose-950/20"
                            : "border-amber-900/40 bg-amber-950/20",
                          item.isRead ? "opacity-60 bg-transparent" : "shadow-xs"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.priority === "CRITICAL" ? (
                              <AlertCircle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-slate-200 text-xs truncate font-heading">
                              {item.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <StatusBadge status={item.priority} className="text-[9px] px-1.5 py-0" />
                          <div className="flex items-center gap-2">
                            {!item.isRead && (
                              <button
                                onClick={() => markNotificationRead(item.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-200 font-mono"
                              >
                                Mark read
                              </button>
                            )}
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAction(item)}
                              className="h-6 text-[10px] px-2 py-0"
                            >
                              <span>Act now</span>
                              <ArrowRight className="h-2.5 w-2.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT / ROUTINE SECTION */}
              {recentNotifications.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold flex items-center gap-1.5 px-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>Recent Updates</span>
                  </div>
                  <div className="space-y-2">
                    {recentNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-3 rounded-lg border border-white/[0.06] bg-[#030706] text-xs transition-all space-y-1.5",
                          item.isRead ? "opacity-60 bg-transparent" : "shadow-xs"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-slate-200 text-xs truncate font-heading">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            {item.entityType}
                          </span>
                          {!item.isRead && (
                            <button
                              onClick={() => markNotificationRead(item.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 font-mono"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}


