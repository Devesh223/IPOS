import { BusinessRuleError } from "../errors";
import { RawLineItemInput } from "./calculations";

/**
 * Validates that an invoice contains at least one valid line item with positive quantity and price.
 */
export function assertLineItemsValid(items: RawLineItemInput[]): void {
  if (!items || items.length === 0) {
    throw new BusinessRuleError("INV-1", "An invoice must contain at least one line item.");
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (!item.description || item.description.trim() === "") {
      throw new BusinessRuleError("INV-2", `Line item #${i + 1} must have a description.`);
    }
    if (item.quantity <= 0) {
      throw new BusinessRuleError("INV-3", `Line item '${item.description}' quantity must be greater than zero.`);
    }
    if (item.unitAmountInPaise <= 0) {
      throw new BusinessRuleError("INV-4", `Line item '${item.description}' unit price must be greater than zero.`);
    }
  }
}

/**
 * Asserts that an invoice is in an eligible state to receive payment (Rules PAY-1, PAY-5).
 */
export function assertInvoiceCanReceivePayment(
  status: string,
  currentPaidAmountInPaise: number,
  totalAmountInPaise: number,
  incomingPaymentInPaise: number
): void {
  if (status === "VOID") {
    throw new BusinessRuleError("PAY-5", "Cannot record payment against a VOID invoice.");
  }
  if (status === "PAID" && currentPaidAmountInPaise >= totalAmountInPaise) {
    throw new BusinessRuleError("PAY-5", "This invoice is already fully paid.");
  }
  if (incomingPaymentInPaise <= 0) {
    throw new BusinessRuleError("PAY-1", "Payment amount must be greater than zero.");
  }
  if (currentPaidAmountInPaise + incomingPaymentInPaise > totalAmountInPaise) {
    const remaining = totalAmountInPaise - currentPaidAmountInPaise;
    throw new BusinessRuleError(
      "PAY-5",
      `Payment amount (₹${(incomingPaymentInPaise / 100).toLocaleString("en-IN")}) exceeds remaining balance of ₹${(remaining / 100).toLocaleString("en-IN")}.`
    );
  }
}

/**
 * Asserts that an invoice can be safely voided (Rule AL-6).
 */
export function assertInvoiceCanBeVoided(status: string, activePaymentsCount: number, voidReason?: string): void {
  if (status === "VOID") {
    throw new BusinessRuleError("INV-5", "Invoice is already voided.");
  }
  if (activePaymentsCount > 0) {
    throw new BusinessRuleError(
      "INV-6",
      "Cannot void an invoice with active, non-refunded payments. Issue a full refund first."
    );
  }
  if (!voidReason || voidReason.trim() === "") {
    throw new BusinessRuleError("AL-6", "A written justification is mandatory when voiding an invoice.");
  }
}
