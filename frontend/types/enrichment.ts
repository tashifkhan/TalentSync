/**
 * Types for AI-powered resume enrichment and regeneration features.
 * Maps to backend models in app/models/enrichment/schemas.py
 */

import type { ResumeData } from "@/types/resume";

// ============================================================================
// Enrichment Analysis Types
// ============================================================================

export interface EnrichmentItem {
  item_id: string;
  item_type: string;
  title: string;
  subtitle?: string | null;
  current_description: string[];
  weakness_reason: string;
}

export interface EnrichmentQuestion {
  question_id: string;
  item_id: string;
  question: string;
  placeholder?: string;
}

export interface AnalysisResponse {
  items_to_enrich: EnrichmentItem[];
  questions: EnrichmentQuestion[];
  analysis_summary?: string | null;
}

// ============================================================================
// Enhancement Types
// ============================================================================

export interface AnswerInput {
  question_id: string;
  answer: string;
}

export interface EnhanceRequest {
  resume_data: ResumeData;
  answers: AnswerInput[];
}

export interface EnhancedDescription {
  item_id: string;
  item_type: string;
  title: string;
  original_description: string[];
  enhanced_description: string[];
}

export interface EnhancementPreview {
  enhancements: EnhancedDescription[];
}

export interface ApplyEnhancementsRequest {
  resume_data: ResumeData;
  enhancements: EnhancedDescription[];
}

// ============================================================================
// Regeneration Types
// ============================================================================

export type RegenerateItemType = "experience" | "project" | "skills";

export interface RegenerateItemInput {
  item_id: string;
  item_type: RegenerateItemType;
  title: string;
  subtitle?: string | null;
  current_content: string[];
}

export interface RegenerateRequest {
  resume_data: ResumeData;
  items: RegenerateItemInput[];
  instruction: string;
  output_language?: string;
}

export interface RegeneratedItem {
  item_id: string;
  item_type: RegenerateItemType;
  title: string;
  subtitle?: string | null;
  original_content: string[];
  new_content: string[];
  diff_summary: string;
}

export interface RegenerateItemError {
  item_id: string;
  item_type: RegenerateItemType;
  title: string;
  subtitle?: string | null;
  message: string;
}

export interface RegenerateResponse {
  regenerated_items: RegeneratedItem[];
  errors: RegenerateItemError[];
}

// ============================================================================
// Wizard State Types
// ============================================================================

export type EnrichmentWizardStep =
  | "idle"
  | "analyzing"
  | "questions"
  | "generating"
  | "preview"
  | "applying"
  | "complete"
  | "error";

export interface EnrichmentWizardState {
  step: EnrichmentWizardStep;
  resumeId: string | null;
  analysisResult: AnalysisResponse | null;
  answers: Record<string, string>;
  enhancementPreview: EnhancementPreview | null;
  appliedEnhancements: EnhancedDescription[];
  error: string | null;
}

export type EnrichmentWizardAction =
  | { type: "START_ANALYSIS"; resumeId: string }
  | { type: "ANALYSIS_SUCCESS"; result: AnalysisResponse }
  | { type: "ANALYSIS_ERROR"; error: string }
  | { type: "SET_ANSWER"; questionId: string; answer: string }
  | { type: "SUBMIT_ANSWERS" }
  | { type: "ENHANCE_SUCCESS"; preview: EnhancementPreview }
  | { type: "ENHANCE_ERROR"; error: string }
  | { type: "START_APPLY" }
  | { type: "APPLY_SUCCESS"; enhancements: EnhancedDescription[] }
  | { type: "APPLY_ERROR"; error: string }
  | { type: "RESET" };

// ============================================================================
// Regenerate Wizard Types
// ============================================================================

export type RegenerateWizardStep =
  | "idle"
  | "selecting"
  | "instructing"
  | "generating"
  | "previewing"
  | "applying"
  | "complete"
  | "error";

export interface SelectableItem {
  id: string;
  type: RegenerateItemType;
  title: string;
  subtitle?: string | null;
  content: string[];
  selected: boolean;
}

export interface RegenerateWizardState {
  step: RegenerateWizardStep;
  resumeId: string | null;
  availableItems: SelectableItem[];
  selectedItems: RegenerateItemInput[];
  instruction: string;
  regeneratedItems: RegeneratedItem[];
  errors: RegenerateItemError[];
  error: string | null;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface EnrichmentModalProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (enhancements: EnhancedDescription[]) => void;
}

export interface QuestionStepProps {
  questions: EnrichmentQuestion[];
  items: EnrichmentItem[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export interface PreviewStepProps {
  enhancements: EnhancedDescription[];
  onApply: () => void;
  onBack: () => void;
  isApplying: boolean;
}

export interface RegenerateDialogProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (items: RegeneratedItem[]) => void;
  availableItems: SelectableItem[];
}

export interface RegenerateInstructionProps {
  selectedItems: RegenerateItemInput[];
  instruction: string;
  onInstructionChange: (instruction: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export interface RegeneratePreviewProps {
  regeneratedItems: RegeneratedItem[];
  errors: RegenerateItemError[];
  onApply: () => void;
  onBack: () => void;
  isApplying: boolean;
}
