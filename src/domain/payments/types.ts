export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";
export type PaymentStatus = "RECORDED" | "RECONCILED" | "DISPUTED" | "REFUNDED";

export interface InvoiceItem {
  id: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  milestoneId: string | null;
  milestoneName?: string | null;
  invoiceNumber: string;
  amount: number; // in paise
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAmount: number;
  remainingBalance: number;
  isOverdue: boolean;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentItem {
  id: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  invoiceId: string;
  invoiceNumber: string;
  milestoneId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  referenceNumber: string | null;
  recordedById: string;
  recordedByName: string;
  disputeReason: string | null;
  refundId: string | null;
  createdAt: string;
}

export interface RecordPaymentInput {
  workspaceId: string;
  projectId: string;
  invoiceId: string;
  milestoneId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  actorId: string;
}

export interface RefundPaymentInput {
  paymentId: string;
  actorId: string;
  amount: number;
  reason: string;
}
