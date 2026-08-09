import crypto from "crypto";

/**
 * Structured Production Logger & Observability Layer for Indian Pixel OS.
 * Emits machine-readable JSON logs with automatic credential redaction,
 * duration metrics, and request correlation tracing.
 */

const REDACT_KEYS = [
  "password",
  "passwordHash",
  "token",
  "sessionToken",
  "keySecret",
  "secretKey",
  "secret",
  "authorization",
  "cookie",
  "apiKey",
  "resendApiKey",
  "webhookSecret",
  "stripeSecretKey",
  "razorpayKeySecret",
  "databaseUrl",
  "card",
  "cvv",
  "signature",
  "clientSecret",
];

export function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_KEYS.some((rk) => key.toLowerCase().includes(rk.toLowerCase()))) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitize(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function generateRequestId(): string {
  return `req_${crypto.randomBytes(8).toString("hex")}`;
}

export interface StructuredLogPayload {
  event?: string;
  requestId?: string;
  workspaceId?: string;
  userId?: string;
  provider?: string;
  operation?: string;
  durationMs?: number;
  [key: string]: any;
}

export const logger = {
  info(messageOrEvent: string, metadata?: StructuredLogPayload) {
    const payload = {
      level: "INFO",
      timestamp: new Date().toISOString(),
      event: metadata?.event || messageOrEvent,
      message: messageOrEvent,
      ...(metadata ? sanitize(metadata) : {}),
    };
    console.log(JSON.stringify(payload));
    return payload;
  },

  warn(messageOrEvent: string, metadata?: StructuredLogPayload) {
    const payload = {
      level: "WARN",
      timestamp: new Date().toISOString(),
      event: metadata?.event || messageOrEvent,
      message: messageOrEvent,
      ...(metadata ? sanitize(metadata) : {}),
    };
    console.warn(JSON.stringify(payload));
    return payload;
  },

  error(messageOrEvent: string, error?: any, metadata?: StructuredLogPayload) {
    const payload = {
      level: "ERROR",
      timestamp: new Date().toISOString(),
      event: metadata?.event || messageOrEvent,
      message: messageOrEvent,
      error: {
        name: error?.name || "Error",
        message: error?.message || String(error),
        stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
      },
      ...(metadata ? sanitize(metadata) : {}),
    };
    console.error(JSON.stringify(payload));
    return payload;
  },

  /**
   * Starts a performance timer for an operational event and returns a finish callback.
   */
  startTimer(event: string, initialMeta?: StructuredLogPayload) {
    const start = Date.now();
    const requestId = initialMeta?.requestId || generateRequestId();

    return {
      requestId,
      done(additionalMeta?: StructuredLogPayload) {
        const durationMs = Date.now() - start;
        return logger.info(event, {
          ...initialMeta,
          ...additionalMeta,
          requestId,
          durationMs,
        });
      },
      fail(err: any, additionalMeta?: StructuredLogPayload) {
        const durationMs = Date.now() - start;
        return logger.error(event, err, {
          ...initialMeta,
          ...additionalMeta,
          requestId,
          durationMs,
        });
      },
    };
  },
};
