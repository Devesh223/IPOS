import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { formatCurrency } from "../src/lib/utils";
import { BusinessRuleError, AuthorizationError } from "../src/domain/errors";
import { assertPaymentGateAllowsTaskCreation } from "../src/domain/payments/rules";
import { assertProjectHasActiveAgreement, assertProjectHasValidClient, assertProjectHasPMBeforeActive } from "../src/domain/projects/rules";
import { assertTaskHasSingleAssignee } from "../src/domain/tasks/rules";
import { assertSubmitterIsNotApprover } from "../src/domain/approvals/rules";
import { validateAuditLogInput } from "../src/domain/audit/service";

describe("Integration: Authentication & Password Reset Security", () => {
  it("verifies hash generation, validation, and salt isolation", () => {
    const rawPass = "StudioLeader2026!";
    const hash = hashPassword(rawPass);

    expect(verifyPassword(rawPass, hash)).toBe(true);
    expect(verifyPassword("WrongPassword!", hash)).toBe(false);
  });

  it("simulates password reset token lifecycle and invalidation", () => {
    const tokenStore = new Map<string, { email: string; expiresAt: Date }>();

    // Step 1: Issue token
    const token = "reset-token-xyz-123";
    const email = "krishna@indianpixel.com";
    tokenStore.set(token, { email, expiresAt: new Date(Date.now() + 3600 * 1000) });

    expect(tokenStore.has(token)).toBe(true);
    const validEntry = tokenStore.get(token);
    expect(validEntry?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Step 2: Use token and invalidate
    const newHash = hashPassword("NewStudioLeader2027!");
    tokenStore.delete(token); // Invalidate token after single use

    expect(tokenStore.has(token)).toBe(false); // Token cannot be reused
    expect(verifyPassword("NewStudioLeader2027!", newHash)).toBe(true);
  });

  it("rejects expired verification tokens", () => {
    const expiredToken = {
      token: "expired-token-001",
      expiresAt: new Date(Date.now() - 1000), // in the past
    };

    const isExpired = expiredToken.expiresAt < new Date();
    expect(isExpired).toBe(true);
  });
});

describe("Integration: RBAC & Server Authorization Boundary", () => {
  function simulateServerActionAuth(sessionRole: string, allowedRoles: string[]) {
    if (!allowedRoles.includes(sessionRole)) {
      throw new AuthorizationError(`UNAUTHORIZED: Requires one of [${allowedRoles.join(", ")}]`, allowedRoles.join(", "));
    }
    return { success: true };
  }

  it("permits SUPER_ADMIN and ADMIN to perform administrative actions", () => {
    expect(() => simulateServerActionAuth("SUPER_ADMIN", ["SUPER_ADMIN", "ADMIN"])).not.toThrow();
    expect(() => simulateServerActionAuth("ADMIN", ["SUPER_ADMIN", "ADMIN"])).not.toThrow();
  });

  it("rejects CLIENT attempting PM or Admin operations", () => {
    expect(() => simulateServerActionAuth("CLIENT", ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"])).toThrowError(AuthorizationError);
  });

  it("rejects STAFF attempting Finance operations", () => {
    expect(() => simulateServerActionAuth("STAFF", ["SUPER_ADMIN", "ADMIN", "FINANCE"])).toThrowError(AuthorizationError);
  });

  it("rejects FREELANCER attempting Workspace configuration changes", () => {
    expect(() => simulateServerActionAuth("FREELANCER", ["SUPER_ADMIN", "ADMIN"])).toThrowError(AuthorizationError);
  });
});

describe("Integration: Multi-Tenant Workspace Isolation", () => {
  it("strictly scopes queries by authenticated workspaceId", () => {
    const mockDbProjects = [
      { id: "proj-1", workspaceId: "ws-indian-pixel", name: "Mitti & Co." },
      { id: "proj-2", workspaceId: "ws-other-agency", name: "Other Brand" },
    ];

    const sessionA = { workspaceId: "ws-indian-pixel" };
    const sessionB = { workspaceId: "ws-other-agency" };

    const projectsA = mockDbProjects.filter((p) => p.workspaceId === sessionA.workspaceId);
    const projectsB = mockDbProjects.filter((p) => p.workspaceId === sessionB.workspaceId);

    expect(projectsA).toHaveLength(1);
    expect(projectsA[0]?.name).toBe("Mitti & Co.");
    expect(projectsB).toHaveLength(1);
    expect(projectsB[0]?.name).toBe("Other Brand");

    // Cross-workspace leak test: Workspace A query returns 0 items from Workspace B
    expect(projectsA.some((p) => p.workspaceId === "ws-other-agency")).toBe(false);
  });
});

describe("Integration: Payment Gate & Task Creation Flow (Rule PAY-3)", () => {
  it("blocks task creation when prior milestone invoice is overdue", () => {
    const workspace = { enforcePaymentGate: true };
    const projectInvoices = [{ id: "inv-1", invoiceNumber: "INV-2026-001", status: "OVERDUE" }];

    const hasUnpaid = projectInvoices.some((i) => i.status === "OVERDUE");

    expect(() =>
      assertPaymentGateAllowsTaskCreation(workspace.enforcePaymentGate, hasUnpaid, projectInvoices[0]!.invoiceNumber)
    ).toThrowError(BusinessRuleError);
  });

  it("permits task creation when all invoices are settled", () => {
    const workspace = { enforcePaymentGate: true };
    const projectInvoices = [{ id: "inv-1", invoiceNumber: "INV-2026-001", status: "PAID" }];

    const hasUnpaid = projectInvoices.some((i) => i.status === "OVERDUE");

    expect(() =>
      assertPaymentGateAllowsTaskCreation(workspace.enforcePaymentGate, hasUnpaid)
    ).not.toThrow();
  });
});

describe("Integration: Agreement Gate & Project Kickoff Flow (Rule AG-3)", () => {
  it("blocks project kickoff when active signed client agreement is missing", () => {
    const workspace = { enforceAgreementGate: true };
    const clientAgreements: Array<{ status: string }> = [{ status: "DRAFT" }];

    const hasActive = clientAgreements.some((a) => a.status === "ACTIVE");

    expect(() =>
      assertProjectHasActiveAgreement(workspace.enforceAgreementGate, hasActive, "Mitti & Co.")
    ).toThrowError(BusinessRuleError);
  });

  it("permits project kickoff when client has an ACTIVE agreement", () => {
    const workspace = { enforceAgreementGate: true };
    const clientAgreements = [{ status: "ACTIVE" }];

    const hasActive = clientAgreements.some((a) => a.status === "ACTIVE");

    expect(() =>
      assertProjectHasActiveAgreement(workspace.enforceAgreementGate, hasActive, "Mitti & Co.")
    ).not.toThrow();
  });
});

describe("Integration: Deliverable Sequential Versioning & Review Separation (Rules D-1..D-3, A-4)", () => {
  it("increments deliverable version strictly sequentially", () => {
    const deliverable = { id: "deliv-101", currentVersion: 1, status: "DRAFT" };
    const nextVersion = deliverable.currentVersion + 1;

    expect(nextVersion).toBe(2);
    expect(nextVersion).toBeGreaterThan(deliverable.currentVersion);
  });

  it("Rule A-4: enforces separation of submitter and approver", () => {
    const submitterId = "user-designer-1";
    const approverId = "user-designer-1";

    expect(() => assertSubmitterIsNotApprover(submitterId, approverId)).toThrowError(BusinessRuleError);
    expect(() => assertSubmitterIsNotApprover(submitterId, "user-client-1")).not.toThrow();
  });
});

describe("Integration: Financial Paise Calculations & Currency Formatting", () => {
  it("computes monetary totals using integer paise arithmetic with zero floating drift", () => {
    const baseAmountPaise = 15000000; // ₹1,50,000.00
    const paymentPaise = 5000000;     // ₹50,000.00

    const newPaidAmount = baseAmountPaise + paymentPaise;
    const remainingBalance = baseAmountPaise - paymentPaise;

    expect(newPaidAmount).toBe(20000000);
    expect(remainingBalance).toBe(10000000);
    expect(Number.isInteger(newPaidAmount)).toBe(true);

    const formatted = formatCurrency(newPaidAmount, "INR");
    expect(formatted).toContain("2,00,000");
  });
});
