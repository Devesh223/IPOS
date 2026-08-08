"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";

export interface OnboardingData {
  studioName: string;
  timezone: string;
  enforcePaymentGate: boolean;
  enforceAgreementGate: boolean;
  teamInvites?: Array<{ email: string; role: string }>;
}

export async function completeOnboardingAction(data: OnboardingData) {
  const session = await getSessionContext();
  if (!session) {
    return { success: false, error: "Unauthorized. Session required." };
  }

  try {
    // 1. Update workspace configuration
    await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: {
        name: data.studioName,
        timezone: data.timezone,
        enforcePaymentGate: data.enforcePaymentGate,
        enforceAgreementGate: data.enforceAgreementGate,
        onboardingStatus: "COMPLETED",
        setupStep: 4,
      },
    });

    // 2. Write immutable audit log entry (Rule AL-1)
    writeAuditLogEntry({
      workspaceId: session.workspaceId,
      actorId: session.user.id,
      actorType: "USER",
      entityType: "Workspace",
      entityId: session.workspaceId,
      action: "workspace.onboarding_completed",
      priorState: "onboardingStatus=PENDING",
      newState: "onboardingStatus=COMPLETED",
      justification: "Initial studio workspace onboarding finalized by founder",
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete onboarding." };
  }
}
