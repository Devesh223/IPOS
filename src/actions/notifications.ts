"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/**
 * Marks a specific notification as read.
 */
export async function markNotificationReadAction(notificationId: string) {
  const session = await requireSession();

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: session.user.id,
      workspaceId: session.workspaceId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Marks all unread notifications for the active user as read.
 */
export async function markAllNotificationsReadAction() {
  const session = await requireSession();

  await prisma.notification.updateMany({
    where: {
      recipientId: session.user.id,
      workspaceId: session.workspaceId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
}
