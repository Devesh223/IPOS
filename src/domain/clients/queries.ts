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
      contacts: c.contacts.map((ct) => ({
        id: ct.id,
        name: ct.name,
        email: ct.email,
        phone: ct.phone,
        isPrimary: ct.isPrimary,
      })),
      agreements: c.agreements.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        version: a.version,
        signedAt: a.signedAt ? a.signedAt.toISOString() : null,
        terms: a.terms,
      })),
      projects: c.projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        servicesCount: p.services.length,
      })),
    };
  });
}

export async function getWorkspaceClientById(workspaceId: string, clientId: string) {
  const clientRaw = await prisma.client.findFirst({
    where: { id: clientId, workspaceId },
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
  });

  if (!clientRaw) return null;

  let totalInvoiced = 0;
  let totalPaid = 0;

  for (const p of clientRaw.projects) {
    for (const inv of p.invoices) {
      totalInvoiced += inv.amount;
      totalPaid += inv.paidAmount;
    }
  }

  const primaryContact = clientRaw.contacts[0] ?? null;
  const latestAgreement = clientRaw.agreements[0] ?? null;

  return {
    id: clientRaw.id,
    name: clientRaw.name,
    companyName: clientRaw.companyName || clientRaw.name,
    email: clientRaw.email || primaryContact?.email || "",
    tier: clientRaw.tier,
    status: clientRaw.status,
    onboardingStatus: clientRaw.onboardingStatus,
    contactName: primaryContact?.name ?? "No Contact Assigned",
    phone: primaryContact?.phone ?? "N/A",
    activeProjectsCount: clientRaw.projects.filter((p) => p.status === "ACTIVE").length,
    totalProjectsCount: clientRaw.projects.length,
    totalInvoiced,
    totalPaid,
    outstandingBalance: Math.max(0, totalInvoiced - totalPaid),
    hasActiveAgreement: latestAgreement?.status === "ACTIVE",
    agreementTitle: latestAgreement?.title ?? "No Agreement Uploaded",
    agreementStatus: latestAgreement?.status ?? "NONE",
    createdAt: clientRaw.createdAt.toISOString(),
    contacts: clientRaw.contacts.map((ct) => ({
      id: ct.id,
      name: ct.name,
      email: ct.email,
      phone: ct.phone,
      isPrimary: ct.isPrimary,
    })),
    agreements: clientRaw.agreements.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      version: a.version,
      signedAt: a.signedAt ? a.signedAt.toISOString() : null,
      terms: a.terms,
    })),
    projects: clientRaw.projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      servicesCount: p.services.length,
    })),
  };
}

