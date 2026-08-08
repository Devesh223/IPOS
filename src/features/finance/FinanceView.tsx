"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { CreditCard, DollarSign, Plus, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/utils";

export function FinanceView() {
  const { state, recordPayment, session } = useApp();

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(state.invoices[0]?.id || "");
  const [paymentAmount, setPaymentAmount] = useState<number>(5000000);
  const [referenceNumber, setReferenceNumber] = useState<string>("UTR-" + Math.floor(Math.random() * 9000000000));

  const isFinanceOrAdmin = session?.isFinance ?? true;

  const handleRecord = () => {
    recordPayment({
      invoiceId: selectedInvoiceId,
      amount: Number(paymentAmount),
      referenceNumber,
    });
    setIsRecordPaymentOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light">
            Payments & Invoicing Hub
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Independent tracking of Milestone delivery and Payment settlement (Rule PAY-2).
          </p>
        </div>

        {isFinanceOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRecordPaymentOpen(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Record Payment (Rule PAY-1)</span>
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase">Total Invoiced</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold font-heading text-brand-light">
              {formatCurrency(state.invoices.reduce((a, b) => a + b.amount, 0))}
            </div>
            <p className="text-[10px] text-brand-counter mt-1">Across 3 client engagements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase">Reconciled Collections</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold font-heading text-emerald-400">
              {formatCurrency(state.payments.reduce((a, b) => a + b.amount, 0))}
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1">Rule PAY-4 immutable entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase">Outstanding / Overdue</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold font-heading text-status-danger">
              {formatCurrency(
                state.invoices
                  .filter((i) => i.isOverdue || i.status === "ISSUED")
                  .reduce((a, b) => a + b.remainingBalance, 0)
              )}
            </div>
            <p className="text-[10px] text-amber-300 mt-1">Constraining gated milestones (Rule PAY-3)</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-heading text-brand-light">
            Issued Client Invoices
          </h2>
        </div>

        <div className="space-y-2">
          {state.invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-lg border border-white/10 bg-brand-dark/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-light">{inv.invoiceNumber}</span>
                  <StatusBadge status={inv.status} />
                  <span className="text-[10px] text-brand-counter font-mono px-2 py-0.5 rounded bg-white/5">
                    {inv.clientName}
                  </span>
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
                    <span className={inv.remainingBalance > 0 ? "text-amber-400" : "text-emerald-400"}>
                      {formatCurrency(inv.remainingBalance)}
                    </span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-brand-counter uppercase font-mono block">Due Date</span>
                  <span className={`font-mono ${inv.isOverdue ? "text-status-danger font-semibold" : "text-brand-light"}`}>
                    {inv.dueDate}
                  </span>
                </div>

                {isFinanceOrAdmin && inv.remainingBalance > 0 && (
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
          ))}
        </div>
      </div>

      {/* Payments History (Rule PAY-4 Immutability) */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold font-heading text-brand-light">
            Immutable Recorded Transactions
          </h2>
          <span className="text-[10px] font-mono text-emerald-400">
            Rule PAY-4: Deletion Structurally Impossible
          </span>
        </div>

        <div className="space-y-2">
          {state.payments.map((pay) => (
            <div
              key={pay.id}
              className="p-3 rounded border border-white/5 bg-brand-main-dark/80 flex items-center justify-between text-xs font-sans"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-light">
                    {formatCurrency(pay.amount)}
                  </span>
                  <StatusBadge status={pay.status} />
                  <span className="text-[10px] text-brand-counter font-mono">
                    Ref: {pay.referenceNumber ?? "N/A"}
                  </span>
                </div>
                <p className="text-[11px] text-brand-counter">
                  Applied to {pay.invoiceNumber} ({pay.projectName}) • Recorded by {pay.recordedByName}
                </p>
              </div>

              <span className="text-[10px] text-brand-counter/60 font-mono">
                {formatDate(pay.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment Transaction"
        description="Records incoming funds against an Invoice. Synced immediately into the immutable Audit Log."
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-brand-light block">Select Invoice:</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none"
            >
              {state.invoices.map((inv) => (
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
              className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-light block">Bank UTR / Transaction Ref:</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-brand-main-dark p-2 text-brand-light focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRecord}>
              <span>Confirm & Post Transaction</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
