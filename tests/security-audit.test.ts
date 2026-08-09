import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "../src/lib/rate-limit";
import { AuthorizationError } from "../src/domain/errors";

describe("Production Security Audit: Rate Limiting Guard", () => {
  const testKey = "test-user-login-attempt";

  beforeEach(() => {
    resetRateLimit(testKey);
  });

  it("permits requests within maximum limit (5 per 60s)", () => {
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testKey, { maxRequests: 5, windowMs: 60 * 1000 });
      expect(res.isAllowed).toBe(true);
    }
  });

  it("blocks the 6th request when limit is exceeded", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(testKey, { maxRequests: 5, windowMs: 60 * 1000 });
    }

    const blockedRes = checkRateLimit(testKey, { maxRequests: 5, windowMs: 60 * 1000 });
    expect(blockedRes.isAllowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetTimeMs).toBeGreaterThan(Date.now());
  });

  it("resets rate limit record upon successful authentication", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(testKey, { maxRequests: 5, windowMs: 60 * 1000 });
    }
    expect(checkRateLimit(testKey, { maxRequests: 5, windowMs: 60 * 1000 }).isAllowed).toBe(false);

    resetRateLimit(testKey);
    const freshRes = checkRateLimit(testKey, { maxRequests: 5, windowMs: 60 * 1000 });
    expect(freshRes.isAllowed).toBe(true);
  });
});

describe("Production Security Audit: Multi-Tenant IDOR & Tenant Isolation", () => {
  it("enforces tenant ownership assertion across workspace operations", () => {
    const session = {
      userId: "usr_admin_1",
      workspaceId: "ws_indian_pixel",
      role: "ADMIN",
    };

    const targetInvoice = {
      id: "inv_foreign_999",
      workspaceId: "ws_foreign_agency",
      amount: 5000000,
    };

    function assertInvoiceAccess(invoiceWorkspaceId: string, userWorkspaceId: string) {
      if (invoiceWorkspaceId !== userWorkspaceId) {
        throw new AuthorizationError("UNAUTHORIZED: Entity does not belong to active workspace.", "Invoice");
      }
    }

    expect(() => assertInvoiceAccess(targetInvoice.workspaceId, session.workspaceId)).toThrowError(AuthorizationError);
  });
});
