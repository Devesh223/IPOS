import React from "react";
import { FilesView } from "@/features/deliverables/FilesView";

export const metadata = {
  title: "Deliverables Vault — Indian Pixel OS",
  description: "Cryptographically verified, version-locked client deliverables registry.",
};

export default function FilesPage() {
  return <FilesView />;
}
