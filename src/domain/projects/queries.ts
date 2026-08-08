import { prisma } from "@/lib/prisma";

export async function getWorkspaceProjectsData(workspaceId: string) {
  const [projectsRaw, tasksRaw, invoicesRaw] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId },
      include: {
        client: true,
        services: {
          include: {
            milestones: {
              include: {
                tasks: {
                  include: {
                    assignee: true,
                    deliverables: {
                      include: {
                        versions: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { workspaceId },
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
        deliverables: true,
      },
    }),
    prisma.invoice.findMany({
      where: { workspaceId },
      include: { project: true },
    }),
  ]);

  const projects = projectsRaw.map((p) => {
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
      workspaceId: p.workspaceId,
      clientId: p.clientId,
      clientName: p.client.name,
      pmId: p.pmId ?? "user-pm-1",
      pmName: p.pmId ?? "Assigned PM",
      name: p.name,
      description: p.description ?? "",
      status: p.status,
      startDate: p.startDate ? p.startDate.toISOString().split("T")[0]! : "2026-07-01",
      targetDate: p.targetDate ? p.targetDate.toISOString().split("T")[0]! : "2026-09-15",
      servicesCount,
      completedServicesCount,
      tasksCount,
      completedTasksCount,
      overdueTasksCount: 0,
      stalledApprovalsCount: 0,
      reopenCount: p.reopenCount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  const tasks = tasksRaw.map((t) => ({
    id: t.id,
    workspaceId: t.workspaceId,
    projectId: t.milestone.service.projectId,
    projectName: t.milestone.service.project.name,
    milestoneId: t.milestoneId,
    milestoneName: t.milestone.name,
    assigneeId: t.assigneeId ?? "",
    assigneeName: t.assignee?.name ?? "Unassigned",
    name: t.name,
    description: t.description ?? "",
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0]! : "2026-08-15",
    isOverdue: t.isOverdue,
    requiresVerification: t.milestone.requiresVerification,
    deliverablesCount: t.deliverables.length,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const invoices = invoicesRaw.map((inv) => ({
    id: inv.id,
    workspaceId: inv.workspaceId,
    projectId: inv.projectId,
    projectName: inv.project.name,
    milestoneId: inv.milestoneId ?? undefined,
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

  return { projects, tasks, invoices };
}
