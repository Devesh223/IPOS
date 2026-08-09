import { prisma } from "../src/lib/prisma";

export interface IntegrityCheckResult {
  passed: boolean;
  timestamp: string;
  checks: Array<{
    name: string;
    status: "PASS" | "FAIL" | "WARN";
    details: string;
  }>;
}

/**
 * Read-only diagnostic verification of database consistency, tenant invariants, and constraint integrity.
 */
export async function runDatabaseIntegrityCheck(): Promise<IntegrityCheckResult> {
  const checks: IntegrityCheckResult["checks"] = [];
  let allPassed = true;

  try {
    // 1. Workspace Record Existence Check
    const workspaceCount = await prisma.workspace.count();
    if (workspaceCount > 0) {
      checks.push({
        name: "Workspace Records",
        status: "PASS",
        details: `Found ${workspaceCount} registered workspace(s).`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Workspace Records",
        status: "FAIL",
        details: "Zero workspaces found. Run bootstrap:admin to initialize.",
      });
    }

    // 2. Super Administrator Existence Check
    const superAdminCount = await prisma.workspaceMember.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount > 0) {
      checks.push({
        name: "Root Super Admin",
        status: "PASS",
        details: `Found ${superAdminCount} Super Admin membership(s).`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Root Super Admin",
        status: "FAIL",
        details: "No active Super Admin membership found.",
      });
    }

    // 3. Invoice Number Uniqueness per Workspace
    const invoices = await prisma.invoice.findMany({
      select: { id: true, workspaceId: true, invoiceNumber: true },
    });
    const invoiceKeys = new Set<string>();
    let duplicateInvoices = 0;
    for (const inv of invoices) {
      const key = `${inv.workspaceId}:${inv.invoiceNumber}`;
      if (invoiceKeys.has(key)) duplicateInvoices++;
      else invoiceKeys.add(key);
    }
    if (duplicateInvoices === 0) {
      checks.push({
        name: "Invoice Uniqueness",
        status: "PASS",
        details: `All ${invoices.length} invoices have unique deterministic numbers.`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Invoice Uniqueness",
        status: "FAIL",
        details: `Found ${duplicateInvoices} duplicate invoice numbers.`,
      });
    }

    // 4. Credit Note Number Uniqueness per Workspace
    const creditNotes = await prisma.creditNote.findMany({
      select: { id: true, workspaceId: true, creditNoteNumber: true },
    });
    const cnKeys = new Set<string>();
    let duplicateCNs = 0;
    for (const cn of creditNotes) {
      const key = `${cn.workspaceId}:${cn.creditNoteNumber}`;
      if (cnKeys.has(key)) duplicateCNs++;
      else cnKeys.add(key);
    }
    if (duplicateCNs === 0) {
      checks.push({
        name: "Credit Note Uniqueness",
        status: "PASS",
        details: `All ${creditNotes.length} credit notes have unique numbers.`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Credit Note Uniqueness",
        status: "FAIL",
        details: `Found ${duplicateCNs} duplicate credit note numbers.`,
      });
    }

    // 5. Deliverable Versioning Sequence Integrity
    const versions = await prisma.deliverableVersion.findMany({
      select: { id: true, deliverableId: true, versionNumber: true },
    });
    const versionKeys = new Set<string>();
    let duplicateVersions = 0;
    for (const v of versions) {
      const key = `${v.deliverableId}:${v.versionNumber}`;
      if (versionKeys.has(key)) duplicateVersions++;
      else versionKeys.add(key);
    }
    if (duplicateVersions === 0) {
      checks.push({
        name: "Deliverable Versioning",
        status: "PASS",
        details: `All ${versions.length} deliverable versions maintain strict sequence uniqueness.`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Deliverable Versioning",
        status: "FAIL",
        details: `Found ${duplicateVersions} duplicate deliverable version numbers.`,
      });
    }

    // 6. Webhook Idempotency Event Integrity
    const webhookEvents = await prisma.paymentWebhookEvent.findMany({
      select: { id: true, provider: true, eventId: true },
    });
    const webhookKeys = new Set<string>();
    let duplicateWebhooks = 0;
    for (const wh of webhookEvents) {
      const key = `${wh.provider}:${wh.eventId}`;
      if (webhookKeys.has(key)) duplicateWebhooks++;
      else webhookKeys.add(key);
    }
    if (duplicateWebhooks === 0) {
      checks.push({
        name: "Webhook Event Idempotency",
        status: "PASS",
        details: `All ${webhookEvents.length} webhook events are distinct and idempotent.`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Webhook Event Idempotency",
        status: "FAIL",
        details: `Found ${duplicateWebhooks} duplicate webhook event records.`,
      });
    }

    // 7. Line Item Orphan Check
    const allInvoiceIds = new Set(invoices.map((i) => i.id));
    const lineItems = await prisma.invoiceLineItem.findMany({
      select: { id: true, invoiceId: true },
    });
    const orphanedLineItems = lineItems.filter((li) => !allInvoiceIds.has(li.invoiceId));

    if (orphanedLineItems.length === 0) {
      checks.push({
        name: "Invoice Line Item Integrity",
        status: "PASS",
        details: `All ${lineItems.length} invoice line items are mapped to valid invoices.`,
      });
    } else {
      allPassed = false;
      checks.push({
        name: "Invoice Line Item Integrity",
        status: "FAIL",
        details: `Found ${orphanedLineItems.length} orphaned invoice line items.`,
      });
    }
  } catch (err: any) {
    allPassed = false;
    checks.push({
      name: "Database Diagnostic Execution",
      status: "FAIL",
      details: err.message || "Failed to execute database integrity queries.",
    });
  }

  return {
    passed: allPassed,
    timestamp: new Date().toISOString(),
    checks,
  };
}

// CLI direct execution entrypoint
if (require.main === module) {
  runDatabaseIntegrityCheck()
    .then((result) => {
      console.log("\n========================================================");
      console.log(`INDIAN PIXEL OS — DATABASE INTEGRITY REPORT [${result.passed ? "PASS" : "FAIL"}]`);
      console.log(`Timestamp: ${result.timestamp}`);
      console.log("========================================================");
      for (const c of result.checks) {
        const symbol = c.status === "PASS" ? "✔" : "✖";
        console.log(`[${c.status}] ${symbol} ${c.name}: ${c.details}`);
      }
      console.log("========================================================\n");
      process.exit(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error("[INTEGRITY_CHECK_FATAL_ERROR]", err.message);
      process.exit(1);
    });
}
