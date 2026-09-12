"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Plus,
  ArrowRight,
  AlertTriangle,
  Upload,
  MessageSquare,
  Check,
  X,
  Clock,
  User,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { createDeliverableVersionAction, submitDeliverableReviewAction } from "@/actions/deliverables";
import { recordApprovalDecisionAction } from "@/actions/approvals";

interface DeliverableItem {
  id: string;
  workspaceId: string;
  taskId: string;
  taskName: string;
  milestoneId: string;
  milestoneName: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  status: string;
  currentVersion: number;
  isClientVisible: boolean;
  authorName: string;
  authorEmail: string;
  hasActiveAgreement: boolean;
  hasUnsettledInvoices: boolean;
  createdAt: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    fileId: string | null;
    submittedById: string;
    submittedByName: string;
    submittedByEmail: string;
    changeSummary: string;
    createdAt: string;
    reviewsCount: number;
  }>;
  reviews: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string;
    isClientReviewer: boolean;
    versionNumber: number;
    content: string;
    status: string;
    createdAt: string;
  }>;
  files: Array<{
    id: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    uploaderName: string;
    createdAt: string;
  }>;
}

export function FilesView({
  initialDeliverables,
  initialFiles,
  initialProjects,
}: {
  initialDeliverables?: DeliverableItem[];
  initialFiles?: any[];
  initialProjects?: any[];
}) {
  const router = useRouter();
  const { session } = useApp();

  const isClient = session?.isClient ?? false;
  const isStudioStaff = !isClient;

  // Fallback data if not loaded
  const defaultDeliverables: DeliverableItem[] = [
    {
      id: "deliv-101",
      workspaceId: "ws_indian_pixel",
      taskId: "task-1",
      taskName: "Package & Label Design",
      milestoneId: "m-1",
      milestoneName: "Primary Packaging Box Die-Lines",
      projectId: "proj-1",
      projectName: "Mitti & Co. Brand Refresh",
      clientId: "client-1",
      clientName: "Mitti & Co.",
      name: "Mitti_Matte_Gold_DieLines.ai",
      description: "300 DPI Vector CMYK + Pantone 871C Gold Foil specifications for luxury packaging.",
      status: "UNDER_REVIEW",
      currentVersion: 2,
      isClientVisible: true,
      authorName: "Rohan Verma",
      authorEmail: "rohan@indianpixel.com",
      hasActiveAgreement: true,
      hasUnsettledInvoices: false,
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-10T14:30:00Z",
      versions: [
        {
          id: "v-2",
          versionNumber: 2,
          fileId: "f-1",
          submittedById: "user-1",
          submittedByName: "Rohan Verma",
          submittedByEmail: "rohan@indianpixel.com",
          changeSummary: "Adjusted matte varnish bleed margin and embossed foil registration.",
          createdAt: "2026-08-10T14:30:00Z",
          reviewsCount: 1,
        },
        {
          id: "v-1",
          versionNumber: 1,
          fileId: "f-0",
          submittedById: "user-1",
          submittedByName: "Rohan Verma",
          submittedByEmail: "rohan@indianpixel.com",
          changeSummary: "Initial draft release of box packaging dielines.",
          createdAt: "2026-08-01T10:00:00Z",
          reviewsCount: 0,
        },
      ],
      reviews: [
        {
          id: "rev-1",
          reviewerId: "client-user",
          reviewerName: "Devika Sen (Client Signatory)",
          isClientReviewer: true,
          versionNumber: 2,
          content: "Foil stamping alignment looks exceptional. Ready for final print proof approval.",
          status: "SUBMITTED",
          createdAt: "2026-08-11T09:15:00Z",
        },
      ],
      files: [
        {
          id: "f-1",
          filename: "Mitti_Matte_Gold_DieLines_v2.0.ai",
          storageKey: "ws_indian_pixel/proj-1/deliverables/v2_dielines.ai",
          mimeType: "application/postscript",
          sizeBytes: 48500000,
          uploaderName: "Rohan Verma",
          createdAt: "2026-08-10T14:30:00Z",
        },
      ],
    },
    {
      id: "deliv-102",
      workspaceId: "ws_indian_pixel",
      taskId: "task-2",
      taskName: "3D Product Visualization",
      milestoneId: "m-2",
      milestoneName: "Amber Glass Studio Renders",
      projectId: "proj-1",
      projectName: "Mitti & Co. Brand Refresh",
      clientId: "client-1",
      clientName: "Mitti & Co.",
      name: "Mitti_Amber_Glass_Studio_Render_4K.png",
      description: "Photorealistic 4K studio lighting scene of amber cosmetic bottles.",
      status: "APPROVED",
      currentVersion: 1,
      isClientVisible: true,
      authorName: "Rohan Verma",
      authorEmail: "rohan@indianpixel.com",
      hasActiveAgreement: true,
      hasUnsettledInvoices: false,
      createdAt: "2026-08-05T12:00:00Z",
      updatedAt: "2026-08-07T16:00:00Z",
      versions: [
        {
          id: "v-1",
          versionNumber: 1,
          fileId: "f-2",
          submittedById: "user-1",
          submittedByName: "Rohan Verma",
          submittedByEmail: "rohan@indianpixel.com",
          changeSummary: "Final raytraced 4K composition with studio caustics.",
          createdAt: "2026-08-05T12:00:00Z",
          reviewsCount: 1,
        },
      ],
      reviews: [
        {
          id: "rev-2",
          reviewerId: "client-user",
          reviewerName: "Devika Sen (Client Signatory)",
          isClientReviewer: true,
          versionNumber: 1,
          content: "Approved without reservation. Colors match physical glass bottle reference.",
          status: "APPROVED",
          createdAt: "2026-08-07T16:00:00Z",
        },
      ],
      files: [
        {
          id: "f-2",
          filename: "Mitti_Amber_Glass_Studio_Render_4K.png",
          storageKey: "ws_indian_pixel/proj-1/deliverables/v1_amber_render.png",
          mimeType: "image/png",
          sizeBytes: 18600000,
          uploaderName: "Rohan Verma",
          createdAt: "2026-08-05T12:00:00Z",
        },
      ],
    },
    {
      id: "deliv-103",
      workspaceId: "ws_indian_pixel",
      taskId: "task-3",
      taskName: "Design System Architecture",
      milestoneId: "m-3",
      milestoneName: "Enterprise Design Tokens Handover",
      projectId: "proj-2",
      projectName: "SaaS Design System & Marketing Site",
      clientId: "client-2",
      clientName: "Tech Solutions Inc.",
      name: "TechSol_Design_Tokens_Studio.json",
      description: "W3C Design Token Community Group compatible token schema with dark mode palettes.",
      status: "APPROVED",
      currentVersion: 2,
      isClientVisible: true,
      authorName: "Ananya Iyer",
      authorEmail: "ananya@indianpixel.com",
      hasActiveAgreement: true,
      hasUnsettledInvoices: false,
      createdAt: "2026-08-01T09:00:00Z",
      updatedAt: "2026-08-04T11:00:00Z",
      versions: [
        {
          id: "v-2",
          versionNumber: 2,
          fileId: "f-3",
          submittedById: "user-2",
          submittedByName: "Ananya Iyer",
          submittedByEmail: "ananya@indianpixel.com",
          changeSummary: "Added semantic elevation tokens and WCAG contrast check passes.",
          createdAt: "2026-08-04T11:00:00Z",
          reviewsCount: 1,
        },
        {
          id: "v-1",
          versionNumber: 1,
          fileId: null,
          submittedById: "user-2",
          submittedByName: "Ananya Iyer",
          submittedByEmail: "ananya@indianpixel.com",
          changeSummary: "Draft core typography and primitive colors.",
          createdAt: "2026-08-01T09:00:00Z",
          reviewsCount: 0,
        },
      ],
      reviews: [
        {
          id: "rev-3",
          reviewerId: "user-pm-2",
          reviewerName: "Siddharth Rao (Client Tech Lead)",
          isClientReviewer: true,
          versionNumber: 2,
          content: "Successfully imported into Tailwind config. All tests passing.",
          status: "APPROVED",
          createdAt: "2026-08-04T15:30:00Z",
        },
      ],
      files: [
        {
          id: "f-3",
          filename: "TechSol_Design_Tokens_Studio.json",
          storageKey: "ws_indian_pixel/proj-2/deliverables/v2_tokens.json",
          mimeType: "application/json",
          sizeBytes: 240000,
          uploaderName: "Ananya Iyer",
          createdAt: "2026-08-04T11:00:00Z",
        },
      ],
    },
    {
      id: "deliv-104",
      workspaceId: "ws_indian_pixel",
      taskId: "task-4",
      taskName: "Motion Reveal Animation",
      milestoneId: "m-4",
      milestoneName: "3D Motion Reveal Teaser",
      projectId: "proj-3",
      projectName: "Vally & Hound Luxury Outdoors",
      clientId: "client-3",
      clientName: "Vally & Hound",
      name: "VallyHound_Cinematic_Teaser_Master_ProRes.mov",
      description: "4K 60FPS ProRes 422 HQ cinematic motion reveal teaser with spatial audio stem mix.",
      status: "APPROVED",
      currentVersion: 1,
      isClientVisible: true,
      authorName: "Vikram Sengupta",
      authorEmail: "vikram@indianpixel.com",
      hasActiveAgreement: true,
      hasUnsettledInvoices: false,
      createdAt: "2026-07-18T10:00:00Z",
      updatedAt: "2026-07-20T12:00:00Z",
      versions: [
        {
          id: "v-1",
          versionNumber: 1,
          fileId: "f-4",
          submittedById: "user-3",
          submittedByName: "Vikram Sengupta",
          submittedByEmail: "vikram@indianpixel.com",
          changeSummary: "Master audio-visual final grading cut.",
          createdAt: "2026-07-18T10:00:00Z",
          reviewsCount: 1,
        },
      ],
      reviews: [
        {
          id: "rev-4",
          reviewerId: "user-pm-1",
          reviewerName: "Aarav Sharma (PM)",
          isClientReviewer: false,
          versionNumber: 1,
          content: "Audio dynamic range conforms to broadcast EBU R128 standards. Approved.",
          status: "APPROVED",
          createdAt: "2026-07-20T12:00:00Z",
        },
      ],
      files: [
        {
          id: "f-4",
          filename: "VallyHound_Cinematic_Teaser_Master_ProRes.mov",
          storageKey: "ws_indian_pixel/proj-3/deliverables/v1_teaser_master.mov",
          mimeType: "video/quicktime",
          sizeBytes: 1400000000,
          uploaderName: "Vikram Sengupta",
          createdAt: "2026-07-18T10:00:00Z",
        },
      ],
    },
  ];

  const deliverables = (initialDeliverables && initialDeliverables.length > 0)
    ? initialDeliverables
    : defaultDeliverables;

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");

  // Inspection Drawer / Modal State
  const [selectedDeliverable, setSelectedDeliverable] = useState<DeliverableItem | null>(null);
  const [dossierTab, setDossierTab] = useState("overview");

  // Version Upload Modal State
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionDeliverableId, setVersionDeliverableId] = useState("");
  const [versionChangeSummary, setVersionChangeSummary] = useState("");
  const [versionFilename, setVersionFilename] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review Submission Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDeliverable, setReviewDeliverable] = useState<DeliverableItem | null>(null);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "CHANGES_REQUESTED" | "COMMENT_ONLY">("APPROVED");

  // Filtered deliverables list
  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.authorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "UNDER_REVIEW" && (d.status === "UNDER_REVIEW" || d.status === "SUBMITTED")) ||
        (statusFilter === "APPROVED" && d.status === "APPROVED") ||
        (statusFilter === "CHANGES_REQUESTED" && d.status === "CHANGES_REQUESTED");

      const matchProject = projectFilter === "ALL" || d.projectId === projectFilter;

      return matchSearch && matchStatus && matchProject;
    });
  }, [deliverables, searchQuery, statusFilter, projectFilter]);

  // Unique project list for filter
  const uniqueProjects = useMemo(() => {
    const map = new Map<string, string>();
    deliverables.forEach((d) => {
      if (!map.has(d.projectId)) {
        map.set(d.projectId, d.projectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [deliverables]);

  const handleCreateVersion = async () => {
    if (!versionChangeSummary.trim()) {
      setErrorMessage("Change summary is required for version tracking.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await createDeliverableVersionAction({
        deliverableId: versionDeliverableId,
        changeSummary: versionChangeSummary,
        filename: versionFilename || "updated_deliverable_asset.zip",
        mimeType: "application/zip",
        sizeBytes: 15000000,
      });

      setIsLoading(false);
      if (res.success) {
        setIsVersionModalOpen(false);
        setVersionChangeSummary("");
        setVersionFilename("");
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to create version.");
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      setErrorMessage("Review feedback comment is mandatory.");
      return;
    }
    if (!reviewDeliverable) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await submitDeliverableReviewAction({
        deliverableId: reviewDeliverable.id,
        content: reviewContent,
        decision: reviewDecision,
      });

      setIsLoading(false);
      if (res.success) {
        setIsReviewModalOpen(false);
        setReviewContent("");
        router.refresh();
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to submit review.");
    }
  };

  const dossierTabs = [
    { id: "overview", label: "Overview" },
    { id: "versions", label: "Version Tree", count: selectedDeliverable?.versions.length || 0 },
    { id: "reviews", label: "Reviews & Feedback", count: selectedDeliverable?.reviews.length || 0 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono border border-amber-500/25 uppercase tracking-wider">
              Rule S-4 Version-Locked
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Cryptographic Proof Registry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-100 tracking-tight">
            Deliverables Vault & Version Registry
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {isClient
              ? "Inspect, review, and sign off on project deliverables with immutable version tracking."
              : "Institutional registry for version-sequenced assets, reviews, and milestone delivery gates."}
          </p>
        </div>

        {isStudioStaff && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (deliverables[0]) {
                setVersionDeliverableId(deliverables[0].id);
                setIsVersionModalOpen(true);
              }
            }}
            className="text-xs self-start sm:self-auto"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            <span>Upload New Version</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#060D0C] p-2.5 rounded-lg border border-white/[0.07]">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deliverables, authors, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-[#030706] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/40 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: "ALL", label: "All Assets" },
              { id: "UNDER_REVIEW", label: "Needs Review" },
              { id: "APPROVED", label: "Approved" },
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

          {/* Project Filter */}
          {uniqueProjects.length > 1 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded bg-[#030706] border border-white/[0.08] px-2.5 py-1 text-xs text-slate-300 focus:outline-none font-mono"
            >
              <option value="ALL">All Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Deliverables Registry Table */}
      {filteredDeliverables.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No deliverables found"
          description="No deliverables match your search criteria or filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
            setProjectFilter("ALL");
          }}
        />
      ) : (
        <div className="rounded-lg border border-white/[0.07] bg-[#060D0C] overflow-hidden shadow-elevation-1">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#030706]/80 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            <div className="col-span-4">Deliverable & Version</div>
            <div className="col-span-3">Project & Milestone</div>
            <div className="col-span-2 text-center">Review State</div>
            <div className="col-span-1 text-center">Specs</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {filteredDeliverables.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 lg:items-center text-xs"
              >
                {/* Col 1: Deliverable Name & Version */}
                <div className="col-span-4 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => {
                        setSelectedDeliverable(item);
                        setDossierTab("overview");
                      }}
                      className="font-mono font-bold text-slate-100 hover:text-amber-400 transition-colors cursor-pointer truncate"
                    >
                      {item.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono text-[9px] font-semibold border border-amber-500/25">
                      v{item.currentVersion}.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {item.description || "Production asset"}
                  </p>
                </div>

                {/* Col 2: Project & Milestone */}
                <div className="col-span-3 space-y-0.5 min-w-0">
                  <span className="font-semibold text-slate-200 block truncate">
                    {item.projectName}
                  </span>
                  <p className="text-[11px] text-slate-400 truncate">
                    Milestone: {item.milestoneName}
                  </p>
                </div>

                {/* Col 3: Review State */}
                <div className="col-span-2 lg:text-center">
                  <StatusBadge status={item.status} className="text-[9px] px-1.5 py-0.5" />
                </div>

                {/* Col 4: Specs / Specs Count */}
                <div className="col-span-1 text-left lg:text-center">
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.versions.length} {item.versions.length === 1 ? "Rev" : "Revs"}
                  </span>
                </div>

                {/* Col 5: Actions */}
                <div className="col-span-2 flex items-center justify-between lg:justify-end gap-2 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedDeliverable(item);
                      setDossierTab("overview");
                    }}
                    className="h-7 text-xs px-2.5"
                  >
                    <Eye className="h-3 w-3 mr-1 text-amber-400" />
                    <span>Inspect</span>
                  </Button>

                  {(item.status === "UNDER_REVIEW" || item.status === "SUBMITTED") && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setReviewDeliverable(item);
                        setReviewContent("");
                        setReviewDecision("APPROVED");
                        setIsReviewModalOpen(true);
                      }}
                      className="h-7 text-xs px-2.5"
                    >
                      <span>Review</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverable Dossier Modal */}
      {selectedDeliverable && (
        <Modal
          isOpen={Boolean(selectedDeliverable)}
          onClose={() => setSelectedDeliverable(null)}
          title={selectedDeliverable.name}
          description={`Asset dossier for ${selectedDeliverable.projectName} • Version v${selectedDeliverable.currentVersion}.0`}
          size="lg"
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Dossier Tabs */}
            <Tabs tabs={dossierTabs} activeTab={dossierTab} onChange={setDossierTab} />

            {/* TAB 1: OVERVIEW */}
            {dossierTab === "overview" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-[#030706] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold block">
                    Scope Deliverable Details
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {selectedDeliverable.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04] text-[11px] font-mono text-slate-400">
                    <div>Author: <strong className="text-slate-200">{selectedDeliverable.authorName}</strong></div>
                    <div>Target Milestone: <strong className="text-slate-200">{selectedDeliverable.milestoneName}</strong></div>
                  </div>
                </div>

                {/* Governance Gates Health */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Master Agreement Gate (AG-3)
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{selectedDeliverable.hasActiveAgreement ? "Verified Active Master Agreement" : "Agreement Pending"}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[#030706] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Payment Delivery Gate (PAY-3)
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      {selectedDeliverable.hasUnsettledInvoices ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Outstanding Milestone Settlement Required</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Payment Compliant</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attached Files / Cryptographic Assets */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-200 block">
                    Cryptographic Asset Files ({selectedDeliverable.files.length})
                  </span>
                  {selectedDeliverable.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded bg-[#030706] border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-200 font-semibold">{file.filename}</span>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {file.mimeType}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2">
                        <Download className="h-3 w-3 mr-1" />
                        <span>Download Proof</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: VERSIONS */}
            {dossierTab === "versions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Immutable Version History (Rule S-4)
                  </span>
                  {isStudioStaff && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setVersionDeliverableId(selectedDeliverable.id);
                        setIsVersionModalOpen(true);
                      }}
                      className="h-6 text-[10px] px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span>Release Next Version</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedDeliverable.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3 rounded-lg bg-[#030706] border border-white/[0.06] space-y-1 text-xs font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300">
                            v{ver.versionNumber}.0
                          </span>
                          {ver.versionNumber === selectedDeliverable.currentVersion && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 font-mono text-[9px] border border-emerald-500/20">
                              Current Release
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDate(ver.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        {ver.changeSummary}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Submitted by: {ver.submittedByName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: REVIEWS */}
            {dossierTab === "reviews" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Formal Reviews & Stakeholder Decisions
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setReviewDeliverable(selectedDeliverable);
                      setReviewContent("");
                      setReviewDecision("APPROVED");
                      setIsReviewModalOpen(true);
                    }}
                    className="h-6 text-[10px] px-2"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>Submit Review</span>
                  </Button>
                </div>

                {selectedDeliverable.reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    No formal review entries submitted yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDeliverable.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-lg bg-[#030706] border border-white/[0.06] space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">
                              {rev.reviewerName}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400">
                              v{rev.versionNumber}.0
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatRelativeTime(rev.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          &ldquo;{rev.content}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Release New Deliverable Version */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Release Sequential Deliverable Version"
        description="Creates an immutable version release with change log and file attachments (Rule S-4)."
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
            <label className="font-semibold text-slate-200 block mb-1">Target Deliverable:</label>
            <select
              value={versionDeliverableId}
              onChange={(e) => setVersionDeliverableId(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            >
              {deliverables.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (Current v{d.currentVersion}.0) — {d.projectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Change Summary / Release Notes (Mandatory):</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Incorporated client feedback on typography contrast and bleed margin."
              value={versionChangeSummary}
              onChange={(e) => setVersionChangeSummary(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Asset Filename (Optional Proof Upload):</label>
            <input
              type="text"
              placeholder="e.g. Mitti_Brand_Identity_v3.0.zip"
              value={versionFilename}
              onChange={(e) => setVersionFilename(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsVersionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleCreateVersion}>
              <span>Publish Version</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Submit Formal Review */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Submit Deliverable Review"
        description={`Formal review commentary on ${reviewDeliverable?.name ?? "Deliverable"}.`}
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
            <label className="font-semibold text-slate-200 block mb-1">Decision / Formal Stance:</label>
            <select
              value={reviewDecision}
              onChange={(e) => setReviewDecision(e.target.value as any)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/40"
            >
              <option value="APPROVED">Approve Deliverable Version</option>
              <option value="CHANGES_REQUESTED">Request Revisions / Changes</option>
              <option value="COMMENT_ONLY">Submit Commentary Only</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1">Written Feedback (Mandatory):</label>
            <textarea
              rows={4}
              required
              placeholder="e.g. Vector dielines align with packaging printer requirements. Approved for production."
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              className="w-full rounded-md border border-white/[0.10] bg-[#030706] px-3 py-2 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button variant="ghost" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isLoading} onClick={handleSubmitReview}>
              <span>Record Decision</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
