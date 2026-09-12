import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceSettingsData } from "@/domain/settings/queries";
import { SettingsView } from "@/features/settings/SettingsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Workspace Settings — Indian Pixel OS",
  description: "Governance switches, payment gate enforcement, and timezone configuration.",
};

export default async function SettingsPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceSettingsData(session.workspaceId) : undefined;

  return <SettingsView initialData={data} />;
}

