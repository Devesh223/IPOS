import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "../src/domain/errors";
import { sendEmail, setEmailProvider, EmailMessage, EmailProvider } from "../src/domain/email/service";

describe("Authentication & Password Cryptography (PBKDF2-SHA512)", () => {
  it("generates unique salt and distinct hashes for identical passwords", () => {
    const password = "StudioLeader2026!";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(hash1.split(":")).toHaveLength(2);
    expect(hash2.split(":")).toHaveLength(2);
  });

  it("verifies correct plaintext password successfully against stored hash", () => {
    const password = "StudioLeader2026!";
    const hash = hashPassword(password);

    const isValid = verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect passwords", () => {
    const hash = hashPassword("StudioLeader2026!");
    const isValid = verifyPassword("WrongPassword123!", hash);
    expect(isValid).toBe(false);
  });

  it("gracefully rejects malformed or empty hash strings without crashing", () => {
    expect(verifyPassword("Test1234!", "")).toBe(false);
    expect(verifyPassword("Test1234!", "invalid-hash-no-colon")).toBe(false);
    expect(verifyPassword("Test1234!", "salt:invalidhexkey")).toBe(false);
  });
});

describe("Typed Domain Error Hierarchy", () => {
  it("instantiates ValidationError with fieldErrors", () => {
    const err = new ValidationError("Invalid inputs", { email: ["Invalid email format"] });
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("ValidationError");
    expect(err.fieldErrors?.email).toContain("Invalid email format");
  });

  it("instantiates AuthorizationError with 403 status", () => {
    const err = new AuthorizationError("Access denied", "SUPER_ADMIN", "Workspace");
    expect(err.statusCode).toBe(403);
    expect(err.name).toBe("AuthorizationError");
    expect(err.requiredRole).toBe("SUPER_ADMIN");
  });

  it("instantiates BusinessRuleError with formatted ruleId", () => {
    const err = new BusinessRuleError("PAY-3", "Task creation is constrained by unpaid invoice");
    expect(err.statusCode).toBe(422);
    expect(err.name).toBe("BusinessRuleError");
    expect(err.ruleId).toBe("PAY-3");
    expect(err.message).toContain("[Rule PAY-3]");
  });

  it("instantiates ConflictError with 409 status and actor id", () => {
    const err = new ConflictError("Decision already recorded", "user-123");
    expect(err.statusCode).toBe(409);
    expect(err.name).toBe("ConflictError");
    expect(err.conflictingActorId).toBe("user-123");
  });

  it("instantiates NotFoundError with 404 status", () => {
    const err = new NotFoundError("Project", "proj-999");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("NotFoundError");
    expect(err.message).toContain("Project with ID 'proj-999' was not found");
  });
});

describe("Email Provider Abstraction", () => {
  it("dispatches emails through active provider", async () => {
    const sentMessages: EmailMessage[] = [];
    const mockProvider: EmailProvider = {
      async sendEmail(msg: EmailMessage) {
        sentMessages.push(msg);
        return { success: true, messageId: "test-id-123" };
      },
    };

    setEmailProvider(mockProvider);

    const result = await sendEmail({
      to: "client@mitti.co",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("test-id-123");
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]?.to).toBe("client@mitti.co");
  });
});
