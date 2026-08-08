import { BusinessRuleError } from "../errors";

/**
 * Asserts that an invoice is in an eligible status to receive a credit note.
 */
export function assertInvoiceEligibleForCreditNote(status: string): void {
  if (status === "VOID" || status === "DRAFT") {
    throw new BusinessRuleError(
      "CN-1",
      `Cannot issue a credit note against an invoice in status '${status}'. Invoice must be ISSUED, PARTIALLY_PAID, PAID, or OVERDUE.`
    );
  }
}

/**
 * Asserts that a credit note does not exceed the total value of the original invoice minus prior credit notes.
 */
export function assertCreditNoteAmountValid(
  invoiceTotalInPaise: number,
  existingCreditsSumInPaise: number,
  requestedAmountInPaise: number,
  reason?: string
): void {
  if (requestedAmountInPaise <= 0) {
    throw new BusinessRuleError("CN-2", "Credit note amount must be greater than zero.");
  }

  const maxAllowedCredit = invoiceTotalInPaise - existingCreditsSumInPaise;
  if (requestedAmountInPaise > maxAllowedCredit) {
    throw new BusinessRuleError(
      "CN-3",
      `Credit note amount (₹${(requestedAmountInPaise / 100).toLocaleString("en-IN")}) exceeds maximum eligible amount of ₹${(maxAllowedCredit / 100).toLocaleString("en-IN")}.`
    );
  }

  if (!reason || reason.trim() === "") {
    throw new BusinessRuleError("AL-6", "A written business reason is mandatory when issuing a credit note.");
  }
}
