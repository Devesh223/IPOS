import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceProjectsData } from "@/domain/projects/queries";
import { ProjectsDirectoryView } from "@/features/projects/ProjectsDirectoryView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects & Scopes — Indian Pixel OS",
  description: "Client projects, milestone gates, deliverable versions, and task execution directly from PostgreSQL.",
};

export default async function ProjectsPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceProjectsData(session.workspaceId) : undefined;

  return <ProjectsDirectoryView initialData={data} />;
}

