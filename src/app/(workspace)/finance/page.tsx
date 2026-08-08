import React from "react";
import { FinanceView } from "@/features/finance/FinanceView";

export const metadata = {
  title: "Payments & Invoices — Indian Pixel OS",
  description: "Independent milestone invoice tracking and bank UTR reconciliation.",
};

export default function FinancePage() {
  return <FinanceView />;
}
