import { prisma } from "@/lib/prisma";

export async function getWorkspaceFinanceData(workspaceId: string) {
  const [invoicesRaw, paymentsRaw, creditNotesRaw] = await Promise.all([
    prisma.invoice.findMany({
      where: { workspaceId },
      include: {
        project: { include: { client: true } },
        milestone: true,
        lineItems: { orderBy: { order: "asc" } },
        creditNotes: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { workspaceId },
      include: { project: true, invoice: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditNote.findMany({
      where: { workspaceId },
      include: { invoice: { include: { project: { include: { client: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const invoices = invoicesRaw.map((inv) => ({
    id: inv.id,
    workspaceId: inv.workspaceId,
    projectId: inv.projectId,
    projectName: inv.project.name,
    clientId: inv.project.clientId,
    clientName: inv.project.client.name,
    milestoneId: inv.milestoneId ?? undefined,
    milestoneName: inv.milestone?.name ?? undefined,
    invoiceNumber: inv.invoiceNumber,
    subtotal: inv.subtotal,
    taxAmount: inv.taxAmount,
    taxRate: inv.taxRate,
    isInterState: inv.isInterState,
    amount: inv.amount,
    paidAmount: inv.paidAmount,
    remainingBalance: Math.max(0, inv.amount - inv.paidAmount),
    currency: inv.currency,
    status: inv.status,
    dueDate: inv.dueDate.toISOString().split("T")[0]!,
    issuedAt: inv.issuedAt ? inv.issuedAt.toISOString().split("T")[0]! : null,
    paidAt: inv.paidAt ? inv.paidAt.toISOString().split("T")[0]! : null,
    isOverdue: inv.status === "OVERDUE" || (inv.dueDate < new Date() && inv.status !== "PAID" && inv.status !== "VOID"),
    notes: inv.notes,
    lineItemsCount: inv.lineItems.length,
    creditNotesCount: inv.creditNotes.length,
  }));

  const payments = paymentsRaw.map((pay) => ({
    id: pay.id,
    workspaceId: pay.workspaceId,
    projectId: pay.projectId,
    projectName: pay.project.name,
    invoiceId: pay.invoiceId,
    invoiceNumber: pay.invoice.invoiceNumber,
    milestoneId: pay.milestoneId ?? undefined,
    amount: pay.amount,
    currency: pay.currency,
    status: pay.status,
    paymentMethod: pay.paymentMethod,
    referenceNumber: pay.referenceNumber ?? "N/A",
    recordedById: "system",
    recordedByName: "Finance Officer",
    disputeReason: pay.disputeReason,
    refundId: pay.refundId,
    createdAt: pay.createdAt.toISOString(),
  }));

  const creditNotes = creditNotesRaw.map((cn) => ({
    id: cn.id,
    workspaceId: cn.workspaceId,
    invoiceId: cn.invoiceId,
    invoiceNumber: cn.invoice.invoiceNumber,
    projectName: cn.invoice.project.name,
    clientName: cn.invoice.project.client.name,
    creditNoteNumber: cn.creditNoteNumber,
    amount: cn.amount,
    reason: cn.reason,
    status: cn.status,
    issuedAt: cn.issuedAt.toISOString().split("T")[0]!,
    createdAt: cn.createdAt.toISOString(),
  }));

  return { invoices, payments, creditNotes };
}

export async function getInvoiceDetailData(workspaceId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    include: {
      project: { include: { client: true } },
      milestone: { include: { service: true } },
      lineItems: { orderBy: { order: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      creditNotes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!invoice) return null;

  const auditLogs = await prisma.auditLogEntry.findMany({
    where: {
      workspaceId,
      OR: [
        { entityType: "Invoice", entityId: invoice.id },
        { entityType: "Payment", entityId: { in: invoice.payments.map((p) => p.id) } },
        { entityType: "CreditNote", entityId: { in: invoice.creditNotes.map((c) => c.id) } },
      ],
    },
    orderBy: { timestamp: "desc" },
  });

  return {
    id: invoice.id,
    workspaceId: invoice.workspaceId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    taxRate: invoice.taxRate,
    isInterState: invoice.isInterState,
    amount: invoice.amount,
    paidAmount: invoice.paidAmount,
    remainingBalance: Math.max(0, invoice.amount - invoice.paidAmount),
    dueDate: invoice.dueDate.toISOString().split("T")[0]!,
    issuedAt: invoice.issuedAt ? invoice.issuedAt.toISOString().split("T")[0]! : null,
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString().split("T")[0]! : null,
    voidReason: invoice.voidReason,
    notes: invoice.notes,
    project: {
      id: invoice.project.id,
      name: invoice.project.name,
      description: invoice.project.description,
    },
    client: {
      id: invoice.project.client.id,
      name: invoice.project.client.name,
      companyName: invoice.project.client.companyName,
      email: invoice.project.client.email,
    },
    milestone: invoice.milestone ? {
      id: invoice.milestone.id,
      name: invoice.milestone.name,
      serviceName: invoice.milestone.service.name,
    } : null,
    lineItems: invoice.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitAmount: li.unitAmount,
      taxableAmount: li.taxableAmount,
      taxRate: li.taxRate,
      taxAmount: li.taxAmount,
      totalAmount: li.totalAmount,
    })),
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      createdAt: p.createdAt.toISOString(),
      refundId: p.refundId,
      disputeReason: p.disputeReason,
    })),
    creditNotes: invoice.creditNotes.map((cn) => ({
      id: cn.id,
      creditNoteNumber: cn.creditNoteNumber,
      amount: cn.amount,
      reason: cn.reason,
      status: cn.status,
      issuedAt: cn.issuedAt.toISOString().split("T")[0]!,
    })),
    auditLogs: auditLogs.map((a) => ({
      id: a.id,
      actorId: a.actorId,
      actorType: a.actorType,
      entityType: a.entityType,
      action: a.action,
      priorState: a.priorState,
      newState: a.newState,
      justification: a.justification,
      timestamp: a.timestamp.toISOString(),
    })),
  };
}
