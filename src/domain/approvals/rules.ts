import { BusinessRuleError, ConflictError } from "../errors";

/**
 * Asserts submitter cannot approve their own deliverable when separation is required (Rule A-4 / Exception E-7).
 */
export function assertSubmitterIsNotApprover(
  submitterId: string,
  approverId: string,
  requiresSeparation: boolean = true
): void {
  if (requiresSeparation && submitterId === approverId) {
    throw new BusinessRuleError(
      "A-4",
      "An Approval decision cannot be granted by the same actor who submitted the Deliverable."
    );
  }
}

/**
 * Asserts that an already decided approval gate cannot be decided again without Reopen (Rule A-1 / Exception E-8).
 */
export function assertGateNotAlreadyDecided(hasExistingDecision: boolean, existingApproverId?: string): void {
  if (hasExistingDecision) {
    throw new ConflictError(
      "This gate has already been decided. Only a formal Reopen action can begin a new cycle.",
      existingApproverId
    );
  }
}

/**
 * Asserts that prior approval stages are approved before subsequent stages can act (Rule A-3).
 */
export function assertPriorStagesApproved(
  currentStage: number,
  priorStagesCompleted: boolean,
  uncompletedStageNumber?: number
): void {
  if (currentStage > 1 && !priorStagesCompleted) {
    throw new BusinessRuleError(
      "A-3",
      `Approval stage ${currentStage} cannot be approved before Stage ${uncompletedStageNumber ?? (currentStage - 1)} is Approved.`
    );
  }
}
