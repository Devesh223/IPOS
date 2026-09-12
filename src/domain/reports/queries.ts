import { prisma } from "@/lib/prisma";

export async function getWorkspaceReportsData(workspaceId: string) {
  const [invoicesRaw, paymentsRaw, projectsRaw, tasksRaw, auditCount] = await Promise.all([
    prisma.invoice.findMany({
      where: { workspaceId },
      include: {
        project: {
          include: { client: true },
        },
      },
    }),
    prisma.payment.findMany({
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
    prisma.task.findMany({
      where: { workspaceId },
      include: {
        deliverables: {
          include: {
            versions: true,
            reviews: true,
          },
        },
      },
    }),
    prisma.auditLogEntry.count({
      where: { workspaceId },
    }),
  ]);

  // Financial aggregates in integer paise
  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  const now = new Date();

  invoicesRaw.forEach((inv) => {
    totalInvoiced += inv.amount;
    totalCollected += inv.paidAmount;
    const remaining = Math.max(0, inv.amount - inv.paidAmount);
    totalOutstanding += remaining;
    if ((inv.status === "OVERDUE" || inv.dueDate < now) && inv.status !== "PAID" && inv.status !== "VOID") {
      totalOverdue += remaining;
    }
  });

  // Delivery & Project performance aggregates
  let totalMilestones = 0;
  let completedMilestones = 0;
  let overdueTasksCount = 0;
  let deliverablesInReviewCount = 0;

  const projectPerformance = projectsRaw.map((p) => {
    let pMilestones = 0;
    let pCompletedMilestones = 0;
    let pTasks = 0;
    let pCompletedTasks = 0;

    p.services.forEach((s) => {
      s.milestones.forEach((m) => {
        pMilestones++;
        totalMilestones++;
        if (m.status === "APPROVED") {
          pCompletedMilestones++;
          completedMilestones++;
        }
        m.tasks.forEach((t) => {
          pTasks++;
          if (t.status === "COMPLETE") {
            pCompletedTasks++;
          }
          if (t.isOverdue || (t.dueDate && t.dueDate < now && t.status !== "COMPLETE" && t.status !== "CANCELLED")) {
            overdueTasksCount++;
          }
        });
      });
    });

    const progressPct = pTasks > 0 ? Math.round((pCompletedTasks / pTasks) * 100) : 0;
    const isDeliveryHealthy = pMilestones === 0 || pCompletedMilestones / pMilestones >= 0.5;

    // Check financial health for this project
    const pInvoices = invoicesRaw.filter((inv) => inv.projectId === p.id);
    const pHasOverdue = pInvoices.some(
      (inv) => (inv.status === "OVERDUE" || inv.dueDate < now) && inv.status !== "PAID" && inv.status !== "VOID"
    );

    return {
      id: p.id,
      name: p.name,
      clientId: p.client.id,
      clientName: p.client.name,
      status: p.status,
      targetDate: p.targetDate ? p.targetDate.toISOString().split("T")[0]! : "2026-09-30",
      progressPct,
      milestonesTotal: pMilestones,
      milestonesCompleted: pCompletedMilestones,
      isDeliveryHealthy,
      isFinancialHealthy: !pHasOverdue,
      pmName: p.pmId ?? "Studio PM",
    };
  });

  // Calculate deliverables in review
  tasksRaw.forEach((t) => {
    t.deliverables.forEach((d) => {
      if (d.status === "UNDER_REVIEW" || d.status === "SUBMITTED") {
        deliverablesInReviewCount++;
      }
    });
  });

  return {
    summary: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      activeProjectsCount: projectsRaw.filter((p) => p.status === "ACTIVE").length,
      totalProjectsCount: projectsRaw.length,
      totalMilestones,
      completedMilestones,
      milestoneCompletionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
      overdueTasksCount,
      deliverablesInReviewCount,
      auditLogCount: auditCount,
    },
    projectPerformance,
  };
}
