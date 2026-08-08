import { BusinessRuleError } from "../errors";

/**
 * Asserts that a payment references a valid Project (Rule PAY-1).
 */
export function assertPaymentHasProject(projectId?: string): void {
  if (!projectId || projectId.trim() === "") {
    throw new BusinessRuleError("PAY-1", "A Payment must reference a Project.");
  }
}

/**
 * Asserts that payment gate enforcement correctly blocks subsequent Milestone task creation if prior milestone payment is unpaid (Rule PAY-3).
 */
export function assertPaymentGateAllowsTaskCreation(
  isPaymentGateEnforced: boolean,
  hasUnpaidPriorMilestone: boolean,
  unpaidMilestoneName?: string
): void {
  if (isPaymentGateEnforced && hasUnpaidPriorMilestone) {
    throw new BusinessRuleError(
      "PAY-3",
      `Task creation is blocked because prior Milestone '${unpaidMilestoneName ?? "Checkpoint"}' payment is outstanding. Settle the invoice or update payment gate configuration.`,
      { id: "payment-gate", type: "PaymentGate", name: unpaidMilestoneName }
    );
  }
}

/**
 * Asserts that a recorded payment is never deleted (Rule PAY-4).
 */
export function assertPaymentCannotBeDeleted(): void {
  throw new BusinessRuleError(
    "PAY-4",
    "A recorded Payment cannot be deleted. Corrections must be made via an explicit Refund or Adjustment record."
  );
}
