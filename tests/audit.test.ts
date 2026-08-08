import { describe, it, expect } from "vitest";
import { validateAuditLogInput } from "../src/domain/audit/service";
import { BusinessRuleError } from "../src/domain/errors";

describe("Audit Log Rules & Invariants (Rules AL-1..AL-9)", () => {
  it("Rule AL-1: throws BusinessRuleError when entityType or entityId is missing", () => {
    expect(() =>
      validateAuditLogInput({
        workspaceId: "ws-test",
        actorId: "user-test",
        entityType: "",
        entityId: "123",
        action: "test.action",
      })
    ).toThrowError(BusinessRuleError);

    expect(() =>
      validateAuditLogInput({
        workspaceId: "ws-test",
        actorId: "user-test",
        entityType: "Project",
        entityId: "",
        action: "test.action",
      })
    ).toThrowError(BusinessRuleError);
  });

  it("Rule AL-2: throws BusinessRuleError when actorId is empty or whitespace", () => {
    expect(() =>
      validateAuditLogInput({
        workspaceId: "ws-test",
        actorId: "",
        entityType: "Project",
        entityId: "proj-1",
        action: "test.action",
      })
    ).toThrowError(BusinessRuleError);

    expect(() =>
      validateAuditLogInput({
        workspaceId: "ws-test",
        actorId: "   ",
        entityType: "Project",
        entityId: "proj-1",
        action: "test.action",
      })
    ).toThrowError(BusinessRuleError);
  });

  it("passes validation when all required entity and actor metadata are provided", () => {
    expect(() =>
      validateAuditLogInput({
        workspaceId: "ws-test",
        actorId: "user-super-admin",
        actorType: "USER",
        entityType: "Milestone",
        entityId: "ms-packaging",
        action: "milestone.approved",
        priorState: "SUBMITTED_FOR_APPROVAL",
        newState: "APPROVED",
        justification: "Brand guidelines strictly met",
        amount: null,
        currency: null,
      })
    ).not.toThrow();
  });

  it("Rule AL-4: records financial values in integer paise", () => {
    const input = {
      workspaceId: "ws-test",
      actorId: "user-finance",
      actorType: "USER" as const,
      entityType: "Payment",
      entityId: "pay-101",
      action: "payment.recorded",
      amount: 15000000, // 1,50,000 INR
      currency: "INR",
    };

    expect(() => validateAuditLogInput(input)).not.toThrow();
    expect(Number.isInteger(input.amount)).toBe(true);
  });
});
