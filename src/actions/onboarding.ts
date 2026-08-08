"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionContext, requireSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { sendEmail } from "@/domain/email/service";
import { hashPassword } from "@/lib/password";
import { assertAgreementSignedBeforeClientActive } from "@/domain/onboarding/client";
import { ClientStatus, AgreementStatus, GlobalRole, ProjectRole } from "@prisma/client";

export interface OnboardingData {
  studioName: string;
  timezone: string;
  enforcePaymentGate: boolean;
  enforceAgreementGate: boolean;
  teamInvites?: Array<{ email: string; role: string }>;
}

export interface InviteClientInput {
  clientName: string;
  companyName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  initialAgreementTerms?: string;
}

export interface SignClientAgreementInput {
  token: string;
  signerName: string;
  signerTitle: string;
}

export interface CompleteClientOnboardingInput {
  token: string;
  password: string;
  companyName?: string;
}

/**
 * Internal Studio Founder Workspace Onboarding Finalizer.
 */
export async function completeOnboardingAction(data: OnboardingData) {
  const session = await getSessionContext();
  if (!session) {
    return { success: false, error: "Unauthorized. Session required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update workspace configuration
      await tx.workspace.update({
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

      // 2. Write immutable audit log entry into PostgreSQL (Rule AL-1, AL-3)
      await writeAuditLogEntry(
        {
          workspaceId: session.workspaceId,
          actorId: session.user.id,
          actorType: "USER",
          entityType: "Workspace",
          entityId: session.workspaceId,
          action: "workspace.onboarding_completed",
          priorState: "onboardingStatus=PENDING",
          newState: "onboardingStatus=COMPLETED",
          justification: "Initial studio workspace onboarding finalized by founder",
        },
        tx
      );
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete onboarding." };
  }
}

/**
 * Invites a new Client into the Workspace with an initial Master Agreement and secure onboarding link.
 */
export async function inviteClientAction(input: InviteClientInput) {
  const session = await requireSession();

  if (!session.isAdmin && !session.isPM) {
    throw new Error("UNAUTHORIZED: Only Admins or Project Managers can invite clients.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Client
    const client = await tx.client.create({
      data: {
        workspaceId: session.workspaceId,
        name: input.clientName,
        companyName: input.companyName || input.clientName,
        email: input.contactEmail.toLowerCase(),
        status: ClientStatus.ONBOARDING_PENDING,
        onboardingStatus: "INVITED",
      },
    });

    // 2. Create Primary Client Contact
    const contact = await tx.clientContact.create({
      data: {
        workspaceId: session.workspaceId,
        clientId: client.id,
        name: input.contactName,
        email: input.contactEmail.toLowerCase(),
        phone: input.contactPhone ?? null,
        isPrimary: true,
      },
    });

    // 3. Create Draft Master Agreement for the Client (Rule AG-1)
    const agreement = await tx.agreement.create({
      data: {
        workspaceId: session.workspaceId,
        clientId: client.id,
        title: `Master Service Agreement — ${input.clientName}`,
        terms: input.initialAgreementTerms || "Standard Indian Pixel Studio Professional Services Terms & Conditions.",
        status: AgreementStatus.DRAFT,
        version: 1,
      },
    });

    // 4. Create Verification / Onboarding Token
    await tx.verification.create({
      data: {
        identifier: `client-onboard:${client.id}`,
        value: token,
        expiresAt,
      },
    });

    // 5. Audit log
    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Client",
        entityId: client.id,
        action: "client.invited",
        priorState: null,
        newState: "ONBOARDING_PENDING",
        justification: `Client invited by ${session.user.name} with master agreement`,
      },
      tx
    );

    return { client, contact, agreement };
  });

  const onboardingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/client-onboarding?token=${token}`;

  await sendEmail({
    to: input.contactEmail,
    subject: `Welcome to Indian Pixel Studio — Client Portal Onboarding for ${input.clientName}`,
    text: `Hello ${input.contactName},\n\nYou have been invited to join the Indian Pixel Studio client portal for ${input.clientName}.\n\nPlease review your Master Agreement and set up your portal credentials here:\n${onboardingUrl}\n\nThis invite is valid for 7 days.`,
    html: `<p>Hello ${input.contactName},</p><p>You have been invited to join the Indian Pixel Studio client portal for <strong>${input.clientName}</strong>.</p><p><a href="${onboardingUrl}">Click here to complete client onboarding & sign your master agreement</a>.</p>`,
  });

  return { success: true, clientId: result.client.id, onboardingUrl };
}

/**
 * Retrieves client onboarding context using secure invite token.
 */
export async function getClientOnboardingDataAction(token: string) {
  if (!token) return { success: false, error: "Onboarding token required." };

  const verification = await prisma.verification.findFirst({
    where: {
      value: token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification || !verification.identifier.startsWith("client-onboard:")) {
    return { success: false, error: "Invalid or expired client invitation link." };
  }

  const clientId = verification.identifier.replace("client-onboard:", "");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      workspace: true,
      contacts: { where: { isPrimary: true } },
      agreements: { orderBy: { version: "desc" }, take: 1 },
      projects: true,
    },
  });

  if (!client) {
    return { success: false, error: "Client record not found." };
  }

  return {
    success: true,
    client: {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      contact: client.contacts[0] ?? null,
      workspaceName: client.workspace.name,
      agreement: client.agreements[0] ?? null,
      status: client.status,
      onboardingStatus: client.onboardingStatus,
    },
  };
}

/**
 * E-Signs the Master Service Agreement during client onboarding (Rule AG-2, AG-3).
 */
export async function signClientAgreementAction(input: SignClientAgreementInput) {
  const context = await getClientOnboardingDataAction(input.token);
  if (!context.success || !context.client) {
    return { success: false, error: context.error || "Invalid onboarding token." };
  }

  const agreement = context.client.agreement;
  if (!agreement) {
    return { success: false, error: "No master agreement found to sign." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.agreement.update({
      where: { id: agreement.id },
      data: {
        status: AgreementStatus.ACTIVE,
        signedAt: new Date(),
      },
    });

    await tx.client.update({
      where: { id: context.client.id },
      data: { onboardingStatus: "AGREEMENT_SIGNED" },
    });

    await writeAuditLogEntry(
      {
        workspaceId: agreement.workspaceId,
        actorId: `client-contact:${context.client.contact?.email ?? context.client.id}`,
        actorType: "USER",
        entityType: "Agreement",
        entityId: agreement.id,
        action: "agreement.e_signed",
        priorState: "DRAFT",
        newState: "ACTIVE",
        justification: `E-Signed by ${input.signerName} (${input.signerTitle})`,
      },
      tx
    );
  });

  return { success: true };
}

/**
 * Finalizes client onboarding, creates User credentials, assigns CLIENT role, and establishes active session.
 */
export async function completeClientOnboardingAction(input: CompleteClientOnboardingInput) {
  const context = await getClientOnboardingDataAction(input.token);
  if (!context.success || !context.client) {
    return { success: false, error: context.error || "Invalid onboarding token." };
  }

  const client = context.client;
  const contact = client.contact;

  if (!contact) {
    return { success: false, error: "Primary client contact not configured." };
  }

  if (input.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  // Ensure agreement has been signed
  assertAgreementSignedBeforeClientActive(
    client.agreement?.status === AgreementStatus.ACTIVE || client.onboardingStatus === "AGREEMENT_SIGNED",
    client.name
  );

  const passwordHash = hashPassword(input.password);

  const sessionResult = await prisma.$transaction(async (tx) => {
    // 1. Create User account for client contact
    const user = await tx.user.upsert({
      where: { email: contact.email },
      update: { passwordHash, emailVerified: true },
      create: {
        email: contact.email,
        name: contact.name,
        passwordHash,
        emailVerified: true,
      },
    });

    // 2. Link Account
    await tx.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
      update: { password: passwordHash },
      create: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });

    // 3. Assign Client workspace membership
    await tx.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: client.agreement?.workspaceId ?? "ws-indian-pixel", userId: user.id } },
      update: { role: GlobalRole.VIEWER },
      create: {
        workspaceId: client.agreement?.workspaceId ?? "ws-indian-pixel",
        userId: user.id,
        role: GlobalRole.VIEWER,
      },
    });

    // 4. Update Client status to ACTIVE
    await tx.client.update({
      where: { id: client.id },
      data: {
        companyName: input.companyName || client.companyName,
        status: ClientStatus.ACTIVE,
        onboardingStatus: "COMPLETED",
      },
    });

    // 5. Invalidate onboarding token
    await tx.verification.deleteMany({
      where: { value: input.token },
    });

    // 6. Create 30-day session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await tx.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // 7. Audit log
    await writeAuditLogEntry(
      {
        workspaceId: client.agreement?.workspaceId ?? "ws-indian-pixel",
        actorId: user.id,
        actorType: "USER",
        entityType: "Client",
        entityId: client.id,
        action: "client.onboarding_completed",
        priorState: "ONBOARDING_PENDING",
        newState: "ACTIVE",
        justification: "Client portal onboarding successfully completed with active master agreement",
      },
      tx
    );

    return { token: sessionToken, expiresAt };
  });

  cookies().set(SESSION_COOKIE_NAME, sessionResult.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: sessionResult.expiresAt,
    path: "/",
  });

  return { success: true, redirectTo: "/dashboard" };
}
