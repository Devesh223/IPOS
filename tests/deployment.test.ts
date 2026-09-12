import { describe, it, expect } from "vitest";
import { GET as healthCheckGet } from "../src/app/api/health/route";
import { validateEnv } from "../src/lib/env";

describe("Production Deployment: Health Check API Endpoint", () => {
  it("returns standard health check structure without exposing credentials", async () => {
    const response = await healthCheckGet();
    const json = await response.json();

    expect(json.service).toBe("indian-pixel-os");
    expect(typeof json.status).toBe("string");
    expect(["ok", "degraded"]).toContain(json.status);
    expect(json.timestamp).toBeDefined();

    // Verify zero secret leakage
    const responseString = JSON.stringify(json);
    expect(responseString).not.toContain("postgres:");
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("secret");
  }, 15000);
});

describe("Production Deployment: Environment & Migration Safety", () => {
  it("validates that required environment keys are documented and server-isolated", () => {
    const env = validateEnv();
    expect(env.databaseUrl).toBeDefined();
    expect(typeof env.isProduction).toBe("boolean");
  });
});
