import { prisma } from "@/lib/prisma";

export async function getWorkspaceSettingsData(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: {
        select: {
          users: true,
          projects: true,
          invoices: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new Error(`Workspace '${workspaceId}' not found.`);
  }

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      timezone: workspace.timezone,
      enforcePaymentGate: workspace.enforcePaymentGate,
      enforceAgreementGate: workspace.enforceAgreementGate,
      onboardingStatus: workspace.onboardingStatus,
      setupStep: workspace.setupStep,
      createdAt: workspace.createdAt.toISOString(),
      memberCount: workspace._count.users,
      projectCount: workspace._count.projects,
      invoiceCount: workspace._count.invoices,
      auditLogCount: workspace._count.auditLogs,
    },
    systemDiagnostics: {
      environment: process.env.NODE_ENV || "development",
      databaseEngine: "PostgreSQL (Supabase Direct)",
      auditEngine: "Append-Only Immutable (PostgreSQL Trigger Protected)",
      storageEngine: "Cloudflare R2 / S3-Compatible Storage Provider",
      emailEngine: process.env.RESEND_API_KEY ? "Resend Production Gateway" : "Development Local Logger",
      paymentEngine: "Razorpay / Stripe Dual Provider Gateway",
    },
  };
}
