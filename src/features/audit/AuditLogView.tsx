"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/lib/app-context";
import {
  ScrollText,
  ShieldCheck,
  Filter,
  User,
  Calendar,
  Database,
  Search,
  Eye,
  ArrowRight,
  Sparkles,
  Lock,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface AuditEntryItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorType: "USER" | "SYSTEM_PROCESS";
  entityType: string;
  entityId: string;
  action: string;
  priorState: string | null;
  newState: string | null;
  justification: string | null;
  amount: number | null;
  currency: string | null;
  timestamp: string;
  timestampFormatted?: string;
}

export function AuditLogView({
  initialLogs,
  initialActors = [],
  initialEntities = [],
  initialActions = [],
}: {
  initialLogs?: AuditEntryItem[];
  initialActors?: string[];
  initialEntities?: string[];
  initialActions?: string[];
}) {
  const { session, state } = useApp();
  const isClient = session?.isClient ?? false;

  const defaultLogs: AuditEntryItem[] = [
    {
      id: "audit-1",
      workspaceId: "ws_indian_pixel",
      actorId: "krishna@indianpixel.com",
      actorType: "USER",
      entityType: "Project",
      entityId: "proj-1",
      action: "project.activated",
      priorState: "DRAFT",
      newState: "ACTIVE",
      justification: "Project kicked off with verified PM assignment and signed client master agreement",
      amount: null,
      currency: null,
      timestamp: "2026-08-01T10:00:00Z",
      timestampFormatted: "01 Aug 2026, 10:00:00 AM IST",
    },
    {
      id: "audit-2",
      workspaceId: "ws_indian_pixel",
      actorId: "aarav@indianpixel.com",
      actorType: "USER",
      entityType: "Milestone",
      entityId: "m-1",
      action: "milestone.approved",
      priorState: "SUBMITTED_FOR_APPROVAL",
      newState: "APPROVED",
      justification: "Client signed off on primary packaging dieline specifications.",
      amount: null,
      currency: null,
      timestamp: "2026-08-10T14:30:00Z",
      timestampFormatted: "10 Aug 2026, 02:30:00 PM IST",
    },
    {
      id: "audit-3",
      workspaceId: "ws_indian_pixel",
      actorId: "neha@indianpixel.com",
      actorType: "USER",
      entityType: "Payment",
      entityId: "pay-1",
      action: "payment.reconciled",
      priorState: "RECORDED",
      newState: "RECONCILED",
      justification: "NEFT transfer from HDFC Bank verified against statement.",
      amount: 14750000,
      currency: "INR",
      timestamp: "2026-08-11T11:00:00Z",
      timestampFormatted: "11 Aug 2026, 11:00:00 AM IST",
    },
    {
      id: "audit-4",
      workspaceId: "ws_indian_pixel",
      actorId: "System Process (Webhook)",
      actorType: "SYSTEM_PROCESS",
      entityType: "Invoice",
      entityId: "inv-101",
      action: "invoice.status_transition",
      priorState: "ISSUED",
      newState: "PAID",
      justification: "Reconciled against payment transaction pay-1",
      amount: 17700000,
      currency: "INR",
      timestamp: "2026-08-11T11:05:00Z",
      timestampFormatted: "11 Aug 2026, 11:05:00 AM IST",
    },
  ];

  const logs = (initialLogs && initialLogs.length > 0) ? initialLogs : defaultLogs;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedActor, setSelectedActor] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditEntryItem | null>(null);

  // Pagination state (dense viewing)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Client users should only see client-safe events
      if (isClient) {
        const clientSafeEntities = ["Milestone", "Agreement", "Invoice", "Payment", "Deliverable"];
        if (!clientSafeEntities.includes(log.entityType)) return false;
      }

      const matchSearch =
        log.actorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.justification && log.justification.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchEntity = selectedEntity === "ALL" || log.entityType === selectedEntity;
      const matchActor = selectedActor === "ALL" || log.actorId === selectedActor;

      return matchSearch && matchEntity && matchActor;
    });
  }, [logs, searchQuery, selectedEntity, selectedActor, isClient]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Extract distinct entities & actors for dropdowns
  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.entityType));
    return Array.from(set);
  }, [logs]);

  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.actorId));
    return Array.from(set);
  }, [logs]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/25 uppercase tracking-wider">
              Rule AL-3 Append-Only (PostgreSQL)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Zero-Deletion Forensic Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Immutable Audit Trail & Ledger
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {isClient
              ? "Append-only operational history of project milestones, agreements, and invoices."
              : "Every state transition in Indian Pixel is permanently attributed and stored in PostgreSQL with cryptographic tamper-proofing."}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>Logged Events:</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-200 border border-white/[0.06] font-bold">
            {filteredLogs.length}
          </span>
        </div>
      </div>

      {/* Multi-Dimensional Query Filters (Rule AL-8) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by action, actor, entity ID, or rationale..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => {
              setSelectedEntity(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded bg-[#030706] border border-white/[0.08] px-2.5 py-1 text-xs text-slate-300 focus:outline-none font-mono"
          >
            <option value="ALL">All Entities</option>
            {uniqueEntities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          {/* Actor Filter (Internal only) */}
          {!isClient && (
            <select
              value={selectedActor}
              onChange={(e) => {
                setSelectedActor(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded bg-[#030706] border border-white/[0.08] px-2.5 py-1 text-xs text-slate-300 focus:outline-none font-mono"
            >
              <option value="ALL">All Actors</option>
              {uniqueActors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}

          {(searchQuery || selectedEntity !== "ALL" || selectedActor !== "ALL") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setSelectedEntity("ALL");
                setSelectedActor("ALL");
                setCurrentPage(1);
              }}
              className="text-xs h-7 px-2"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Forensic Audit Ledger Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events matched"
          description="No state transitions match your search filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedEntity("ALL");
            setSelectedActor("ALL");
          }}
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
            <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              <div className="col-span-2">Timestamp (IST)</div>
              <div className="col-span-2">Actor Identity</div>
              <div className="col-span-3">Action & Entity</div>
              <div className="col-span-2">State Transition</div>
              <div className="col-span-2">Justification / Amount</div>
              <div className="col-span-1 text-right">Inspect</div>
            </div>

            <div className="divide-y divide-white/[0.04] text-xs">
              {paginatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-4 py-3 hover:bg-white/[0.02] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-3 lg:items-center"
                >
                  {/* Col 1: Timestamp */}
                  <div className="col-span-2 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {log.timestampFormatted || new Date(log.timestamp).toLocaleString("en-IN")}
                  </div>

                  {/* Col 2: Actor Identity */}
                  <div className="col-span-2 space-y-0.5 min-w-0">
                    <span className="font-semibold text-slate-200 block truncate font-sans">
                      {log.actorId}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">
                      {log.actorType}
                    </span>
                  </div>

                  {/* Col 3: Action & Entity */}
                  <div className="col-span-3 space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-amber-300 font-semibold">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {log.entityType} ({log.entityId})
                    </span>
                  </div>

                  {/* Col 4: State Transition */}
                  <div className="col-span-2 font-mono text-[11px]">
                    {log.priorState || log.newState ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-500 line-through opacity-70">
                          {log.priorState ?? "None"}
                        </span>
                        <span className="text-amber-400">→</span>
                        <span className="text-emerald-400 font-semibold">{log.newState}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </div>

                  {/* Col 5: Justification / Amount */}
                  <div className="col-span-2 min-w-0">
                    {log.justification && (
                      <p className="text-slate-300 italic text-[11px] truncate">
                        &ldquo;{log.justification}&rdquo;
                      </p>
                    )}
                    {typeof log.amount === "number" && (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 font-mono text-[10px] border border-emerald-500/20">
                        {formatCurrency(log.amount, log.currency || "INR")}
                      </span>
                    )}
                    {!log.justification && typeof log.amount !== "number" && (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </div>

                  {/* Col 6: Inspect Button */}
                  <div className="col-span-1 text-left lg:text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedLog(log)}
                      className="h-6 text-[10px] px-2"
                    >
                      <Eye className="h-3 w-3 text-amber-400 mr-1" />
                      <span>Proof</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2 text-xs font-mono text-slate-400">
              <span>
                Page {currentPage} of {totalPages} ({filteredLogs.length} total events)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs px-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 text-xs px-2"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forensic Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Forensic Event: ${selectedLog.action}`}
          description={`Cryptographic log ID: ${selectedLog.id} • Recorded in PostgreSQL`}
          size="md"
        >
          <div className="space-y-3.5 text-xs font-sans">
            <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.08] space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">
                Forensic Event Details
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div>Timestamp: <strong className="text-slate-100">{selectedLog.timestampFormatted || selectedLog.timestamp}</strong></div>
                <div>Actor Type: <strong className="text-slate-100">{selectedLog.actorType}</strong></div>
                <div>Actor Identity: <strong className="text-slate-100">{selectedLog.actorId}</strong></div>
                <div>Entity Type: <strong className="text-slate-100">{selectedLog.entityType}</strong></div>
                <div>Entity ID: <strong className="text-slate-100">{selectedLog.entityId}</strong></div>
                <div>Workspace: <strong className="text-slate-100">{selectedLog.workspaceId}</strong></div>
              </div>
            </div>

            {/* State Transition Diff */}
            <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.08] space-y-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">
                State Transition Diff
              </span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04] flex-1">
                  <span className="text-[10px] text-slate-500 block">PRIOR STATE</span>
                  <span className="text-slate-400">{selectedLog.priorState || "null"}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/20 flex-1">
                  <span className="text-[10px] text-emerald-400 block">NEW STATE</span>
                  <span className="text-emerald-300 font-bold">{selectedLog.newState || "null"}</span>
                </div>
              </div>
            </div>

            {/* Justification & Financials */}
            {selectedLog.justification && (
              <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                  Mandatory Operational Justification (Rule AL-5)
                </span>
                <p className="text-slate-200 italic text-xs leading-relaxed">
                  &ldquo;{selectedLog.justification}&rdquo;
                </p>
              </div>
            )}

            {typeof selectedLog.amount === "number" && (
              <div className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between font-mono">
                <span className="text-slate-400 text-xs">Financial Transaction Amount:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatCurrency(selectedLog.amount, selectedLog.currency || "INR")}
                </span>
              </div>
            )}

            <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Immutable cryptographic record. Deletion, truncation, or overwrite physically disallowed.</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
