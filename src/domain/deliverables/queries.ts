import { prisma } from "@/lib/prisma";

export async function getWorkspaceDeliverablesData(workspaceId: string) {
  const [deliverablesRaw, filesRaw, projectsRaw] = await Promise.all([
    prisma.deliverable.findMany({
      where: { workspaceId },
      include: {
        task: {
          include: {
            assignee: true,
            milestone: {
              include: {
                service: {
                  include: {
                    project: {
                      include: {
                        client: true,
                        agreements: true,
                        invoices: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        versions: {
          include: {
            submittedBy: true,
            reviews: {
              include: {
                reviewer: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { versionNumber: "desc" },
        },
        reviews: {
          include: {
            reviewer: true,
            version: true,
          },
          orderBy: { createdAt: "desc" },
        },
        files: {
          include: {
            uploader: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.file.findMany({
      where: { workspaceId, isArchived: false },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        uploader: true,
        task: true,
        deliverable: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            milestones: {
              select: {
                id: true,
                name: true,
                tasks: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const deliverables = deliverablesRaw.map((d) => {
    const project = d.task.milestone.service.project;
    const milestone = d.task.milestone;
    const task = d.task;

    const hasActiveAgreement = project.agreements.some((a) => a.status === "ACTIVE");
    const hasUnsettledInvoices = project.invoices.some(
      (inv) => inv.status !== "PAID" && inv.status !== "VOID" && inv.amount - inv.paidAmount > 0
    );

    return {
      id: d.id,
      workspaceId: d.workspaceId,
      taskId: d.taskId,
      taskName: task.name,
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      projectId: project.id,
      projectName: project.name,
      clientId: project.client.id,
      clientName: project.client.name,
      name: d.name,
      description: d.description ?? "",
      status: d.status,
      currentVersion: d.currentVersion,
      isClientVisible: d.isClientVisible,
      authorName: task.assignee?.name ?? "Studio Team",
      authorEmail: task.assignee?.email ?? "",
      hasActiveAgreement,
      hasUnsettledInvoices,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      versions: d.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        fileId: v.fileId,
        submittedById: v.submittedById,
        submittedByName: v.submittedBy.name,
        submittedByEmail: v.submittedBy.email,
        changeSummary: v.changeSummary ?? "Deliverable version package",
        createdAt: v.createdAt.toISOString(),
        reviewsCount: v.reviews.length,
      })),
      reviews: d.reviews.map((r) => ({
        id: r.id,
        reviewerId: r.reviewerId,
        reviewerName: r.reviewer.name,
        isClientReviewer: r.isClientReviewer,
        versionNumber: r.version?.versionNumber ?? d.currentVersion,
        content: r.content,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      files: d.files.map((f) => ({
        id: f.id,
        filename: f.filename,
        storageKey: f.storageKey,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        uploaderName: f.uploader.name,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  });

  const files = filesRaw.map((f) => ({
    id: f.id,
    workspaceId: f.workspaceId,
    projectId: f.projectId,
    projectName: f.project.name,
    clientId: f.project.client.id,
    clientName: f.project.client.name,
    taskId: f.taskId,
    deliverableId: f.deliverableId,
    filename: f.filename,
    storageKey: f.storageKey,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    uploaderName: f.uploader.name,
    createdAt: f.createdAt.toISOString(),
  }));

  return { deliverables, files, projects: projectsRaw };
}
