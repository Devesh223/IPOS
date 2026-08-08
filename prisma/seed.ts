import { PrismaClient, GlobalRole, ProjectRole, ProjectStatus, ServiceStatus, MilestoneStatus, TaskStatus, DeliverableStatus, InvoiceStatus, PaymentStatus, ClientStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Indian Pixel Operating System database...");

  // 1. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "indian-pixel" },
    update: {},
    create: {
      id: "ws-indian-pixel",
      name: "Indian Pixel Studio",
      slug: "indian-pixel",
      timezone: "Asia/Kolkata",
      enforcePaymentGate: true,
      enforceAgreementGate: true,
      onboardingStatus: "COMPLETED",
      setupStep: 4,
    },
  });

  // 2. Create Super Admin User
  const passwordHash = hashPassword("StudioLeader2026!");
  const founder = await prisma.user.upsert({
    where: { email: "krishna@indianpixel.com" },
    update: { passwordHash },
    create: {
      id: "user-super-admin",
      name: "Krishna Mishra",
      email: "krishna@indianpixel.com",
      passwordHash,
      emailVerified: true,
    },
  });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: founder.id,
      },
    },
    update: {},
    create: {
      accountId: founder.id,
      providerId: "credential",
      userId: founder.id,
      password: passwordHash,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: founder.id,
      },
    },
    update: { role: GlobalRole.SUPER_ADMIN },
    create: {
      workspaceId: workspace.id,
      userId: founder.id,
      role: GlobalRole.SUPER_ADMIN,
    },
  });

  // 3. Create Core Team Users
  const teamUsers = [
    { id: "user-pm-1", name: "Aarav Sharma", email: "aarav@indianpixel.com", role: GlobalRole.STAFF, projectRole: ProjectRole.PROJECT_MANAGER },
    { id: "user-designer-1", name: "Rohan Verma", email: "rohan@indianpixel.com", role: GlobalRole.STAFF, projectRole: ProjectRole.DESIGNER },
    { id: "user-dev-1", name: "Ananya Iyer", email: "ananya@indianpixel.com", role: GlobalRole.STAFF, projectRole: ProjectRole.DEVELOPER },
    { id: "user-freelance-1", name: "Vikram Sengupta", email: "vikram.motion@external.co", role: GlobalRole.STAFF, projectRole: ProjectRole.FREELANCER },
    { id: "user-finance", name: "Neha Kulkarni", email: "neha@indianpixel.com", role: GlobalRole.FINANCE, projectRole: ProjectRole.VIEWER },
  ];

  for (const u of teamUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash,
        emailVerified: true,
      },
    });

    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      update: { role: u.role },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: u.role,
      },
    });
  }

  // 4. Create Clients
  const mittiClient = await prisma.client.upsert({
    where: { id: "client-mitti" },
    update: {},
    create: {
      id: "client-mitti",
      workspaceId: workspace.id,
      name: "Mitti & Co.",
      tier: "Enterprise Retainer",
      status: ClientStatus.ACTIVE,
    },
  });

  // 5. Create Projects
  const mittiProject = await prisma.project.upsert({
    where: { id: "proj-mitti" },
    update: {},
    create: {
      id: "proj-mitti",
      workspaceId: workspace.id,
      clientId: mittiClient.id,
      pmId: "user-pm-1",
      name: "Mitti & Co. Brand Refresh & Packaging",
      description: "Artisanal natural textures, earth-toned packaging, and multi-channel eCommerce identity.",
      status: ProjectStatus.ACTIVE,
    },
  });

  // 6. Create Service & Milestone
  const packagingService = await prisma.service.upsert({
    where: { id: "srv-packaging" },
    update: {},
    create: {
      id: "srv-packaging",
      workspaceId: workspace.id,
      projectId: mittiProject.id,
      name: "Packaging & Print Identity",
      status: ServiceStatus.IN_PROGRESS,
    },
  });

  const packagingMilestone = await prisma.milestone.upsert({
    where: { id: "ms-packaging" },
    update: {},
    create: {
      id: "ms-packaging",
      workspaceId: workspace.id,
      serviceId: packagingService.id,
      name: "Primary Box Packaging Design",
      status: MilestoneStatus.SUBMITTED_FOR_APPROVAL,
      order: 1,
    },
  });

  // 7. Create Task & Deliverable
  const printTask = await prisma.task.upsert({
    where: { id: "task-101" },
    update: {},
    create: {
      id: "task-101",
      workspaceId: workspace.id,
      milestoneId: packagingMilestone.id,
      assigneeId: "user-designer-1",
      name: "Matte Foil Emboss Print Specifications",
      description: "Prepare 300DPI vector die-lines with pantone metallic gold foil separations.",
      status: TaskStatus.IN_PROGRESS,
      isOverdue: true,
      dueDate: new Date("2026-08-05"),
    },
  });

  await prisma.deliverable.upsert({
    where: { id: "deliv-101" },
    update: {},
    create: {
      id: "deliv-101",
      workspaceId: workspace.id,
      taskId: printTask.id,
      name: "Matte Gold Die-Lines v2.0",
      description: "Vector die-lines with pantone metallic gold foil separations.",
      status: DeliverableStatus.UNDER_REVIEW,
      currentVersion: 2,
    },
  });

  // 8. Create Invoices and Payments
  const invoice = await prisma.invoice.upsert({
    where: {
      workspaceId_invoiceNumber: {
        workspaceId: workspace.id,
        invoiceNumber: "INV-2026-001",
      },
    },
    update: {},
    create: {
      id: "inv-2026-001",
      workspaceId: workspace.id,
      projectId: mittiProject.id,
      milestoneId: packagingMilestone.id,
      invoiceNumber: "INV-2026-001",
      amount: 15000000,
      paidAmount: 0,
      currency: "INR",
      status: InvoiceStatus.ISSUED,
      dueDate: new Date("2026-08-10"),
    },
  });

  // 9. Create Immutable Audit Log Entries
  await prisma.auditLogEntry.create({
    data: {
      workspaceId: workspace.id,
      actorId: "user-super-admin",
      actorType: "USER",
      entityType: "Workspace",
      entityId: workspace.id,
      action: "workspace.configured",
      newState: "PaymentGate=Enforced, AgreementGate=Enforced",
      justification: "Initial workspace launch setup",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
