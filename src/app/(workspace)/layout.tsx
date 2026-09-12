import React from "react";
import { getSessionContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { Topbar } from "@/features/navigation/Topbar";
import { Sidebar } from "@/features/navigation/Sidebar";
import { NotificationDrawer } from "@/features/notifications/NotificationDrawer";
import { CommandPalette } from "@/features/search/CommandPalette";
import { AppProvider } from "@/lib/app-context";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <AppProvider initialSession={session}>
      <div className="flex h-screen flex-col bg-[#030706] text-slate-100 overflow-hidden select-text">
        {/* Topbar with authenticated session identity */}
        <Topbar session={session} />

        {/* Workspace Shell */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scoped Sidebar Navigation */}
          <Sidebar role={session.role} />

          {/* Dynamic Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#020504]">
            <div className="mx-auto max-w-7xl w-full">{children}</div>
          </main>
        </div>

        {/* Global Overlays */}
        <NotificationDrawer />
        <CommandPalette />
      </div>
    </AppProvider>
  );
}

