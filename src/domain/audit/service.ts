import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { WriteAuditLogInput, AuditLogItem } from "./types";
import { BusinessRuleError } from "../errors";

/**
 * Validates domain rules AL-1 and AL-2 before any audit log is written.
 */
export function validateAuditLogInput(input: WriteAuditLogInput): void {
  if (!input.actorId || input.actorId.trim() === "") {
    throw new BusinessRuleError("AL-2", "Every Audit Log entry must contain a specific actor identity or named system process.");
  }
  if (!input.entityType || !input.entityId) {
    throw new BusinessRuleError("AL-1", "Every Audit Log entry must reference the entity affected.");
  }
}

/**
 * Writes an append-only, immutable Audit Log entry directly into PostgreSQL (Rules AL-1, AL-2, AL-3, AL-4, AL-5, AL-6).
 * Accepts optional Prisma.TransactionClient so the audit entry is atomically bound to the caller's database transaction.
 */
export async function writeAuditLogEntry(
  input: WriteAuditLogInput,
  txClient?: Prisma.TransactionClient
): Promise<AuditLogItem> {
  validateAuditLogInput(input);

  const client = txClient || prisma;

  const created = await client.auditLogEntry.create({
    data: {
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      actorType: input.actorType ?? "USER",
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      priorState: input.priorState ?? null,
      newState: input.newState ?? null,
      justification: input.justification ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? null,
    },
  });

  return {
    id: created.id,
    workspaceId: created.workspaceId,
    actorId: created.actorId,
    actorType: created.actorType as "USER" | "SYSTEM_PROCESS",
    entityType: created.entityType,
    entityId: created.entityId,
    action: created.action,
    priorState: created.priorState,
    newState: created.newState,
    justification: created.justification,
    amount: created.amount,
    currency: created.currency,
    timestamp: created.timestamp.toISOString(),
  };
}

/**
 * Query the immutable Audit Log per Workspace, Project, or Actor from PostgreSQL (Rule AL-8).
 */
export async function queryAuditLogs(params: {
  workspaceId: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}): Promise<AuditLogItem[]> {
  const entries = await prisma.auditLogEntry.findMany({
    where: {
      workspaceId: params.workspaceId,
      ...(params.actorId ? { actorId: params.actorId } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
    },
    orderBy: {
      timestamp: "desc",
    },
    take: params.limit ?? 100,
  });

  return entries.map((entry) => ({
    id: entry.id,
    workspaceId: entry.workspaceId,
    actorId: entry.actorId,
    actorType: entry.actorType as "USER" | "SYSTEM_PROCESS",
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    priorState: entry.priorState,
    newState: entry.newState,
    justification: entry.justification,
    amount: entry.amount,
    currency: entry.currency,
    timestamp: entry.timestamp.toISOString(),
  }));
}
