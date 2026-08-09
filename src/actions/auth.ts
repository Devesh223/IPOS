"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { GlobalRole } from "@prisma/client";

export type AuthActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

/**
 * Handles user login with password verification, rate limiting, session creation, and secure cookie setting.
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  // 1. Rate Limiting Protection (Max 5 attempts per 60 seconds per email)
  const rateLimit = checkRateLimit(`login:${email}`, { maxRequests: 5, windowMs: 60 * 1000 });
  if (!rateLimit.isAllowed) {
    return {
      success: false,
      error: "Too many login attempts. Please wait 1 minute before trying again.",
    };
  }

  // 2. Find user by email
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

  // 3. Verify password
  const account = user.accounts.find((a) => a.providerId === "credential");
  const storedHash = user.passwordHash || account?.password;

  if (!storedHash || !verifyPassword(password, storedHash)) {
    return { success: false, error: "Invalid email or password." };
  }

  // Reset rate limit on successful authentication
  resetRateLimit(`login:${email}`);

  // 4. Check email verification if configured
  if (!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
    return {
      success: false,
      error: "Please verify your email before logging in.",
      redirectTo: `/auth/verify?email=${encodeURIComponent(email)}`,
    };
  }

  // 5. Generate high-entropy 256-bit session token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // 6. Set HTTP-only secure cookie
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  // 7. Check onboarding state
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
    return { success: false, error: "Name, email, and password are required." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = hashPassword(password);
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug,
        onboardingStatus: "COMPLETED",
      },
    });

    const u = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: false,
      },
    });

    await tx.account.create({
      data: {
        userId: u.id,
        accountId: u.id,
        providerId: "credential",
        password: passwordHash,
      },
    });

    await tx.workspaceMember.create({
      data: {
        userId: u.id,
        workspaceId: ws.id,
        role: GlobalRole.SUPER_ADMIN,
      },
    });

    await tx.session.create({
      data: {
        userId: u.id,
        token,
        expiresAt,
      },
    });

    return { u, ws };
  });

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return { success: true, redirectTo: "/dashboard" };
}

/**
 * Handles user logout by invalidating database session and clearing session cookie.
 */
export async function logoutAction(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/auth/login");
}

/**
 * Initiates a password reset workflow.
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  // Rate Limiting Protection (Max 3 reset requests per 15 minutes per email)
  const rateLimit = checkRateLimit(`forgot-password:${email}`, { maxRequests: 3, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.isAllowed) {
    return {
      success: false,
      error: "Too many password reset requests. Please wait a few minutes before trying again.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration timing attacks
  if (!user || user.isSuspended) {
    return { success: true, redirectTo: `/auth/forgot-password/sent?email=${encodeURIComponent(email)}` };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verification.create({
    data: {
      identifier: email,
      value: token,
      expiresAt,
    },
  });

  return { success: true, redirectTo: `/auth/forgot-password/sent?email=${encodeURIComponent(email)}` };
}

/**
 * Resets password using a verified token.
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const token = formData.get("token") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!token || !email || !password) {
    return { success: false, error: "Token, email, and password are required." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  // 1. Verify token existence and expiry
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: email,
      value: token,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verification) {
    return { success: false, error: "Invalid or expired password reset link. Please request a new one." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "Account not found." };
  }

  const newHash = hashPassword(password);

  // 2. Transactionally update user password and clean up verification token
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await tx.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: newHash },
    });

    // Invalidate all existing sessions for security on password change
    await tx.session.deleteMany({
      where: { userId: user.id },
    });

    // Invalidate used verification token
    await tx.verification.deleteMany({
      where: { identifier: email, value: token },
    });
  });

  return { success: true, redirectTo: "/auth/login?reset=success" };
}

/**
 * Verifies email using verification token.
 */
export async function verifyEmailAction(token: string, email: string): Promise<AuthActionResult> {
  if (!token || !email) {
    return { success: false, error: "Token and email are required." };
  }

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: email.toLowerCase(),
      value: token,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verification) {
    return { success: false, error: "Invalid or expired email verification link." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: true },
    });

    await tx.verification.deleteMany({
      where: { identifier: email.toLowerCase(), value: token },
    });
  });

  return { success: true, redirectTo: "/auth/login?verified=true" };
}
