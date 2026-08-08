import React from "react";
import { ReportsView } from "@/features/reports/ReportsView";

export const metadata = {
  title: "Executive Reports — Indian Pixel OS",
  description: "Financial health, turnaround SLAs, and audit completeness.",
};

export default function ReportsPage() {
  return <ReportsView />;
}
