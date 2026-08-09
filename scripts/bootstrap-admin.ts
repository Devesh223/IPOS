import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { writeAuditLogEntry } from "../src/domain/audit/service";
import { GlobalRole } from "@prisma/client";
import { logger } from "../src/lib/logger";

export interface BootstrapAdminOptions {
  email?: string;
  password?: string;
  name?: string;
  workspaceName?: string;
}

export async function bootstrapAdmin(options: BootstrapAdminOptions = {}) {
  const email = (options.email || process.env.ADMIN_EMAIL || "admin@indianpixel.com").trim().toLowerCase();
  const password = options.password || process.env.ADMIN_PASSWORD || "StudioAdmin2026!";
  const name = options.name || process.env.ADMIN_NAME || "Root Super Administrator";
  const workspaceName = options.workspaceName || process.env.WORKSPACE_NAME || "Indian Pixel Studio";

  logger.info("bootstrap.admin.started", { targetEmail: email, workspaceName });

  // 1. Check if user already exists (Idempotency Guard)
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (existingUser) {
    logger.info("bootstrap.admin.skipped", {
      message: "Admin account already exists. Existing credentials and memberships preserved.",
      userId: existingUser.id,
      email: existingUser.email,
    });
    return {
      status: "EXISTING",
      userId: existingUser.id,
      email: existingUser.email,
    };
  }

  // 2. Ensure root workspace exists or create one
  let workspace = await prisma.workspace.findFirst({
    where: { name: workspaceName },
  });

  if (!workspace) {
    const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-root";
    workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug,
        onboardingStatus: "COMPLETED",
      },
    });
    logger.info("bootstrap.workspace.created", { workspaceId: workspace.id, workspaceName });
  }

  // 3. Create Super Admin user with PBKDF2/scrypt hashed password
  const passwordHash = hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: true,
      },
    });

    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      },
    });

    await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace!.id,
        role: GlobalRole.SUPER_ADMIN,
      },
    });

    await writeAuditLogEntry(
      {
        workspaceId: workspace!.id,
        actorId: "system:bootstrap",
        actorType: "SYSTEM_PROCESS",
        entityType: "User",
        entityId: user.id,
        action: "user.bootstrapped",
        priorState: null,
        newState: "SUPER_ADMIN",
        justification: `Initial production root administrator ${email} bootstrapped safely.`,
      },
      tx
    );

    return user;
  });

  logger.info("bootstrap.admin.succeeded", {
    userId: result.id,
    email: result.email,
    workspaceId: workspace.id,
  });

  return {
    status: "CREATED",
    userId: result.id,
    email: result.email,
    workspaceId: workspace.id,
  };
}

// CLI direct execution entrypoint
if (require.main === module) {
  bootstrapAdmin()
    .then((res) => {
      console.log(`[BOOTSTRAP_SUCCESS] Status: ${res.status}, Admin Email: ${res.email}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[BOOTSTRAP_ERROR]", err.message);
      process.exit(1);
    });
}
