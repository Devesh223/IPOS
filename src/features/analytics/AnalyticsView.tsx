"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import { TrendingUp, Activity, CheckCircle, AlertOctagon, Users, Zap } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function AnalyticsView() {
  const { state } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Studio Velocity & Operations Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cta/20 text-brand-cta font-mono font-medium border border-brand-cta/30">
              Live Metrics
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Real-time throughput metrics, rework frequency, PM milestone cadence, and sprint delivery health.
          </p>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Task Completion Rate</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              91.4%
            </div>
            <p className="text-[10px] text-emerald-400 mt-1">+4.2% vs target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Approval First-Pass Yield</span>
              <CheckCircle className="h-4 w-4 text-brand-cta" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              88.0%
            </div>
            <p className="text-[10px] text-brand-counter mt-1">12 of 14 approved without rework</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Average PM Response Time</span>
              <Zap className="h-4 w-4 text-sky-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              1.8 Hours
            </div>
            <p className="text-[10px] text-sky-400 mt-1">SLA Target: &lt; 4 Hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <span className="text-[11px] font-mono text-brand-counter uppercase flex items-center justify-between">
              <span>Formal Reopen Rate</span>
              <AlertOctagon className="h-4 w-4 text-purple-400" />
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-heading text-brand-light">
              1 Event
            </div>
            <p className="text-[10px] text-purple-400 mt-1">Rule A-3 logged with justification</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Chart Simulation & Performance */}
      <div className="p-5 rounded-lg border border-white/10 bg-brand-dark/95 space-y-4">
        <h2 className="text-sm font-semibold font-heading text-brand-light">
          Weekly Production Throughput & Milestone Velocity
        </h2>
        <div className="h-48 flex items-end gap-3 pt-6 px-2 border-b border-white/10">
          {[
            { week: "W28", tasks: 12, height: "45%" },
            { week: "W29", tasks: 18, height: "65%" },
            { week: "W30", tasks: 22, height: "80%" },
            { week: "W31", tasks: 16, height: "60%" },
            { week: "W32", tasks: 26, height: "95%" },
          ].map((bar) => (
            <div key={bar.week} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-mono text-brand-cta">{bar.tasks} Tasks</span>
              <div
                className="w-full bg-gradient-to-t from-brand-cta/20 to-brand-cta rounded-t-md transition-all hover:brightness-125"
                style={{ height: bar.height }}
              />
              <span className="text-[10px] font-mono text-brand-counter">{bar.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
