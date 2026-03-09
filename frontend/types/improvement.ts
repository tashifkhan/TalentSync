/**
 * Types for resume improvement and refinement features.
 * Maps to backend models in app/models/improvement/schemas.py and app/models/refinement/schemas.py
 */

import type { ResumeData } from "@/types/resume";

// ============================================================================
// Improvement Types
// ============================================================================

export interface ImprovementSuggestion {
  suggestion: string;
  lineNumber?: number | null;
}

export type ResumeFieldType =
  | "skill"
  | "description"
  | "summary"
  | "certification"
  | "experience"
  | "education"
  | "project";

export type ChangeType = "added" | "removed" | "modified";
export type ConfidenceLevel = "low" | "medium" | "high";

export interface ResumeFieldDiff {
  field_path: string;
  field_type: ResumeFieldType;
  change_type: ChangeType;
  original_value?: string | null;
  new_value?: string | null;
  confidence: ConfidenceLevel;
}

export interface ResumeDiffSummary {
  total_changes: number;
  skills_added: number;
  skills_removed: number;
  descriptions_modified: number;
  certifications_added: number;
  high_risk_changes: number;
}

// ============================================================================
// Refinement Types
// ============================================================================

export interface RefinementConfig {
  enable_keyword_injection?: boolean;
  enable_ai_phrase_removal?: boolean;
  enable_master_alignment_check?: boolean;
  max_refinement_passes?: number;
}

export interface AlignmentViolation {
  field_path: string;
  violation_type: string;
  value: string;
  severity: "critical" | "warning";
}

export interface AlignmentReport {
  is_aligned: boolean;
  violations: AlignmentViolation[];
  confidence_score: number;
}

export interface RefinementStats {
  passes_completed: number;
  keywords_injected: number;
  ai_phrases_removed: string[];
  alignment_violations_fixed: number;
  initial_match_percentage: number;
  final_match_percentage: number;
}


// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ResumeImproveRequest {
  resume_text: string;
  resume_data: ResumeData;
  job_description: string;
  job_keywords?: Record<string, unknown> | null;
  prompt_id?: string | null;
  language?: string;
  refinement_config?: RefinementConfig | null;
}

export interface ResumeImproveResponse {
  success: boolean;
  message: string;
  improved_resume: ResumeData;
  improvements: ImprovementSuggestion[];
  diff_summary?: ResumeDiffSummary | null;
  detailed_changes?: ResumeFieldDiff[] | null;
  refinement_stats?: RefinementStats | null;
  warnings: string[];
  refinement_attempted: boolean;
  refinement_successful: boolean;
}

export interface ResumeRefineRequest {
  tailored_resume: Record<string, unknown>;
  resume_data: ResumeData;
  job_description: string;
  job_keywords?: Record<string, unknown> | null;
  refinement_config?: RefinementConfig | null;
}

export interface ResumeRefineResponse {
  success: boolean;
  message: string;
  refined_resume: ResumeData;
  refinement_stats?: RefinementStats | null;
}


