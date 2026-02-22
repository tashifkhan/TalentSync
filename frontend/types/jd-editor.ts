/**
 * Types for the JD-based resume editing feature.
 * Maps to backend models in backend/app/models/jd_editor/schemas.py
 */

import type { ResumeData } from "@/types/resume";
import type { ResumeFieldDiff, ResumeDiffSummary } from "@/types/improvement";

// ============================================================================
// API Request / Response
// ============================================================================

export interface JDEditRequest {
  resumeId: string;
  jobDescription: string;
  jdUrl?: string;
  companyName?: string;
}

export interface JDEditChange {
  field: string;
  original: string;
  edited: string;
  reason: string;
}

export interface JDEditResponse {
  success: boolean;
  edited_resume: ResumeData;
  changes: JDEditChange[];
  diff_summary: ResumeDiffSummary | null;
  detailed_changes: ResumeFieldDiff[];
  ats_score_before: number;
  ats_score_after: number;
  keywords_addressed: string[];
  keywords_missing: string[];
  warnings: string[];
}

// ============================================================================
// Wizard UI State
// ============================================================================

export type JDEditStep =
  | "idle"
  | "editing"
  | "preview"
  | "applying"
  | "complete"
  | "error";

export interface JDEditState {
  step: JDEditStep;
  resumeId: string | null;
  jobDescription: string;
  jdUrl: string;
  companyName: string;
  response: JDEditResponse | null;
  error: string | null;
}
