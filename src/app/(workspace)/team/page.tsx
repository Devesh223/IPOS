import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceTeamData } from "@/domain/team/queries";
import { TeamView } from "@/features/team/TeamView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Team & Contractors — Indian Pixel OS",
  description: "Internal team and scoped contractor rosters.",
};

export default async function TeamPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceTeamData(session.workspaceId) : undefined;

  return <TeamView initialTeam={data?.team} />;
}

