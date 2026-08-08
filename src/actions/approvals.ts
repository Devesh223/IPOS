"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import {
  assertSubmitterIsNotApprover,
  assertGateNotAlreadyDecided,
} from "@/domain/approvals/rules";
import { ApprovalDecision, ApprovalEntityType, MilestoneStatus } from "@prisma/client";

export interface RecordApprovalInput {
  milestoneId: string;
  decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  comment?: string;
}

/**
 * Records an immutable formal Approval decision on a Project Milestone (Rule A-1, A-4, AL-5).
 */
export async function recordApprovalDecisionAction(input: RecordApprovalInput) {
  const session = await requireSession();

  if (input.decision !== "APPROVED" && (!input.comment || input.comment.trim() === "")) {
    throw new Error("Rule AL-5: Written feedback/rationale is mandatory when requesting changes or rejecting.");
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: input.milestoneId },
    include: {
      service: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!milestone) {
    throw new Error(`Milestone with ID ${input.milestoneId} was not found.`);
  }

  // 1. Transactionally record Approval decision and update Milestone status
  await prisma.$transaction(async (tx) => {
    // Record immutable Approval record
    await tx.approval.create({
      data: {
        workspaceId: session.workspaceId,
        entityType: ApprovalEntityType.MILESTONE,
        entityId: input.milestoneId,
        approverId: session.user.id,
        decision: input.decision as ApprovalDecision,
        comment: input.comment ?? null,
      },
    });

    // Map decision to MilestoneStatus
    const newStatus =
      input.decision === "APPROVED"
        ? MilestoneStatus.APPROVED
        : input.decision === "CHANGES_REQUESTED"
        ? MilestoneStatus.CHANGES_REQUESTED
        : MilestoneStatus.IN_PROGRESS;

    await tx.milestone.update({
      where: { id: input.milestoneId },
      data: { status: newStatus },
    });

    // Write immutable audit log entry (Rule AL-1)
    writeAuditLogEntry({
      workspaceId: session.workspaceId,
      actorId: session.user.id,
      actorType: "USER",
      entityType: "Milestone",
      entityId: input.milestoneId,
      action: `milestone.${input.decision.toLowerCase()}`,
      priorState: milestone.status,
      newState: newStatus,
      justification: input.comment ?? null,
    });
  });

  revalidatePath(`/projects/${milestone.service.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
