"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  FileText,
  Download,
  Eye,
  History,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function FilesView() {
  const { state } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const deliverables = [
    {
      id: "deliv-101",
      name: "Mitti_Matte_Gold_DieLines_v2.0.ai",
      projectName: "Mitti & Co. Brand Refresh & Packaging",
      milestoneName: "Primary Box Packaging Design",
      category: "PRINT_DIELINE",
      version: "v2.0",
      previousVersion: "v1.0 (Preserved)",
      author: "Rohan Verma (Designer)",
      size: "48.2 MB",
      dimensions: "300 DPI Vector CMYK + Pantone 871C",
      status: "UNDER_REVIEW",
      uploadedAt: "2026-08-08T10:15:00Z",
      previewUrl: null,
      verificationHash: "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    {
      id: "deliv-102",
      name: "Mitti_Amber_Glass_Studio_Render_4K.png",
      projectName: "Mitti & Co. Brand Refresh & Packaging",
      milestoneName: "Primary Box Packaging Design",
      category: "3D_RENDER",
      version: "v1.0",
      previousVersion: null,
      author: "Rohan Verma (Designer)",
      size: "18.6 MB",
      dimensions: "3840 x 2160 (16:9)",
      status: "APPROVED",
      uploadedAt: "2026-08-07T16:30:00Z",
      previewUrl: null,
      verificationHash: "sha256-a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    },
    {
      id: "deliv-103",
      name: "TechSol_Design_Tokens_TokensStudio.json",
      projectName: "SaaS Design System & Marketing Site",
      milestoneName: "Enterprise Design Tokens & Typography",
      category: "TOKENS_CODE",
      version: "v1.2",
      previousVersion: "v1.1",
      author: "Ananya Iyer (Developer)",
      size: "240 KB",
      dimensions: "Figma Tokens Sync Validated",
      status: "COMPLETED",
      uploadedAt: "2026-08-01T11:00:00Z",
      previewUrl: null,
      verificationHash: "sha256-4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865",
    },
    {
      id: "deliv-104",
      name: "VallyHound_Cinematic_Teaser_Master_ProRes.mov",
      projectName: "Vally & Hound Luxury Outdoors Identity",
      milestoneName: "3D Motion Reveal Teaser",
      category: "MOTION_VIDEO",
      version: "v1.0",
      previousVersion: null,
      author: "Vikram Sengupta (Freelancer)",
      size: "1.4 GB",
      dimensions: "4K 60FPS ProRes 422 HQ + Dolby 5.1",
      status: "APPROVED",
      uploadedAt: "2026-07-18T12:00:00Z",
      previewUrl: null,
      verificationHash: "sha256-53c234e5e8472b6ac51c1ae1cab3fe06fad053beb8ebfd8977b010655bfdd3c3",
    },
  ];

  const filtered = deliverables.filter((d) => {
    const matchCat = selectedCategory === "ALL" || d.category === selectedCategory;
    const matchQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-light flex items-center gap-2">
            <span>Deliverables Vault & Version Registry</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30">
              Rule S-4 Immutable Versions
            </span>
          </h1>
          <p className="text-xs text-brand-counter mt-1 font-sans">
            Every client deliverable is cryptographically verified, version-locked, and permanently preserved with historical audits.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg border border-white/10 bg-brand-dark/95 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="h-4 w-4 text-brand-cta flex-shrink-0" />
          <input
            type="text"
            placeholder="Search deliverables, authors, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-white/10 bg-brand-main-dark px-3 py-1.5 text-brand-light placeholder:text-brand-counter/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {["ALL", "PRINT_DIELINE", "3D_RENDER", "TOKENS_CODE", "MOTION_VIDEO"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                selectedCategory === cat
                  ? "bg-brand-cta text-black font-semibold"
                  : "bg-white/5 text-brand-counter hover:text-brand-light hover:bg-white/10"
              }`}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Deliverables List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-lg border border-white/10 bg-brand-dark/90 hover:border-brand-cta/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-elevation-1"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-brand-light text-sm">{item.name}</span>
                <span className="px-2 py-0.5 rounded bg-brand-cta/20 text-brand-cta font-mono text-[10px] font-semibold">
                  {item.version}
                </span>
                <StatusBadge status={item.status} />
              </div>

              <p className="text-brand-counter text-[11px]">
                Project: <strong>{item.projectName}</strong> • Milestone: <em>{item.milestoneName}</em>
              </p>

              <div className="flex items-center gap-4 text-[10px] font-mono text-brand-counter/70">
                <span>Author: {item.author}</span>
                <span>Size: {item.size}</span>
                <span>Specs: {item.dimensions}</span>
              </div>

              {item.previousVersion && (
                <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                  <History className="h-3 w-3" />
                  <span>Prior State Preserved: {item.previousVersion}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
              <Button size="sm" variant="secondary" className="text-xs h-7">
                <Eye className="h-3 w-3 mr-1 text-brand-cta" />
                <span>Inspect Asset</span>
              </Button>
              <Button size="sm" variant="primary" className="text-xs h-7">
                <Download className="h-3 w-3 mr-1" />
                <span>Download Proof</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
