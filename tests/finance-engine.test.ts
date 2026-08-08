import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { calculateGST } from "../src/domain/finance/tax";
import { computeInvoiceTotals } from "../src/domain/finance/calculations";
import {
  assertLineItemsValid,
  assertInvoiceCanReceivePayment,
  assertInvoiceCanBeVoided,
} from "../src/domain/finance/invoice-rules";
import {
  assertInvoiceEligibleForCreditNote,
  assertCreditNoteAmountValid,
} from "../src/domain/finance/credit-notes";
import {
  RazorpayGatewayProvider,
  StripeGatewayProvider,
} from "../src/domain/finance/gateway";
import { BusinessRuleError } from "../src/domain/errors";
import { formatCurrency } from "../src/lib/utils";

describe("GST Tax Engine: Exact Integer Paise Calculations", () => {
  it("computes intra-state GST (9% CGST + 9% SGST) for ₹1,50,000 (15,000,000 paise)", () => {
    const result = calculateGST({
      taxableAmountInPaise: 15000000,
      taxRateBasisPoints: 1800,
      isInterState: false,
    });

    expect(result.taxableAmountInPaise).toBe(15000000);
    expect(result.cgstInPaise).toBe(1350000); // ₹13,500
    expect(result.sgstInPaise).toBe(1350000); // ₹13,500
    expect(result.igstInPaise).toBe(0);
    expect(result.totalTaxInPaise).toBe(2700000); // ₹27,000
    expect(result.grandTotalInPaise).toBe(17700000); // ₹1,77,000
    expect(Number.isInteger(result.grandTotalInPaise)).toBe(true);
  });

  it("computes inter-state GST (18% IGST) for ₹1,00,000 (10,000,000 paise)", () => {
    const result = calculateGST({
      taxableAmountInPaise: 10000000,
      taxRateBasisPoints: 1800,
      isInterState: true,
    });

    expect(result.cgstInPaise).toBe(0);
    expect(result.sgstInPaise).toBe(0);
    expect(result.igstInPaise).toBe(1800000); // ₹18,000
    expect(result.totalTaxInPaise).toBe(1800000);
    expect(result.grandTotalInPaise).toBe(11800000); // ₹1,18,000
  });

  it("handles edge cases: ₹1 (100 paise), ₹999 (99,900 paise), ₹0", () => {
    // ₹1 = 100 paise
    const res1 = calculateGST({ taxableAmountInPaise: 100, isInterState: false });
    expect(res1.taxableAmountInPaise).toBe(100);
    expect(res1.grandTotalInPaise).toBe(118); // 100 + 9 + 9 = 118 paise (₹1.18)

    // ₹999 = 99900 paise
    const res999 = calculateGST({ taxableAmountInPaise: 99900, isInterState: true });
    expect(res999.totalTaxInPaise).toBe(17982); // 99900 * 0.18 = 17982 paise
    expect(res999.grandTotalInPaise).toBe(117882); // ₹1,178.82

    // ₹0
    const res0 = calculateGST({ taxableAmountInPaise: 0, isInterState: false });
    expect(res0.grandTotalInPaise).toBe(0);
    expect(res0.totalTaxInPaise).toBe(0);
  });
});

describe("Invoice Line-Item & Totals Calculation Engine", () => {
  it("authoritatively computes multi-item invoice subtotal, taxes, and grand total", () => {
    const lineItems = [
      { description: "3D Motion Graphics Package", quantity: 1, unitAmountInPaise: 10000000 }, // ₹1,00,000
      { description: "Packaging Die-line Engineering", quantity: 2, unitAmountInPaise: 2500000 }, // ₹50,000
    ];

    const result = computeInvoiceTotals(lineItems, false);

    expect(result.subtotalInPaise).toBe(15000000); // ₹1,50,000
    expect(result.taxAmountInPaise).toBe(2700000); // ₹27,000
    expect(result.grandTotalInPaise).toBe(17700000); // ₹1,77,000
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]?.totalAmountInPaise).toBe(11800000);
    expect(result.lineItems[1]?.totalAmountInPaise).toBe(5900000);
  });

  it("handles empty items gracefully", () => {
    const result = computeInvoiceTotals([]);
    expect(result.grandTotalInPaise).toBe(0);
    expect(result.subtotalInPaise).toBe(0);
  });
});

describe("Invoice Lifecycle & Validation Domain Rules", () => {
  it("assertLineItemsValid: rejects invalid items", () => {
    expect(() => assertLineItemsValid([])).toThrowError(BusinessRuleError);
    expect(() =>
      assertLineItemsValid([{ description: "", quantity: 1, unitAmountInPaise: 1000 }])
    ).toThrowError(BusinessRuleError);
    expect(() =>
      assertLineItemsValid([{ description: "Item 1", quantity: 0, unitAmountInPaise: 1000 }])
    ).toThrowError(BusinessRuleError);
    expect(() =>
      assertLineItemsValid([{ description: "Item 1", quantity: 1, unitAmountInPaise: 0 }])
    ).toThrowError(BusinessRuleError);
  });

  it("assertInvoiceCanReceivePayment: blocks VOID, overpayment, and double-settlement", () => {
    // VOID
    expect(() =>
      assertInvoiceCanReceivePayment("VOID", 0, 10000000, 5000000)
    ).toThrowError(BusinessRuleError);

    // Overpayment
    expect(() =>
      assertInvoiceCanReceivePayment("ISSUED", 8000000, 10000000, 3000000) // 80k + 30k > 100k
    ).toThrowError(BusinessRuleError);

    // Fully paid already
    expect(() =>
      assertInvoiceCanReceivePayment("PAID", 10000000, 10000000, 1000000)
    ).toThrowError(BusinessRuleError);

    // Valid partial payment
    expect(() =>
      assertInvoiceCanReceivePayment("ISSUED", 0, 10000000, 4000000)
    ).not.toThrow();
  });

  it("assertInvoiceCanBeVoided: blocks voiding when active payments exist", () => {
    expect(() => assertInvoiceCanBeVoided("VOID", 0, "Reason")).toThrowError(BusinessRuleError);
    expect(() => assertInvoiceCanBeVoided("ISSUED", 1, "Reason")).toThrowError(BusinessRuleError);
    expect(() => assertInvoiceCanBeVoided("ISSUED", 0, "")).toThrowError(BusinessRuleError);
    expect(() => assertInvoiceCanBeVoided("ISSUED", 0, "Project scope cancelled")).not.toThrow();
  });
});

describe("Credit Note Domain Rules (Rules CN-1..CN-3)", () => {
  it("Rule CN-1: blocks credit notes on DRAFT or VOID invoices", () => {
    expect(() => assertInvoiceEligibleForCreditNote("DRAFT")).toThrowError(BusinessRuleError);
    expect(() => assertInvoiceEligibleForCreditNote("VOID")).toThrowError(BusinessRuleError);
    expect(() => assertInvoiceEligibleForCreditNote("ISSUED")).not.toThrow();
    expect(() => assertInvoiceEligibleForCreditNote("PAID")).not.toThrow();
  });

  it("Rule CN-3: blocks credit notes exceeding remaining invoice value", () => {
    const invoiceTotal = 10000000; // ₹1,00,000
    const existingCredits = 4000000; // ₹40,000

    // Requesting ₹70,000 exceeds max ₹60,000
    expect(() =>
      assertCreditNoteAmountValid(invoiceTotal, existingCredits, 7000000, "Commercial discount")
    ).toThrowError(BusinessRuleError);

    // Requesting ₹50,000 is valid
    expect(() =>
      assertCreditNoteAmountValid(invoiceTotal, existingCredits, 5000000, "Commercial discount")
    ).not.toThrow();

    // Missing reason
    expect(() =>
      assertCreditNoteAmountValid(invoiceTotal, existingCredits, 2000000, "")
    ).toThrowError(BusinessRuleError);
  });
});

describe("Payment Gateway Provider Abstraction & Webhook Signatures", () => {
  it("creates Razorpay and Stripe payment orders", async () => {
    const razorpay = new RazorpayGatewayProvider("rzp_test_123", "rzp_secret_456");
    const stripe = new StripeGatewayProvider("sk_test_123");

    const rzpOrder = await razorpay.createOrder({
      invoiceId: "inv-101",
      invoiceNumber: "IP-INV-2026-0001",
      amountInPaise: 15000000,
      currency: "INR",
      description: "Initial 40% Milestone",
    });

    const stripeOrder = await stripe.createOrder({
      invoiceId: "inv-101",
      invoiceNumber: "IP-INV-2026-0001",
      amountInPaise: 15000000,
      currency: "INR",
      description: "Initial 40% Milestone",
    });

    expect(rzpOrder.provider).toBe("razorpay");
    expect(rzpOrder.amountInPaise).toBe(15000000);
    expect(rzpOrder.orderId).toContain("order_");

    expect(stripeOrder.provider).toBe("stripe");
    expect(stripeOrder.orderId).toContain("cs_test_");
  });

  it("verifies authentic HMAC-SHA256 signature and rejects forged payload", () => {
    const gateway = new RazorpayGatewayProvider("key", "secret_key_999");
    const rawPayload = JSON.stringify({ event: "payment.captured", amount: 15000000, invoiceId: "inv-1" });

    const validSig = crypto.createHmac("sha256", "secret_key_999").update(rawPayload).digest("hex");
    const invalidSig = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    expect(gateway.verifyWebhookSignature(rawPayload, validSig, "secret_key_999")).toBe(true);
    expect(gateway.verifyWebhookSignature(rawPayload, invalidSig, "secret_key_999")).toBe(false);
  });
});
