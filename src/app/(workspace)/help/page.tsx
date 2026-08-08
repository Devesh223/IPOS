import React from "react";
import { DocumentationView } from "@/features/help/DocumentationView";

export const metadata = {
  title: "Rule Book & Architecture — Indian Pixel OS",
  description: "Interactive operational rules matrix across Governance, Projects, Approvals, and Finance.",
};

export default function HelpPage() {
  return <DocumentationView />;
}
