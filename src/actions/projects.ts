"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import {
  assertProjectHasValidClient,
  assertProjectHasPMBeforeActive,
  assertProjectChildServicesCompleted,
  assertProjectInvoicesSettled,
  assertProjectReopenHasReason,
  assertProjectHasActiveAgreement,
} from "@/domain/projects/rules";
import { ProjectStatus, AgreementStatus, InvoiceStatus, ServiceStatus } from "@prisma/client";

/**
 * Creates a new Client Project with strict client containment (Rule P-1).
 */
export async function createProjectAction(formData: FormData) {
  const session = await requireSession();

  if (!session.isAdmin && !session.isPM) {
    throw new Error("UNAUTHORIZED: Only Admins or Project Managers can create projects.");
  }

  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const pmId = formData.get("pmId") as string;

  assertProjectHasValidClient(clientId);

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
  });

  if (!client) {
    throw new Error(`Client with ID '${clientId}' was not found in this workspace.`);
  }

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

    // Write audit log entry in PostgreSQL inside transaction (Rule AL-1, AL-3)
    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Project",
        entityId: p.id,
        action: "project.created",
        priorState: null,
        newState: "DRAFT",
        justification: `Project initialized under Client ID: ${clientId}`,
      },
      tx
    );

    return p;
  });

  revalidatePath("/projects");
  return { success: true, project };
}

/**
 * Activates a Project, actively enforcing Agreement Gate and PM Assignment (Rules AG-3, P-2).
 */
export async function activateProjectAction(projectId: string) {
  const session = await requireSession();

  if (!session.isAdmin && !session.isPM) {
    throw new Error("UNAUTHORIZED: Only Admins or Project Managers can activate projects.");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: session.workspaceId },
    include: {
      client: {
        include: {
          agreements: true,
        },
      },
      workspace: true,
    },
  });

  if (!project) {
    throw new Error(`Project with ID '${projectId}' was not found in this workspace.`);
  }

  // Enforce Rule P-2: Must have assigned PM before leaving Draft
  assertProjectHasPMBeforeActive(project.pmId, "ACTIVE");

  // Enforce Rule AG-3: Must have active signed agreement if agreement gate is enforced
  if (project.workspace.enforceAgreementGate) {
    const hasActiveAgreement = project.client.agreements.some(
      (ag) => ag.status === AgreementStatus.ACTIVE
    );
    assertProjectHasActiveAgreement(
      project.workspace.enforceAgreementGate,
      hasActiveAgreement,
      project.client.name
    );
  }

  const updatedProject = await prisma.$transaction(async (tx) => {
    const p = await tx.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.ACTIVE },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Project",
        entityId: projectId,
        action: "project.activated",
        priorState: project.status,
        newState: "ACTIVE",
        justification: "Project kicked off with verified PM assignment and signed client master agreement",
      },
      tx
    );

    return p;
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, project: updatedProject };
}

/**
 * Completes a Project after validating child services and settled invoices (Rules P-3, P-4).
 */
export async function completeProjectAction(projectId: string) {
  const session = await requireSession();

  if (!session.isAdmin && !session.isPM) {
    throw new Error("UNAUTHORIZED: Only Admins or Project Managers can complete projects.");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: session.workspaceId },
    include: {
      services: true,
      invoices: true,
    },
  });

  if (!project) {
    throw new Error(`Project with ID '${projectId}' was not found in this workspace.`);
  }

  // Enforce Rule P-3: All services completed or cancelled
  const unresolvedServices = project.services.filter(
    (s) => s.status !== ServiceStatus.COMPLETED && s.status !== ServiceStatus.CANCELLED
  );
  assertProjectChildServicesCompleted(unresolvedServices);

  // Enforce Rule P-4: All invoices settled
  const unsettledInvoices = project.invoices.filter(
    (inv) => inv.status !== InvoiceStatus.PAID
  );
  assertProjectInvoicesSettled(unsettledInvoices);

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.COMPLETED },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Project",
        entityId: projectId,
        action: "project.completed",
        priorState: project.status,
        newState: "COMPLETED",
        justification: "All child services verified completed and all invoices settled",
      },
      tx
    );

    return p;
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, project: updated };
}

/**
 * Reopens a completed or cancelled Project with recorded operational justification (Rule P-6).
 */
export async function reopenProjectAction(projectId: string, reopenReason: string) {
  const session = await requireSession();

  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Super Admin or Admin can reopen projects.");
  }

  assertProjectReopenHasReason(reopenReason);

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: session.workspaceId },
  });

  if (!project) {
    throw new Error(`Project with ID '${projectId}' was not found in this workspace.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ACTIVE,
        reopenCount: project.reopenCount + 1,
        reopenReason,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Project",
        entityId: projectId,
        action: "project.reopened",
        priorState: project.status,
        newState: "ACTIVE",
        justification: reopenReason,
      },
      tx
    );

    return p;
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, project: updated };
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

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Project",
        entityId: projectId,
        action: "project.invoice_gate_overridden",
        priorState: "BLOCKED_ON_INVOICE",
        newState: "COMPLETED",
        justification,
      },
      tx
    );
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
