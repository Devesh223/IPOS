import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceAuditData } from "@/domain/audit/queries";
import { AuditLogView } from "@/features/audit/AuditLogView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Log — Indian Pixel OS",
  description: "Immutable, append-only forensic event trail stored in PostgreSQL.",
};

export default async function AuditPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceAuditData(session.workspaceId, 250) : undefined;

  return (
    <AuditLogView
      initialLogs={data?.logs}
      initialActors={data?.actors}
      initialEntities={data?.entities}
      initialActions={data?.actions}
    />
  );
}

