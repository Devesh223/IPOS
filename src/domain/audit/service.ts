import { WriteAuditLogInput, AuditLogItem } from "./types";
import { BusinessRuleError } from "../errors";

/**
 * In-memory / Mock Audit storage supporting append-only guarantee (Rule AL-3).
 * There are deliberately NO update or delete methods on this service (Phase 4.5 Rule 3/7).
 */
const auditLogStore: AuditLogItem[] = [];

/**
 * Writes an append-only Audit Log entry (Rules AL-1, AL-2, AL-4, AL-5, AL-6).
 */
export function writeAuditLogEntry(input: WriteAuditLogInput): AuditLogItem {
  if (!input.actorId || input.actorId.trim() === "") {
    throw new BusinessRuleError("AL-2", "Every Audit Log entry must contain a specific actor identity or named system process.");
  }
  if (!input.entityType || !input.entityId) {
    throw new BusinessRuleError("AL-1", "Every Audit Log entry must reference the entity affected.");
  }

  const entry: AuditLogItem = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    timestamp: new Date().toISOString(),
  };

  auditLogStore.unshift(entry);
  return entry;
}

/**
 * Query the Audit Log per Workspace, Project, or Actor (Rule AL-8).
 */
export function queryAuditLogs(params: {
  workspaceId: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}): AuditLogItem[] {
  let results = auditLogStore.filter((item) => item.workspaceId === params.workspaceId);

  if (params.actorId) {
    results = results.filter((item) => item.actorId === params.actorId);
  }
  if (params.entityType) {
    results = results.filter((item) => item.entityType === params.entityType);
  }
  if (params.entityId) {
    results = results.filter((item) => item.entityId === params.entityId);
  }

  return results.slice(0, params.limit ?? 100);
}
