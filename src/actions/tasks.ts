"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { assertTaskHasSingleAssignee } from "@/domain/tasks/rules";
import { TaskStatus } from "@prisma/client";

export interface ReassignTaskInput {
  taskId: string;
  newAssigneeId: string;
  justification: string;
}

/**
 * Reassigns a Task with mandatory operational justification (Rule T-1, T-3, AL-6).
 */
export async function reassignTaskAction(input: ReassignTaskInput) {
  const session = await requireSession();

  if (!session.isPM && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Project Managers or Admins can reassign tasks.");
  }

  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    include: {
      assignee: true,
      milestone: {
        include: {
          service: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error(`Task with ID '${input.taskId}' was not found.`);
  }

  const newAssignee = await prisma.user.findUnique({
    where: { id: input.newAssigneeId },
  });

  if (!newAssignee) {
    throw new Error(`Assignee user was not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: input.taskId },
      data: {
        assigneeId: input.newAssigneeId,
        status: TaskStatus.IN_PROGRESS,
      },
    });

    writeAuditLogEntry({
      workspaceId: session.workspaceId,
      actorId: session.user.id,
      actorType: "USER",
      entityType: "Task",
      entityId: input.taskId,
      action: "task.reassigned",
      priorState: `Assignee: ${task.assignee?.name ?? "Unassigned"}`,
      newState: `Assignee: ${newAssignee.name}`,
      justification: input.justification || "PM balanced production workload (Rule T-3)",
    });
  });

  revalidatePath(`/projects/${task.milestone.service.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
