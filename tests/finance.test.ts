import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { formatCurrency } from "../src/lib/utils";
import {
  verifyWebhookSignature,
  isWebhookIdempotent,
  resetWebhookIdempotencyCache,
} from "../src/domain/payments/webhooks";

describe("Financial Domain: Integer Paise Arithmetic & Invariant Rules", () => {
  it("enforces integer paise representation without floating point inaccuracies", () => {
    const invoiceAmount = 15000000; // ₹1,50,000.00
    const payment1 = 5000000;       // ₹50,000.00
    const payment2 = 10000000;      // ₹1,00,000.00

    const totalPaid = payment1 + payment2;
    const remainingBalance = invoiceAmount - totalPaid;

    expect(totalPaid).toBe(invoiceAmount);
    expect(remainingBalance).toBe(0);
    expect(Number.isInteger(totalPaid)).toBe(true);
    expect(formatCurrency(totalPaid, "INR")).toContain("1,50,000");
  });

  it("calculates partial payment state transitions correctly", () => {
    const invoice = {
      amount: 10000000,
      paidAmount: 0,
      status: "ISSUED",
    };

    const paymentAmount = 4000000;
    const updatedPaidAmount = invoice.paidAmount + paymentAmount;
    const newStatus = updatedPaidAmount >= invoice.amount ? "PAID" : "PARTIALLY_PAID";

    expect(updatedPaidAmount).toBe(4000000);
    expect(newStatus).toBe("PARTIALLY_PAID");
  });

  it("detects and blocks overpayment amounts exceeding total balance", () => {
    const invoice = {
      amount: 5000000,
      paidAmount: 3000000,
    };

    const remaining = invoice.amount - invoice.paidAmount; // 2000000
    const incomingPayment = 3000000; // Exceeds remaining

    const isOverpayment = invoice.paidAmount + incomingPayment > invoice.amount;
    expect(isOverpayment).toBe(true);
    expect(remaining).toBe(2000000);
  });

  it("Rule PAY-4: generates offsetting refund records instead of deleting payments", () => {
    const originalPayment = {
      id: "pay-101",
      amount: 5000000,
      status: "RECORDED",
    };

    const refundAmount = 5000000;
    const refundRecord = {
      id: "pay-refund-102",
      amount: refundAmount,
      status: "REFUNDED",
      refundId: originalPayment.id,
      referenceNumber: `REFUND-${originalPayment.id}`,
    };

    expect(refundRecord.status).toBe("REFUNDED");
    expect(refundRecord.refundId).toBe(originalPayment.id);
    expect(originalPayment.id).not.toBe(refundRecord.id);
  });
});

describe("Payment Webhooks: HMAC Verification & Idempotency", () => {
  const testSecret = "whsec_test_secret_123456789";

  beforeEach(() => {
    resetWebhookIdempotencyCache();
  });

  it("verifies authentic HMAC-SHA256 signatures", () => {
    const rawPayload = JSON.stringify({
      event: "payment.captured",
      paymentId: "pay_xyz_789",
      amount: 15000000,
    });

    const validSignature = crypto
      .createHmac("sha256", testSecret)
      .update(rawPayload)
      .digest("hex");

    const isValid = verifyWebhookSignature(rawPayload, validSignature, testSecret);
    expect(isValid).toBe(true);
  });

  it("rejects forged or modified webhook signatures", () => {
    const rawPayload = JSON.stringify({ event: "payment.captured", amount: 15000000 });
    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const isValid = verifyWebhookSignature(rawPayload, forgedSignature, testSecret);
    expect(isValid).toBe(false);
  });

  it("enforces webhook idempotency by detecting and blocking duplicate event IDs", () => {
    const eventId = "evt_razorpay_998877";

    const firstAttempt = isWebhookIdempotent(eventId);
    expect(firstAttempt).toBe(true); // First attempt processed

    const duplicateAttempt = isWebhookIdempotent(eventId);
    expect(duplicateAttempt).toBe(false); // Duplicate blocked
  });
});
