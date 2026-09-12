"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { GlobalRole } from "@prisma/client";

export interface InviteTeamMemberInput {
  name: string;
  email: string;
  role: GlobalRole;
}

export interface UpdateMemberRoleInput {
  memberId: string;
  newRole: GlobalRole;
}

export interface ToggleSuspensionInput {
  userId: string;
  isSuspended: boolean;
  reason?: string;
}

/**
 * Invites a new team member into the workspace with designated GlobalRole (Rules G-6, AL-1).
 */
export async function inviteTeamMemberAction(input: InviteTeamMemberInput) {
  const session = await requireSession();

  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Super Admins or Admins can invite team members.");
  }

  if (!input.email || !input.name) {
    throw new Error("Name and email are required for team invitation.");
  }

  const normalizedEmail = input.email.toLowerCase().trim();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Find or create user
    let user = await tx.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: input.name.trim(),
          isSuspended: false,
        },
      });
    }

    // 2. Check if already a workspace member
    const existingMember = await tx.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: session.workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new Error(`User with email '${normalizedEmail}' is already a member of this workspace.`);
    }

    const member = await tx.workspaceMember.create({
      data: {
        workspaceId: session.workspaceId,
        userId: user.id,
        role: input.role,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "WorkspaceMember",
        entityId: member.id,
        action: "team.member_invited",
        priorState: null,
        newState: input.role,
        justification: `Invited ${input.name} (${normalizedEmail}) as ${input.role}`,
      },
      tx
    );

    return member;
  });

  revalidatePath("/team");
  return { success: true, member: result };
}

/**
 * Updates a team member's role (Rule G-6, AL-1).
 */
export async function updateTeamMemberRoleAction(input: UpdateMemberRoleInput) {
  const session = await requireSession();

  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Super Admins or Admins can update roles.");
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: input.memberId, workspaceId: session.workspaceId },
    include: { user: true },
  });

  if (!member) {
    throw new Error(`Workspace member '${input.memberId}' not found.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.workspaceMember.update({
      where: { id: member.id },
      data: { role: input.newRole },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "WorkspaceMember",
        entityId: member.id,
        action: "team.role_updated",
        priorState: member.role,
        newState: input.newRole,
        justification: `Role changed from ${member.role} to ${input.newRole} for ${member.user.name}`,
      },
      tx
    );

    return updated;
  });

  revalidatePath("/team");
  return { success: true, member: result };
}

/**
 * Non-destructively suspends or restores a member (Rule G-7, AL-1).
 */
export async function toggleMemberSuspensionAction(input: ToggleSuspensionInput) {
  const session = await requireSession();

  if (!session.isAdmin) {
    throw new Error("UNAUTHORIZED: Only Super Admins or Admins can change member suspension status.");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!user) {
    throw new Error(`User '${input.userId}' not found.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { isSuspended: input.isSuspended },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "User",
        entityId: user.id,
        action: input.isSuspended ? "team.member_suspended" : "team.member_restored",
        priorState: user.isSuspended ? "SUSPENDED" : "ACTIVE",
        newState: input.isSuspended ? "SUSPENDED" : "ACTIVE",
        justification: input.reason || (input.isSuspended ? "Non-destructive account suspension" : "Account access restored"),
      },
      tx
    );

    return updated;
  });

  revalidatePath("/team");
  return { success: true, user: result };
}
