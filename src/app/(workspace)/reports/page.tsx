import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceReportsData } from "@/domain/reports/queries";
import { ReportsView } from "@/features/reports/ReportsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Executive Reports — Indian Pixel OS",
  description: "Financial health, turnaround SLAs, and audit completeness.",
};

export default async function ReportsPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceReportsData(session.workspaceId) : undefined;

  return <ReportsView initialData={data} />;
}

