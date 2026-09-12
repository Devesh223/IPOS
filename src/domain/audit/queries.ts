import { prisma } from "@/lib/prisma";

export async function getWorkspaceAuditData(workspaceId: string, limit = 250) {
  const entries = await prisma.auditLogEntry.findMany({
    where: { workspaceId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  const actorsSet = new Set<string>();
  const entitiesSet = new Set<string>();
  const actionsSet = new Set<string>();

  const logs = entries.map((entry) => {
    actorsSet.add(entry.actorId);
    entitiesSet.add(entry.entityType);
    actionsSet.add(entry.action);

    return {
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
      timestampFormatted: new Date(entry.timestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    };
  });

  return {
    logs,
    actors: Array.from(actorsSet),
    entities: Array.from(entitiesSet),
    actions: Array.from(actionsSet),
  };
}
