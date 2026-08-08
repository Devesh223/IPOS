"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { writeAuditLogEntry } from "@/domain/audit/service";
import { validateFileMetadata, buildStorageKey } from "@/domain/files/service";

export interface RegisterFileInput {
  projectId: string;
  taskId?: string;
  deliverableId?: string;
  invoiceId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Registers an uploaded production file in the database with strict workspace isolation and audit logging (Rules F-1..F-4, AL-1).
 */
export async function registerUploadedFileAction(input: RegisterFileInput) {
  const session = await requireSession();

  validateFileMetadata(input.filename, input.mimeType, input.sizeBytes);

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, workspaceId: session.workspaceId },
  });

  if (!project) {
    throw new Error(`Project with ID '${input.projectId}' was not found in this workspace.`);
  }

  const fileId = `file_${crypto.randomBytes(12).toString("hex")}`;
  const storageKey = buildStorageKey(
    session.workspaceId,
    input.projectId,
    input.deliverableId ? "deliverables" : input.taskId ? "tasks" : "general",
    fileId,
    input.filename
  );

  const file = await prisma.$transaction(async (tx) => {
    const created = await tx.file.create({
      data: {
        id: fileId,
        workspaceId: session.workspaceId,
        projectId: input.projectId,
        taskId: input.taskId || null,
        deliverableId: input.deliverableId || null,
        invoiceId: input.invoiceId || null,
        uploaderId: session.user.id,
        filename: input.filename,
        storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "File",
        entityId: created.id,
        action: "file.uploaded",
        priorState: null,
        newState: "STORED",
        justification: `Uploaded asset '${input.filename}' (${(input.sizeBytes / 1024).toFixed(1)} KB)`,
      },
      tx
    );

    return created;
  });

  revalidatePath(`/projects/${input.projectId}`);
  return { success: true, file };
}

/**
 * Non-destructively archives a file (Rule F-2, AL-1).
 */
export async function archiveFileAction(fileId: string, reason: string) {
  const session = await requireSession();

  if (!session.isAdmin && !session.isPM) {
    throw new Error("UNAUTHORIZED: Only Admins or Project Managers can archive files.");
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, workspaceId: session.workspaceId },
  });

  if (!file) {
    throw new Error(`File '${fileId}' not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.file.update({
      where: { id: fileId },
      data: { isArchived: true },
    });

    await writeAuditLogEntry(
      {
        workspaceId: session.workspaceId,
        actorId: session.user.id,
        actorType: "USER",
        entityType: "File",
        entityId: fileId,
        action: "file.archived",
        priorState: "ACTIVE",
        newState: "ARCHIVED",
        justification: reason || "File archived from active project scope",
      },
      tx
    );
  });

  revalidatePath(`/projects/${file.projectId}`);
  return { success: true };
}
