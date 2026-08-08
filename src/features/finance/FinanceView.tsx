"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import {
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Tag,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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

  const isFinanceOrAdmin = session?.isFinance || session?.isAdmin || true;

  const effectiveInvoices = initialData?.invoices && initialData.invoices.length > 0 ? initialData.invoices : state.invoices;
  const effectivePayments = initialData?.payments && initialData.payments.length > 0 ? initialData.payments : state.payments;
  const effectiveCreditNotes = initialData?.creditNotes || [];

  // Metrics
  const totalInvoiced = effectiveInvoices.reduce((acc: number, i: any) => acc + i.amount, 0);
  const reconciledCollections = effectivePayments
    .filter((p: any) => p.status === "RECONCILED")
    .reduce((acc: number, p: any) => acc + p.amount, 0);
  const outstandingOverdue = effectiveInvoices
    .filter((i: any) => i.status !== "PAID" && i.status !== "VOID")
    .reduce((acc: number, i: any) => acc + i.remainingBalance, 0);
  const totalCreditNotes = effectiveCreditNotes.reduce((acc: number, cn: any) => acc + cn.amount, 0);

  // Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

  // Record Payment Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(effectiveInvoices[0]?.id || "");
  const [paymentAmount, setPaymentAmount] = useState<number>(5000000);
  const [referenceNumber, setReferenceNumber] = useState<string>(`UTR-${Math.floor(Math.random() * 9000000000)}`);
  const [autoReconcile, setAutoReconcile] = useState(true);

  // Create Invoice Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(state.projects[0]?.id || "");
  const [dueDate, setDueDate] = useState<string>("2026-08-31");
  const [isInterState, setIsInterState] = useState(false);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unitPriceRupees: number }>>([
    { description: "Brand Identity Design & Guidelines (Milestone 1 — 40%)", quantity: 1, unitPriceRupees: 60000 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Computed Invoice Preview
  const previewTotals = computeInvoiceTotals(
    lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitAmountInPaise: Math.round(li.unitPriceRupees * 100),
    })),
    isInterState
  );

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Payments & Invoicing Hub</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
              Live PostgreSQL Ledger
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Authoritative financial ledger, GST tax calculation, milestone billing, and bank reconciliation.
          </p>
        </div>

        {isFinanceOrAdmin && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="text-xs"
            >
              <Receipt className="h-3.5 w-3.5 mr-1 text-brand-cta" />
              <span>Issue New Invoice</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRecordPaymentOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Record Payment (Rule PAY-1)</span>
            </Button>
          </div>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Total Invoiced</span>
              <Receipt className="h-4 w-4 text-brand-cta" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              {formatCurrency(totalInvoiced)}
            </div>
            <p className="text-[10px] text-brand-counter mt-1">{effectiveInvoices.length} issued invoices</p>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Reconciled Collections</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-emerald-400">
              {formatCurrency(reconciledCollections)}
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1">Rule PAY-2 Bank Reconciled</p>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Outstanding / Overdue</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-amber-400">
              {formatCurrency(outstandingOverdue)}
            </div>
            <p className="text-[10px] text-amber-300 mt-1">Constraining Rule PAY-3 milestones</p>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-cta/40 transition-colors">
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Credit Adjustments</span>
              <Tag className="h-4 w-4 text-purple-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-purple-300">
              {formatCurrency(totalCreditNotes)}
            </div>
            <p className="text-[10px] text-purple-400/80 mt-1">{effectiveCreditNotes.length} credit notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold font-heading text-brand-light">
            Issued Client Invoices
          </h2>
          <span className="text-xs font-mono text-brand-counter">
            Showing {effectiveInvoices.length} {effectiveInvoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>

        <div className="space-y-2.5">
          {effectiveInvoices.map((inv: any) => (
            <div
              key={inv.id}
              className="p-4 rounded-lg border border-white/10 bg-brand-dark/90 hover:border-brand-cta/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/finance/invoices/${inv.id}`}
                    className="font-mono font-bold text-brand-light group-hover:text-brand-cta transition-colors flex items-center gap-1.5"
                  >
                    <span>{inv.invoiceNumber}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <StatusBadge status={inv.status} />
                  <span className="text-[10px] text-brand-counter font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    {inv.clientName}
                  </span>
                  {inv.isInterState ? (
                    <span className="text-[9px] text-sky-400 font-mono bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/20">
                      IGST 18%
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      CGST+SGST 18%
                    </span>
                  )}
                </div>
                <p className="text-brand-counter text-[11px]">
                  Project: <strong>{inv.projectName}</strong>
                  {inv.milestoneName && <span> • Milestone: <em>{inv.milestoneName}</em></span>}
                </p>
              </div>

              <div className="flex items-center gap-6 justify-between md:justify-end">
                <div>
                  <span className="text-[10px] text-brand-counter uppercase font-mono block">
                    Amount / Remaining
                  </span>
                  <span className="font-semibold text-brand-light block">
                    {formatCurrency(inv.amount)} /{" "}
                    <span className={inv.remainingBalance > 0 ? "text-amber-400 font-bold" : "text-emerald-400"}>
                      {formatCurrency(inv.remainingBalance)}
                    </span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-brand-counter uppercase font-mono block">Due Date</span>
                  <span className={`font-mono ${inv.isOverdue ? "text-status-danger font-bold" : "text-brand-light"}`}>
                    {inv.dueDate}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
                      <span>Receive</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Payment History & Credit Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Payments History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-heading text-brand-light flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Immutable Payment Ledger</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">
              Rule PAY-4 Non-Destructive
            </span>
          </div>

          <div className="space-y-2">
            {effectivePayments.map((pay: any) => (
              <div
                key={pay.id}
                className="p-3 rounded border border-white/5 bg-brand-main-dark/80 flex items-center justify-between text-xs font-sans"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-light font-mono">
                      {formatCurrency(pay.amount)}
                    </span>
                    <StatusBadge status={pay.status} />
                    <span className="text-[10px] text-brand-counter font-mono">
                      Ref: {pay.referenceNumber ?? "N/A"}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-counter">
                    Applied to {pay.invoiceNumber} ({pay.projectName}) • Method: {pay.paymentMethod}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-brand-counter/60 font-mono block">
                    {formatDate(pay.createdAt)}
                  </span>
                  {pay.status === "RECORDED" && isFinanceOrAdmin && (
                    <button
                      onClick={async () => {
                        await reconcilePaymentAction(pay.id);
                        router.refresh();
                      }}
                      className="text-[10px] text-emerald-400 hover:underline font-mono mt-0.5 block"
                    >
                      Reconcile UTR →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Notes Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-heading text-brand-light flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-400" />
              <span>Credit Notes & Adjustments</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-400">
              Rules CN-1..CN-3
            </span>
          </div>

          {effectiveCreditNotes.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-white/10 text-center text-xs text-brand-counter">
              No credit notes issued in this workspace.
            </div>
          ) : (
            <div className="space-y-2">
              {effectiveCreditNotes.map((cn: any) => (
                <div
                  key={cn.id}
                  className="p-3 rounded border border-white/5 bg-brand-main-dark/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-300 font-mono">{cn.creditNoteNumber}</span>
                      <StatusBadge status={cn.status} />
                      <span className="font-bold font-mono text-brand-light">{formatCurrency(cn.amount)}</span>
                    </div>
                    <span className="text-[10px] text-brand-counter/60 font-mono">
                      {formatDate(cn.issuedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-counter">
                    Invoice: <strong className="text-brand-light">{cn.invoiceNumber}</strong> ({cn.clientName}) • &ldquo;{cn.reason}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Invoice with Line Items & Live GST Calculation */}
      <Modal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        title="Issue Milestone Invoice"
        description="Generates an authoritative GST invoice with itemized line items."
        size="lg"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-brand-light block mb-1">Target Project:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
              >
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.clientName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-brand-light block mb-1">Due Date:</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-brand-light block mb-1">GST Tax Supply Type:</label>
              <select
                value={isInterState ? "INTER" : "INTRA"}
                onChange={(e) => setIsInterState(e.target.value === "INTER")}
                className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
              >
                <option value="INTRA">Intra-State (CGST 9% + SGST 9%)</option>
                <option value="INTER">Inter-State (IGST 18%)</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-light">Itemized Deliverables & Scope:</span>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs text-brand-cta hover:underline flex items-center gap-1 font-mono"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-brand-main-dark/90 p-2 rounded border border-white/10">
                  <input
                    type="text"
                    required
                    placeholder="Deliverable description (e.g. 3D Motion Asset Package)"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                    className="flex-1 rounded border border-white/10 bg-black/40 px-2.5 py-1.5 text-brand-light text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                    className="w-14 rounded border border-white/10 bg-black/40 px-2 py-1.5 text-brand-light text-xs text-center font-mono"
                    title="Quantity"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-brand-counter text-xs">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPriceRupees}
                      onChange={(e) => handleLineItemChange(idx, "unitPriceRupees", Number(e.target.value))}
                      className="w-28 rounded border border-white/10 bg-black/40 pl-5 pr-2 py-1.5 text-brand-light text-xs font-mono text-right"
                      title="Unit Price in INR"
                    />
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="text-status-danger/70 hover:text-status-danger p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Authoritative Live Tax Preview */}
          <div className="p-3.5 rounded-lg bg-black/50 border border-white/10 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-brand-counter">
              <span>Subtotal (Base Scope):</span>
              <span>{formatCurrency(previewTotals.subtotalInPaise)}</span>
            </div>
            <div className="flex justify-between text-sky-400">
              <span>GST Tax (18% {isInterState ? "IGST" : "CGST 9% + SGST 9%"}):</span>
              <span>{formatCurrency(previewTotals.taxAmountInPaise)}</span>
            </div>
            <div className="flex justify-between font-bold text-brand-cta text-sm pt-1.5 border-t border-white/10">
              <span>Grand Total Amount:</span>
              <span>{formatCurrency(previewTotals.grandTotalInPaise)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleCreateInvoiceSubmit}>
              <span>Issue Authoritative Invoice</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment Transaction"
        description="Records incoming funds against an Invoice. Synced immediately into the immutable Audit Log."
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-brand-light block">Select Invoice:</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const inv = effectiveInvoices.find((i) => i.id === e.target.value);
                if (inv) setPaymentAmount(inv.remainingBalance);
              }}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none text-xs"
            >
              {effectiveInvoices
                .filter((i) => i.status !== "VOID")
                .map((inv: any) => (
                  <option key={inv.id} value={inv.id} className="bg-brand-dark">
                    {inv.invoiceNumber} — {inv.clientName} ({formatCurrency(inv.remainingBalance)} remaining)
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-light block">Amount (in Rupees):</label>
            <input
              type="number"
              value={paymentAmount / 100}
              onChange={(e) => setPaymentAmount(Number(e.target.value) * 100)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-light block">Bank UTR / Transaction Ref:</label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none text-xs font-mono"
            />
          </div>

          <label className="flex items-center gap-2 p-2.5 rounded bg-white/5 border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={autoReconcile}
              onChange={(e) => setAutoReconcile(e.target.checked)}
              className="rounded border-white/20 bg-brand-main-dark text-brand-cta focus:ring-brand-cta"
            />
            <span className="text-[11px] text-brand-light">
              Mark as Bank Reconciled (Verified in Studio Account)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
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
