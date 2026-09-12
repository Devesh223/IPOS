"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  ShieldCheck,
  Ban,
  Tag,
  Clock,
  Printer,
  Building2,
  Calendar,
  Check,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { recordPaymentAction, voidInvoiceAction, issueCreditNoteAction, reconcilePaymentAction } from "@/actions/finance";
import { useApp } from "@/lib/app-context";
import { IndianPixelInvoiceDocument } from "@/components/invoice/IndianPixelInvoiceDocument";

export function InvoiceDetailView({ invoice }: { invoice: any }) {
  const router = useRouter();
  const { session } = useApp();

  const isClient = session?.isClient ?? false;
  const isFinanceOrAdmin = (session?.isFinance || session?.isAdmin) && !isClient;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState(invoice.remainingBalance);
  const [referenceNumber, setReferenceNumber] = useState(`UTR-${Math.floor(Math.random() * 9000000000)}`);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [autoReconcile, setAutoReconcile] = useState(true);

  const [voidReason, setVoidReason] = useState("");
  const [creditNoteAmount, setCreditNoteAmount] = useState(invoice.remainingBalance || 5000000);
  const [creditNoteReason, setCreditNoteReason] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRecordPayment = async () => {
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
        invoiceId: invoice.id,
        amountInPaise: Number(paymentAmount),
        referenceNumber,
        paymentMethod,
        autoReconcile,
      });
      setIsLoading(false);
      if (res.success) {
        setIsPaymentModalOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to record payment.");
    }
  };

  const handleVoidInvoice = async () => {
    if (!voidReason.trim()) {
      setErrorMessage("Please enter an operational reason for voiding this invoice.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await voidInvoiceAction(invoice.id, voidReason);
      setIsLoading(false);
      if (res.success) {
        setIsVoidModalOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to void invoice.");
    }
  };

  const handleIssueCreditNote = async () => {
    if (!creditNoteReason.trim()) {
      setErrorMessage("Please enter a business reason for the credit note.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await issueCreditNoteAction({
        invoiceId: invoice.id,
        amountInPaise: Number(creditNoteAmount),
        reason: creditNoteReason,
      });
      setIsLoading(false);
      if (res.success) {
        setIsCreditNoteModalOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to issue credit note.");
    }
  };

  const remainingAfterPayment = Math.max(0, invoice.remainingBalance - paymentAmount);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1 min-w-0">
          <Link
            href="/finance"
            className="inline-flex items-center text-xs text-slate-400 hover:text-amber-400 font-mono mb-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            <span>Back to Finance Control</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">
              {invoice.isInterState ? "IGST (Inter-State 18%)" : "CGST + SGST (Intra-State 9%+9%)"}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Client: <strong className="text-slate-200">{invoice.client?.companyName || invoice.client?.name}</strong> • Project: <strong className="text-slate-200">{invoice.project?.name}</strong>
            {invoice.milestone && <span> • Milestone: <em>{invoice.milestone.name}</em></span>}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            <span>Print Invoice</span>
          </Button>

          {isFinanceOrAdmin && invoice.status !== "VOID" && (
            <>
              {invoice.remainingBalance > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setPaymentAmount(invoice.remainingBalance);
                    setIsPaymentModalOpen(true);
                  }}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Record Payment</span>
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreditNoteModalOpen(true)}
                className="text-xs"
              >
                <Tag className="h-3.5 w-3.5 mr-1" />
                <span>Credit Note</span>
              </Button>

              {invoice.payments.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVoidModalOpen(true)}
                  className="text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  <span>Void</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Financial Summary Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Taxable Subtotal</span>
          <div className="text-lg font-bold text-slate-100 font-heading font-mono">
            {formatCurrency(invoice.subtotal)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Base Scope Value</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">GST Statutory Tax</span>
          <div className="text-lg font-bold text-sky-400 font-heading font-mono">
            {formatCurrency(invoice.taxAmount)}
          </div>
          <span className="text-[10px] text-sky-400/80 font-mono block">
            {invoice.isInterState ? "IGST 18%" : "CGST 9% + SGST 9%"}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Invoice Grand Total</span>
          <div className="text-lg font-bold text-slate-100 font-heading font-mono">
            {formatCurrency(invoice.amount)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Inclusive of GST</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Reconciled Collections</span>
          <div className="text-lg font-bold text-emerald-400 font-heading font-mono">
            {formatCurrency(invoice.paidAmount)}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono block">
            {invoice.paidAt ? `Settled on ${formatDate(invoice.paidAt)}` : `${invoice.payments.length} Transaction(s)`}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">Balance Due</span>
          <div className={`text-lg font-bold font-heading font-mono ${invoice.remainingBalance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {formatCurrency(invoice.remainingBalance)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">Due: {invoice.dueDate}</span>
        </div>
      </div>

      {/* Formal Printable Studio Invoice Document Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 no-print">
          <span>Format: Official Indian Pixel Studio Tax Invoice & Payment Schedule</span>
          <span className="text-amber-400">Ready for PDF Download & Printing</span>
        </div>
        <IndianPixelInvoiceDocument invoice={invoice} />
      </div>

      {/* Grid: Payment Ledger & Credit Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <div className="p-5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h2 className="text-sm font-semibold font-heading text-slate-200 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Immutable Payment Ledger</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">Rule PAY-4 Verified</span>
          </div>

          {invoice.payments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center italic">
              No payments recorded against this invoice yet.
            </p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((pay: any) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-lg bg-[#030706] border border-white/[0.04] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 font-mono">
                        {formatCurrency(pay.amount)}
                      </span>
                      <StatusBadge status={pay.status} className="text-[9px]" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDate(pay.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Method: <strong>{pay.paymentMethod}</strong> • Ref: <strong className="font-mono">{pay.referenceNumber}</strong></span>
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

        {/* Credit Notes */}
        <div className="p-5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h2 className="text-sm font-semibold font-heading text-slate-200 flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-400" />
              <span>Credit Notes & Adjustments</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-400">Rules CN-1..CN-3</span>
          </div>

          {invoice.creditNotes.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center italic">
              No credit notes issued for this invoice.
            </p>
          ) : (
            <div className="space-y-2">
              {invoice.creditNotes.map((cn: any) => (
                <div
                  key={cn.id}
                  className="p-3 rounded-lg bg-[#030706] border border-white/[0.04] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-300 font-mono">
                        {cn.creditNoteNumber}
                      </span>
                      <StatusBadge status={cn.status} className="text-[9px]" />
                      <span className="font-bold font-mono text-slate-100">
                        {formatCurrency(cn.amount)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDate(cn.issuedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    Reason: &ldquo;{cn.reason}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forensic Audit History Log (Internal Only) */}
      {!isClient && (
        <div className="p-5 rounded-lg bg-[#060D0C] border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <h2 className="text-sm font-semibold font-heading text-slate-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Forensic Audit Trail</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">Rule AL-3 PostgreSQL Permanent</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {invoice.auditLogs.map((log: any) => (
              <div
                key={log.id}
                className="p-2.5 rounded bg-[#030706] border border-white/[0.04] text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <strong>{log.actorId}</strong> acted on {log.entityType}
                </p>
                {log.justification && (
                  <p className="text-[10px] text-slate-400 italic">
                    &ldquo;{log.justification}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Verified Payment"
        description={`Record incoming funds against Invoice ${invoice.invoiceNumber}.`}
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Payment Amount (in Rupees):</label>
            <input
              type="number"
              value={paymentAmount / 100}
              max={invoice.remainingBalance / 100}
              onChange={(e) => setPaymentAmount(Number(e.target.value) * 100)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/40 text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Remaining balance: {formatCurrency(invoice.remainingBalance)}
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Payment Method:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI Transfer</option>
              <option value="RAZORPAY">Razorpay Gateway</option>
              <option value="STRIPE">Stripe International</option>
              <option value="CHEQUE">Cheque Clearance</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Bank UTR / Transaction Reference:</label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          {/* Remaining Balance Preview */}
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
            <Button variant="ghost" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleRecordPayment}>
              <span>Confirm & Post Transaction</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Issue Credit Note Modal */}
      <Modal
        isOpen={isCreditNoteModalOpen}
        onClose={() => setIsCreditNoteModalOpen(false)}
        title="Issue Credit Note"
        description={`Issue an independent credit note against Invoice ${invoice.invoiceNumber}.`}
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Credit Amount (in Rupees):</label>
            <input
              type="number"
              value={creditNoteAmount / 100}
              onChange={(e) => setCreditNoteAmount(Number(e.target.value) * 100)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Business Justification / Reason (Mandatory):</label>
            <textarea
              rows={3}
              required
              value={creditNoteReason}
              onChange={(e) => setCreditNoteReason(e.target.value)}
              placeholder="e.g. Scope adjustment or discount agreed with client"
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsCreditNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleIssueCreditNote}>
              <span>Issue Credit Note</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Void Invoice Modal */}
      <Modal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        title="Void Invoice"
        description="Permanently void this invoice. Requires written operational justification."
        size="sm"
      >
        <div className="space-y-4 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Void Reason (Mandatory):</label>
            <textarea
              rows={3}
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Cancelled project scope or duplicate billing issue"
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsVoidModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" isLoading={isLoading} onClick={handleVoidInvoice}>
              <span>Permanently Void</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


