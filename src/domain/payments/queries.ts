import { prisma } from "@/lib/prisma";

export async function getWorkspaceFinanceData(workspaceId: string) {
  const [invoicesRaw, paymentsRaw] = await Promise.all([
    prisma.invoice.findMany({
      where: { workspaceId },
      include: { project: true, milestone: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { workspaceId },
      include: { project: true, invoice: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const invoices = invoicesRaw.map((inv) => ({
    id: inv.id,
    workspaceId: inv.workspaceId,
    projectId: inv.projectId,
    projectName: inv.project.name,
    milestoneId: inv.milestoneId ?? undefined,
    milestoneName: inv.milestone?.name ?? undefined,
    invoiceNumber: inv.invoiceNumber,
    amount: inv.amount,
    paidAmount: inv.paidAmount,
    remainingBalance: Math.max(0, inv.amount - inv.paidAmount),
    currency: inv.currency,
    status: inv.status,
    dueDate: inv.dueDate.toISOString().split("T")[0]!,
    issuedAt: inv.issuedAt ? inv.issuedAt.toISOString().split("T")[0]! : null,
    paidAt: inv.paidAt ? inv.paidAt.toISOString().split("T")[0]! : null,
    isOverdue: inv.status === "OVERDUE" || (inv.dueDate < new Date() && inv.status !== "PAID"),
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

  return { invoices, payments };
}
