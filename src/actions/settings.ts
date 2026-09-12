"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";

export interface UpdateWorkspaceSettingsInput {
  name?: string;
  timezone?: string;
  enforcePaymentGate?: boolean;
  enforceAgreementGate?: boolean;
}

/**
 * Updates workspace governance configuration and policy enforcement with mandatory audit logging (Rules G-1, PAY-3, AG-3, AL-1).
 */
export async function updateWorkspaceSettingsAction(input: UpdateWorkspaceSettingsInput) {
  const session = await requireSession();

  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Super Admins or Admins can update workspace policies.");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
  });

  if (!workspace) {
    throw new Error(`Workspace '${session.workspaceId}' not found.`);
  }

  const dataToUpdate: any = {};
  if (input.name !== undefined) dataToUpdate.name = input.name.trim();
  if (input.timezone !== undefined) dataToUpdate.timezone = input.timezone;
  if (input.enforcePaymentGate !== undefined) dataToUpdate.enforcePaymentGate = input.enforcePaymentGate;
  if (input.enforceAgreementGate !== undefined) dataToUpdate.enforceAgreementGate = input.enforceAgreementGate;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.workspace.update({
      where: { id: workspace.id },
      data: dataToUpdate,
    });

    await writeAuditLogEntry(
      {
        workspaceId: workspace.id,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Workspace",
        entityId: workspace.id,
        action: "workspace.settings_updated",
        priorState: `PaymentGate: ${workspace.enforcePaymentGate}, AgreementGate: ${workspace.enforceAgreementGate}`,
        newState: `PaymentGate: ${updated.enforcePaymentGate}, AgreementGate: ${updated.enforceAgreementGate}`,
        justification: "Governance switches and operational timezone configuration updated",
      },
      tx
    );

    return updated;
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, workspace: result };
}
