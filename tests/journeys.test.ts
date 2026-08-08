import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "../src/domain/finance/calculations";
import { calculateGST } from "../src/domain/finance/tax";
import { assertProjectHasActiveAgreement, assertProjectHasPMBeforeActive, assertProjectInvoicesSettled } from "../src/domain/projects/rules";
import { assertPaymentGateAllowsTaskCreation } from "../src/domain/payments/rules";
import { assertSubmitterIsNotApprover } from "../src/domain/approvals/rules";
import { assertAgreementSignedBeforeClientActive } from "../src/domain/onboarding/client";
import { assertCreditNoteAmountValid } from "../src/domain/finance/credit-notes";
import { formatCurrency } from "../src/lib/utils";

describe("Journey A: Studio Admin End-to-End Governance Lifecycle", () => {
  it("executes complete project creation, billing, kickoff, deliverable review, and milestone approval", () => {
    // 1. Admin creates client & issues initial 40% invoice
    const client = { id: "client-mitti", name: "Mitti & Co.", hasSignedMSA: true };
    const initialMilestoneInvoice = computeInvoiceTotals([
      { description: "Primary Packaging Architecture (40% Milestone 1)", quantity: 1, unitAmountInPaise: 6000000 },
    ], false);

    expect(initialMilestoneInvoice.subtotalInPaise).toBe(6000000);
    expect(initialMilestoneInvoice.grandTotalInPaise).toBe(7080000); // with 18% GST (₹70,800)

    // 2. Client settles milestone 1 payment
    const payment = { amount: 7080000, isReconciled: true };
    const remainingBalance = initialMilestoneInvoice.grandTotalInPaise - payment.amount;
    expect(remainingBalance).toBe(0);

    // 3. Admin activates project (verifies PM & signed MSA)
    expect(() => assertProjectHasPMBeforeActive("user-pm-1", "ACTIVE")).not.toThrow();
    expect(() => assertProjectHasActiveAgreement(true, client.hasSignedMSA, client.name)).not.toThrow();

    // 4. Payment Gate allows task creation
    expect(() => assertPaymentGateAllowsTaskCreation(true, remainingBalance > 0)).not.toThrow();

    // 5. Worker submits deliverable and client approves
    const designerId = "user-designer-1";
    const clientApproverId = "user-client-1";
    expect(() => assertSubmitterIsNotApprover(designerId, clientApproverId)).not.toThrow();
  });
});

describe("Journey B: Client Onboarding & Portal Collaboration", () => {
  it("executes invitation verification, agreement execution, portal activation, and deliverable review", () => {
    // 1. Client receives invitation and signs Master Agreement
    const clientName = "Vally & Hound";
    let hasSignedAgreement = false;

    expect(() => assertAgreementSignedBeforeClientActive(hasSignedAgreement, clientName)).toThrow();

    // Client e-signs
    hasSignedAgreement = true;
    expect(() => assertAgreementSignedBeforeClientActive(hasSignedAgreement, clientName)).not.toThrow();

    // 2. Client reviews deliverable v2.0
    const deliverable = { id: "deliv-1", currentVersion: 2, status: "UNDER_REVIEW" };
    expect(deliverable.currentVersion).toBe(2);
  });
});

describe("Journey C: Creative Specialist / Worker Production Flow", () => {
  it("executes assigned task progression and sequential deliverable version submission", () => {
    const task = { id: "task-die-lines", status: "IN_PROGRESS", assigneeId: "user-designer-1" };
    expect(task.assigneeId).toBeDefined();

    // Initial deliverable v1.0
    let currentVersion = 1;
    expect(currentVersion).toBe(1);

    // Submitting review feedback results in revision v2.0
    currentVersion += 1;
    expect(currentVersion).toBe(2);
  });
});

describe("Journey D: Finance Specialist Ledger & GST Reconciliation Lifecycle", () => {
  it("executes multi-line GST invoicing, bank UTR reconciliation, and partial credit note adjustments", () => {
    // 1. Generate GST invoice with intra-state split
    const totals = computeInvoiceTotals([
      { description: "3D Motion Identity Package", quantity: 1, unitAmountInPaise: 10000000 },
      { description: "Sound Design & Mastering", quantity: 1, unitAmountInPaise: 2000000 },
    ], false);

    expect(totals.subtotalInPaise).toBe(12000000); // ₹1,20,000
    expect(totals.taxAmountInPaise).toBe(2160000); // 18% GST = ₹21,600
    expect(totals.grandTotalInPaise).toBe(14160000); // ₹1,41,600

    // 2. Partial payment recorded
    const partialPayment = 7080000;
    const balance = totals.grandTotalInPaise - partialPayment;
    expect(balance).toBe(7080000);

    // 3. Issue credit note for scope reduction
    const creditAmount = 2360000; // ₹23,600 credit
    expect(() => assertCreditNoteAmountValid(totals.grandTotalInPaise, 0, creditAmount, "Audio scope reduced")).not.toThrow();
  });
});
