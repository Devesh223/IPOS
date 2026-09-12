import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceDeliverablesData } from "@/domain/deliverables/queries";
import { FilesView } from "@/features/deliverables/FilesView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Deliverables Vault — Indian Pixel OS",
  description: "Cryptographically verified, version-locked client deliverables registry.",
};

export default async function FilesPage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceDeliverablesData(session.workspaceId) : undefined;

  return (
    <FilesView
      initialDeliverables={data?.deliverables}
      initialFiles={data?.files}
      initialProjects={data?.projects}
    />
  );
}

