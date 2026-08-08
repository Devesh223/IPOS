"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { InvoiceStatus, PaymentStatus } from "@prisma/client";

export interface CreateInvoiceInput {
  projectId: string;
  milestoneId?: string;
  invoiceNumber: string;
  amountInPaise: number;
  dueDate: string;
  currency?: string;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amountInPaise: number;
  referenceNumber: string;
  paymentMethod?: string;
  autoReconcile?: boolean;
}

export interface RecordRefundInput {
  originalPaymentId: string;
  refundAmountInPaise: number;
  reason: string;
}

/**
 * Creates and issues a new milestone or project Invoice (Rules PAY-1, AL-1).
 */
export async function createInvoiceAction(input: CreateInvoiceInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can issue invoices.");
  }

  if (input.amountInPaise <= 0) {
    throw new Error("Invoice amount must be greater than zero.");
  }

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, workspaceId: session.workspaceId },
  });

  if (!project) {
    throw new Error(`Project with ID '${input.projectId}' was not found in this workspace.`);
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: input.projectId,
        milestoneId: input.milestoneId || null,
        invoiceNumber: input.invoiceNumber,
        amount: input.amountInPaise,
        paidAmount: 0,
        currency: input.currency || "INR",
        status: InvoiceStatus.ISSUED,
        dueDate: new Date(input.dueDate),
        issuedAt: new Date(),
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Invoice",
        entityId: inv.id,
        action: "invoice.issued",
        priorState: null,
        newState: "ISSUED",
        justification: `Invoice ${input.invoiceNumber} issued for project '${project.name}'`,
        amount: input.amountInPaise,
        currency: inv.currency,
      },
      tx
    );

    return inv;
  });

  revalidatePath("/finance");
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/dashboard");
  return { success: true, invoice };
}

/**
 * Records a verified Payment transaction against an Invoice with overpayment protection (Rules PAY-1, PAY-4, AL-1).
 */
export async function recordPaymentAction(input: RecordPaymentInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can record and reconcile payments.");
  }

  if (input.amountInPaise <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, workspaceId: session.workspaceId },
    include: { project: true },
  });

  if (!invoice) {
    throw new Error(`Invoice with ID '${input.invoiceId}' was not found in this workspace.`);
  }

  if (invoice.status === InvoiceStatus.VOID) {
    throw new Error("Cannot record payment against a VOID invoice.");
  }

  const newPaidAmount = invoice.paidAmount + input.amountInPaise;
  if (newPaidAmount > invoice.amount) {
    throw new Error(`Payment amount (${input.amountInPaise / 100} INR) exceeds remaining invoice balance (${(invoice.amount - invoice.paidAmount) / 100} INR).`);
  }

  const newStatus =
    newPaidAmount >= invoice.amount ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

  const payment = await prisma.$transaction(async (tx) => {
    // 1. Create immutable Payment record
    const pay = await tx.payment.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: invoice.projectId,
        invoiceId: invoice.id,
        milestoneId: invoice.milestoneId,
        amount: input.amountInPaise,
        currency: invoice.currency,
        status: input.autoReconcile ? PaymentStatus.RECONCILED : PaymentStatus.RECORDED,
        paymentMethod: input.paymentMethod || "BANK_TRANSFER",
        referenceNumber: input.referenceNumber,
      },
    });

    // 2. Update Invoice
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === InvoiceStatus.PAID ? new Date() : null,
      },
    });

    // 3. Write immutable audit log entry in PostgreSQL inside transaction (Rule AL-1, AL-3, AL-4)
    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Payment",
        entityId: pay.id,
        action: input.autoReconcile ? "payment.reconciled" : "payment.recorded",
        priorState: invoice.status,
        newState: newStatus,
        justification: `Payment recorded via reference ${input.referenceNumber}`,
        amount: input.amountInPaise,
        currency: invoice.currency,
      },
      tx
    );

    return pay;
  });

  revalidatePath("/finance");
  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/dashboard");
  return { success: true, payment };
}

/**
 * Reconciles an existing Payment transaction against bank settlement ledger (Rule PAY-2, AL-1).
 */
export async function reconcilePaymentAction(paymentId: string, bankReference?: string) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can reconcile payments.");
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, workspaceId: session.workspaceId },
  });

  if (!payment) {
    throw new Error(`Payment with ID '${paymentId}' was not found in this workspace.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const pay = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.RECONCILED,
        referenceNumber: bankReference || payment.referenceNumber,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Payment",
        entityId: pay.id,
        action: "payment.reconciled",
        priorState: payment.status,
        newState: "RECONCILED",
        justification: `Bank credit confirmed and reconciled with UTR/Ref: ${bankReference || payment.referenceNumber}`,
        amount: payment.amount,
        currency: payment.currency,
      },
      tx
    );

    return pay;
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true, payment: updated };
}

/**
 * Voids an issued invoice before any non-refunded payments have been credited (Rule AL-6).
 */
export async function voidInvoiceAction(invoiceId: string, voidReason: string) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can void invoices.");
  }

  if (!voidReason || voidReason.trim() === "") {
    throw new Error("Rule AL-6: A written reason is mandatory when voiding an invoice.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, workspaceId: session.workspaceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw new Error(`Invoice with ID '${invoiceId}' was not found in this workspace.`);
  }

  const activePayments = invoice.payments.filter((p) => p.status !== PaymentStatus.REFUNDED);
  if (activePayments.length > 0) {
    throw new Error("Cannot void an invoice with active payments. Refund all payments first.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.VOID,
        voidReason,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Invoice",
        entityId: invoiceId,
        action: "invoice.voided",
        priorState: invoice.status,
        newState: "VOID",
        justification: voidReason,
        amount: invoice.amount,
        currency: invoice.currency,
      },
      tx
    );
  });

  revalidatePath("/finance");
  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Records an offsetting refund record against an existing Payment (Rule PAY-4).
 * Payments are immutable and never deleted; refunds create linked negative offsetting records.
 */
export async function recordRefundAction(input: RecordRefundInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can issue refunds.");
  }

  if (input.refundAmountInPaise <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  if (!input.reason || input.reason.trim() === "") {
    throw new Error("Rule AL-6: A written justification is mandatory for refunds.");
  }

  const originalPayment = await prisma.payment.findFirst({
    where: { id: input.originalPaymentId, workspaceId: session.workspaceId },
    include: { invoice: true },
  });

  if (!originalPayment) {
    throw new Error(`Original payment with ID '${input.originalPaymentId}' was not found.`);
  }

  if (input.refundAmountInPaise > originalPayment.amount) {
    throw new Error("Refund amount cannot exceed the original payment amount.");
  }

  const invoice = originalPayment.invoice;
  const newInvoicePaidAmount = Math.max(0, invoice.paidAmount - input.refundAmountInPaise);
  const newInvoiceStatus =
    newInvoicePaidAmount === 0
      ? InvoiceStatus.ISSUED
      : newInvoicePaidAmount >= invoice.amount
      ? InvoiceStatus.PAID
      : InvoiceStatus.PARTIALLY_PAID;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create linked offsetting Refund record (Rule PAY-4)
    const refundPayment = await tx.payment.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: originalPayment.projectId,
        invoiceId: originalPayment.invoiceId,
        milestoneId: originalPayment.milestoneId,
        amount: input.refundAmountInPaise,
        currency: originalPayment.currency,
        status: PaymentStatus.REFUNDED,
        paymentMethod: originalPayment.paymentMethod,
        referenceNumber: `REFUND-${originalPayment.referenceNumber ?? originalPayment.id}`,
        refundId: originalPayment.id,
        disputeReason: input.reason,
      },
    });

    // 2. Adjust invoice paidAmount
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newInvoicePaidAmount,
        status: newInvoiceStatus,
      },
    });

    // 3. Write immutable audit log
    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Payment",
        entityId: refundPayment.id,
        action: "payment.refunded",
        priorState: `Paid: ${invoice.paidAmount} paise`,
        newState: `Paid: ${newInvoicePaidAmount} paise (Status: ${newInvoiceStatus})`,
        justification: input.reason,
        amount: input.refundAmountInPaise,
        currency: originalPayment.currency,
      },
      tx
    );

    return refundPayment;
  });

  revalidatePath("/finance");
  revalidatePath(`/projects/${originalPayment.projectId}`);
  revalidatePath("/dashboard");
  return { success: true, refund: result };
}
