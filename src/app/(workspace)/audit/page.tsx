import React from "react";
import { AuditLogView } from "@/features/audit/AuditLogView";

export const metadata = {
  title: "Audit Log — Indian Pixel OS",
  description: "Immutable, append-only forensic event trail.",
};

export default function AuditPage() {
  return <AuditLogView />;
}
