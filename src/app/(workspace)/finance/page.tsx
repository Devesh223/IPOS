import React from "react";
import { getSessionContext } from "@/lib/session";
import { getWorkspaceFinanceData } from "@/domain/payments/queries";
import { FinanceView } from "@/features/finance/FinanceView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payments & Invoices — Indian Pixel OS",
  description: "Independent milestone invoice tracking and bank UTR reconciliation directly from PostgreSQL.",
};

export default async function FinancePage() {
  const session = await getSessionContext();
  const data = session ? await getWorkspaceFinanceData(session.workspaceId) : undefined;

  return <FinanceView initialData={data} />;
}
