import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceClientsData } from "@/domain/clients/queries";
import { ClientsDirectoryView } from "@/features/clients/ClientsDirectoryView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clients & Institutional Directory — Indian Pixel OS",
  description: "Enterprise client accounts, Master Agreement compliance, and billing ledgers directly from PostgreSQL.",
};

export default async function ClientsPage() {
  const session = await getSessionContext();
  const clients = session ? await getWorkspaceClientsData(session.workspaceId) : [];

  return <ClientsDirectoryView initialClients={clients} />;
}

