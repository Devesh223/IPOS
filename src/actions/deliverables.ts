"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { DeliverableStatus, ReviewStatus } from "@prisma/client";

export interface CreateDeliverableVersionInput {
  deliverableId: string;
  changeSummary: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface SubmitDeliverableReviewInput {
  deliverableId: string;
  deliverableVersionId?: string;
  content: string;
  decision?: "APPROVED" | "CHANGES_REQUESTED" | "COMMENT_ONLY";
}

/**
 * Creates a new sequential version for a deliverable with audit trail (Rules D-3, S-4, AL-1).
 */
export async function createDeliverableVersionAction(input: CreateDeliverableVersionInput) {
  const session = await requireSession();

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: input.deliverableId, workspaceId: session.workspaceId },
    include: {
      task: {
        include: {
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
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!deliverable) {
    throw new Error(`Deliverable '${input.deliverableId}' was not found in this workspace.`);
  }

  const latestVersion = deliverable.versions[0]?.versionNumber ?? deliverable.currentVersion ?? 1;
  const newVersionNumber = latestVersion + 1;

  const result = await prisma.$transaction(async (tx) => {
    let fileId: string | null = null;

    if (input.filename && input.sizeBytes && input.mimeType) {
      const file = await tx.file.create({
        data: {
          workspaceId: session.workspaceId,
          projectId: deliverable.task.milestone.service.projectId,
          taskId: deliverable.taskId,
          deliverableId: deliverable.id,
          uploaderId: session.user.id,
          filename: input.filename,
          storageKey: `${session.workspaceId}/${deliverable.task.milestone.service.projectId}/deliverables/v${newVersionNumber}_${input.filename}`,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
      });
      fileId = file.id;
    }

    const version = await tx.deliverableVersion.create({
      data: {
        workspaceId: session.workspaceId,
        deliverableId: deliverable.id,
        versionNumber: newVersionNumber,
        fileId,
        submittedById: session.user.id,
        changeSummary: input.changeSummary || `Version ${newVersionNumber}.0 release`,
      },
    });

    await tx.deliverable.update({
      where: { id: deliverable.id },
      data: {
        currentVersion: newVersionNumber,
        status: DeliverableStatus.UNDER_REVIEW,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Deliverable",
        entityId: deliverable.id,
        action: "deliverable.version_created",
        priorState: `v${latestVersion}.0 (${deliverable.status})`,
        newState: `v${newVersionNumber}.0 (UNDER_REVIEW)`,
        justification: input.changeSummary,
      },
      tx
    );

    return version;
  });

  revalidatePath("/files");
  revalidatePath(`/projects/${deliverable.task.milestone.service.projectId}`);
  return { success: true, version: result };
}

/**
 * Records a formal deliverable review with feedback commentary (Rules R-1..R-3, AL-1).
 */
export async function submitDeliverableReviewAction(input: SubmitDeliverableReviewInput) {
  const session = await requireSession();

  if (!input.content || input.content.trim() === "") {
    throw new Error("Review feedback comment is mandatory.");
  }

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: input.deliverableId, workspaceId: session.workspaceId },
    include: {
      task: {
        include: {
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
      },
    },
  });

  if (!deliverable) {
    throw new Error(`Deliverable '${input.deliverableId}' was not found.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        workspaceId: session.workspaceId,
        deliverableId: deliverable.id,
        deliverableVersionId: input.deliverableVersionId || null,
        reviewerId: session.user.id,
        isClientReviewer: session.isClient,
        content: input.content,
        status: ReviewStatus.SUBMITTED,
      },
    });

    let newStatus = deliverable.status;
    if (input.decision === "APPROVED") {
      newStatus = DeliverableStatus.APPROVED;
    } else if (input.decision === "CHANGES_REQUESTED") {
      newStatus = DeliverableStatus.CHANGES_REQUESTED;
    }

    if (newStatus !== deliverable.status) {
      await tx.deliverable.update({
        where: { id: deliverable.id },
        data: { status: newStatus },
      });
    }

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Deliverable",
        entityId: deliverable.id,
        action: `deliverable.review_${input.decision?.toLowerCase() || "submitted"}`,
        priorState: deliverable.status,
        newState: newStatus,
        justification: input.content,
      },
      tx
    );

    return review;
  });

  revalidatePath("/files");
  revalidatePath(`/projects/${deliverable.task.milestone.service.projectId}`);
  return { success: true, review: result };
}
