import { describe, it, expect } from "vitest";
import { validateEnv } from "../src/lib/env";
import { hashPassword, verifyPassword } from "../src/lib/password";
import nextConfig from "../next.config.mjs";

describe("Production Infrastructure: Environment & Security Headers", () => {
  it("validates environment configuration cleanly without throwing in test mode", () => {
    const config = validateEnv();
    expect(config.isTest).toBe(true);
    expect(config.databaseUrl).toBeDefined();
    expect(config.appUrl).toBeDefined();
  });

  it("exports strict enterprise HTTP security headers in next.config.mjs", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.reactStrictMode).toBe(true);

    if (typeof nextConfig.headers === "function") {
      const headerRules = await nextConfig.headers();
      expect(headerRules).toHaveLength(1);

      const headers = headerRules[0]?.headers || [];
      const headerMap = new Map(headers.map((h: { key: string; value: string }) => [h.key, h.value]));

      expect(headerMap.get("X-Frame-Options")).toBe("DENY");
      expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(headerMap.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(headerMap.get("Permissions-Policy")).toContain("camera=()");
    }
  });
});

describe("Production Infrastructure: Password Cryptography & Salt Randomness", () => {
  it("generates distinct cryptographically random salts for identical passwords", () => {
    const password = "StudioSecurePassword2026!";

    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    // Hashes must be completely distinct because salts are random
    expect(hash1).not.toBe(hash2);

    const [salt1, key1] = hash1.split(":");
    const [salt2, key2] = hash2.split(":");

    expect(salt1).not.toBe(salt2);
    expect(key1).not.toBe(key2);

    // Both distinct hashes must verify correctly against the same password
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);

    // Wrong password must fail
    expect(verifyPassword("WrongPassword123", hash1)).toBe(false);
  });
});
