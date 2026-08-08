"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { InvoiceStatus, PaymentStatus } from "@prisma/client";

export interface RecordPaymentInput {
  invoiceId: string;
  amountInPaise: number;
  referenceNumber: string;
  paymentMethod?: string;
}

/**
 * Records a verified Payment transaction against an Invoice (Rule PAY-1, PAY-4, AL-1).
 */
export async function recordPaymentAction(input: RecordPaymentInput) {
  const session = await requireSession();

  if (!session.isFinance && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Finance or Admin roles can record and reconcile payments.");
  }

  if (input.amountInPaise <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: {
      project: true,
    },
  });

  if (!invoice) {
    throw new Error(`Invoice with ID '${input.invoiceId}' was not found.`);
  }

  const newPaidAmount = invoice.paidAmount + input.amountInPaise;
  const newStatus =
    newPaidAmount >= invoice.amount ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

  await prisma.$transaction(async (tx) => {
    // 1. Create immutable Payment record
    const payment = await tx.payment.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: invoice.projectId,
        invoiceId: invoice.id,
        milestoneId: invoice.milestoneId,
        amount: input.amountInPaise,
        currency: invoice.currency,
        status: PaymentStatus.RECORDED,
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

    // 3. Write immutable audit log entry (Rule AL-1, AL-4)
    writeAuditLogEntry({
      workspaceId: session.workspaceId,
      actorId: session.user.id,
      actorType: "USER",
      entityType: "Payment",
      entityId: payment.id,
      action: "payment.recorded",
      priorState: invoice.status,
      newState: newStatus,
      justification: `Payment recorded via reference ${input.referenceNumber}`,
      amount: input.amountInPaise,
      currency: invoice.currency,
    });
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { success: true };
}
