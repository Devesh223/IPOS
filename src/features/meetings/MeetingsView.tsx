"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { Calendar, Video, Clock, CheckCircle2, User, FileText, Plus, Shield } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MeetingsView() {
  const { state } = useApp();

  const meetings = [
    {
      id: "meet-101",
      title: "Packaging Die-Line & Foil Review",
      clientName: "Mitti & Co.",
      date: "2026-08-10",
      time: "15:00 IST (3:00 PM)",
      host: "Aarav Sharma (PM)",
      attendees: ["Devika Sen (Client)", "Rohan Verma (Designer)", "Aarav Sharma (PM)"],
      status: "SCHEDULED",
      agenda: "Review physical foil stamp proofs and resolve matte packaging finish objections.",
      meetingLink: "https://meet.google.com/ip-mitti-review",
      hasRecordedDecisions: false,
    },
    {
      id: "meet-102",
      title: "SaaS Design Token Sign-off & Handover",
      clientName: "Tech Solutions Inc.",
      date: "2026-08-01",
      time: "11:00 IST (11:00 AM)",
      host: "Priya Patel (PM)",
      attendees: ["Siddharth Rao (Client)", "Ananya Iyer (Dev)", "Priya Patel (PM)"],
      status: "COMPLETED",
      agenda: "Figma token sync verified. Client engineering team confirmed WCAG AA compliance.",
      meetingLink: "https://meet.google.com/ip-techsol-handoff",
      hasRecordedDecisions: true,
      decisionSummary: "Approved token set. Invoice INV-2026-002 flagged for finance settlement.",
    },
    {
      id: "meet-103",
      title: "Luxury 3D Motion Teaser Kick-off",
      clientName: "Vally & Hound",
      date: "2026-07-15",
      time: "17:00 IST (5:00 PM)",
      host: "Aarav Sharma (PM)",
      attendees: ["Kabir Mehra (Client)", "Vikram Sengupta (Motion)", "Krishna Mishra"],
      status: "COMPLETED",
      agenda: "Spatial audio direction, particle simulation parameters, and master color grade.",
      meetingLink: "https://meet.google.com/ip-vally-kickoff",
      hasRecordedDecisions: true,
      decisionSummary: "Approved 4K 60FPS deliverable target. Advance payment received via NEFT.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Client Review Sessions & Meetings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium border border-brand-cta/30">
              Rule M-1 Structured Syncs
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Every meeting is agenda-bound with formal decision logs synced directly to project milestone gates.
          </p>
        </div>

        <Button variant="primary" size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>Schedule Review Session</span>
        </Button>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {meetings.map((meet) => (
          <div
            key={meet.id}
            className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-3 shadow-elevation-1"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-brand-counter">
                    {meet.clientName}
                  </span>
                  <StatusBadge status={meet.status} />
                </div>
                <h3 className="text-base font-semibold text-brand-light font-heading mt-1">
                  {meet.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {meet.status === "SCHEDULED" ? (
                  <Button size="sm" variant="primary" className="text-xs">
                    <Video className="h-3.5 w-3.5 mr-1" />
                    <span>Join Google Meet</span>
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1 text-brand-cta" />
                    <span>View Decision Log</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-brand-counter">
              <div>
                <span className="text-[10px] font-mono uppercase block">Date & Time</span>
                <span className="font-medium text-brand-light mt-0.5 block font-mono">
                  {meet.date} • {meet.time}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase block">Host / PM</span>
                <span className="font-medium text-brand-light mt-0.5 block">{meet.host}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase block">Attendees</span>
                <span className="font-medium text-brand-light mt-0.5 block">
                  {meet.attendees.length} Confirmed
                </span>
              </div>
            </div>

            <div className="p-3 rounded bg-white/5 border border-white/5 text-xs text-brand-counter space-y-1">
              <span className="font-semibold text-brand-light block">Session Agenda:</span>
              <p>{meet.agenda}</p>
              {meet.decisionSummary && (
                <div className="pt-2 border-t border-white/5 text-emerald-400 font-mono text-[11px]">
                  <strong>Recorded Decision:</strong> {meet.decisionSummary}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
