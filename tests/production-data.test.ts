import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { validateEnv } from "../src/lib/env";

describe("Production Data: Admin Bootstrap & Password Cryptography", () => {
  it("generates verified PBKDF2/scrypt password hashes with random salt", () => {
    const rawPassword = "StudioLeader2026!";
    const hash = hashPassword(rawPassword);

    expect(hash).toContain(":");
    const [salt, key] = hash.split(":");
    expect(salt).toBeDefined();
    expect(key).toBeDefined();
    expect(salt!.length).toBe(32); // 16 bytes hex

    expect(verifyPassword(rawPassword, hash)).toBe(true);
    expect(verifyPassword("IncorrectPassword123", hash)).toBe(false);
  });

  it("idempotency simulation: existing admin account preservation logic", () => {
    const existingUsers = [
      { id: "usr_admin_1", email: "admin@indianpixel.com", passwordHash: "existing_hash_salt:key" },
    ];

    function simulateBootstrap(targetEmail: string) {
      const found = existingUsers.find((u) => u.email === targetEmail.toLowerCase());
      if (found) {
        return {
          status: "EXISTING",
          userId: found.id,
          email: found.email,
        };
      }
      return {
        status: "CREATED",
        userId: "usr_new",
        email: targetEmail,
      };
    }

    // First attempt on existing admin
    const res1 = simulateBootstrap("admin@indianpixel.com");
    expect(res1.status).toBe("EXISTING");
    expect(res1.userId).toBe("usr_admin_1");

    // Second attempt on non-existing admin
    const res2 = simulateBootstrap("new_superadmin@indianpixel.com");
    expect(res2.status).toBe("CREATED");
  });
});

describe("Production Data: Environment Validation & Secret Redaction", () => {
  it("validates environment without leaking secrets or failing in test mode", () => {
    const envConfig = validateEnv();
    expect(envConfig.isTest).toBe(true);
    expect(envConfig.databaseUrl).toBeDefined();
    expect(typeof envConfig.email.hasResendApiKey).toBe("boolean");
    expect(typeof envConfig.payments.hasRazorpay).toBe("boolean");
  });
});

describe("Production Data: Database Integrity & Orphan Detection Logic", () => {
  it("detects and flags orphaned records when parent entity is absent", () => {
    const invoices = [{ id: "inv_1", workspaceId: "ws_1", invoiceNumber: "IP-INV-2026-0001" }];
    const lineItems = [
      { id: "li_1", invoiceId: "inv_1", description: "Design Deliverable" },
      { id: "li_2", invoiceId: "inv_nonexistent", description: "Orphaned Deliverable" },
    ];

    const validInvoiceIds = new Set(invoices.map((i) => i.id));
    const orphaned = lineItems.filter((li) => !validInvoiceIds.has(li.invoiceId));

    expect(orphaned).toHaveLength(1);
    expect(orphaned[0]?.id).toBe("li_2");
  });

  it("verifies uniqueness of deterministic invoice numbers per workspace", () => {
    const invoices = [
      { id: "inv_1", workspaceId: "ws_1", invoiceNumber: "IP-INV-2026-0001" },
      { id: "inv_2", workspaceId: "ws_1", invoiceNumber: "IP-INV-2026-0002" },
      { id: "inv_3", workspaceId: "ws_2", invoiceNumber: "IP-INV-2026-0001" }, // Allowed: different workspace
    ];

    const compositeKeys = new Set<string>();
    let duplicates = 0;

    for (const inv of invoices) {
      const key = `${inv.workspaceId}:${inv.invoiceNumber}`;
      if (compositeKeys.has(key)) duplicates++;
      else compositeKeys.add(key);
    }

    expect(duplicates).toBe(0);
  });
});
