import { BusinessRuleError } from "../errors";

/**
 * Asserts that an active or in-progress Task has a single assigned owner (Rule T-1).
 */
export function assertTaskHasSingleAssignee(assigneeId?: string | null, status?: string): void {
  if ((status === "ASSIGNED" || status === "IN_PROGRESS") && (!assigneeId || assigneeId.trim() === "")) {
    throw new BusinessRuleError("T-1", "A Task must have exactly one assignee at any time once active or in-progress.");
  }
}

/**
 * Asserts that a Task cannot complete while an associated deliverable is rejected or changes-requested (Rule T-4).
 */
export function assertNoOutstandingRejectedDeliverables(
  rejectedDeliverables: Array<{ id: string; name: string; status: string }>
): void {
  if (rejectedDeliverables.length > 0) {
    const first = rejectedDeliverables[0]!;
    throw new BusinessRuleError(
      "T-4",
      `Task cannot be marked Complete while Deliverable '${first.name}' is in status '${first.status}'. Resubmit and approve the deliverable first.`,
      { id: first.id, type: "Deliverable", name: first.name }
    );
  }
}

/**
 * Asserts that task verification requirement is respected before direct completion (Rule T-2).
 */
export function assertTaskVerificationConfig(
  requiresVerification: boolean,
  targetStatus: string,
  isVerifier: boolean
): void {
  if (requiresVerification && targetStatus === "COMPLETE" && !isVerifier) {
    throw new BusinessRuleError(
      "T-2",
      "This Milestone requires PM/Admin verification. Task must move to 'Submitted for Verification' first."
    );
  }
}
