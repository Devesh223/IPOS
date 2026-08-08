import React from "react";
import { SettingsView } from "@/features/settings/SettingsView";

export const metadata = {
  title: "Workspace Settings — Indian Pixel OS",
  description: "Governance switches, payment gate enforcement, and timezone configuration.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
