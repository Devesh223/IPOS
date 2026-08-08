import { BusinessRuleError } from "../errors";

export type ClientOnboardingStep = "INVITED" | "COMPANY_PROFILE" | "TERMS_AGREEMENT" | "CREDENTIALS" | "ACTIVE";

export interface ClientOnboardingState {
  clientId: string;
  clientName: string;
  companyName?: string | null;
  email: string;
  step: ClientOnboardingStep;
  hasActiveAgreement: boolean;
}

/**
 * Validates step sequencing for client onboarding journey.
 */
export function assertClientOnboardingStepAllowed(
  currentStep: ClientOnboardingStep,
  targetStep: ClientOnboardingStep
): void {
  const stepOrder: ClientOnboardingStep[] = ["INVITED", "COMPANY_PROFILE", "TERMS_AGREEMENT", "CREDENTIALS", "ACTIVE"];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);

  if (targetIndex > currentIndex + 1) {
    throw new BusinessRuleError(
      "CO-1",
      `Cannot skip onboarding step. Current step: '${currentStep}', requested step: '${targetStep}'.`
    );
  }
}

/**
 * Validates that an agreement is e-signed before client can finalize account.
 */
export function assertAgreementSignedBeforeClientActive(hasSignedAgreement: boolean, clientName: string): void {
  if (!hasSignedAgreement) {
    throw new BusinessRuleError(
      "CO-2",
      `Client '${clientName}' must review and e-sign the client master agreement before account finalization.`
    );
  }
}
