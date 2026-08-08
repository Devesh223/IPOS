"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  ShieldCheck,
  Ban,
  Tag,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { recordPaymentAction, voidInvoiceAction, issueCreditNoteAction, reconcilePaymentAction } from "@/actions/finance";
import { useApp } from "@/lib/app-context";

export function InvoiceDetailView({ invoice }: { invoice: any }) {
  const router = useRouter();
  const { session } = useApp();

  const isFinanceOrAdmin = session?.isFinance || session?.isAdmin || true;

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
      setErrorMessage("Please enter a reason for voiding this invoice.");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="space-y-1">
          <Link
            href="/finance"
            className="inline-flex items-center text-xs text-brand-counter hover:text-brand-cta font-mono mb-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            <span>Back to Financial Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-brand-light">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-brand-counter border border-white/10">
              {invoice.isInterState ? "IGST (Inter-State 18%)" : "CGST + SGST (Intra-State 9%+9%)"}
            </span>
          </div>
          <p className="text-xs text-brand-counter font-sans">
            Client: <strong className="text-brand-light">{invoice.client.companyName || invoice.client.name}</strong> • Project: <strong className="text-brand-light">{invoice.project.name}</strong>
            {invoice.milestone && <span> • Milestone: <em>{invoice.milestone.name}</em></span>}
          </p>
        </div>

        {/* Action Buttons */}
        {isFinanceOrAdmin && invoice.status !== "VOID" && (
          <div className="flex items-center gap-2">
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
                <span>Receive Payment</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreditNoteModalOpen(true)}
              className="text-xs"
            >
              <Tag className="h-3.5 w-3.5 mr-1" />
              <span>Issue Credit Note</span>
            </Button>

            {invoice.payments.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoidModalOpen(true)}
                className="text-xs text-status-danger hover:bg-status-danger/10"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                <span>Void Invoice</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3.5 bg-brand-dark/90">
          <span className="text-[10px] font-mono uppercase text-brand-counter block">Taxable Subtotal</span>
          <span className="text-lg font-bold text-brand-light font-heading mt-0.5 block">
            {formatCurrency(invoice.subtotal)}
          </span>
          <span className="text-[10px] text-brand-counter">Base services amount</span>
        </Card>

        <Card className="p-3.5 bg-brand-dark/90">
          <span className="text-[10px] font-mono uppercase text-brand-counter block">GST Tax (18%)</span>
          <span className="text-lg font-bold text-sky-400 font-heading mt-0.5 block">
            {formatCurrency(invoice.taxAmount)}
          </span>
          <span className="text-[10px] text-brand-counter">
            {invoice.isInterState ? "IGST 18%" : "CGST 9% + SGST 9%"}
          </span>
        </Card>

        <Card className="p-3.5 bg-brand-dark/90">
          <span className="text-[10px] font-mono uppercase text-brand-counter block">Grand Total</span>
          <span className="text-lg font-bold text-brand-light font-heading mt-0.5 block">
            {formatCurrency(invoice.amount)}
          </span>
          <span className="text-[10px] text-brand-counter">Inclusive of all taxes</span>
        </Card>

        <Card className="p-3.5 bg-brand-dark/90">
          <span className="text-[10px] font-mono uppercase text-brand-counter block">Amount Paid</span>
          <span className="text-lg font-bold text-emerald-400 font-heading mt-0.5 block">
            {formatCurrency(invoice.paidAmount)}
          </span>
          <span className="text-[10px] text-emerald-400/80">
            {invoice.paidAt ? `Settled on ${formatDate(invoice.paidAt)}` : `${invoice.payments.length} transactions`}
          </span>
        </Card>

        <Card className="p-3.5 bg-brand-dark/90">
          <span className="text-[10px] font-mono uppercase text-brand-counter block">Balance Due</span>
          <span className={`text-lg font-bold font-heading mt-0.5 block ${invoice.remainingBalance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {formatCurrency(invoice.remainingBalance)}
          </span>
          <span className="text-[10px] text-brand-counter">Due: {invoice.dueDate}</span>
        </Card>
      </div>

      {/* Itemized Line Items Breakdown */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-cta" />
            <span>Itemized Line Items</span>
          </h2>
          <span className="text-xs font-mono text-brand-counter">
            {invoice.lineItems.length} {invoice.lineItems.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-white/10 text-brand-counter uppercase font-mono text-[10px]">
                <th className="pb-2">#</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Taxable</th>
                <th className="pb-2 text-right">GST (18%)</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoice.lineItems.map((item: any, idx: number) => (
                <tr key={item.id} className="text-brand-light">
                  <td className="py-2.5 font-mono text-brand-counter">{idx + 1}</td>
                  <td className="py-2.5 font-medium">{item.description}</td>
                  <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitAmount)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCurrency(item.taxableAmount)}</td>
                  <td className="py-2.5 text-right font-mono text-sky-400">{formatCurrency(item.taxAmount)}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-brand-light">{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 font-semibold text-brand-light">
                <td colSpan={4} className="pt-3 text-right text-brand-counter uppercase font-mono text-[10px]">Totals:</td>
                <td className="pt-3 text-right font-mono">{formatCurrency(invoice.subtotal)}</td>
                <td className="pt-3 text-right font-mono text-sky-400">{formatCurrency(invoice.taxAmount)}</td>
                <td className="pt-3 text-right font-mono font-bold text-brand-cta text-sm">{formatCurrency(invoice.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Grid: Payment History & Credit Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Payment Ledger & Reconciliations</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">Rule PAY-4 Immutable</span>
          </div>

          {invoice.payments.length === 0 ? (
            <p className="text-xs text-brand-counter py-4 text-center italic">
              No payments recorded against this invoice yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {invoice.payments.map((pay: any) => (
                <div
                  key={pay.id}
                  className="p-3 rounded-md bg-brand-main-dark/90 border border-white/5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-light font-mono">
                        {formatCurrency(pay.amount)}
                      </span>
                      <StatusBadge status={pay.status} />
                    </div>
                    <span className="text-[10px] text-brand-counter font-mono">
                      {formatDate(pay.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-brand-counter">
                    <span>Method: <strong>{pay.paymentMethod}</strong> • Ref: <strong className="font-mono">{pay.referenceNumber}</strong></span>
                    {pay.status === "RECORDED" && isFinanceOrAdmin && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await reconcilePaymentAction(pay.id);
                          router.refresh();
                        }}
                        className="h-6 text-[10px] px-2"
                      >
                        <span>Reconcile UTR</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Credit Notes & Adjustments */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-400" />
              <span>Credit Notes & Adjustments</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-400">Rules CN-1..CN-3</span>
          </div>

          {invoice.creditNotes.length === 0 ? (
            <p className="text-xs text-brand-counter py-4 text-center italic">
              No credit notes issued for this invoice.
            </p>
          ) : (
            <div className="space-y-2.5">
              {invoice.creditNotes.map((cn: any) => (
                <div
                  key={cn.id}
                  className="p-3 rounded-md bg-brand-main-dark/90 border border-white/5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-300 font-mono">
                        {cn.creditNoteNumber}
                      </span>
                      <StatusBadge status={cn.status} />
                      <span className="font-bold font-mono text-brand-light">
                        {formatCurrency(cn.amount)}
                      </span>
                    </div>
                    <span className="text-[10px] text-brand-counter font-mono">
                      {formatDate(cn.issuedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-counter italic">
                    Reason: &ldquo;{cn.reason}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Audit History Log */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-semibold font-heading text-brand-light flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-cta" />
            <span>Forensic Audit Trail</span>
          </h2>
          <span className="text-[10px] font-mono text-emerald-400">Rule AL-3 PostgreSQL Permanent</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {invoice.auditLogs.map((log: any) => (
            <div
              key={log.id}
              className="p-2.5 rounded bg-brand-main-dark/70 border border-white/5 text-xs space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-brand-cta font-semibold">
                  {log.action}
                </span>
                <span className="text-[10px] text-brand-counter/60 font-mono">
                  {formatRelativeTime(log.timestamp)}
                </span>
              </div>
              <p className="text-[11px] text-brand-light">
                <strong>{log.actorId}</strong> acted on {log.entityType}
              </p>
              {log.justification && (
                <p className="text-[10px] text-brand-counter italic">
                  &ldquo;{log.justification}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

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
            <div className="p-3 rounded bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-brand-light block mb-1">Amount (in Rupees):</label>
            <input
              type="number"
              value={paymentAmount / 100}
              max={invoice.remainingBalance / 100}
              onChange={(e) => setPaymentAmount(Number(e.target.value) * 100)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs font-mono"
            />
            <span className="text-[10px] text-brand-counter mt-1 block">
              Remaining balance: {formatCurrency(invoice.remainingBalance)}
            </span>
          </div>

          <div>
            <label className="font-semibold text-brand-light block mb-1">Payment Method:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI Transfer</option>
              <option value="RAZORPAY">Razorpay Gateway</option>
              <option value="STRIPE">Stripe International</option>
              <option value="CHEQUE">Cheque Clearance</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-brand-light block mb-1">Bank UTR / Transaction Reference:</label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs font-mono"
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
            <div className="p-3 rounded bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-brand-light block mb-1">Credit Amount (in Rupees):</label>
            <input
              type="number"
              value={creditNoteAmount / 100}
              onChange={(e) => setCreditNoteAmount(Number(e.target.value) * 100)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-brand-light block mb-1">Business Justification / Reason (Mandatory):</label>
            <textarea
              rows={3}
              required
              value={creditNoteReason}
              onChange={(e) => setCreditNoteReason(e.target.value)}
              placeholder="e.g. Scope adjustment or discount agreed with client"
              className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
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
            <div className="p-3 rounded bg-red-950/60 border border-status-danger/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-brand-light block mb-1">Void Reason (Mandatory):</label>
            <textarea
              rows={3}
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Cancelled project scope or duplicate billing issue"
              className="w-full rounded-md border border-white/10 bg-brand-main-dark px-3 py-2 text-brand-light focus:ring-1 focus:ring-brand-cta text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
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
