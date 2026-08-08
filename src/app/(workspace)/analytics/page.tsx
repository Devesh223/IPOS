import React from "react";
import { AnalyticsView } from "@/features/analytics/AnalyticsView";

export const metadata = {
  title: "Studio Analytics — Indian Pixel OS",
  description: "Velocity, team throughput, and first-pass yield metrics.",
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
