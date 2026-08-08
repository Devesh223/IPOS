import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceClientsData } from "@/domain/clients/queries";
import { ClientsView } from "@/features/clients/ClientsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clients & Stakeholders — Indian Pixel OS",
  description: "Client engagement directory, SLA compliance, and contract status directly from PostgreSQL.",
};

export default async function ClientsPage() {
  const session = await getSessionContext();
  const clients = session ? await getWorkspaceClientsData(session.workspaceId) : [];

  return <ClientsView initialClients={clients} />;
}
