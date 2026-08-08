import React from "react";
import { notFound } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getInvoiceDetailData } from "@/domain/payments/queries";
import { InvoiceDetailView } from "@/features/finance/InvoiceDetailView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoice Detail — Indian Pixel OS",
  description: "Itemized tax breakdown, payment timeline, and audit trail for studio invoices.",
};

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) return notFound();

  const invoice = await getInvoiceDetailData(session.workspaceId, params.id);
  if (!invoice) return notFound();

  return <InvoiceDetailView invoice={invoice} />;
}
