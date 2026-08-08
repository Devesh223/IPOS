import { BusinessRuleError } from "../errors";

/**
 * Asserts that a project has a valid client reference (Rule P-1).
 */
export function assertProjectHasValidClient(clientId?: string): void {
  if (!clientId || clientId.trim() === "") {
    throw new BusinessRuleError("P-1", "A Project must be associated with exactly one Client at creation.");
  }
}

/**
 * Asserts that a project has an assigned Project Manager before leaving Draft status (Rule P-2).
 */
export function assertProjectHasPMBeforeActive(pmId?: string | null, status?: string): void {
  if (status === "ACTIVE" && (!pmId || pmId.trim() === "")) {
    throw new BusinessRuleError("P-2", "A Project must have an assigned Project Manager once it leaves Draft status.");
  }
}

/**
 * Asserts that all child services are Completed or Cancelled before project completion (Rule P-3).
 */
export function assertProjectChildServicesCompleted(
  unresolvedServices: Array<{ id: string; name: string; status: string }>
): void {
  if (unresolvedServices.length > 0) {
    const first = unresolvedServices[0]!;
    throw new BusinessRuleError(
      "P-3",
      `Project cannot be marked Completed while Service '${first.name}' is in status '${first.status}'.`,
      { id: first.id, type: "Service", name: first.name }
    );
  }
}

/**
 * Asserts that all invoices are settled before Project completion unless an Admin override is provided (Rule P-4).
 */
export function assertProjectInvoicesSettled(
  unsettledInvoices: Array<{ id: string; invoiceNumber: string; status: string }>,
  adminOverrideJustification?: string
): void {
  if (unsettledInvoices.length > 0 && (!adminOverrideJustification || adminOverrideJustification.trim() === "")) {
    const first = unsettledInvoices[0]!;
    throw new BusinessRuleError(
      "P-4",
      `Project cannot be marked Completed while Invoice '${first.invoiceNumber}' is in '${first.status}' status. Provide an Admin override with justification to complete.`,
      { id: first.id, type: "Invoice", name: first.invoiceNumber }
    );
  }
}

/**
 * Asserts that a project reopen is authorized and carries a recorded reason (Rule P-6).
 */
export function assertProjectReopenHasReason(reopenReason?: string): void {
  if (!reopenReason || reopenReason.trim() === "") {
    throw new BusinessRuleError("P-6", "Reopening a Completed or Cancelled Project requires a recorded reason.");
  }
}

/**
 * Asserts that an agreement gate is satisfied before project execution leaves Draft status (Rule AG-3).
 */
export function assertProjectHasActiveAgreement(
  isAgreementGateEnforced: boolean,
  hasActiveAgreement: boolean,
  clientName?: string
): void {
  if (isAgreementGateEnforced && !hasActiveAgreement) {
    throw new BusinessRuleError(
      "AG-3",
      `Project execution cannot commence for client '${clientName ?? "Client"}' without an active, signed client master agreement.`
    );
  }
}

