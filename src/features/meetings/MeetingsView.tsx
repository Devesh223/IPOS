"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import {
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  User,
  FileText,
  Plus,
  Shield,
  ExternalLink,
  Search,
  Users,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Building2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { scheduleMeetingAction, recordMeetingDecisionAction } from "@/actions/meetings";

interface MeetingItem {
  id: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  title: string;
  agenda: string;
  meetingTime: string;
  dateFormatted: string;
  timeFormatted: string;
  durationMinutes: number;
  meetingUrl: string;
  status: string;
  attendees: Array<{
    id: string;
    userId: string | null;
    clientContactId: string | null;
    name: string;
    email: string;
    isSignatory: boolean;
    attended: boolean;
  }>;
  notes: Array<{
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    isClientVisible: boolean;
    createdAt: string;
  }>;
  hasRecordedDecisions: boolean;
  decisionSummary: string | null;
}

export function MeetingsView({
  initialMeetings,
  initialProjects,
  initialTeamMembers,
}: {
  initialMeetings?: MeetingItem[];
  initialProjects?: any[];
  initialTeamMembers?: any[];
}) {
  const router = useRouter();
  const { session } = useApp();

  const isClient = session?.isClient ?? false;
  const isStudioStaff = !isClient;

  const defaultMeetings: MeetingItem[] = [
    {
      id: "meet-101",
      workspaceId: "ws_indian_pixel",
      projectId: "proj-1",
      projectName: "Mitti & Co. Brand Refresh",
      clientId: "client-1",
      clientName: "Mitti & Co.",
      title: "Packaging Die-Line & Foil Review",
      agenda: "Review physical foil stamp proofs and resolve matte packaging finish objections for primary cosmetic bottle range.",
      meetingTime: "2026-08-20T15:00:00Z",
      dateFormatted: "2026-08-20",
      timeFormatted: "3:00 PM",
      durationMinutes: 45,
      meetingUrl: "https://meet.google.com/ip-mitti-review",
      status: "SCHEDULED",
      attendees: [
        {
          id: "att-1",
          userId: null,
          clientContactId: "cc-1",
          name: "Devika Sen",
          email: "devika@mitti.in",
          isSignatory: true,
          attended: false,
        },
        {
          id: "att-2",
          userId: "user-1",
          clientContactId: null,
          name: "Rohan Verma",
          email: "rohan@indianpixel.com",
          isSignatory: false,
          attended: false,
        },
        {
          id: "att-3",
          userId: "user-pm-1",
          clientContactId: null,
          name: "Aarav Sharma",
          email: "aarav@indianpixel.com",
          isSignatory: false,
          attended: false,
        },
      ],
      notes: [],
      hasRecordedDecisions: false,
      decisionSummary: null,
    },
    {
      id: "meet-102",
      workspaceId: "ws_indian_pixel",
      projectId: "proj-2",
      projectName: "SaaS Design System & Marketing Site",
      clientId: "client-2",
      clientName: "Tech Solutions Inc.",
      title: "SaaS Design Token Sign-off & Handover",
      agenda: "Figma token sync verification, Tailwind preset handoff, and WCAG AA contrast validation.",
      meetingTime: "2026-08-04T11:00:00Z",
      dateFormatted: "2026-08-04",
      timeFormatted: "11:00 AM",
      durationMinutes: 60,
      meetingUrl: "https://meet.google.com/ip-techsol-handoff",
      status: "COMPLETED",
      attendees: [
        {
          id: "att-4",
          userId: null,
          clientContactId: "cc-2",
          name: "Siddharth Rao",
          email: "siddharth@techsol.io",
          isSignatory: true,
          attended: true,
        },
        {
          id: "att-5",
          userId: "user-2",
          clientContactId: null,
          name: "Ananya Iyer",
          email: "ananya@indianpixel.com",
          isSignatory: false,
          attended: true,
        },
      ],
      notes: [
        {
          id: "note-1",
          authorId: "user-pm-2",
          authorName: "Priya Patel",
          content: "Approved enterprise token repository. Client confirmed WCAG AA compliance and authorized invoice settlement.",
          isClientVisible: true,
          createdAt: "2026-08-04T12:15:00Z",
        },
      ],
      hasRecordedDecisions: true,
      decisionSummary: "Approved enterprise token repository. Client confirmed WCAG AA compliance and authorized invoice settlement.",
    },
    {
      id: "meet-103",
      workspaceId: "ws_indian_pixel",
      projectId: "proj-3",
      projectName: "Vally & Hound Luxury Outdoors",
      clientId: "client-3",
      clientName: "Vally & Hound",
      title: "Luxury 3D Motion Teaser Kick-off",
      agenda: "Spatial audio direction, particle simulation parameters, and master color grade palette.",
      meetingTime: "2026-07-18T17:00:00Z",
      dateFormatted: "2026-07-18",
      timeFormatted: "5:00 PM",
      durationMinutes: 45,
      meetingUrl: "https://meet.google.com/ip-vally-kickoff",
      status: "COMPLETED",
      attendees: [
        {
          id: "att-6",
          userId: null,
          clientContactId: "cc-3",
          name: "Kabir Mehra",
          email: "kabir@vallyhound.com",
          isSignatory: true,
          attended: true,
        },
        {
          id: "att-7",
          userId: "user-3",
          clientContactId: null,
          name: "Vikram Sengupta",
          email: "vikram@indianpixel.com",
          isSignatory: false,
          attended: true,
        },
      ],
      notes: [
        {
          id: "note-2",
          authorId: "user-pm-1",
          authorName: "Aarav Sharma",
          content: "Approved 4K 60FPS deliverable target. Advance milestone invoice IP-INV-2026-0003 verified received.",
          isClientVisible: true,
          createdAt: "2026-07-18T18:00:00Z",
        },
      ],
      hasRecordedDecisions: true,
      decisionSummary: "Approved 4K 60FPS deliverable target. Advance milestone invoice IP-INV-2026-0003 verified received.",
    },
  ];

  const meetings = (initialMeetings && initialMeetings.length > 0)
    ? initialMeetings
    : defaultMeetings;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Inspection Drawer State
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [meetingTab, setMeetingTab] = useState("agenda");

  // Scheduling Modal State (4-step guided wizard)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [targetProjectId, setTargetProjectId] = useState(initialProjects?.[0]?.id || "proj-1");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("2026-08-25");
  const [meetingTime, setMeetingTime] = useState("15:00");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Record Decision Modal State
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionMeeting, setDecisionMeeting] = useState<MeetingItem | null>(null);
  const [decisionText, setDecisionText] = useState("");
  const [isClientVisible, setIsClientVisible] = useState(true);

  // Prioritize upcoming meetings first
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => {
      if (a.status === "SCHEDULED" && b.status !== "SCHEDULED") return -1;
      if (a.status !== "SCHEDULED" && b.status === "SCHEDULED") return 1;
      return new Date(b.meetingTime).getTime() - new Date(a.meetingTime).getTime();
    });
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    return sortedMeetings.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.agenda.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "UPCOMING" && m.status === "SCHEDULED") ||
        (statusFilter === "COMPLETED" && m.status === "COMPLETED");

      return matchSearch && matchStatus;
    });
  }, [sortedMeetings, searchQuery, statusFilter]);

  const handleScheduleSubmit = async () => {
    if (!meetingTitle.trim()) {
      setErrorMessage("Meeting title is required.");
      return;
    }
    if (!meetingAgenda.trim()) {
      setErrorMessage("Please define an agenda topic.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const isoDateTime = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
      const res = await scheduleMeetingAction({
        projectId: targetProjectId,
        title: meetingTitle,
        agenda: meetingAgenda,
        meetingTime: isoDateTime,
        durationMinutes,
      });

      setIsLoading(false);
      if (res.success) {
        setIsScheduleModalOpen(false);
        setMeetingTitle("");
        setMeetingAgenda("");
        setWizardStep(1);
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to schedule meeting.");
    }
  };

  const handleRecordDecisionSubmit = async () => {
    if (!decisionText.trim()) {
      setErrorMessage("Decision summary cannot be empty.");
      return;
    }
    if (!decisionMeeting) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await recordMeetingDecisionAction({
        meetingId: decisionMeeting.id,
        decisionText,
        isClientVisible,
      });

      setIsLoading(false);
      if (res.success) {
        setIsDecisionModalOpen(false);
        setDecisionText("");
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to record decision.");
    }
  };

  const meetingDetailTabs = [
    { id: "agenda", label: "Agenda & Objectives" },
    { id: "attendees", label: "Participants", count: selectedMeeting?.attendees.length || 0 },
    { id: "decisions", label: "Decision Record", count: selectedMeeting?.notes.length || 0 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/25 uppercase tracking-wider">
              Rule M-1 Structured Syncs
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Agenda & Decision Protocol
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Client Review Sessions & Meetings
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {isClient
              ? "Review sessions and formal decision records bound to your project milestones."
              : "Every studio review is agenda-bound with formal decision logs synced directly to milestone gates."}
          </p>
        </div>

        {isStudioStaff && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setWizardStep(1);
              setErrorMessage(null);
              setIsScheduleModalOpen(true);
            }}
            className="text-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Schedule Review</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sessions by title, client, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: "All Sessions" },
            { id: "UPCOMING", label: "Upcoming Reviews" },
            { id: "COMPLETED", label: "Decided & Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25"
                  : "bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings Registry Table */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No review sessions found"
          description="No sessions match your search or status filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <div className="col-span-4">Session Title & Client</div>
            <div className="col-span-3">Project & Agenda</div>
            <div className="col-span-2 text-center">Date & Time</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filteredMeetings.map((meet) => (
              <div
                key={meet.id}
                className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center text-xs"
              >
                {/* Col 1: Title & Client */}
                <div className="col-span-4 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => {
                        setSelectedMeeting(meet);
                        setMeetingTab("agenda");
                      }}
                      className="font-mono font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer truncate"
                    >
                      {meet.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06]">
                      {meet.clientName}
                    </span>
                  </div>
                  {meet.decisionSummary ? (
                    <p className="text-[11px] text-emerald-400/90 font-mono truncate flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                      <span>Decided: {meet.decisionSummary}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 truncate">
                      {meet.agenda || "Agenda-bound sync"}
                    </p>
                  )}
                </div>

                {/* Col 2: Project */}
                <div className="col-span-3 space-y-0.5 min-w-0">
                  <span className="font-semibold text-slate-200 block truncate">
                    {meet.projectName}
                  </span>
                  <p className="text-[10px] font-mono text-slate-500">
                    {meet.attendees.length} Confirmed Participants
                  </p>
                </div>

                {/* Col 3: Date & Time */}
                <div className="col-span-2 text-left lg:text-center space-y-0.5 font-mono">
                  <span className="text-slate-200 font-bold block">{meet.dateFormatted}</span>
                  <span className="text-[10px] text-slate-400 block">{meet.timeFormatted} ({meet.durationMinutes}m)</span>
                </div>

                {/* Col 4: Status */}
                <div className="col-span-1 lg:text-center">
                  <StatusBadge status={meet.status} className="text-[9px] px-1.5 py-0.5" />
                </div>

                {/* Col 5: Actions */}
                <div className="col-span-2 flex items-center justify-between lg:justify-end gap-2 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedMeeting(meet);
                      setMeetingTab("agenda");
                    }}
                    className="h-7 text-xs px-2.5"
                  >
                    <span>Dossier</span>
                  </Button>

                  {meet.status === "SCHEDULED" ? (
                    <a href={meet.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="primary" className="h-7 text-xs px-2.5">
                        <Video className="h-3 w-3 mr-1" />
                        <span>Join</span>
                      </Button>
                    </a>
                  ) : isStudioStaff && !meet.hasRecordedDecisions ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setDecisionMeeting(meet);
                        setDecisionText("");
                        setIsDecisionModalOpen(true);
                      }}
                      className="h-7 text-xs px-2.5"
                    >
                      <span>Log Decision</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Detail Dossier Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={Boolean(selectedMeeting)}
          onClose={() => setSelectedMeeting(null)}
          title={selectedMeeting.title}
          description={`Review session for ${selectedMeeting.projectName} • ${selectedMeeting.dateFormatted} at ${selectedMeeting.timeFormatted}`}
          size="lg"
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Dossier Tabs */}
            <Tabs tabs={meetingDetailTabs} activeTab={meetingTab} onChange={setMeetingTab} />

            {/* TAB 1: AGENDA */}
            {meetingTab === "agenda" && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[#030706] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                    Session Agenda & Deliverable Scope
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {selectedMeeting.agenda || "No written agenda specified."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#030706] border border-white/[0.06] font-mono text-xs text-slate-400">
                  <div>Scheduled Date: <strong className="text-slate-200">{selectedMeeting.dateFormatted}</strong></div>
                  <div>Duration: <strong className="text-slate-200">{selectedMeeting.durationMinutes} Minutes</strong></div>
                </div>

                {selectedMeeting.status === "SCHEDULED" && (
                  <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-between">
                    <span className="text-emerald-300 font-mono text-xs">Video Call Room Prepared</span>
                    <a href={selectedMeeting.meetingUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="primary" className="h-7 text-xs">
                        <Video className="h-3 w-3 mr-1" />
                        <span>Launch Google Meet</span>
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {meetingTab === "attendees" && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-200 block">
                  Confirmed Participants & Signatories ({selectedMeeting.attendees.length})
                </span>
                {selectedMeeting.attendees.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between text-xs font-sans"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{att.name}</span>
                        {att.isSignatory && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                            Authorized Signatory
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{att.email || "Studio Team Member"}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Confirmed</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: DECISION LOG */}
            {meetingTab === "decisions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Recorded Decisions (Rule M-1)
                  </span>
                  {isStudioStaff && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setDecisionMeeting(selectedMeeting);
                        setDecisionText("");
                        setIsDecisionModalOpen(true);
                      }}
                      className="h-6 text-[10px] px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span>Record Formal Decision</span>
                    </Button>
                  )}
                </div>

                {selectedMeeting.notes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    No decisions recorded yet. Decisions will be recorded upon session conclusion.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedMeeting.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.06] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-emerald-400 text-[10px] font-semibold uppercase">
                            Formal Milestone Decision
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed font-sans">
                          {note.content}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Recorded by: {note.authorName}
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

      {/* Modal: 3-Step Guided Scheduling Wizard */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Milestone Review Session"
        description="Creates an agenda-bound review session with Google Meet room and attendee notifications (Rule M-1)."
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
            <div className={`p-1.5 rounded border ${wizardStep >= 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              1. Project & Time
            </div>
            <div className={`p-1.5 rounded border ${wizardStep === 2 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold" : "border-white/[0.04] text-slate-500"}`}>
              2. Title & Agenda
            </div>
          </div>

          {wizardStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Target Project Engagement:</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                >
                  {(initialProjects && initialProjects.length > 0 ? initialProjects : [
                    { id: "proj-1", name: "Mitti & Co. Brand Refresh" },
                    { id: "proj-2", name: "SaaS Design System & Marketing Site" },
                    { id: "proj-3", name: "Vally & Hound Luxury Outdoors" },
                  ]).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Session Date:</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-200 block mb-1">Session Time (IST):</label>
                  <input
                    type="time"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Estimated Duration:</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40 font-mono"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Standard)</option>
                  <option value={60}>60 Minutes (Deep Dive)</option>
                </select>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Review Session Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Refresh Packaging Die-Line Review"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Session Agenda & Deliverables (Mandatory):</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Review physical packaging gold foil proofs and resolve Pantone finish feedback."
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-white/[0.08]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (wizardStep === 1) setIsScheduleModalOpen(false);
                else setWizardStep(1);
              }}
            >
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>

            {wizardStep === 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setWizardStep(2)}
              >
                <span>Continue</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                onClick={handleScheduleSubmit}
              >
                <span>Schedule Session</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Record Formal Decision */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title="Record Formal Review Decision"
        description={`Record official milestone sign-off decision for '${decisionMeeting?.title ?? "Session"}'.`}
        size="sm"
      >
        <div className="space-y-3.5 text-xs font-sans">
          {errorMessage && (
            <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Official Decision Record (Mandatory):</label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Approved packaging die-lines for Mitti & Co. Client authorized invoice settlement."
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <label className="flex items-center gap-2 p-2 rounded bg-white/[0.02] border border-white/[0.06] cursor-pointer">
            <input
              type="checkbox"
              checked={isClientVisible}
              onChange={(e) => setIsClientVisible(e.target.checked)}
              className="rounded border-white/20 bg-[#030706] text-amber-500 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-300">
              Visible to Client Stakeholders & Signatories
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleRecordDecisionSubmit}>
              <span>Commit Decision</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
