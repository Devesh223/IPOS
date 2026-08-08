export type TaskStatus =
  | "BACKLOG"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED_FOR_VERIFICATION"
  | "COMPLETE"
  | "BLOCKED"
  | "CANCELLED";

export interface TaskItem {
  id: string;
  workspaceId: string;
  milestoneId: string;
  milestoneName?: string;
  projectId: string;
  projectName?: string;
  clientName?: string;
  assigneeId: string | null;
  assigneeName?: string;
  assigneeAvatar?: string | null;
  name: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  isOverdue: boolean;
  blockedReason: string | null;
  deliverablesCount: number;
  hasRejectedDeliverable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  workspaceId: string;
  milestoneId: string;
  name: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskStatusInput {
  taskId: string;
  actorId: string;
  targetStatus: TaskStatus;
  blockedReason?: string;
  cancelledReason?: string;
}

export interface ReassignTaskInput {
  taskId: string;
  actorId: string;
  newAssigneeId: string;
  reason?: string;
}
