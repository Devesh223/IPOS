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
    return null; // Rule G-7 non-destructive offboarding: suspended accounts are immediately locked out
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

  // Global workspace role derivations (do NOT derive global session authority from arbitrary user.projectRoles[0])
  const defaultProjectRole = user.projectRoles[0]?.role;
  const isPM = isAdmin;
  const isStaff = globalRole === GlobalRole.STAFF || isPM;
  const isFreelancer = false;
  const isClient = globalRole === GlobalRole.VIEWER;

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
    actingProjectRole: defaultProjectRole,
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

/**
 * Resolves the project-scoped role for a given user in a specific project.
 */
export async function getProjectRoleForUser(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return member?.role ?? null;
}

/**
 * Resolves project-scoped permissions for a specific project without cross-project bleed.
 */
export async function resolveProjectPermissions(
  session: SessionContext,
  projectId: string
): Promise<{
  projectRole: ProjectRole | null;
  isPM: boolean;
  isStaff: boolean;
  isFreelancer: boolean;
  isClient: boolean;
}> {
  if (session.isAdmin) {
    return {
      projectRole: ProjectRole.PROJECT_MANAGER,
      isPM: true,
      isStaff: true,
      isFreelancer: false,
      isClient: false,
    };
  }

  const projectRole = await getProjectRoleForUser(session.user.id, projectId);

  const isPM = projectRole === ProjectRole.PROJECT_MANAGER;
  const isStaff =
    projectRole === ProjectRole.DESIGNER ||
    projectRole === ProjectRole.DEVELOPER ||
    session.role === GlobalRole.STAFF ||
    isPM;
  const isFreelancer = projectRole === ProjectRole.FREELANCER;
  const isClient = projectRole === ProjectRole.CLIENT || session.role === GlobalRole.VIEWER;

  return {
    projectRole,
    isPM,
    isStaff,
    isFreelancer,
    isClient,
  };
}
