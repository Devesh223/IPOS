import React from "react";
import { ClientsView } from "@/features/clients/ClientsView";

export const metadata = {
  title: "Clients & Stakeholders — Indian Pixel OS",
  description: "Client engagement directory, SLA compliance, and contract status.",
};

export default function ClientsPage() {
  return <ClientsView />;
}
