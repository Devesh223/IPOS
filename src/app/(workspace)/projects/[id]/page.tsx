import React from "react";
import { ProjectDetailView } from "@/features/projects/ProjectDetailView";

export default function ProjectByIdPage({ params }: { params: { id: string } }) {
  return <ProjectDetailView projectId={params.id} />;
}
