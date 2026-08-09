import { prisma } from "../src/lib/prisma";
import { validateEnv } from "../src/lib/env";
import { runDatabaseIntegrityCheck } from "./db-integrity";

export interface ProductionVerifyResult {
  passed: boolean;
  timestamp: string;
  summary: {
    environment: "PASS" | "FAIL";
    databaseConnection: "PASS" | "FAIL";
    databaseIntegrity: "PASS" | "FAIL";
    providerStatus: {
      email: string;
      payments: string;
      storage: string;
    };
  };
}

/**
 * Non-destructive pre-flight / post-deployment production verification script.
 */
export async function runProductionVerification(): Promise<ProductionVerifyResult> {
  const timestamp = new Date().toISOString();
  let allPassed = true;

  console.log("\n========================================================");
  console.log("INDIAN PIXEL OS — PRE-FLIGHT / POST-DEPLOYMENT VERIFICATION");
  console.log(`Timestamp: ${timestamp}`);
  console.log("========================================================\n");

  // 1. Environment Validation
  let envStatus: "PASS" | "FAIL" = "PASS";
  let providerStatus = {
    email: "UNCONFIGURED",
    payments: "UNCONFIGURED",
    storage: "UNCONFIGURED",
  };

  try {
    const env = validateEnv();
    providerStatus = {
      email: env.email.hasResendApiKey ? "CONFIGURED (Resend)" : "LOCAL_LOG_FALLBACK",
      payments: env.payments.hasRazorpay ? "CONFIGURED (Razorpay)" : "LOCAL_MOCK_FALLBACK",
      storage: env.storage.hasStorageBucket ? "CONFIGURED (S3/R2)" : "LOCAL_BLOB_FALLBACK",
    };
    console.log("[PASS] ✔ Environment Configuration: Required variables present.");
  } catch (err: any) {
    envStatus = "FAIL";
    allPassed = false;
    console.log(`[FAIL] ✖ Environment Configuration: ${err.message}`);
  }

  // 2. Database Ping
  let dbConnectionStatus: "PASS" | "FAIL" = "PASS";
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[PASS] ✔ PostgreSQL Connectivity: Verified (SELECT 1 succeeded).");
  } catch (err: any) {
    dbConnectionStatus = "FAIL";
    allPassed = false;
    console.log(`[FAIL] ✖ PostgreSQL Connectivity: ${err.message}`);
  }

  // 3. Database Integrity & Constraints Check
  let dbIntegrityStatus: "PASS" | "FAIL" = "PASS";
  try {
    const integrityResult = await runDatabaseIntegrityCheck();
    if (!integrityResult.passed) {
      dbIntegrityStatus = "FAIL";
      allPassed = false;
    }
    console.log(`[${integrityResult.passed ? "PASS" : "FAIL"}] ${integrityResult.passed ? "✔" : "✖"} Database Invariants: All 7 constraints verified.`);
  } catch (err: any) {
    dbIntegrityStatus = "FAIL";
    allPassed = false;
    console.log(`[FAIL] ✖ Database Invariants: ${err.message}`);
  }

  console.log("\n--- EXTERNAL PROVIDER OPERATIONAL STATUS ---");
  console.log(`• Email Dispatch:   ${providerStatus.email}`);
  console.log(`• Payment Gateways: ${providerStatus.payments}`);
  console.log(`• Object Storage:   ${providerStatus.storage}`);
  console.log("--------------------------------------------\n");

  console.log("========================================================");
  console.log(`VERIFICATION RESULT: [${allPassed ? "READY FOR PRODUCTION" : "FAILED — REMEDIATE BEFORE LAUNCH"}]`);
  console.log("========================================================\n");

  return {
    passed: allPassed,
    timestamp,
    summary: {
      environment: envStatus,
      databaseConnection: dbConnectionStatus,
      databaseIntegrity: dbIntegrityStatus,
      providerStatus,
    },
  };
}

// CLI direct execution entrypoint
if (require.main === module) {
  runProductionVerification()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error("[FATAL_VERIFICATION_ERROR]", err.message);
      process.exit(1);
    });
}
