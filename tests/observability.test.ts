import { describe, it, expect, vi } from "vitest";
import { logger, sanitize, generateRequestId } from "../src/lib/logger";

describe("Production Observability: Structured JSON Logger & Redaction", () => {
  it("formats structured JSON logs with standard level, timestamp, and event fields", () => {
    const payload = logger.info("test.operational_event", {
      workspaceId: "ws_101",
      userId: "usr_202",
      provider: "razorpay",
    });

    expect(payload.level).toBe("INFO");
    expect(payload.timestamp).toBeDefined();
    expect(payload.event).toBe("test.operational_event");
    expect(payload.workspaceId).toBe("ws_101");
    expect(payload.userId).toBe("usr_202");
    expect(payload.provider).toBe("razorpay");
  });

  it("redacts sensitive credential keys in nested objects and arrays", () => {
    const rawPayload = {
      username: "designer@indianpixel.com",
      password: "SuperSecretPassword123!",
      sessionToken: "62bfa35198eac81290ff",
      stripeSecretKey: "sk_live_998811223344",
      webhookSecret: "whsec_abcdef123456",
      cookie: "ip_session_token=secret_val",
      meta: {
        apiKey: "re_secret_key_here",
        card: "4111222233334444",
        cvv: "123",
        safeNote: "Milestone deliverable approved",
      },
      list: [
        { token: "sub_token_secret", id: "item_1" },
        { safeId: "item_2" },
      ],
    };

    const sanitized = sanitize(rawPayload);

    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.sessionToken).toBe("[REDACTED]");
    expect(sanitized.stripeSecretKey).toBe("[REDACTED]");
    expect(sanitized.webhookSecret).toBe("[REDACTED]");
    expect(sanitized.cookie).toBe("[REDACTED]");
    expect(sanitized.meta.apiKey).toBe("[REDACTED]");
    expect(sanitized.meta.card).toBe("[REDACTED]");
    expect(sanitized.meta.cvv).toBe("[REDACTED]");
    expect(sanitized.meta.safeNote).toBe("Milestone deliverable approved");
    expect(sanitized.list[0].token).toBe("[REDACTED]");
    expect(sanitized.list[0].id).toBe("item_1");
  });

  it("generates random request IDs with prefix req_", () => {
    const reqId1 = generateRequestId();
    const reqId2 = generateRequestId();

    expect(reqId1.startsWith("req_")).toBe(true);
    expect(reqId2.startsWith("req_")).toBe(true);
    expect(reqId1).not.toBe(reqId2);
  });

  it("tracks operational duration via startTimer", async () => {
    const timer = logger.startTimer("invoice.computation");
    expect(timer.requestId.startsWith("req_")).toBe(true);

    await new Promise((r) => setTimeout(r, 20));

    const logged = timer.done({ invoiceNumber: "IP-INV-2026-0001" });
    expect(logged.durationMs).toBeGreaterThanOrEqual(15);
    expect(logged.invoiceNumber).toBe("IP-INV-2026-0001");
  });

  it("formats error exceptions cleanly without leaking raw connection strings", () => {
    const sampleError = new Error("Database query timeout on table invoices");
    const payload = logger.error("database.error", sampleError, {
      workspaceId: "ws_indian_pixel",
      operation: "findMany",
    });

    expect(payload.level).toBe("ERROR");
    expect(payload.error.name).toBe("Error");
    expect(payload.error.message).toBe("Database query timeout on table invoices");
    expect(payload.workspaceId).toBe("ws_indian_pixel");
  });
});
