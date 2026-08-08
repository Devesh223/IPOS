"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import {
  assertProjectHasValidClient,
  assertProjectHasPMBeforeActive,
  assertProjectInvoicesSettled,
  assertProjectReopenHasReason,
} from "@/domain/projects/rules";
import { ProjectStatus } from "@prisma/client";

/**
 * Creates a new Client Project with strict client containment (Rule P-1).
 */
export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const pmId = formData.get("pmId") as string;

  assertProjectHasValidClient(clientId);

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        workspaceId: session.workspaceId,
        clientId,
        pmId: pmId || session.user.id,
        name,
        description,
        status: ProjectStatus.DRAFT,
      },
    });

    // Write audit log entry (Rule AL-1)
    writeAuditLogEntry({
      workspaceId: session.workspaceId,
      actorId: session.user.id,
      actorType: "USER",
      entityType: "Project",
      entityId: p.id,
      action: "project.created",
      priorState: null,
      newState: "DRAFT",
      justification: `Project initialized under Client ID: ${clientId}`,
    });

    return p;
  });

  revalidatePath("/projects");
  return { success: true, project };
}

/**
 * Super Admin or Admin Override protocol for gated project completion (Rule P-4 / AL-6).
 */
export async function overrideProjectGateAction(projectId: string, justification: string) {
  const session = await requireSession();

  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Super Admin or Admin can perform a project gate override.");
  }

  if (!justification || justification.trim() === "") {
    throw new Error("Rule AL-6: A written justification is mandatory for Admin gate overrides.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.COMPLETED,
      },
    });

    writeAuditLogEntry({
      workspaceId: session.workspaceId,
      actorId: session.user.id,
      actorType: "USER",
      entityType: "Project",
      entityId: projectId,
      action: "project.invoice_gate_overridden",
      priorState: "BLOCKED_ON_INVOICE",
      newState: "COMPLETED",
      justification,
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
