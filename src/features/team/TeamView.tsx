"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  Users,
  Shield,
  Briefcase,
  Mail,
  CheckCircle2,
  UserCheck,
  Plus,
  Search,
  Eye,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { inviteTeamMemberAction, updateTeamMemberRoleAction, toggleMemberSuspensionAction } from "@/actions/team";
import { GlobalRole } from "@prisma/client";

interface TeamMemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: GlobalRole;
  isSuspended: boolean;
  joinedAt: string;
  permissionsDescription: string;
  assignedProjects: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  assignedProjectsCount: number;
  activeTasksCount: number;
}

export function TeamView({ initialTeam = [] }: { initialTeam?: TeamMemberItem[] }) {
  const router = useRouter();
  const { session } = useApp();

  const isClient = session?.isClient ?? false;
  const isSuperAdminOrAdmin = session?.isAdmin ?? false;

  const defaultTeam: TeamMemberItem[] = [
    {
      id: "mem-1",
      userId: "user-super-admin",
      name: "Krishna Mishra",
      email: "krishna@indianpixel.com",
      avatarUrl: null,
      role: "SUPER_ADMIN",
      isSuspended: false,
      joinedAt: "2026-06-01T10:00:00Z",
      permissionsDescription: "Full Global Authority & Governance Policy Control (Rule G-6)",
      assignedProjects: [
        { id: "proj-1", name: "Mitti & Co. Brand Refresh", role: "PROJECT_MANAGER" },
        { id: "proj-2", name: "SaaS Design System", role: "PROJECT_MANAGER" },
        { id: "proj-3", name: "Vally & Hound Luxury Outdoors", role: "PROJECT_MANAGER" },
      ],
      assignedProjectsCount: 3,
      activeTasksCount: 0,
    },
    {
      id: "mem-2",
      userId: "user-pm-1",
      name: "Aarav Sharma",
      email: "aarav@indianpixel.com",
      avatarUrl: null,
      role: "ADMIN",
      isSuspended: false,
      joinedAt: "2026-06-15T10:00:00Z",
      permissionsDescription: "Administrative Control & Milestone Governance (Rule P-2)",
      assignedProjects: [
        { id: "proj-1", name: "Mitti & Co. Brand Refresh", role: "PROJECT_MANAGER" },
        { id: "proj-3", name: "Vally & Hound Luxury Outdoors", role: "PROJECT_MANAGER" },
      ],
      assignedProjectsCount: 2,
      activeTasksCount: 4,
    },
    {
      id: "mem-3",
      userId: "user-designer-1",
      name: "Rohan Verma",
      email: "rohan@indianpixel.com",
      avatarUrl: null,
      role: "STAFF",
      isSuspended: false,
      joinedAt: "2026-07-01T10:00:00Z",
      permissionsDescription: "Deliverable Submissions & Production Scope (Rule T-1)",
      assignedProjects: [
        { id: "proj-1", name: "Mitti & Co. Brand Refresh", role: "DESIGNER" },
      ],
      assignedProjectsCount: 1,
      activeTasksCount: 2,
    },
    {
      id: "mem-4",
      userId: "user-dev-1",
      name: "Ananya Iyer",
      email: "ananya@indianpixel.com",
      avatarUrl: null,
      role: "STAFF",
      isSuspended: false,
      joinedAt: "2026-07-05T10:00:00Z",
      permissionsDescription: "Design Tokens & Frontend Code Scope",
      assignedProjects: [
        { id: "proj-2", name: "SaaS Design System", role: "DEVELOPER" },
      ],
      assignedProjectsCount: 1,
      activeTasksCount: 1,
    },
    {
      id: "mem-5",
      userId: "user-finance",
      name: "Neha Kulkarni",
      email: "neha@indianpixel.com",
      avatarUrl: null,
      role: "FINANCE",
      isSuspended: false,
      joinedAt: "2026-07-10T10:00:00Z",
      permissionsDescription: "Financial Invoicing, Payment Reconciliation, & Ledger Access (Rule PAY-1)",
      assignedProjects: [],
      assignedProjectsCount: 3,
      activeTasksCount: 0,
    },
  ];

  const team = (initialTeam && initialTeam.length > 0) ? initialTeam : defaultTeam;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Member Inspection Drawer State
  const [selectedMember, setSelectedMember] = useState<TeamMemberItem | null>(null);
  const [memberDrawerTab, setMemberDrawerTab] = useState("profile");

  // Invitation Modal State (3-step wizard)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteStep, setInviteStep] = useState<1 | 2 | 3>(1);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<GlobalRole>("STAFF");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredTeam = useMemo(() => {
    return team.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === "ALL" || m.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [team, searchQuery, roleFilter]);

  const handleInviteSubmit = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setErrorMessage("Name and email are required.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await inviteTeamMemberAction({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });

      setIsLoading(false);
      if (res.success) {
        setIsInviteModalOpen(false);
        setInviteName("");
        setInviteEmail("");
        setInviteStep(1);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to invite team member.");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: GlobalRole) => {
    try {
      await updateTeamMemberRoleAction({ memberId, newRole });
      router.refresh();
      if (selectedMember) {
        setSelectedMember({ ...selectedMember, role: newRole });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update role.");
    }
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleMemberSuspensionAction({
        userId,
        isSuspended: !currentStatus,
        reason: !currentStatus ? "Suspended by Administrator" : "Restored access",
      });
      router.refresh();
      if (selectedMember) {
        setSelectedMember({ ...selectedMember, isSuspended: !currentStatus });
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle suspension.");
    }
  };

  const memberTabs = [
    { id: "profile", label: "Profile & Role" },
    { id: "projects", label: "Projects & Tasks", count: selectedMember?.assignedProjectsCount || 0 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono border border-amber-500/25 uppercase tracking-wider">
              Rule T-1 Single Ownership
            </span>
            <span className="text-xs text-slate-500 font-mono">
              RBAC & Scoped Authorities
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Team & Contractor Roster
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {isClient
              ? "Studio specialists and project managers assigned to your engagements."
              : "Enforced single task ownership (Rule T-1) and strict zero-leakage role scoping (Rule G-6)."}
          </p>
        </div>

        {isSuperAdminOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setInviteStep(1);
              setErrorMessage(null);
              setIsInviteModalOpen(true);
            }}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Invite Team Member</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {["ALL", "SUPER_ADMIN", "ADMIN", "STAFF", "FINANCE"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                roleFilter === r
                  ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-white/[0.04]"
              }`}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Team Directory Table */}
      {filteredTeam.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description="No members match your search criteria or role filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setRoleFilter("ALL");
          }}
        />
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <div className="col-span-4">Team Member</div>
            <div className="col-span-3">Role & Authority</div>
            <div className="col-span-2 text-center">Workload</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/[0.04] text-xs">
            {filteredTeam.map((member) => (
              <div
                key={member.id}
                className="px-4 py-3 hover:bg-white/[0.02] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center"
              >
                {/* Col 1: Member Info */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0">
                    <span
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberDrawerTab("profile");
                      }}
                      className="font-semibold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer block truncate font-sans"
                    >
                      {member.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block truncate">
                      {member.email}
                    </span>
                  </div>
                </div>

                {/* Col 2: Role & Scope */}
                <div className="col-span-3 space-y-0.5 min-w-0 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-amber-300 text-[10px] font-semibold border border-white/[0.06]">
                    {member.role.replace("_", " ")}
                  </span>
                  <p className="text-[10px] text-slate-500 truncate">
                    {member.permissionsDescription}
                  </p>
                </div>

                {/* Col 3: Workload */}
                <div className="col-span-2 text-left lg:text-center font-mono text-[11px] text-slate-400">
                  <span>{member.assignedProjectsCount} Projects • {member.activeTasksCount} Tasks</span>
                </div>

                {/* Col 4: Status */}
                <div className="col-span-1 lg:text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${member.isSuspended ? "bg-rose-950/60 text-rose-400 border-rose-500/20" : "bg-emerald-950/60 text-emerald-400 border-emerald-500/20"}`}>
                    {member.isSuspended ? "SUSPENDED" : "ACTIVE"}
                  </span>
                </div>

                {/* Col 5: Actions */}
                <div className="col-span-2 flex items-center justify-between lg:justify-end gap-2 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedMember(member);
                      setMemberDrawerTab("profile");
                    }}
                    className="h-7 text-xs px-2.5"
                  >
                    <span>Dossier</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Dossier Modal */}
      {selectedMember && (
        <Modal
          isOpen={Boolean(selectedMember)}
          onClose={() => setSelectedMember(null)}
          title={selectedMember.name}
          description={`Member Profile • ${selectedMember.role.replace("_", " ")}`}
          size="md"
        >
          <div className="space-y-4 text-xs font-sans">
            <Tabs tabs={memberTabs} activeTab={memberDrawerTab} onChange={setMemberDrawerTab} />

            {memberDrawerTab === "profile" && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.08] space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Email Address:</span>
                    <strong className="text-slate-200">{selectedMember.email}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Global Role (Rule G-6):</span>
                    <strong className="text-amber-300">{selectedMember.role}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Joined Workspace:</span>
                    <strong className="text-slate-200">{formatDate(selectedMember.joinedAt)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account Status (Rule G-7):</span>
                    <strong className={selectedMember.isSuspended ? "text-rose-400" : "text-emerald-400"}>
                      {selectedMember.isSuspended ? "SUSPENDED (Non-destructive)" : "ACTIVE"}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
                    Permissions & Authority Matrix
                  </span>
                  <p className="text-slate-300 text-xs">
                    {selectedMember.permissionsDescription}
                  </p>
                </div>

                {isSuperAdminOrAdmin && selectedMember.role !== "SUPER_ADMIN" && (
                  <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.06] space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                      Administrative Role Management
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMember.role}
                        onChange={(e) => handleRoleChange(selectedMember.id, e.target.value as GlobalRole)}
                        className="rounded bg-white/[0.04] border border-white/[0.10] px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="STAFF">STAFF</option>
                        <option value="FINANCE">FINANCE</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>

                      <Button
                        size="sm"
                        variant={selectedMember.isSuspended ? "primary" : "secondary"}
                        onClick={() => handleToggleSuspension(selectedMember.userId, selectedMember.isSuspended)}
                        className="h-7 text-xs px-2.5"
                      >
                        {selectedMember.isSuspended ? "Restore Access" : "Suspend Member"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {memberDrawerTab === "projects" && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">
                  Assigned Engagements ({selectedMember.assignedProjects.length})
                </span>
                {selectedMember.assignedProjects.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">
                    No individual project roles assigned.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.assignedProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between text-xs font-sans"
                      >
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          {p.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: 3-Step Member Invitation Wizard */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Workspace Member"
        description="Grants scoped role and permissions to a studio team member or contractor (Rule G-6)."
        size="sm"
      >
        <div className="space-y-3.5 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Wizard step indicator */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/[0.06] text-center font-mono text-[10px]">
            <div className={`p-1.5 rounded border ${inviteStep >= 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              1. Identity
            </div>
            <div className={`p-1.5 rounded border ${inviteStep === 2 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              2. Role & Access
            </div>
          </div>

          {inviteStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sengupta"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@indianpixel.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>
          )}

          {inviteStep === 2 && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Global Workspace Role (Rule G-6):</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as GlobalRole)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40 font-mono"
                >
                  <option value="STAFF">STAFF (Designers, Developers, Specialists)</option>
                  <option value="ADMIN">ADMIN (PMs, Resource Managers)</option>
                  <option value="FINANCE">FINANCE (Billing & Reconciliation)</option>
                  <option value="VIEWER">VIEWER (Read-Only Observer)</option>
                </select>
              </div>

              <div className="p-3 rounded bg-[#030706] border border-white/[0.04] text-[11px] text-slate-400 space-y-1 font-mono">
                <span className="text-slate-200 font-semibold block uppercase text-[10px]">Permission Preview:</span>
                <p>
                  {inviteRole === "STAFF" && "Can be assigned tasks, submit deliverable versions, and participate in project reviews."}
                  {inviteRole === "ADMIN" && "Can create projects, assign PMs, invite team members, and activate deliverables."}
                  {inviteRole === "FINANCE" && "Can issue invoices, reconcile payments, and manage credit notes."}
                  {inviteRole === "VIEWER" && "Read-only access to assigned projects and deliverables."}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-white/[0.08]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (inviteStep === 1) setIsInviteModalOpen(false);
                else setInviteStep(1);
              }}
            >
              {inviteStep === 1 ? "Cancel" : "Back"}
            </Button>

            {inviteStep === 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!inviteName.trim() || !inviteEmail.trim()) {
                    setErrorMessage("Name and email are required.");
                    return;
                  }
                  setErrorMessage(null);
                  setInviteStep(2);
                }}
              >
                <span>Continue</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                onClick={handleInviteSubmit}
              >
                <span>Send Invitation</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
