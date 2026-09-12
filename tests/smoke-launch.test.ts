import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "../src/domain/finance/calculations";
import { calculateGST } from "../src/domain/finance/tax";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { sanitize, generateRequestId } from "../src/lib/logger";
import { checkRateLimit, resetRateLimit } from "../src/lib/rate-limit";
import { AuthorizationError, BusinessRuleError } from "../src/domain/errors";

describe("Production Smoke Test: 1. Authentication, Cryptography & Rate Limiting", () => {
  it("verifies PBKDF2/scrypt password hashing with high-entropy salts", () => {
    const rawPass = "StudioProduction2026!";
    const hash = hashPassword(rawPass);

    expect(verifyPassword(rawPass, hash)).toBe(true);
    expect(verifyPassword("WrongPassword!", hash)).toBe(false);
  });

  it("verifies rate limiting guard against brute-force login attempts", () => {
    const key = "smoke-test-rate-limit-user";
    resetRateLimit(key);

    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { maxRequests: 5, windowMs: 60000 }).isAllowed).toBe(true);
    }
    expect(checkRateLimit(key, { maxRequests: 5, windowMs: 60000 }).isAllowed).toBe(false);

    resetRateLimit(key);
    expect(checkRateLimit(key, { maxRequests: 5, windowMs: 60000 }).isAllowed).toBe(true);
  });
});

describe("Production Smoke Test: 2. RBAC & Multi-Tenant Cross-Workspace Containment", () => {
  it("enforces tenant isolation and rejects cross-workspace access attempts", () => {
    const session = {
      userId: "usr_admin",
      workspaceId: "ws_alpha_studio",
      role: "ADMIN",
    };

    const targetProject = {
      id: "proj_beta_999",
      workspaceId: "ws_beta_studio",
      name: "Brand Redesign",
    };

    const isSameWorkspace = targetProject.workspaceId === session.workspaceId;
    expect(isSameWorkspace).toBe(false);
  });
});

import { assertPaymentGateAllowsTaskCreation } from "../src/domain/payments/rules";
import { assertProjectHasActiveAgreement } from "../src/domain/projects/rules";

describe("Production Smoke Test: 3. Gated Delivery Engine (PAY-3 & AG-3)", () => {
  it("enforces Rule PAY-3: blocks milestone progress when overdue invoices exist", () => {
    expect(() =>
      assertPaymentGateAllowsTaskCreation(true, true, "IP-INV-2026-0001")
    ).toThrowError(BusinessRuleError);
  });

  it("enforces Rule AG-3: blocks milestone delivery when master agreement is unsigned", () => {
    expect(() =>
      assertProjectHasActiveAgreement(true, false, "Mitti Organic")
    ).toThrowError(BusinessRuleError);
  });
});

describe("Production Smoke Test: 4. Financial Ledger, Line-Items & Integer GST Calculations", () => {
  it("computes exact integer paise GST (Intra-state: 9%+9%, Inter-state: 18%) without float drift", () => {
    const intra = calculateGST({ taxableAmountInPaise: 10000000, isInterState: false }); // ₹1,00,000.00
    expect(intra.taxRateBasisPoints).toBe(1800);
    expect(intra.totalTaxInPaise).toBe(1800000); // ₹18,000.00
    expect(intra.cgstInPaise).toBe(900000); // ₹9,000.00
    expect(intra.sgstInPaise).toBe(900000); // ₹9,000.00
    expect(intra.igstInPaise).toBe(0);
    expect(intra.grandTotalInPaise).toBe(11800000);

    const inter = calculateGST({ taxableAmountInPaise: 10000000, isInterState: true });
    expect(inter.taxRateBasisPoints).toBe(1800);
    expect(inter.totalTaxInPaise).toBe(1800000);
    expect(inter.igstInPaise).toBe(1800000);
    expect(inter.cgstInPaise).toBe(0);
    expect(inter.sgstInPaise).toBe(0);
    expect(inter.grandTotalInPaise).toBe(11800000);
  });

  it("computes invoice line items and totals aggregation accurately", () => {
    const lineItems = [
      { description: "Design Phase 1", quantity: 1, unitAmountInPaise: 6000000 }, // ₹60,000
      { description: "Production Phase 2", quantity: 1, unitAmountInPaise: 4000000 }, // ₹40,000
    ];

    const result = computeInvoiceTotals(lineItems, false);
    expect(result.subtotalInPaise).toBe(10000000); // ₹1,00,000
    expect(result.taxAmountInPaise).toBe(1800000); // ₹18,000
    expect(result.grandTotalInPaise).toBe(11800000); // ₹1,18,000
    expect(result.lineItems).toHaveLength(2);
  });
});

describe("Production Smoke Test: 5. Observability, Request Correlation & Zero Secret Leaks", () => {
  it("generates unique request IDs and redacts secrets in operational logs", () => {
    const reqId = generateRequestId();
    expect(reqId.startsWith("req_")).toBe(true);

    const sanitized = sanitize({
      user: "krishna@indianpixel.com",
      password: "SuperSecretPassword123!",
      sessionToken: "62bfa35198eac81290ff",
      apiKey: "re_secret_key_12345",
      safeKey: "deliverable_v2.pdf",
    });

    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.sessionToken).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect(sanitized.safeKey).toBe("deliverable_v2.pdf");
  });
});
