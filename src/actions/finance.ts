"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { computeInvoiceTotals, RawLineItemInput } from "@/domain/finance/calculations";
import { assertLineItemsValid, assertInvoiceCanReceivePayment, assertInvoiceCanBeVoided } from "@/domain/finance/invoice-rules";
import { assertInvoiceEligibleForCreditNote, assertCreditNoteAmountValid } from "@/domain/finance/credit-notes";
import { getPaymentGateway } from "@/domain/finance/gateway";
import { InvoiceStatus, PaymentStatus, CreditNoteStatus } from "@prisma/client";

export interface CreateInvoiceInput {
  projectId: string;
  milestoneId?: string;
  invoiceNumber?: string;
  dueDate: string;
  isInterState?: boolean;
  notes?: string;
  lineItems: RawLineItemInput[];
}

export interface RecordPaymentInput {
  invoiceId: string;
  amountInPaise: number;
  referenceNumber: string;
  paymentMethod?: string;
  autoReconcile?: boolean;
}

export interface IssueCreditNoteInput {
  invoiceId: string;
  amountInPaise: number;
  reason: string;
}

export interface RecordRefundInput {
  originalPaymentId: string;
  refundAmountInPaise: number;
  reason: string;
}

export interface WebhookProcessInput {
  provider: "razorpay" | "stripe";
  eventId: string;
  eventType: string;
  invoiceId: string;
  amountInPaise: number;
  currency: string;
  referenceNumber: string;
  rawBody: string;
  signature: string;
  webhookSecret?: string;
}

/**
 * Creates and issues a new Invoice with server-calculated GST and Line Items (Rules PAY-1, AL-1).
 */
export async function createInvoiceAction(input: CreateInvoiceInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can issue invoices.");
  }

  assertLineItemsValid(input.lineItems);

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, workspaceId: session.workspaceId },
    include: { client: true },
  });

  if (!project) {
    throw new Error(`Project with ID '${input.projectId}' was not found in this workspace.`);
  }

  // Authoritative server-side calculation
  const totals = computeInvoiceTotals(input.lineItems, input.isInterState ?? false);

  // Generate deterministic invoice number if not provided
  const invoiceCount = await prisma.invoice.count({ where: { workspaceId: session.workspaceId } });
  const year = new Date().getFullYear();
  const autoInvoiceNumber = input.invoiceNumber?.trim() || `IP-INV-${year}-${String(invoiceCount + 1).padStart(4, "0")}`;

  const createdInvoice = await prisma.$transaction(async (tx) => {
    // 1. Create Invoice header
    const inv = await tx.invoice.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: input.projectId,
        milestoneId: input.milestoneId || null,
        invoiceNumber: autoInvoiceNumber,
        subtotal: totals.subtotalInPaise,
        taxAmount: totals.taxAmountInPaise,
        taxRate: 1800, // 18.00%
        isInterState: totals.isInterState,
        amount: totals.grandTotalInPaise,
        paidAmount: 0,
        currency: "INR",
        status: InvoiceStatus.ISSUED,
        dueDate: new Date(input.dueDate),
        issuedAt: new Date(),
        notes: input.notes ?? null,
      },
    });

    // 2. Create Line Items
    for (let i = 0; i < totals.lineItems.length; i++) {
      const item = totals.lineItems[i]!;
      await tx.invoiceLineItem.create({
        data: {
          workspaceId: session.workspaceId,
          invoiceId: inv.id,
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmountInPaise,
          taxableAmount: item.taxableAmountInPaise,
          taxRate: item.taxRateBasisPoints,
          taxAmount: item.taxAmountInPaise,
          totalAmount: item.totalAmountInPaise,
          order: i,
        },
      });
    }

    // 3. Write immutable audit log
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
        justification: `Invoice ${autoInvoiceNumber} issued for ${project.client.name} (${project.name}) with ${totals.lineItems.length} line items`,
        amount: totals.grandTotalInPaise,
        currency: "INR",
      },
      tx
    );

    return inv;
  });

  revalidatePath("/finance");
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/dashboard");
  return { success: true, invoice: createdInvoice };
}

/**
 * Records a verified Payment against an Invoice with overpayment and status protection (Rules PAY-1, PAY-5, AL-1).
 */
export async function recordPaymentAction(input: RecordPaymentInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can record and reconcile payments.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, workspaceId: session.workspaceId },
    include: { project: true },
  });

  if (!invoice) {
    throw new Error(`Invoice with ID '${input.invoiceId}' was not found in this workspace.`);
  }

  assertInvoiceCanReceivePayment(invoice.status, invoice.paidAmount, invoice.amount, input.amountInPaise);

  const newPaidAmount = invoice.paidAmount + input.amountInPaise;
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
  revalidatePath(`/finance/invoices/${invoice.id}`);
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
        justification: `Bank settlement reconciled with UTR/Ref: ${bankReference || payment.referenceNumber}`,
        amount: payment.amount,
        currency: payment.currency,
      },
      tx
    );

    return pay;
  });

  revalidatePath("/finance");
  revalidatePath(`/finance/invoices/${payment.invoiceId}`);
  revalidatePath("/dashboard");
  return { success: true, payment: updated };
}

/**
 * Issues an independent Credit Note referencing an Invoice (Rules CN-1..CN-3, AL-1, AL-6).
 */
export async function issueCreditNoteAction(input: IssueCreditNoteInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can issue credit notes.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, workspaceId: session.workspaceId },
    include: { creditNotes: true },
  });

  if (!invoice) {
    throw new Error(`Invoice with ID '${input.invoiceId}' was not found in this workspace.`);
  }

  assertInvoiceEligibleForCreditNote(invoice.status);

  const existingCreditsSum = invoice.creditNotes
    .filter((cn) => cn.status !== CreditNoteStatus.VOID)
    .reduce((sum, cn) => sum + cn.amount, 0);

  assertCreditNoteAmountValid(invoice.amount, existingCreditsSum, input.amountInPaise, input.reason);

  const creditNoteCount = await prisma.creditNote.count({ where: { workspaceId: session.workspaceId } });
  const year = new Date().getFullYear();
  const creditNoteNumber = `IP-CN-${year}-${String(creditNoteCount + 1).padStart(4, "0")}`;

  const creditNote = await prisma.$transaction(async (tx) => {
    const cn = await tx.creditNote.create({
      data: {
        workspaceId: session.workspaceId,
        invoiceId: invoice.id,
        creditNoteNumber,
        amount: input.amountInPaise,
        reason: input.reason,
        status: CreditNoteStatus.ISSUED,
        issuedById: session.user.id,
        issuedAt: new Date(),
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "CreditNote",
        entityId: cn.id,
        action: "credit_note.issued",
        priorState: null,
        newState: "ISSUED",
        justification: `Credit note ${creditNoteNumber} issued against invoice ${invoice.invoiceNumber}: "${input.reason}"`,
        amount: input.amountInPaise,
        currency: invoice.currency,
      },
      tx
    );

    return cn;
  });

  revalidatePath("/finance");
  revalidatePath(`/finance/invoices/${invoice.id}`);
  revalidatePath("/dashboard");
  return { success: true, creditNote };
}

/**
 * Voids an issued invoice before active non-refunded payments are posted (Rules INV-5, INV-6, AL-6).
 */
export async function voidInvoiceAction(invoiceId: string, voidReason: string) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can void invoices.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, workspaceId: session.workspaceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw new Error(`Invoice with ID '${invoiceId}' was not found in this workspace.`);
  }

  const activePayments = invoice.payments.filter((p) => p.status !== PaymentStatus.REFUNDED && !p.refundId);
  assertInvoiceCanBeVoided(invoice.status, activePayments.length, voidReason);

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
  revalidatePath(`/finance/invoices/${invoiceId}`);
  revalidatePath(`/projects/${invoice.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Records an offsetting refund record against an existing Payment (Rule PAY-4).
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

  // Calculate cumulative prior refunds against this payment
  const priorRefunds = await prisma.payment.findMany({
    where: { refundId: originalPayment.id, workspaceId: session.workspaceId },
  });
  const totalPriorRefunded = priorRefunds.reduce((sum, r) => sum + r.amount, 0);
  const totalRefundAmount = totalPriorRefunded + input.refundAmountInPaise;

  if (totalRefundAmount > originalPayment.amount) {
    throw new Error(`Cumulative refund amount (${totalRefundAmount} paise) exceeds original payment amount (${originalPayment.amount} paise).`);
  }

  const invoice = originalPayment.invoice;
  const newInvoicePaidAmount = Math.max(0, invoice.paidAmount - input.refundAmountInPaise);
  const newInvoiceStatus =
    newInvoicePaidAmount === 0
      ? InvoiceStatus.ISSUED
      : newInvoicePaidAmount >= invoice.amount
      ? InvoiceStatus.PAID
      : InvoiceStatus.PARTIALLY_PAID;

  const isFullyRefunded = totalRefundAmount >= originalPayment.amount;

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

    // 2. Mark original payment status as REFUNDED if fully refunded
    if (isFullyRefunded) {
      await tx.payment.update({
        where: { id: originalPayment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    }

    // 3. Adjust invoice paidAmount
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
  revalidatePath(`/finance/invoices/${originalPayment.invoiceId}`);
  revalidatePath(`/projects/${originalPayment.projectId}`);
  revalidatePath("/dashboard");
  return { success: true, refund: result };
}

/**
 * Handles incoming payment webhooks with cryptographic HMAC signature verification and persistent DB idempotency.
 */
export async function processPaymentWebhookAction(input: WebhookProcessInput) {
  const webhookSecret = input.webhookSecret || process.env.PAYMENT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("SECURITY ERROR: Payment webhook secret is not configured.");
  }

  const gateway = getPaymentGateway();

  // 1. Verify HMAC Signature
  const isValidSignature = gateway.verifyWebhookSignature(
    input.rawBody,
    input.signature,
    webhookSecret
  );

  if (!isValidSignature) {
    throw new Error("SECURITY ERROR: Invalid webhook cryptographic signature.");
  }

  // 2. Transactionally record webhook event (unique constraint enforces persistent idempotency)
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create idempotency record
      await tx.paymentWebhookEvent.create({
        data: {
          provider: input.provider,
          eventId: input.eventId,
          eventType: input.eventType,
          payload: JSON.parse(input.rawBody || "{}"),
          status: "PROCESSED",
        },
      });

      const invoice = await tx.invoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice) {
        throw new Error(`Invoice '${input.invoiceId}' referenced in webhook does not exist.`);
      }

      const newPaidAmount = invoice.paidAmount + input.amountInPaise;
      const newStatus = newPaidAmount >= invoice.amount ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      const payment = await tx.payment.create({
        data: {
          workspaceId: invoice.workspaceId,
          projectId: invoice.projectId,
          invoiceId: invoice.id,
          milestoneId: invoice.milestoneId,
          amount: input.amountInPaise,
          currency: input.currency || invoice.currency,
          status: PaymentStatus.RECONCILED,
          paymentMethod: input.provider.toUpperCase(),
          referenceNumber: input.referenceNumber,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: newStatus === InvoiceStatus.PAID ? new Date() : null,
        },
      });

      await writeAuditLogEntry(
        {
          workspaceId: invoice.workspaceId,
          actorId: `webhook:${input.provider}`,
          actorType: "SYSTEM_PROCESS",
          entityType: "Payment",
          entityId: payment.id,
          action: "payment.webhook_captured",
          priorState: invoice.status,
          newState: newStatus,
          justification: `Captured via verified ${input.provider} webhook (Event ID: ${input.eventId})`,
          amount: input.amountInPaise,
          currency: payment.currency,
        },
        tx
      );

      return payment;
    });

    return { success: true, paymentId: result.id };
  } catch (error: any) {
    if (error.code === "P2002") {
      // Prisma unique constraint violation -> Duplicate webhook event (Idempotent response)
      return { success: true, message: "Webhook event already processed (Idempotent duplicate ignored)." };
    }
    throw error;
  }
}
