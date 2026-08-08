export type ApprovalEntityType = "DELIVERABLE" | "MILESTONE";
export type ApprovalDecision = "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export interface ApprovalRecord {
  id: string;
  workspaceId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityTitle: string;
  versionNumber: number;
  stageNumber: number;
  totalStages: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  decision: ApprovalDecision;
  comment: string | null;
  isReopened: boolean;
  reopenedReason: string | null;
  createdAt: string;
}

export interface RecordApprovalInput {
  workspaceId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  versionNumber?: number;
  stageNumber?: number;
  approverId: string;
  decision: ApprovalDecision;
  comment?: string;
  submitterId?: string;
  requiresSeparation?: boolean;
}

export interface ReopenApprovalInput {
  approvalId: string;
  actorId: string;
  reason: string;
}
