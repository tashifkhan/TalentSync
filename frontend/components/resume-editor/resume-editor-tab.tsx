"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Save,
  Loader2,
  RotateCcw,
  CircleDot,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorLayout } from "./editor-layout";
import { useUpdateResumeAnalysis } from "@/hooks/queries/use-resume-editor";
import { cn } from "@/lib/utils";
import type { ResumeData, SectionMeta } from "@/types/resume";
import { DEFAULT_SECTION_ORDER } from "@/types/resume";

/* ------------------------------------------------------------------ */
/*  Helpers: camelCase API analysis -> snake_case ResumeData           */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function analysisToResumeData(analysis: any): ResumeData {
  return {
    name: analysis.name ?? "",
    email: analysis.email ?? "",
    contact: analysis.contact ?? "",
    linkedin: analysis.linkedin ?? "",
    github: analysis.github ?? "",
    blog: analysis.blog ?? "",
    portfolio: analysis.portfolio ?? "",
    predicted_field: analysis.predictedField ?? "",
    skills_analysis: analysis.skillsAnalysis ?? [],
    recommended_roles: analysis.recommendedRoles ?? [],
    languages: analysis.languages ?? [],
    education: analysis.education ?? [],
    work_experience: analysis.workExperience ?? [],
    projects: analysis.projects ?? [],
    publications: analysis.publications ?? [],
    positions_of_responsibility: analysis.positionsOfResponsibility ?? [],
    certifications: analysis.certifications ?? [],
    achievements: analysis.achievements ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  localStorage draft helpers                                        */
/* ------------------------------------------------------------------ */

interface EditorDraft {
  data: ResumeData;
  sectionOrder: SectionMeta[];
  savedAt: number;
}

function getDraftKey(resumeId: string) {
  return `resume-editor-draft-${resumeId}`;
}

function loadDraft(resumeId: string): EditorDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getDraftKey(resumeId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as EditorDraft;
    if (Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(getDraftKey(resumeId));
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(
  resumeId: string,
  data: ResumeData,
  sectionOrder: SectionMeta[]
) {
  if (typeof window === "undefined") return;
  try {
    const draft: EditorDraft = { data, sectionOrder, savedAt: Date.now() };
    localStorage.setItem(getDraftKey(resumeId), JSON.stringify(draft));
  } catch {
    // storage full or unavailable
  }
}

function clearDraft(resumeId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getDraftKey(resumeId));
}

/* ------------------------------------------------------------------ */
/*  ResumeEditorTab                                                    */
/* ------------------------------------------------------------------ */

interface ResumeEditorTabProps {
  resumeId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis: any;
}

export function ResumeEditorTab({ resumeId, analysis }: ResumeEditorTabProps) {
  const serverData = useRef(analysisToResumeData(analysis));

  const [data, setData] = useState<ResumeData>(() => {
    const draft = loadDraft(resumeId);
    if (draft) return draft.data;
    return analysisToResumeData(analysis);
  });

  const [sectionOrder, setSectionOrder] = useState<SectionMeta[]>(() => {
    const draft = loadDraft(resumeId);
    if (draft?.sectionOrder) return draft.sectionOrder;
    return [...DEFAULT_SECTION_ORDER];
  });

  const [hasDraft] = useState(() => loadDraft(resumeId) !== null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateMutation = useUpdateResumeAnalysis();

  const hasChanges =
    JSON.stringify(data) !== JSON.stringify(serverData.current);

  // Auto-save draft to localStorage on changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasChanges) {
        saveDraft(resumeId, data, sectionOrder);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [data, sectionOrder, hasChanges, resumeId]);

  const handleChange = useCallback((updated: ResumeData) => {
    setData(updated);
  }, []);

  const handleSectionOrderChange = useCallback((order: SectionMeta[]) => {
    setSectionOrder(order);
  }, []);

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync({ id: resumeId, data });
    serverData.current = { ...data };
    clearDraft(resumeId);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  }, [data, resumeId, updateMutation]);

  const handleDiscard = useCallback(() => {
    setData(analysisToResumeData(analysis));
    setSectionOrder([...DEFAULT_SECTION_ORDER]);
    clearDraft(resumeId);
  }, [analysis, resumeId]);

  // Sync if analysis prop changes from outside
  useEffect(() => {
    const newServer = analysisToResumeData(analysis);
    const oldServer = serverData.current;
    if (JSON.stringify(newServer) !== JSON.stringify(oldServer)) {
      serverData.current = newServer;
      if (!hasChanges) {
        setData(newServer);
      }
    }
  }, [analysis]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {/* ---- Floating status bar ---- */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 py-2.5 shadow-sm">
        {/* Left: status indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          {saveSuccess ? (
            <div className="flex items-center gap-1.5 text-emerald-400 animate-in fade-in slide-in-from-left-1 duration-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Saved</span>
            </div>
          ) : updateMutation.isError ? (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Save failed</span>
            </div>
          ) : hasChanges ? (
            <div className="flex items-center gap-1.5 text-amber-400/90">
              <CircleDot className="h-3 w-3 animate-pulse" />
              <span className="text-xs font-medium">Unsaved changes</span>
            </div>
          ) : hasDraft ? (
            <span className="text-xs text-muted-foreground italic">
              Draft restored
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">All saved</span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="h-8 text-muted-foreground hover:text-foreground text-xs px-3 rounded-lg"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={cn(
              "h-8 text-xs px-4 rounded-lg font-medium transition-all",
              hasChanges
                ? "bg-brand-primary hover:bg-brand-secondary text-white shadow-md shadow-brand-primary/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ---- Editor + Preview layout ---- */}
      <EditorLayout
        data={data}
        onChange={handleChange}
        sectionOrder={sectionOrder}
        onSectionOrderChange={handleSectionOrderChange}
      />
    </div>
  );
}
