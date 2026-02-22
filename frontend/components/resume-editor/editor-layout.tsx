"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResumeForm } from "./resume-form";
import { ResumePreviewPanel } from "./resume-preview-panel";
import type { ResumeData, SectionMeta } from "@/types/resume";

interface EditorLayoutProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  sectionOrder: SectionMeta[];
  onSectionOrderChange: (order: SectionMeta[]) => void;
}

export function EditorLayout({
  data,
  onChange,
  sectionOrder,
  onSectionOrderChange,
}: EditorLayoutProps) {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="flex gap-3 items-start relative">
      {/* ---- Editor panel (left) ---- */}
      <div
        className={cn(
          "flex-1 min-w-0 overflow-y-auto rounded-xl border border-border bg-card/40 backdrop-blur-sm",
          showPreview ? "max-w-[55%]" : "max-w-full"
        )}
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        {/* Editor header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-primary/60" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resume Sections
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/60">
            Drag to reorder
          </span>
        </div>

        <div className="p-3">
          <ResumeForm
            data={data}
            onChange={onChange}
            sectionOrder={sectionOrder}
            onSectionOrderChange={onSectionOrderChange}
          />
        </div>
      </div>

      {/* ---- Preview toggle button ---- */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(!showPreview)}
        className={cn(
          "sticky top-4 shrink-0 h-8 gap-1.5 rounded-lg border-border text-xs font-medium transition-all",
          showPreview
            ? "text-muted-foreground hover:text-foreground"
            : "bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20"
        )}
        title={showPreview ? "Hide preview" : "Show preview"}
      >
        {showPreview ? (
          <>
            <PanelRightClose className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Hide</span>
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Preview</span>
          </>
        )}
      </Button>

      {/* ---- Preview panel (right) ---- */}
      {showPreview && (
        <div
          className="flex-1 min-w-0 max-w-[45%] sticky top-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/5"
          style={{ maxHeight: "calc(100vh - 240px)" }}
        >
          {/* Preview header */}
          <div className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-brand-primary/70" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live Preview
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
              <span className="text-[10px] text-muted-foreground/60">Live</span>
            </div>
          </div>

          {/* Preview content */}
          <div
            className="overflow-y-auto bg-muted/20"
            style={{ maxHeight: "calc(100vh - 290px)" }}
          >
            <ResumePreviewPanel data={data} sectionOrder={sectionOrder} />
          </div>
        </div>
      )}
    </div>
  );
}
