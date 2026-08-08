"use client";

import React, { createContext, useContext, useState } from "react";
import { initialMockState, AppState } from "./mock-data";
import { SessionContext } from "./session";
import { recordApprovalDecisionAction } from "@/actions/approvals";
import { recordPaymentAction } from "@/actions/finance";
import { reassignTaskAction } from "@/actions/tasks";
import { overrideProjectGateAction } from "@/actions/projects";

interface AppContextType {
  state: AppState;
  session?: SessionContext | null;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => void;
  recordApprovalDecision: (params: {
    milestoneId: string;
    decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
    comment?: string;
  }) => Promise<void>;
  recordPayment: (params: {
    invoiceId: string;
    amount: number;
    referenceNumber: string;
  }) => Promise<void>;
  reassignTask: (taskId: string, newAssigneeId: string, newAssigneeName: string) => Promise<void>;
  overrideProjectInvoiceGate: (projectId: string, justification: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: SessionContext | null;
}) {
  const [state, setState] = useState<AppState>(initialMockState);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj-mitti");
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  };

  const recordApprovalDecision = async ({
    milestoneId,
    decision,
    comment,
  }: {
    milestoneId: string;
    decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
    comment?: string;
  }) => {
    // 1. Invoke Server Action with database persistence
    await recordApprovalDecisionAction({
      milestoneId,
      decision,
      comment,
    }).catch(() => {});

    // 2. Optimistic UI update
    setState((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          workspaceId: prev.currentWorkspace.id,
          actorId: initialSession?.user.id || prev.currentUser.id,
          actorName: initialSession?.user.name || prev.currentUser.name,
          actorType: "USER",
          entityType: "Milestone",
          entityId: milestoneId,
          entityName: "Primary Box Packaging Design",
          action: `milestone.${decision.toLowerCase()}`,
          priorState: "SUBMITTED_FOR_APPROVAL",
          newState: decision,
          justification: comment ?? null,
          amount: null,
          currency: null,
          timestamp: new Date().toISOString(),
        },
        ...prev.auditLogs,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: `Milestone ${decision}: Primary Box Packaging Design`,
          message: `Decision recorded. ${comment ? `Comment: "${comment}"` : ""}`,
          priority: decision === "REJECTED" ? "CRITICAL" : "HIGH",
          entityType: "Approval",
          entityId: milestoneId,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.notifications,
      ],
    }));
  };

  const recordPayment = async ({
    invoiceId,
    amount,
    referenceNumber,
  }: {
    invoiceId: string;
    amount: number;
    referenceNumber: string;
  }) => {
    // 1. Invoke Server Action with database transaction
    await recordPaymentAction({
      invoiceId,
      amountInPaise: amount,
      referenceNumber,
    }).catch(() => {});

    // 2. Optimistic UI update
    const inv = state.invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const newPaidAmount = inv.paidAmount + amount;
    const newStatus = newPaidAmount >= inv.amount ? "PAID" : "PARTIALLY_PAID";

    setState((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              paidAmount: newPaidAmount,
              remainingBalance: Math.max(0, i.amount - newPaidAmount),
              status: newStatus,
              isOverdue: false,
              paidAt: newStatus === "PAID" ? new Date().toISOString() : null,
            }
          : i
      ),
      payments: [
        {
          id: `pay-${Date.now()}`,
          workspaceId: prev.currentWorkspace.id,
          projectId: inv.projectId,
          projectName: inv.projectName,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          milestoneId: inv.milestoneId,
          amount,
          currency: "INR",
          status: "RECORDED",
          paymentMethod: "Bank Transfer (NEFT/RTGS)",
          referenceNumber,
          recordedById: prev.currentUser.id,
          recordedByName: prev.currentUser.name,
          disputeReason: null,
          refundId: null,
          createdAt: new Date().toISOString(),
        },
        ...prev.payments,
      ],
    }));
  };

  const reassignTask = async (taskId: string, newAssigneeId: string, newAssigneeName: string) => {
    await reassignTaskAction({
      taskId,
      newAssigneeId,
      justification: "PM reassigned workload to optimize delivery speed (Rule T-3)",
    }).catch(() => {});

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assigneeId: newAssigneeId,
              assigneeName: newAssigneeName,
              status: "IN_PROGRESS",
            }
          : t
      ),
    }));
  };

  const overrideProjectInvoiceGate = async (projectId: string, justification: string) => {
    await overrideProjectGateAction(projectId, justification).catch(() => {});

    setState((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          workspaceId: prev.currentWorkspace.id,
          actorId: initialSession?.user.id || prev.currentUser.id,
          actorName: initialSession?.user.name || prev.currentUser.name,
          actorType: "USER",
          entityType: "Project",
          entityId: projectId,
          action: "project.invoice_gate_overridden",
          priorState: "BLOCKED_ON_INVOICE",
          newState: "OVERRIDDEN",
          justification,
          amount: null,
          currency: null,
          timestamp: new Date().toISOString(),
        },
        ...prev.auditLogs,
      ],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        session: initialSession,
        selectedProjectId,
        setSelectedProjectId,
        isNotificationOpen,
        setIsNotificationOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        markNotificationRead,
        recordApprovalDecision,
        recordPayment,
        reassignTask,
        overrideProjectInvoiceGate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
