import { prisma } from "@/lib/prisma";
import { Prisma, NotificationPriority } from "@prisma/client";

export interface CreateNotificationInput {
  workspaceId: string;
  recipientId: string;
  senderProcess?: string;
  eventType: string;
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
}

/**
 * Creates an authoritative server-side system notification, optionally coupled into an active transaction.
 */
export async function createSystemNotification(
  input: CreateNotificationInput,
  txClient?: Prisma.TransactionClient
) {
  const client = txClient || prisma;

  return client.notification.create({
    data: {
      workspaceId: input.workspaceId,
      recipientId: input.recipientId,
      senderProcess: input.senderProcess || "System",
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      message: input.message,
      priority: input.priority || NotificationPriority.NORMAL,
      actionUrl: input.actionUrl || null,
    },
  });
}

/**
 * Queries scoped notifications for a user.
 */
export async function getUserNotifications(userId: string, workspaceId: string, limit: number = 20) {
  return prisma.notification.findMany({
    where: {
      recipientId: userId,
      workspaceId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
