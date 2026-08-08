"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { GlobalRole } from "@prisma/client";

export type AuthActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

/**
 * Handles user login with password verification, session creation, and secure cookie setting.
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
      memberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user || user.isSuspended) {
    return { success: false, error: "Invalid email or password." };
  }

  // 2. Verify password
  const account = user.accounts.find((a) => a.providerId === "credential");
  const storedHash = user.passwordHash || account?.password;

  if (!storedHash || !verifyPassword(password, storedHash)) {
    return { success: false, error: "Invalid email or password." };
  }

  // 3. Check email verification if configured
  if (!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
    return {
      success: false,
      error: "Please verify your email before logging in.",
      redirectTo: `/auth/verify?email=${encodeURIComponent(email)}`,
    };
  }

  // 4. Generate high-entropy session token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // 5. Set HTTP-only secure cookie
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  // 6. Check onboarding state
  const workspace = user.memberships[0]?.workspace;
  if (workspace && workspace.onboardingStatus !== "COMPLETED") {
    return { success: true, redirectTo: "/onboarding" };
  }

  return { success: true, redirectTo: "/dashboard" };
}

/**
 * Handles new user and initial workspace signup.
 */
export async function signupAction(formData: FormData): Promise<AuthActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const workspaceName = (formData.get("workspaceName") as string)?.trim() || "Indian Pixel Studio";

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = hashPassword(password);
  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Create Workspace, User, Account, Membership inside transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Workspace
    const ws = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
        onboardingStatus: "PENDING",
        setupStep: 1,
      },
    });

    // 2. Create User
    const u = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: true, // Auto-verified for primary founder signups in prototype reset
      },
    });

    // 3. Link Account
    await tx.account.create({
      data: {
        accountId: u.id,
        providerId: "credential",
        userId: u.id,
        password: passwordHash,
      },
    });

    // 4. Assign Super Admin role
    await tx.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId: u.id,
        role: GlobalRole.SUPER_ADMIN,
      },
    });

    // 5. Generate Session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await tx.session.create({
      data: {
        userId: u.id,
        token,
        expiresAt,
      },
    });

    return { token, expiresAt };
  });

  cookies().set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: result.expiresAt,
    path: "/",
  });

  return { success: true, redirectTo: "/onboarding" };
}

/**
 * Handles secure logout by clearing database session and cookie.
 */
export async function logoutAction(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    }).catch(() => {});
  }

  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/auth/login");
}

/**
 * Initiates forgot-password verification email.
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verification.create({
      data: {
        identifier: email,
        value: token,
        expiresAt,
      },
    });
  }

  // Always return success to prevent email enumeration attacks
  return {
    success: true,
    redirectTo: `/auth/forgot-password/sent?email=${encodeURIComponent(email)}`,
  };
}
