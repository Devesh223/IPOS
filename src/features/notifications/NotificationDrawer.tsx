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
  const { isNotificationOpen, setIsNotificationOpen, state, markNotificationRead, setSelectedProjectId } =
    useApp();

  if (!isNotificationOpen) return null;

  const handleAction = (item: (typeof state.notifications)[0]) => {
    markNotificationRead(item.id);
    if (item.entityType === "Milestone" || item.entityType === "Task") {
      setSelectedProjectId("proj-mitti");
      router.push("/projects");
    } else if (item.entityType === "Invoice") {
      router.push("/finance");
    }
    setIsNotificationOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-drawer flex justify-end"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsNotificationOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md bg-brand-dark/98 border-l border-white/10 text-brand-light shadow-elevation-3 flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-heading text-brand-light">
              Notification Center
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta text-[10px] font-mono font-bold">
              {state.notifications.filter((n) => !n.isRead).length} unread
            </span>
          </div>
          <button
            onClick={() => setIsNotificationOpen(false)}
            className="p-1 rounded text-brand-counter hover:text-brand-light hover:bg-white/10"
            aria-label="Close notification drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-brand-counter">
              <CheckCheck className="h-8 w-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              <p className="font-medium text-brand-light">You are all caught up</p>
              <p className="text-[11px] opacity-70">No pending alerts or notifications.</p>
            </div>
          ) : (
            state.notifications.map((item) => {
              let Icon = Clock;
              let borderClass = "border-white/10";
              let badgeColor = "info";

              if (item.priority === "CRITICAL") {
                Icon = AlertCircle;
                borderClass = "border-status-danger/40 bg-red-950/20";
                badgeColor = "danger";
              } else if (item.priority === "HIGH") {
                Icon = AlertTriangle;
                borderClass = "border-brand-cta/40 bg-amber-950/20";
                badgeColor = "warning";
              }

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3.5 rounded-lg border text-xs transition-all space-y-2 relative",
                    borderClass,
                    item.isRead ? "opacity-60 bg-white/2" : "bg-white/5 shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("h-3.5 w-3.5", item.priority === "CRITICAL" ? "text-status-danger" : "text-brand-cta")} />
                      <span className="font-semibold text-brand-light text-xs font-heading">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-brand-counter/70 font-mono">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-brand-counter text-[11px] leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={item.priority} className="text-[9px] px-1.5 py-0" />
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <button
                          onClick={() => markNotificationRead(item.id)}
                          className="text-[10px] text-brand-counter hover:text-brand-light"
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
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
