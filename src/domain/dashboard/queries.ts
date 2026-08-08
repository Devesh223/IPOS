import { prisma } from "@/lib/prisma";
import { ProjectStatus, TaskStatus, InvoiceStatus, PaymentStatus } from "@prisma/client";

export interface DashboardMetrics {
  activeProjectsCount: number;
  tasksInProgressCount: number;
  overdueTasksCount: number;
  reconciledPaymentsAmountPaise: number;
  totalAuditEntriesCount: number;
  overdueTasks: Array<{
    id: string;
    name: string;
    projectId: string;
    projectName: string;
    assigneeName: string;
    dueDate: string | null;
  }>;
  overdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    projectId: string;
    projectName: string;
    amount: number;
    paidAmount: number;
    remainingBalance: number;
    dueDate: string;
  }>;
  projectsSummary: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    clientName: string;
    pmName: string;
    targetDate: string | null;
    servicesCount: number;
    completedServicesCount: number;
    tasksCount: number;
    completedTasksCount: number;
    stalledApprovalsCount: number;
  }>;
  recentAuditLogs: Array<{
    id: string;
    actorId: string;
    actorType: string;
    entityType: string;
    entityId: string;
    action: string;
    priorState: string | null;
    newState: string | null;
    justification: string | null;
    timestamp: string;
  }>;
}

/**
 * Computes authoritative studio operations metrics directly from PostgreSQL via Prisma.
 */
export async function getWorkspaceDashboardData(workspaceId: string): Promise<DashboardMetrics> {
  const [
    activeProjectsCount,
    tasksInProgressCount,
    overdueTasksRaw,
    overdueInvoicesRaw,
    reconciledAggregate,
    totalAuditEntriesCount,
    projectsRaw,
    recentAuditRaw,
  ] = await Promise.all([
    prisma.project.count({
      where: { workspaceId, status: ProjectStatus.ACTIVE },
    }),
    prisma.task.count({
      where: { workspaceId, status: TaskStatus.IN_PROGRESS },
    }),
    prisma.task.findMany({
      where: {
        workspaceId,
        isOverdue: true,
      },
      include: {
        assignee: true,
        milestone: {
          include: {
            service: {
              include: {
                project: true,
              },
            },
          },
        },
      },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: {
        workspaceId,
        status: { in: [InvoiceStatus.OVERDUE, InvoiceStatus.ISSUED] },
        dueDate: { lt: new Date() },
      },
      include: {
        project: true,
      },
      take: 5,
    }),
    prisma.payment.aggregate({
      where: { workspaceId, status: PaymentStatus.RECONCILED },
      _sum: { amount: true },
    }),
    prisma.auditLogEntry.count({
      where: { workspaceId },
    }),
    prisma.project.findMany({
      where: { workspaceId },
      include: {
        client: true,
        services: {
          include: {
            milestones: {
              include: {
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLogEntry.findMany({
      where: { workspaceId },
      orderBy: { timestamp: "desc" },
      take: 10,
    }),
  ]);

  const overdueTasks = overdueTasksRaw.map((t) => ({
    id: t.id,
    name: t.name,
    projectId: t.milestone.service.project.id,
    projectName: t.milestone.service.project.name,
    assigneeName: t.assignee?.name ?? "Unassigned",
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0]! : null,
  }));

  const overdueInvoices = overdueInvoicesRaw.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    projectId: inv.projectId,
    projectName: inv.project.name,
    amount: inv.amount,
    paidAmount: inv.paidAmount,
    remainingBalance: Math.max(0, inv.amount - inv.paidAmount),
    dueDate: inv.dueDate.toISOString().split("T")[0]!,
  }));

  const projectsSummary = projectsRaw.map((p) => {
    let tasksCount = 0;
    let completedTasksCount = 0;
    let servicesCount = p.services.length;
    let completedServicesCount = 0;

    for (const s of p.services) {
      if (s.status === "COMPLETED") completedServicesCount++;
      for (const m of s.milestones) {
        tasksCount += m.tasks.length;
        for (const t of m.tasks) {
          if (t.status === "COMPLETE") completedTasksCount++;
        }
      }
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      clientName: p.client.name,
      pmName: p.pmId ?? "Unassigned",
      targetDate: p.targetDate ? p.targetDate.toISOString().split("T")[0]! : null,
      servicesCount,
      completedServicesCount,
      tasksCount,
      completedTasksCount,
      stalledApprovalsCount: 0,
    };
  });

  const recentAuditLogs = recentAuditRaw.map((a) => ({
    id: a.id,
    actorId: a.actorId,
    actorType: a.actorType,
    entityType: a.entityType,
    entityId: a.entityId,
    action: a.action,
    priorState: a.priorState,
    newState: a.newState,
    justification: a.justification,
    timestamp: a.timestamp.toISOString(),
  }));

  return {
    activeProjectsCount,
    tasksInProgressCount,
    overdueTasksCount: overdueTasks.length,
    reconciledPaymentsAmountPaise: reconciledAggregate._sum.amount ?? 0,
    totalAuditEntriesCount,
    overdueTasks,
    overdueInvoices,
    projectsSummary,
    recentAuditLogs,
  };
}
