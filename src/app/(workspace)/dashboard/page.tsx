import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceDashboardData } from "@/domain/dashboard/queries";
import { DashboardView } from "@/features/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Indian Pixel OS",
  description: "Operations dashboard with live PostgreSQL KPIs, overdue task alerts, and traceable audit stream.",
};

export default async function DashboardPage() {
  const session = await getSessionContext();
  const metrics = session ? await getWorkspaceDashboardData(session.workspaceId) : undefined;

  return <DashboardView metrics={metrics} />;
}
