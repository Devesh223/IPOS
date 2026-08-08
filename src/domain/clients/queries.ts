import { prisma } from "@/lib/prisma";

export async function getWorkspaceClientsData(workspaceId: string) {
  const clientsRaw = await prisma.client.findMany({
    where: { workspaceId },
    include: {
      contacts: { orderBy: { isPrimary: "desc" } },
      projects: {
        include: {
          services: true,
          invoices: true,
        },
      },
      agreements: { orderBy: { version: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return clientsRaw.map((c) => {
    let totalInvoiced = 0;
    let totalPaid = 0;

    for (const p of c.projects) {
      for (const inv of p.invoices) {
        totalInvoiced += inv.amount;
        totalPaid += inv.paidAmount;
      }
    }

    const primaryContact = c.contacts[0] ?? null;
    const latestAgreement = c.agreements[0] ?? null;

    return {
      id: c.id,
      name: c.name,
      companyName: c.companyName || c.name,
      email: c.email || primaryContact?.email || "",
      tier: c.tier,
      status: c.status,
      onboardingStatus: c.onboardingStatus,
      contactName: primaryContact?.name ?? "No Contact Assigned",
      phone: primaryContact?.phone ?? "N/A",
      activeProjectsCount: c.projects.filter((p) => p.status === "ACTIVE").length,
      totalProjectsCount: c.projects.length,
      totalInvoiced,
      totalPaid,
      outstandingBalance: Math.max(0, totalInvoiced - totalPaid),
      hasActiveAgreement: latestAgreement?.status === "ACTIVE",
      agreementTitle: latestAgreement?.title ?? "No Agreement Uploaded",
      agreementStatus: latestAgreement?.status ?? "NONE",
      createdAt: c.createdAt.toISOString(),
      projects: c.projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        servicesCount: p.services.length,
      })),
    };
  });
}
