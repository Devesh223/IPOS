"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { MeetingStatus } from "@prisma/client";

export interface ScheduleMeetingInput {
  projectId: string;
  title: string;
  agenda?: string;
  meetingTime: string; // ISO string
  durationMinutes?: number;
  meetingUrl?: string;
  attendeeClientContactIds?: string[];
  attendeeUserIds?: string[];
}

export interface RecordMeetingDecisionInput {
  meetingId: string;
  decisionText: string;
  isClientVisible?: boolean;
}

/**
 * Schedules a structured, agenda-bound Review Session / Meeting (Rules M-1, AL-1).
 */
export async function scheduleMeetingAction(input: ScheduleMeetingInput) {
  const session = await requireSession();

  if (!input.title || input.title.trim() === "") {
    throw new Error("Meeting title is required.");
  }

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, workspaceId: session.workspaceId },
    include: { client: true },
  });

  if (!project) {
    throw new Error(`Project with ID '${input.projectId}' was not found in this workspace.`);
  }

  const meetingDate = new Date(input.meetingTime);

  const meeting = await prisma.$transaction(async (tx) => {
    const created = await tx.meeting.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: input.projectId,
        title: input.title,
        agenda: input.agenda ?? null,
        meetingTime: meetingDate,
        durationMinutes: input.durationMinutes || 45,
        meetingUrl: input.meetingUrl || `https://meet.google.com/ip-${project.client.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-review`,
        status: MeetingStatus.SCHEDULED,
      },
    });

    // Create attendee entries
    if (input.attendeeClientContactIds && input.attendeeClientContactIds.length > 0) {
      for (const contactId of input.attendeeClientContactIds) {
        await tx.meetingAttendee.create({
          data: {
            meetingId: created.id,
            clientContactId: contactId,
            attended: false,
          },
        });
      }
    }

    if (input.attendeeUserIds && input.attendeeUserIds.length > 0) {
      for (const userId of input.attendeeUserIds) {
        await tx.meetingAttendee.create({
          data: {
            meetingId: created.id,
            userId: userId,
            attended: false,
          },
        });
      }
    }

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Meeting",
        entityId: created.id,
        action: "meeting.scheduled",
        priorState: null,
        newState: "SCHEDULED",
        justification: `Scheduled review session '${input.title}' for ${project.client.name} on ${meetingDate.toISOString()}`,
      },
      tx
    );

    return created;
  });

  revalidatePath("/meetings");
  revalidatePath(`/projects/${input.projectId}`);
  return { success: true, meeting };
}

/**
 * Records an authoritative formal Decision in a Meeting with audit trail (Rules M-1, AL-1, G-3).
 */
export async function recordMeetingDecisionAction(input: RecordMeetingDecisionInput) {
  const session = await requireSession();

  if (!input.decisionText || input.decisionText.trim() === "") {
    throw new Error("Formal decision record cannot be empty.");
  }

  const meeting = await prisma.meeting.findFirst({
    where: { id: input.meetingId, workspaceId: session.workspaceId },
    include: { project: true },
  });

  if (!meeting) {
    throw new Error(`Meeting with ID '${input.meetingId}' was not found in this workspace.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create linked Note with isClientVisible flag (Rule G-3, 5.19)
    const note = await tx.note.create({
      data: {
        workspaceId: session.workspaceId,
        projectId: meeting.projectId,
        meetingId: meeting.id,
        authorId: session.user.id,
        content: input.decisionText,
        isClientVisible: input.isClientVisible ?? true,
      },
    });

    // 2. Mark meeting as COMPLETED
    await tx.meeting.update({
      where: { id: meeting.id },
      data: { status: MeetingStatus.COMPLETED },
    });

    // 3. Write immutable audit log entry
    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "Meeting",
        entityId: meeting.id,
        action: "meeting.decision_recorded",
        priorState: meeting.status,
        newState: "COMPLETED",
        justification: input.decisionText,
      },
      tx
    );

    return note;
  });

  revalidatePath("/meetings");
  revalidatePath(`/projects/${meeting.projectId}`);
  return { success: true, note: result };
}
