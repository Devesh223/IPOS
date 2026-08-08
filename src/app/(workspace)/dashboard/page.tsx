import React from "react";
import { DashboardView } from "@/features/dashboard/DashboardView";

export const metadata = {
  title: "Dashboard — Indian Pixel OS",
  description: "Operations dashboard with live KPIs, overdue task alerts, and traceable audit stream.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
