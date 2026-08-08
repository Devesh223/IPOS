import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { GlobalRole, ProjectRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  globalRole: GlobalRole;
}

export interface SessionContext {
  user: SessionUser;
  workspaceId: string;
  workspaceName: string;
  role: GlobalRole;
  actingProjectRole?: ProjectRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isPM: boolean;
  isStaff: boolean;
  isFreelancer: boolean;
  isClient: boolean;
}

export const SESSION_COOKIE_NAME = "ip_session_token";

/**
 * Resolves the authenticated session, workspace boundary, and verified server-side role.
 * NEVER trusts client-supplied headers or role parameters (Phase 4 Section 5.4, Rule G-6).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  // Look up session in DB
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              workspace: true,
            },
          },
          projectRoles: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = session.user;
  if (user.isSuspended) {
    return null; // Rule G-7 non-destructive offboarding
  }

  // Determine active workspace membership
  const membership = user.memberships[0];
  if (!membership) {
    return null;
  }

  const globalRole = membership.role;
  const isSuperAdmin = globalRole === GlobalRole.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || globalRole === GlobalRole.ADMIN;
  const isFinance = globalRole === GlobalRole.FINANCE || isAdmin;

  // Project level role
  const projectRole = user.projectRoles[0]?.role;
  const isPM = projectRole === ProjectRole.PROJECT_MANAGER || isAdmin;
  const isStaff = projectRole === ProjectRole.DESIGNER || projectRole === ProjectRole.DEVELOPER || isPM;
  const isFreelancer = projectRole === ProjectRole.FREELANCER;
  const isClient = projectRole === ProjectRole.CLIENT;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      globalRole,
    },
    workspaceId: membership.workspaceId,
    workspaceName: membership.workspace.name,
    role: globalRole,
    actingProjectRole: projectRole,
    isSuperAdmin,
    isAdmin,
    isFinance,
    isPM,
    isStaff,
    isFreelancer,
    isClient,
  };
}

/**
 * Asserts session is present and throws or redirects if unauthenticated.
 */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new Error("UNAUTHENTICATED: Valid session required.");
  }
  return ctx;
}
