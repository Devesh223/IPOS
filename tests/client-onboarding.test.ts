import { describe, it, expect } from "vitest";
import {
  assertClientOnboardingStepAllowed,
  assertAgreementSignedBeforeClientActive,
} from "../src/domain/onboarding/client";
import { BusinessRuleError } from "../src/domain/errors";

describe("Client Onboarding State Machine & Domain Rules", () => {
  it("enforces sequential onboarding step progression", () => {
    // Valid transitions
    expect(() => assertClientOnboardingStepAllowed("INVITED", "COMPANY_PROFILE")).not.toThrow();
    expect(() => assertClientOnboardingStepAllowed("COMPANY_PROFILE", "TERMS_AGREEMENT")).not.toThrow();
    expect(() => assertClientOnboardingStepAllowed("TERMS_AGREEMENT", "CREDENTIALS")).not.toThrow();
    expect(() => assertClientOnboardingStepAllowed("CREDENTIALS", "ACTIVE")).not.toThrow();
  });

  it("Rule CO-1: blocks skipping onboarding stages", () => {
    expect(() => assertClientOnboardingStepAllowed("INVITED", "CREDENTIALS")).toThrowError(BusinessRuleError);
    expect(() => assertClientOnboardingStepAllowed("INVITED", "ACTIVE")).toThrowError(BusinessRuleError);
    expect(() => assertClientOnboardingStepAllowed("COMPANY_PROFILE", "ACTIVE")).toThrowError(BusinessRuleError);
  });

  it("Rule CO-2: prevents client activation without signed Master Agreement", () => {
    expect(() => assertAgreementSignedBeforeClientActive(false, "Mitti & Co.")).toThrowError(BusinessRuleError);
    expect(() => assertAgreementSignedBeforeClientActive(true, "Mitti & Co.")).not.toThrow();
  });
});
