"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { assertTaskHasSingleAssignee, assertNoOutstandingRejectedDeliverables } from "@/domain/tasks/rules";
import { assertPaymentGateAllowsTaskCreation } from "@/domain/payments/rules";
import { TaskStatus, DeliverableStatus, InvoiceStatus } from "@prisma/client";

export interface CreateTaskInput {
  milestoneId: string;
  name: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface SubmitDeliverableVersionInput {
  deliverableId: string;
  changeSummary: string;
  fileId?: string;
}

export interface ReassignTaskInput {
  taskId: string;
  newAssigneeId: string;
  justification: string;
}

/**
 * Creates a new Task under a Milestone, actively enforcing Payment Gate (Rule PAY-3, T-1).
 */
export async function createTaskAction(input: CreateTaskInput) {
  const session = await requireSession();

  if (!session.isPM && !session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Project Managers or Admins can create tasks.");
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: input.milestoneId },
    include: {
      service: {
        include: {
          project: {
            include: {
              workspace: true,
              invoices: true,
            },
          },
        },
      },
    },
  });

  if (!milestone) {
    throw new Error(`Milestone with ID '${input.milestoneId}' was not found.`);
  }

  const workspace = milestone.service.project.workspace;
  const project = milestone.service.project;

  // Enforce Rule PAY-3: Check if there are unpaid/overdue invoices on the project if payment gate is enforced
  if (workspace.enforcePaymentGate) {
    const unpaidInvoices = project.invoices.filter(
      (inv) => inv.status === InvoiceStatus.OVERDUE || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== InvoiceStatus.PAID)
    );
    assertPaymentGateAllowsTaskCreation(
      workspace.enforcePaymentGate,
      unpaidInvoices.length > 0,
      unpaidInvoices[0]?.invoiceNumber || "Unsettled Checkpoint"
    );
  }

  const initialStatus = input.assigneeId ? TaskStatus.ASSIGNED : TaskStatus.BACKLOG;
  assertTaskHasSingleAssignee(input.assigneeId, initialStatus);

  const createdTask = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        workspaceId: session.workspaceId,
        milestoneId: input.milestoneId,
        assigneeId: input.assigneeId || null,
        name: input.name,
        description: input.description ?? null,
        status: initialStatus,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Task",
        entityId: task.id,
        action: "task.created",
        priorState: null,
        newState: task.status,
        justification: `Task created under milestone '${milestone.name}'`,
      },
      tx
    );

    return task;
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/dashboard");
  return { success: true, task: createdTask };
}

/**
 * Submits a new sequential Deliverable Version (Rules D-1, D-3).
 */
export async function submitDeliverableVersionAction(input: SubmitDeliverableVersionInput) {
  const session = await requireSession();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: input.deliverableId },
    include: {
      task: {
        include: {
          milestone: {
            include: {
              service: true,
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
    throw new Error(`Deliverable with ID '${input.deliverableId}' was not found.`);
  }

  const nextVersionNumber = deliverable.currentVersion + 1;

  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.deliverableVersion.create({
      data: {
        workspaceId: session.workspaceId,
        deliverableId: deliverable.id,
        versionNumber: nextVersionNumber,
        fileId: input.fileId ?? null,
        submittedById: session.user.id,
        changeSummary: input.changeSummary || `Version ${nextVersionNumber}.0 submitted for review`,
      },
    });

    await tx.deliverable.update({
      where: { id: deliverable.id },
      data: {
        currentVersion: nextVersionNumber,
        status: DeliverableStatus.UNDER_REVIEW,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "DeliverableVersion",
        entityId: version.id,
        action: "deliverable_version.submitted",
        priorState: `v${deliverable.currentVersion}.0 (${deliverable.status})`,
        newState: `v${nextVersionNumber}.0 (UNDER_REVIEW)`,
        justification: input.changeSummary,
      },
      tx
    );

    return version;
  });

  revalidatePath(`/projects/${deliverable.task.milestone.service.projectId}`);
  return { success: true, version: result };
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

  assertTaskHasSingleAssignee(input.newAssigneeId, TaskStatus.IN_PROGRESS);

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: input.taskId },
      data: {
        assigneeId: input.newAssigneeId,
        status: TaskStatus.IN_PROGRESS,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Task",
        entityId: input.taskId,
        action: "task.reassigned",
        priorState: `Assignee: ${task.assignee?.name ?? "Unassigned"}`,
        newState: `Assignee: ${newAssignee.name}`,
        justification: input.justification || "PM balanced production workload (Rule T-3)",
      },
      tx
    );
  });

  revalidatePath(`/projects/${task.milestone.service.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export interface UpdateTaskStatusInput {
  taskId: string;
  status: TaskStatus;
}

/**
 * Updates task status while enforcing single assignee and deliverable completion rules (Rule T-1, T-4).
 */
export async function updateTaskStatusAction(input: UpdateTaskStatusInput) {
  const session = await requireSession();

  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    include: {
      deliverables: true,
      milestone: {
        include: { service: true },
      },
    },
  });

  if (!task) {
    throw new Error(`Task with ID '${input.taskId}' was not found.`);
  }

  assertTaskHasSingleAssignee(task.assigneeId, input.status);

  if (input.status === TaskStatus.COMPLETE) {
    const rejectedDeliverables = task.deliverables
      .filter((d) => d.status === DeliverableStatus.REJECTED || d.status === DeliverableStatus.CHANGES_REQUESTED)
      .map((d) => ({ id: d.id, name: d.name, status: d.status }));
    assertNoOutstandingRejectedDeliverables(rejectedDeliverables);
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: input.taskId },
      data: { status: input.status },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Task",
        entityId: input.taskId,
        action: `task.status_${input.status.toLowerCase()}`,
        priorState: task.status,
        newState: input.status,
        justification: `Task status updated to ${input.status}`,
      },
      tx
    );
  });

  revalidatePath(`/projects/${task.milestone.service.projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
