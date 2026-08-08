import React from "react";
import { ProjectDetailView } from "@/features/projects/ProjectDetailView";

export const metadata = {
  title: "Projects & Scopes — Indian Pixel OS",
  description: "Client projects, milestone gates, deliverable versions, and task execution.",
};

export default function ProjectsPage() {
  return <ProjectDetailView />;
}
