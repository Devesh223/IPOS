export interface AuditLogItem {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName?: string;
  actorType: "USER" | "SYSTEM_PROCESS";
  entityType: string;
  entityId: string;
  entityName?: string;
  action: string;
  priorState: string | null;
  newState: string | null;
  justification: string | null;
  amount: number | null;
  currency: string | null;
  timestamp: string;
}

export interface WriteAuditLogInput {
  workspaceId: string;
  actorId: string;
  actorType?: "USER" | "SYSTEM_PROCESS";
  entityType: string;
  entityId: string;
  action: string;
  priorState?: string | null;
  newState?: string | null;
  justification?: string | null;
  amount?: number | null;
  currency?: string | null;
}
