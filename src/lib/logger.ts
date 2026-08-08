/**
 * Structured Logger for Indian Pixel OS.
 * Automatically sanitizes and redacts sensitive credentials, session tokens, and secrets.
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
];

function sanitize(obj: any): any {
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

export const logger = {
  info(message: string, context?: Record<string, any>) {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: new Date().toISOString(),
        message,
        ...(context ? { context: sanitize(context) } : {}),
      })
    );
  },

  warn(message: string, context?: Record<string, any>) {
    console.warn(
      JSON.stringify({
        level: "WARN",
        timestamp: new Date().toISOString(),
        message,
        ...(context ? { context: sanitize(context) } : {}),
      })
    );
  },

  error(message: string, error?: any, context?: Record<string, any>) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message,
        error: error?.message || String(error),
        stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
        ...(context ? { context: sanitize(context) } : {}),
      })
    );
  },
};
