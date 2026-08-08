import { describe, it, expect } from "vitest";
import {
  assertClientOnboardingStepAllowed,
  assertAgreementSignedBeforeClientActive,
} from "../src/domain/onboarding/client";
import { assertProjectHasActiveAgreement } from "../src/domain/projects/rules";
import { assertSubmitterIsNotApprover, assertGateNotAlreadyDecided } from "../src/domain/approvals/rules";
import { BusinessRuleError, ConflictError } from "../src/domain/errors";

describe("Client Lifecycle & Master Agreement Governance (Rule AG-3)", () => {
  it("Step 1: Onboarding starts in INVITED state and enforces step sequence", () => {
    expect(() => assertClientOnboardingStepAllowed("INVITED", "COMPANY_PROFILE")).not.toThrow();
    expect(() => assertClientOnboardingStepAllowed("INVITED", "ACTIVE")).toThrowError(BusinessRuleError);
  });

  it("Step 2 & 3: Blocks client account finalization until Master Agreement is signed", () => {
    // Unsigned agreement attempt
    expect(() =>
      assertAgreementSignedBeforeClientActive(false, "Mitti & Co.")
    ).toThrowError(BusinessRuleError);

    // Signed agreement success
    expect(() =>
      assertAgreementSignedBeforeClientActive(true, "Mitti & Co.")
    ).not.toThrow();
  });

  it("Step 4: Rule AG-3 blocks project activation when client lacks ACTIVE signed agreement", () => {
    const isEnforced = true;
    const hasActiveAgreement = false;

    expect(() =>
      assertProjectHasActiveAgreement(isEnforced, hasActiveAgreement, "Mitti & Co.")
    ).toThrowError(BusinessRuleError);

    // Passes when client signed agreement
    expect(() =>
      assertProjectHasActiveAgreement(isEnforced, true, "Mitti & Co.")
    ).not.toThrow();
  });

  it("Step 5: Client can approve milestones while submitter self-approval is rejected (Rule A-4)", () => {
    const internalDesignerId = "user-designer-1";
    const clientApproverId = "user-client-1";

    // Submitter cannot approve their own milestone
    expect(() =>
      assertSubmitterIsNotApprover(internalDesignerId, internalDesignerId)
    ).toThrowError(BusinessRuleError);

    // Client can approve the milestone
    expect(() =>
      assertSubmitterIsNotApprover(internalDesignerId, clientApproverId)
    ).not.toThrow();
  });

  it("Step 6: Prevents re-deciding an already approved milestone gate without formal reopen (Rule A-1)", () => {
    const isAlreadyDecided = true;
    expect(() =>
      assertGateNotAlreadyDecided(isAlreadyDecided, "user-client-1")
    ).toThrowError(ConflictError);

    expect(() =>
      assertGateNotAlreadyDecided(false)
    ).not.toThrow();
  });
});
