"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Tag,
  Trash2,
  Search,
  CheckCheck,
  FileCheck,
  ArrowLeft,
  Calendar,
  Building2,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createInvoiceAction, recordPaymentAction, reconcilePaymentAction } from "@/actions/finance";
import { computeInvoiceTotals } from "@/domain/finance/calculations";

export function FinanceView({
  initialData,
}: {
  initialData?: { invoices: any[]; payments: any[]; creditNotes?: any[] };
}) {
  const router = useRouter();
  const { state, session } = useApp();

  const isClient = session?.isClient ?? false;
  const isFinanceOrAdmin = (session?.isFinance || session?.isAdmin) && !isClient;

  const rawInvoices = useMemo(() => initialData?.invoices ?? [], [initialData?.invoices]);
  const rawPayments = useMemo(() => initialData?.payments ?? [], [initialData?.payments]);
  const rawCreditNotes = useMemo(() => initialData?.creditNotes ?? [], [initialData?.creditNotes]);

  // Metrics
  const totalInvoiced = rawInvoices.reduce((acc: number, i: any) => acc + i.amount, 0);
  const reconciledCollections = rawPayments
    .filter((p: any) => p.status === "RECONCILED")
    .reduce((acc: number, p: any) => acc + p.amount, 0);
  const outstandingBalance = rawInvoices
    .filter((i: any) => i.status !== "PAID" && i.status !== "VOID")
    .reduce((acc: number, i: any) => acc + i.remainingBalance, 0);
  const overdueAmount = rawInvoices
    .filter((i: any) => i.isOverdue && i.status !== "PAID" && i.status !== "VOID")
    .reduce((acc: number, i: any) => acc + i.remainingBalance, 0);

  // Active view tab
  const [activeLedgerTab, setActiveLedgerTab] = useState("invoices");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

  // Record Payment Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(rawInvoices[0]?.id || "");
  const [paymentAmount, setPaymentAmount] = useState<number>(rawInvoices[0]?.remainingBalance || 5000000);
  const [referenceNumber, setReferenceNumber] = useState<string>(`UTR-${Math.floor(Math.random() * 9000000000)}`);
  const [autoReconcile, setAutoReconcile] = useState(true);

  // Create Invoice Guided Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(state.projects[0]?.id || "");
  const [dueDate, setDueDate] = useState<string>("2026-09-15");
  const [isInterState, setIsInterState] = useState(false);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unitPriceRupees: number }>>([
    { description: "Milestone Deliverable Scope Package", quantity: 1, unitPriceRupees: 60000 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Computed Invoice Preview
  const previewTotals = useMemo(() => {
    return computeInvoiceTotals(
      lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitAmountInPaise: Math.round((li.unitPriceRupees || 0) * 100),
      })),
      isInterState
    );
  }, [lineItems, isInterState]);

  // Prioritize invoices: Overdue (1), Due Soon / Pending (2), Paid (3), Void (4)
  const prioritizedInvoices = useMemo(() => {
    return [...rawInvoices].sort((a, b) => {
      const getScore = (inv: typeof rawInvoices[0]) => {
        if (inv.isOverdue && inv.status !== "PAID" && inv.status !== "VOID") return 4;
        if (inv.status === "ISSUED" || inv.status === "SENT" || inv.status === "PARTIALLY_PAID") return 3;
        if (inv.status === "PAID") return 2;
        return 1;
      };
      return getScore(b) - getScore(a);
    });
  }, [rawInvoices]);

  const filteredInvoices = prioritizedInvoices.filter((inv: any) => {
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OVERDUE" && inv.isOverdue && inv.status !== "PAID") ||
      (statusFilter === "PENDING" && (inv.status === "ISSUED" || inv.status === "SENT" || inv.status === "PARTIALLY_PAID")) ||
      (statusFilter === "PAID" && inv.status === "PAID");

    const matchQuery =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchQuery;
  });

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPriceRupees: 25000 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, idx) => idx !== index));
    }
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    const current = { ...updated[index]! };
    (current as any)[field] = value;
    updated[index] = current;
    setLineItems(updated);
  };

  const handleCreateInvoiceSubmit = async () => {
    if (lineItems.some((li) => !li.description.trim() || li.unitPriceRupees <= 0)) {
      setErrorMessage("Please ensure all line items have a valid description and amount.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await createInvoiceAction({
        projectId: selectedProjectId,
        dueDate,
        isInterState,
        notes: invoiceNotes,
        lineItems: lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          unitAmountInPaise: Math.round(Number(li.unitPriceRupees) * 100),
        })),
      });

      setIsLoading(false);
      if (res.success && res.invoice) {
        setIsCreateInvoiceOpen(false);
        router.push(`/finance/invoices/${res.invoice.id}`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to create invoice.");
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (paymentAmount <= 0) {
      setErrorMessage("Payment amount must be greater than zero.");
      return;
    }
    if (!referenceNumber.trim()) {
      setErrorMessage("Bank UTR / Reference number is required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await recordPaymentAction({
        invoiceId: selectedInvoiceId,
        amountInPaise: Number(paymentAmount),
        referenceNumber,
        autoReconcile,
      });

      setIsLoading(false);
      if (res.success) {
        setIsRecordPaymentOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to record payment.");
    }
  };

  const selectedPaymentInvoice = rawInvoices.find((i) => i.id === selectedInvoiceId);
  const remainingAfterPayment = selectedPaymentInvoice
    ? Math.max(0, selectedPaymentInvoice.remainingBalance - paymentAmount)
    : 0;

  const ledgerTabs = [
    { id: "invoices", label: "Invoices Ledger", count: rawInvoices.length },
    { id: "payments", label: "Payments Registry", count: rawPayments.length },
    { id: "credit_notes", label: "Credit Notes", count: rawCreditNotes.length },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/25 uppercase tracking-wider">
              Rule PAY-2 Bank Reconciled
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Live PostgreSQL Financial Ledger
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Finance & Invoicing Control
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Institutional billing, milestone delivery gates, GST statutory tax computation, and bank reconciliation.
          </p>
        </div>

        {isFinanceOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setWizardStep(1);
              setErrorMessage(null);
              setIsCreateInvoiceOpen(true);
            }}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Create Invoice</span>
          </Button>
        )}
      </div>

      {/* Executive Financial Summary (Compact Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Total Invoiced
          </span>
          <div className="text-lg sm:text-xl font-bold font-heading text-slate-100 font-mono">
            {formatCurrency(totalInvoiced)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {rawInvoices.length} Issued Invoices
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Reconciled Collections
          </span>
          <div className="text-lg sm:text-xl font-bold font-heading text-emerald-400 font-mono">
            {formatCurrency(reconciledCollections)}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono block">
            Rule PAY-2 Verified
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Outstanding Balance
          </span>
          <div className={`text-lg sm:text-xl font-bold font-heading font-mono ${outstandingBalance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {formatCurrency(outstandingBalance)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Rule PAY-3 Delivery Gate
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Overdue Amount
          </span>
          <div className={`text-lg sm:text-xl font-bold font-heading font-mono ${overdueAmount > 0 ? "text-rose-400" : "text-slate-400"}`}>
            {formatCurrency(overdueAmount)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {overdueAmount > 0 ? "Requires Follow-up" : "Zero Overdue"}
          </span>
        </div>
      </div>

      {/* Tabs Switcher for Ledgers */}
      <Tabs tabs={ledgerTabs} activeTab={activeLedgerTab} onChange={setActiveLedgerTab} />

      {/* TAB 1: INVOICES LEDGER */}
      {activeLedgerTab === "invoices" && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
            <div className="relative flex-1 max-w-md">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search invoices by #, client, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "ALL", label: "All Invoices" },
                { id: "OVERDUE", label: "Overdue" },
                { id: "PENDING", label: "Pending Payment" },
                { id: "PAID", label: "Paid" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25"
                      : "bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-white/[0.04]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          {filteredInvoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices match your filter criteria"
              description="Try adjusting your search query or status filter to see other financial invoices."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
            />
          ) : (
            <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
              {/* Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                <div className="col-span-3">Invoice & Tax Type</div>
                <div className="col-span-3">Client & Scope</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-right">Amount / Due</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.04]">
                {filteredInvoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center text-xs"
                  >
                    {/* Col 1: Invoice & Tax */}
                    <div className="col-span-3 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/finance/invoices/${inv.id}`}
                          className="font-mono font-bold text-slate-100 hover:text-amber-400 transition-colors"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        {inv.isInterState ? (
                          <span className="text-[9px] text-sky-400 font-mono bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-500/20">
                            IGST 18%
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            CGST+SGST
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Due: {inv.dueDate}
                      </span>
                    </div>

                    {/* Col 2: Client & Scope */}
                    <div className="col-span-3 space-y-0.5 min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">
                        {inv.clientName}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate">
                        {inv.projectName}
                      </p>
                    </div>

                    {/* Col 3: Status */}
                    <div className="col-span-2 lg:text-center">
                      <StatusBadge status={inv.status} className="text-[9px] px-1.5 py-0.5" />
                    </div>

                    {/* Col 4: Amount & Due */}
                    <div className="col-span-2 lg:text-right space-y-0.5">
                      <span className="font-mono font-bold text-slate-100 block">
                        {formatCurrency(inv.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-mono block ${
                          inv.remainingBalance > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"
                        }`}
                      >
                        {inv.remainingBalance > 0
                          ? `${formatCurrency(inv.remainingBalance)} Due`
                          : "Fully Paid"}
                      </span>
                    </div>

                    {/* Col 5: Actions */}
                    <div className="col-span-2 flex items-center justify-between lg:justify-end gap-2 text-right">
                      <Link href={`/finance/invoices/${inv.id}`}>
                        <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5">
                          <span>Inspect</span>
                        </Button>
                      </Link>

                      {isFinanceOrAdmin && inv.remainingBalance > 0 && inv.status !== "VOID" && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            setPaymentAmount(inv.remainingBalance);
                            setIsRecordPaymentOpen(true);
                          }}
                          className="h-7 text-xs px-2.5"
                        >
                          <span>Record Payment</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENTS REGISTRY */}
      {activeLedgerTab === "payments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Immutable Payment History (Rule PAY-4)
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">
              PostgreSQL Verified
            </span>
          </div>

          {rawPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#060D0C] rounded-lg border border-white/[0.07]">
              No payments recorded in this workspace.
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] divide-y divide-white/[0.04] overflow-hidden">
              {rawPayments.map((pay: any) => (
                <div
                  key={pay.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-100 font-mono">
                        {formatCurrency(pay.amount)}
                      </span>
                      <StatusBadge status={pay.status} className="text-[9px]" />
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ref: {pay.referenceNumber ?? "N/A"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Applied to <strong>{pay.invoiceNumber}</strong> ({pay.projectName}) • Method: {pay.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDate(pay.createdAt)}
                    </span>
                    {pay.status === "RECORDED" && isFinanceOrAdmin && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await reconcilePaymentAction(pay.id);
                          router.refresh();
                        }}
                        className="h-6 text-[10px] px-2 text-emerald-400"
                      >
                        <span>Reconcile UTR</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREDIT NOTES */}
      {activeLedgerTab === "credit_notes" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold font-heading text-slate-200">
              Credit Notes & Adjustments (Rules CN-1..CN-3)
            </h2>
          </div>

          {rawCreditNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-[#060D0C] rounded-lg border border-white/[0.07]">
              No credit notes issued in this workspace.
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] divide-y divide-white/[0.04] overflow-hidden">
              {rawCreditNotes.map((cn: any) => (
                <div
                  key={cn.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-300 font-mono">{cn.creditNoteNumber}</span>
                      <StatusBadge status={cn.status} className="text-[9px]" />
                      <span className="font-bold font-mono text-slate-100">{formatCurrency(cn.amount)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Invoice: {cn.invoiceNumber} ({cn.clientName}) • &ldquo;{cn.reason}&rdquo;
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Issued on {formatDate(cn.issuedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Guided Invoice Creation Wizard */}
      <Modal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        title="Issue Milestone Invoice"
        description="Generates an authoritative GST invoice with server-validated statutory calculation (Rule PAY-1)."
        size="lg"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Wizard Step Navigation */}
          <div className="grid grid-cols-3 gap-2 pb-2 border-b border-white/[0.06] text-center font-mono text-[10px]">
            <div className={`p-1.5 rounded border ${wizardStep >= 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              1. Project & Terms
            </div>
            <div className={`p-1.5 rounded border ${wizardStep >= 2 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              2. Line Items
            </div>
            <div className={`p-1.5 rounded border ${wizardStep === 3 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              3. Review & Issue
            </div>
          </div>

          {/* STEP 1: Project & Terms */}
          {wizardStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Target Project Engagement (Rule P-1):</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Due Date:</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">GST Tax Supply Type:</label>
                  <select
                    value={isInterState ? "INTER" : "INTRA"}
                    onChange={(e) => setIsInterState(e.target.value === "INTER")}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="INTRA">Intra-State (CGST 9% + SGST 9%)</option>
                    <option value="INTER">Inter-State (IGST 18%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Invoice Notes / Payment Instructions (Optional):</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Milestone 1 settlement via RTGS/NEFT to Indian Pixel HDFC account."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Line Items */}
          {wizardStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Itemized Scope Deliverables:</span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#030706] p-2 rounded border border-white/[0.08]">
                    <input
                      type="text"
                      required
                      placeholder="Scope description (e.g. 3D Spatial Identity)"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                      className="flex-1 rounded border border-white/[0.08] bg-black/40 px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                      className="w-14 rounded border border-white/[0.08] bg-black/40 px-2 py-1.5 text-slate-100 text-xs text-center font-mono focus:outline-none focus:border-amber-500/40"
                      title="Quantity"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-500 text-xs">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPriceRupees}
                        onChange={(e) => handleLineItemChange(idx, "unitPriceRupees", Number(e.target.value))}
                        className="w-28 rounded border border-white/[0.08] bg-black/40 pl-5 pr-2 py-1.5 text-slate-100 text-xs font-mono text-right focus:outline-none focus:border-amber-500/40"
                        title="Unit Price in INR"
                      />
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-rose-400/70 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Live Subtotal */}
              <div className="p-2.5 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Taxable Base Subtotal:</span>
                <span className="font-bold text-slate-200">{formatCurrency(previewTotals.subtotalInPaise)}</span>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Summary */}
          {wizardStep === 3 && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.08] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Base Scope Subtotal:</span>
                  <span className="text-slate-200">{formatCurrency(previewTotals.subtotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-sky-400">
                  <span>GST Statutory Tax (18% {isInterState ? "IGST" : "CGST 9% + SGST 9%"}):</span>
                  <span>{formatCurrency(previewTotals.taxAmountInPaise)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-400 text-sm pt-2 border-t border-white/[0.08]">
                  <span>Grand Total Payable:</span>
                  <span>{formatCurrency(previewTotals.grandTotalInPaise)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
                <p>Due Date: <strong className="text-slate-200 font-mono">{dueDate}</strong></p>
                <p>Tax Jurisdiction: <strong className="text-slate-200">{isInterState ? "Inter-State (IGST 18%)" : "Intra-State (CGST 9% + SGST 9%)"}</strong></p>
              </div>
            </div>
          )}

          {/* Wizard Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                if (wizardStep === 1) setIsCreateInvoiceOpen(false);
                else setWizardStep((prev) => (prev - 1) as any);
              }}
            >
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>

            {wizardStep < 3 ? (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  if (wizardStep === 2 && lineItems.some((li) => !li.description.trim() || li.unitPriceRupees <= 0)) {
                    setErrorMessage("Please complete all line item descriptions and amounts.");
                    return;
                  }
                  setErrorMessage(null);
                  setWizardStep((prev) => (prev + 1) as any);
                }}
              >
                <span>Continue</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                onClick={handleCreateInvoiceSubmit}
              >
                <span>Issue Invoice</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment Transaction"
        description="Records incoming funds against an Invoice with immediate audit log sync."
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-200 block">Select Target Invoice:</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const inv = rawInvoices.find((i) => i.id === e.target.value);
                if (inv) setPaymentAmount(inv.remainingBalance);
              }}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            >
              {rawInvoices
                .filter((i) => i.status !== "VOID")
                .map((inv: any) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.clientName} ({formatCurrency(inv.remainingBalance)} due)
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-200 block">Payment Amount (in Rupees):</label>
            <input
              type="number"
              value={paymentAmount / 100}
              onChange={(e) => setPaymentAmount(Number(e.target.value) * 100)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-200 block">Bank UTR / Transaction Reference:</label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] p-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          {/* Remaining balance preview */}
          <div className="p-2.5 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Outstanding after payment:</span>
            <span className={remainingAfterPayment === 0 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {remainingAfterPayment === 0 ? "₹0 (Fully Paid)" : formatCurrency(remainingAfterPayment)}
            </span>
          </div>

          <label className="flex items-center gap-2 p-2 rounded bg-white/[0.02] border border-white/[0.06] cursor-pointer">
            <input
              type="checkbox"
              checked={autoReconcile}
              onChange={(e) => setAutoReconcile(e.target.checked)}
              className="rounded border-white/20 bg-[#030706] text-amber-500 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-300">
              Mark as Bank Reconciled (Verified in Studio Account)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleRecordPaymentSubmit}>
              <span>Confirm & Post Transaction</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


