import React from "react";
import { getSessionContext } from "@/lib/session";
import { queryAuditLogs } from "@/domain/audit/service";
import { AuditLogView } from "@/features/audit/AuditLogView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Log — Indian Pixel OS",
  description: "Immutable, append-only forensic event trail stored in PostgreSQL.",
};

export default async function AuditPage() {
  const session = await getSessionContext();
  const logs = session ? await queryAuditLogs({ workspaceId: session.workspaceId, limit: 200 }) : [];

  return <AuditLogView initialLogs={logs} />;
}
