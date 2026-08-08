"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Users, Shield, Briefcase, Mail, CheckCircle2, UserCheck, Plus } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function TeamView() {
  const { state, reassignTask } = useApp();

  const members = [
    {
      id: "user-super-admin",
      name: "Krishna Mishra",
      role: "Super Admin & Founder",
      type: "INTERNAL_CORE",
      email: "krishna@indianpixel.com",
      assignedProjects: 3,
      assignedTasks: 0,
      status: "ACTIVE",
      permissions: "Full Global Authority (Rule G-6)",
    },
    {
      id: "user-pm-1",
      name: "Aarav Sharma",
      role: "Project Manager Lead",
      type: "INTERNAL_STAFF",
      email: "aarav@indianpixel.com",
      assignedProjects: 2,
      assignedTasks: 4,
      status: "ACTIVE",
      permissions: "Milestone Submissions & PM Overrides (Rule P-2)",
    },
    {
      id: "user-designer-1",
      name: "Rohan Verma",
      role: "Senior Packaging & Print Designer",
      type: "INTERNAL_STAFF",
      email: "rohan@indianpixel.com",
      assignedProjects: 1,
      assignedTasks: 2,
      status: "ACTIVE",
      permissions: "Deliverable Submissions (Rule T-1)",
    },
    {
      id: "user-dev-1",
      name: "Ananya Iyer",
      role: "Design Systems & Frontend Engineer",
      type: "INTERNAL_STAFF",
      email: "ananya@indianpixel.com",
      assignedProjects: 1,
      assignedTasks: 1,
      status: "ACTIVE",
      permissions: "Code Deliverables & Token Exports",
    },
    {
      id: "user-freelance-1",
      name: "Vikram Sengupta",
      role: "3D Motion & Sound Designer",
      type: "FREELANCER_SCOPED",
      email: "vikram.motion@external.co",
      assignedProjects: 1,
      assignedTasks: 1,
      status: "ACTIVE",
      permissions: "Scoped Project Access Only (Rule G-6 No Cross-Client Visibility)",
    },
    {
      id: "user-finance",
      name: "Neha Kulkarni",
      role: "Finance & Accounts Lead",
      type: "INTERNAL_STAFF",
      email: "neha@indianpixel.com",
      assignedProjects: 3,
      assignedTasks: 0,
      status: "ACTIVE",
      permissions: "Payment Reconciliations & Invoicing (Rule PAY-1)",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Team & Freelancer Operations</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium border border-brand-cta/30">
              {members.length} Members
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Enforced single ownership (Rule T-1) and strict zero-leakage role scoping for contractors and freelancers (Rule G-6).
          </p>
        </div>

        <Button variant="primary" size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>Invite Member</span>
        </Button>
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-4 hover:border-brand-cta/30 transition-all shadow-elevation-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size="md" />
                <div>
                  <h3 className="text-sm font-semibold font-heading text-brand-light">
                    {member.name}
                  </h3>
                  <span className="text-xs text-brand-cta font-medium block">
                    {member.role}
                  </span>
                </div>
              </div>
              <StatusBadge status={member.status} />
            </div>

            <div className="space-y-1 text-xs text-brand-counter border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Mail className="h-3 w-3 text-brand-cta" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] mt-1">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span className="font-mono text-[10px]">{member.type}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-white/5 text-[11px] text-brand-counter font-mono">
              <span className="text-brand-light font-semibold block text-[10px] uppercase">
                Scope & Authority:
              </span>
              {member.permissions}
            </div>

            <div className="flex items-center justify-between text-xs text-brand-counter pt-2 border-t border-white/5">
              <span>{member.assignedProjects} Projects</span>
              <span>{member.assignedTasks} Active Tasks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
