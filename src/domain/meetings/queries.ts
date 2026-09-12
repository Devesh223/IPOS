import { prisma } from "@/lib/prisma";

export async function getWorkspaceMeetingsData(workspaceId: string) {
  const [meetingsRaw, projectsRaw, teamMembersRaw] = await Promise.all([
    prisma.meeting.findMany({
      where: { workspaceId },
      include: {
        project: {
          include: {
            client: {
              include: {
                contacts: true,
              },
            },
          },
        },
        attendees: {
          include: {
            clientContact: true,
          },
        },
        notes: {
          include: {
            author: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { meetingTime: "asc" },
    }),
    prisma.project.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        client: {
          select: {
            id: true,
            name: true,
            contacts: {
              select: {
                id: true,
                name: true,
                email: true,
                roleTitle: true,
                isPrimary: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const meetings = meetingsRaw.map((m) => {
    return {
      id: m.id,
      workspaceId: m.workspaceId,
      projectId: m.projectId,
      projectName: m.project.name,
      clientId: m.project.client.id,
      clientName: m.project.client.name,
      title: m.title,
      agenda: m.agenda ?? "",
      meetingTime: m.meetingTime.toISOString(),
      dateFormatted: m.meetingTime.toISOString().split("T")[0]!,
      timeFormatted: m.meetingTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      durationMinutes: m.durationMinutes,
      meetingUrl: m.meetingUrl ?? "https://meet.google.com/indian-pixel-review",
      status: m.status,
      attendees: m.attendees.map((a) => ({
        id: a.id,
        userId: a.userId,
        clientContactId: a.clientContactId,
        name: a.clientContact?.name ?? "Studio Member",
        email: a.clientContact?.email ?? "",
        isSignatory: a.clientContact?.isPrimary ?? false,
        attended: a.attended,
      })),
      notes: m.notes.map((n) => ({
        id: n.id,
        authorId: n.authorId,
        authorName: n.author.name,
        content: n.content,
        isClientVisible: n.isClientVisible,
        createdAt: n.createdAt.toISOString(),
      })),
      hasRecordedDecisions: m.notes.length > 0,
      decisionSummary: m.notes[0]?.content ?? null,
    };
  });

  const teamMembers = teamMembersRaw.map((tm) => ({
    id: tm.user.id,
    name: tm.user.name,
    email: tm.user.email,
  }));

  return { meetings, projects: projectsRaw, teamMembers };
}
