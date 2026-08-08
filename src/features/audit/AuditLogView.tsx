"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { ScrollText, ShieldCheck, Filter, User, Calendar, Database } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export function AuditLogView() {
  const { state } = useApp();
  const [filterActor, setFilterActor] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const filteredLogs = state.auditLogs.filter((log) => {
    const matchesActor = filterActor ? log.actorId.includes(filterActor) || (log.actorName && log.actorName.includes(filterActor)) : true;
    const matchesEntity = filterEntity ? log.entityType.toLowerCase().includes(filterEntity.toLowerCase()) : true;
    return matchesActor && matchesEntity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Immutable Audit Log</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
              Rule AL-3 Append-Only
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Every state change in Indian Pixel is permanently attributed and cannot be modified or deleted by any role.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-counter font-mono">
            Total Logged Events: <strong>{state.auditLogs.length}</strong>
          </span>
        </div>
      </div>

      {/* Filters (Rule AL-8 Multi-Dimensional Query) */}
      <div className="p-4 rounded-lg border border-white/10 bg-brand-dark/95 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <User className="h-4 w-4 text-brand-cta flex-shrink-0" />
          <input
            type="text"
            placeholder="Filter by Actor (e.g. Krishna, PM, System)..."
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className="w-full rounded border border-white/10 bg-brand-main-dark px-3 py-1.5 text-brand-light placeholder:text-brand-counter/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Database className="h-4 w-4 text-brand-cta flex-shrink-0" />
          <input
            type="text"
            placeholder="Filter by Entity Type (Milestone, Task, Payment)..."
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full rounded border border-white/10 bg-brand-main-dark px-3 py-1.5 text-brand-light placeholder:text-brand-counter/50 focus:outline-none"
          />
        </div>

        {(filterActor || filterEntity) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterActor("");
              setFilterEntity("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Audit Log Table (Phase 3 Section 9.30) */}
      <div className="rounded-lg border border-white/10 bg-brand-dark/95 overflow-hidden shadow-elevation-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 font-mono text-[11px] text-brand-counter uppercase">
                <th className="p-3.5 pl-4">Timestamp (Rule G-9)</th>
                <th className="p-3.5">Actor Identity (Rule AL-2)</th>
                <th className="p-3.5">Action & Entity</th>
                <th className="p-3.5">State Transition</th>
                <th className="p-3.5">Justification / Financials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5 pl-4 font-mono text-brand-counter text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-IN")}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-semibold text-brand-light block">
                      {log.actorName ?? log.actorId}
                    </span>
                    <span className="text-[10px] text-brand-counter font-mono uppercase">
                      {log.actorType}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-brand-cta font-bold">{log.action}</span>
                      <span className="text-brand-counter">on</span>
                      <span className="font-medium text-brand-light">{log.entityType}</span>
                    </div>
                    {log.entityName && (
                      <span className="text-[11px] text-brand-counter/80 italic block">
                        {log.entityName}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    {log.priorState || log.newState ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-brand-counter line-through opacity-70">
                          {log.priorState ?? "None"}
                        </span>
                        <span className="text-brand-cta">→</span>
                        <span className="text-emerald-400 font-semibold">{log.newState}</span>
                      </div>
                    ) : (
                      <span className="text-brand-counter/40 font-mono">—</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {log.justification && (
                      <p className="text-brand-light/90 italic text-[11px] leading-relaxed">
                        &ldquo;{log.justification}&rdquo;
                      </p>
                    )}
                    {typeof log.amount === "number" && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono text-[10px] border border-emerald-500/20">
                        {formatCurrency(log.amount, log.currency || "INR")}
                      </span>
                    )}
                    {!log.justification && typeof log.amount !== "number" && (
                      <span className="text-brand-counter/40 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
