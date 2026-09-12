import { prisma } from "@/lib/prisma";

export async function getWorkspaceTeamData(workspaceId: string) {
  const [membersRaw, projectsRaw, tasksRaw] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          include: {
            projectRoles: {
              where: { workspaceId },
              include: {
                project: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    }),
    prisma.task.findMany({
      where: { workspaceId, status: { notIn: ["COMPLETE", "CANCELLED"] } },
      select: { id: true, name: true, assigneeId: true },
    }),
  ]);

  const team = membersRaw.map((member) => {
    const user = member.user;
    const assignedProjects = user.projectRoles.map((pr) => ({
      id: pr.project.id,
      name: pr.project.name,
      role: pr.role,
    }));

    const activeTasksCount = tasksRaw.filter((t) => t.assigneeId === user.id).length;

    let permissionsDescription = "Standard workspace staff access";
    if (member.role === "SUPER_ADMIN") {
      permissionsDescription = "Full Global Authority & Governance Policy Control (Rule G-6)";
    } else if (member.role === "ADMIN") {
      permissionsDescription = "Administrative Control & Member Management (Rule G-6)";
    } else if (member.role === "FINANCE") {
      permissionsDescription = "Financial Invoicing, Payment Reconciliation, & Ledger Access (Rule PAY-1)";
    } else if (member.role === "VIEWER") {
      permissionsDescription = "Read-only access to assigned projects";
    }

    return {
      id: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: member.role,
      isSuspended: user.isSuspended,
      joinedAt: member.createdAt.toISOString(),
      permissionsDescription,
      assignedProjects,
      assignedProjectsCount: assignedProjects.length,
      activeTasksCount,
    };
  });

  return { team, projects: projectsRaw };
}
