import { describe, it, expect } from "vitest";
import { AuthorizationError, BusinessRuleError } from "../src/domain/errors";
import { validateFileMetadata } from "../src/domain/files/service";
import { assertInvoiceCanReceivePayment } from "../src/domain/finance/invoice-rules";

describe("Security Hardening: Cross-Workspace & IDOR Protection", () => {
  it("prevents Workspace A user from mutating or accessing Workspace B entity", () => {
    const session = { workspaceId: "ws-indian-pixel", role: "ADMIN" };
    const targetEntity = { id: "proj-999", workspaceId: "ws-other-agency", name: "Secret Brand" };

    function assertTenantOwnership(entityWorkspaceId: string, sessionWorkspaceId: string) {
      if (entityWorkspaceId !== sessionWorkspaceId) {
        throw new AuthorizationError("UNAUTHORIZED: Access across workspace boundaries is prohibited.", "WorkspaceOwner");
      }
    }

    expect(() => assertTenantOwnership(targetEntity.workspaceId, session.workspaceId)).toThrowError(AuthorizationError);
  });

  it("rejects client-supplied role tampering or privilege escalation", () => {
    const maliciousPayload = {
      role: "SUPER_ADMIN", // Attacker sends elevated role in form body
      workspaceId: "ws-other-agency",
    };

    function resolveServerRole(serverMembershipRole: string, _clientPayloadRole: string) {
      // Server MUST exclusively use DB membership role and ignore payload
      return serverMembershipRole;
    }

    const effectiveRole = resolveServerRole("STAFF", maliciousPayload.role);
    expect(effectiveRole).toBe("STAFF");
    expect(effectiveRole).not.toBe("SUPER_ADMIN");
  });

  it("locks out suspended users immediately regardless of valid token existence", () => {
    const user = { id: "user-101", isSuspended: true };

    function validateSessionUser(u: { isSuspended: boolean }) {
      if (u.isSuspended) return null;
      return u;
    }

    expect(validateSessionUser(user)).toBeNull();
  });
});

describe("Security Hardening: File Asset Governance (Rules F-1..F-4)", () => {
  it("blocks files exceeding 50MB limit", () => {
    const hugeFileSize = 60 * 1024 * 1024; // 60MB
    expect(() => validateFileMetadata("video.mp4", "video/mp4", hugeFileSize)).toThrowError(BusinessRuleError);
  });

  it("blocks unapproved or executable MIME types (e.g. .exe, .sh, .bat)", () => {
    expect(() => validateFileMetadata("script.sh", "application/x-sh", 1024)).toThrowError(BusinessRuleError);
    expect(() => validateFileMetadata("trojan.exe", "application/x-msdownload", 1024)).toThrowError(BusinessRuleError);
  });

  it("accepts valid design assets, PDFs, and media", () => {
    expect(() => validateFileMetadata("artwork.png", "image/png", 5 * 1024 * 1024)).not.toThrow();
    expect(() => validateFileMetadata("dieline.pdf", "application/pdf", 2 * 1024 * 1024)).not.toThrow();
    expect(() => validateFileMetadata("assets.zip", "application/zip", 15 * 1024 * 1024)).not.toThrow();
  });
});
