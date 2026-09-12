import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceMeetingsData } from "@/domain/meetings/queries";
import { MeetingsView } from "@/features/meetings/MeetingsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Sessions & Meetings — Indian Pixel OS",
  description: "Milestone-bound syncs with recorded decision logs.",
};

export default async function MeetingsPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceMeetingsData(session.workspaceId) : undefined;

  return (
    <MeetingsView
      initialMeetings={data?.meetings}
      initialProjects={data?.projects}
      initialTeamMembers={data?.teamMembers}
    />
  );
}

