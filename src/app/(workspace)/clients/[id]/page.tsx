import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceClientById } from "@/domain/clients/queries";
import { ClientDetailView } from "@/features/clients/ClientDetailView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client Dossier — Indian Pixel OS",
  description: "Executive client dossier, governance agreements, and billing history.",
};

export default async function ClientByIdPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  const client = session ? await getWorkspaceClientById(session.workspaceId, params.id) : undefined;

  return <ClientDetailView clientId={params.id} initialClient={client} />;
}
