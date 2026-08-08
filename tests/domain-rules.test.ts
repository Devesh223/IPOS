import { describe, it, expect } from "vitest";
import { BusinessRuleError, ConflictError } from "../src/domain/errors";
import { assertPaymentGateAllowsTaskCreation, assertPaymentHasProject, assertPaymentCannotBeDeleted } from "../src/domain/payments/rules";
import {
  assertProjectHasValidClient,
  assertProjectHasPMBeforeActive,
  assertProjectChildServicesCompleted,
  assertProjectInvoicesSettled,
  assertProjectReopenHasReason,
  assertProjectHasActiveAgreement,
} from "../src/domain/projects/rules";
import {
  assertTaskHasSingleAssignee,
  assertNoOutstandingRejectedDeliverables,
  assertTaskVerificationConfig,
} from "../src/domain/tasks/rules";
import {
  assertSubmitterIsNotApprover,
  assertGateNotAlreadyDecided,
  assertPriorStagesApproved,
} from "../src/domain/approvals/rules";

describe("Payment Gate Domain Rules (Rule PAY-3)", () => {
  it("throws BusinessRuleError PAY-3 when payment gate is enforced and unpaid milestone exists", () => {
    expect(() =>
      assertPaymentGateAllowsTaskCreation(true, true, "Primary Box Packaging Design")
    ).toThrowError(BusinessRuleError);

    try {
      assertPaymentGateAllowsTaskCreation(true, true, "Primary Box Packaging Design");
    } catch (err: any) {
      expect(err.ruleId).toBe("PAY-3");
      expect(err.message).toContain("Primary Box Packaging Design");
    }
  });

  it("allows task creation when payment gate is enforced but prior milestone is fully settled", () => {
    expect(() =>
      assertPaymentGateAllowsTaskCreation(true, false)
    ).not.toThrow();
  });

  it("allows task creation when payment gate is disabled on workspace", () => {
    expect(() =>
      assertPaymentGateAllowsTaskCreation(false, true, "Outstanding Inv")
    ).not.toThrow();
  });

  it("Rule PAY-4: asserts payment records cannot be deleted", () => {
    expect(() => assertPaymentCannotBeDeleted()).toThrowError(BusinessRuleError);
  });
});

describe("Agreement Gate Domain Rules (Rule AG-3)", () => {
  it("throws BusinessRuleError AG-3 when agreement gate is enforced and client agreement is missing", () => {
    expect(() =>
      assertProjectHasActiveAgreement(true, false, "Mitti & Co.")
    ).toThrowError(BusinessRuleError);

    try {
      assertProjectHasActiveAgreement(true, false, "Mitti & Co.");
    } catch (err: any) {
      expect(err.ruleId).toBe("AG-3");
      expect(err.message).toContain("Mitti & Co.");
    }
  });

  it("allows project execution when signed active agreement exists", () => {
    expect(() =>
      assertProjectHasActiveAgreement(true, true, "Mitti & Co.")
    ).not.toThrow();
  });
});

describe("Project Domain Rules (Rules P-1..P-6)", () => {
  it("Rule P-1: throws when client reference is missing", () => {
    expect(() => assertProjectHasValidClient("")).toThrowError(BusinessRuleError);
    expect(() => assertProjectHasValidClient("client-101")).not.toThrow();
  });

  it("Rule P-2: throws when project leaves Draft without an assigned PM", () => {
    expect(() => assertProjectHasPMBeforeActive(null, "ACTIVE")).toThrowError(BusinessRuleError);
    expect(() => assertProjectHasPMBeforeActive("user-pm-1", "ACTIVE")).not.toThrow();
    expect(() => assertProjectHasPMBeforeActive(null, "DRAFT")).not.toThrow();
  });

  it("Rule P-3: throws when child services remain uncompleted on project completion", () => {
    const uncompleted = [{ id: "srv-1", name: "3D Motion Identity", status: "IN_PROGRESS" }];
    expect(() => assertProjectChildServicesCompleted(uncompleted)).toThrowError(BusinessRuleError);
    expect(() => assertProjectChildServicesCompleted([])).not.toThrow();
  });

  it("Rule P-4: blocks project completion on unsettled invoices unless Admin override is provided", () => {
    const unsettled = [{ id: "inv-1", invoiceNumber: "INV-2026-001", status: "ISSUED" }];
    expect(() => assertProjectInvoicesSettled(unsettled)).toThrowError(BusinessRuleError);
    expect(() => assertProjectInvoicesSettled(unsettled, "Founder approved credit terms")).not.toThrow();
  });

  it("Rule P-6: requires written reason when reopening a project", () => {
    expect(() => assertProjectReopenHasReason("")).toThrowError(BusinessRuleError);
    expect(() => assertProjectReopenHasReason("Client added retainer extension")).not.toThrow();
  });
});

describe("Task & Deliverable Domain Rules (Rules T-1..T-4)", () => {
  it("Rule T-1: throws when active/in-progress task lacks an assignee", () => {
    expect(() => assertTaskHasSingleAssignee(null, "IN_PROGRESS")).toThrowError(BusinessRuleError);
    expect(() => assertTaskHasSingleAssignee("user-dev-1", "IN_PROGRESS")).not.toThrow();
    expect(() => assertTaskHasSingleAssignee(null, "BACKLOG")).not.toThrow();
  });

  it("Rule T-4: prevents task completion when deliverable is rejected", () => {
    const rejected = [{ id: "deliv-1", name: "Die-lines v1.0", status: "REJECTED" }];
    expect(() => assertNoOutstandingRejectedDeliverables(rejected)).toThrowError(BusinessRuleError);
    expect(() => assertNoOutstandingRejectedDeliverables([])).not.toThrow();
  });

  it("Rule T-2: requires verification transition before completion when verification is configured", () => {
    expect(() => assertTaskVerificationConfig(true, "COMPLETE", false)).toThrowError(BusinessRuleError);
    expect(() => assertTaskVerificationConfig(true, "COMPLETE", true)).not.toThrow();
  });
});

describe("Approval System Rules (Rules A-1..A-4)", () => {
  it("Rule A-4: separates submitter identity from approver identity", () => {
    expect(() => assertSubmitterIsNotApprover("user-designer-1", "user-designer-1")).toThrowError(BusinessRuleError);
    expect(() => assertSubmitterIsNotApprover("user-designer-1", "user-client-1")).not.toThrow();
  });

  it("Rule A-1: prevents deciding an already decided gate without formal reopen", () => {
    expect(() => assertGateNotAlreadyDecided(true, "user-client-1")).toThrowError(ConflictError);
    expect(() => assertGateNotAlreadyDecided(false)).not.toThrow();
  });

  it("Rule A-3: prevents subsequent stages from acting before prior stages are approved", () => {
    expect(() => assertPriorStagesApproved(2, false, 1)).toThrowError(BusinessRuleError);
    expect(() => assertPriorStagesApproved(2, true)).not.toThrow();
  });
});
