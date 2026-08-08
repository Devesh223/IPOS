export type ProjectStatus = "DRAFT" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface ProjectSummary {
  id: string;
  workspaceId: string;
  clientId: string;
  clientName: string;
  pmId: string | null;
  pmName?: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  servicesCount: number;
  completedServicesCount: number;
  tasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  stalledApprovalsCount: number;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  workspaceId: string;
  clientId: string;
  name: string;
  description?: string;
  pmId?: string;
  targetDate?: string;
}

export interface ActivateProjectInput {
  projectId: string;
  pmId: string;
}

export interface CompleteProjectInput {
  projectId: string;
  actorId: string;
  adminOverrideJustification?: string;
}

export interface ReopenProjectInput {
  projectId: string;
  actorId: string;
  reason: string;
}
