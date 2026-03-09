"use client";

import { useReducer, useCallback } from "react";
import { useImproveResume } from "@/hooks/queries/use-improvement";
import type {
  ResumeImproveResponse,
  ResumeDiffSummary,
  ResumeFieldDiff,
  ImprovementSuggestion,
  RefinementStats,
} from "@/types/improvement";
import type { ResumeData } from "@/types/resume";

// ============================================================================
// Local types (not exported from improvement.ts)
// ============================================================================

type ImprovementStep =
  | "idle"
  | "improving"
  | "preview"
  | "applying"
  | "complete"
  | "error";

interface ImprovementState {
  step: ImprovementStep;
  originalResume: ResumeData | null;
  improvedResume: ResumeData | null;
  diffSummary: ResumeDiffSummary | null;
  detailedChanges: ResumeFieldDiff[];
  suggestions: ImprovementSuggestion[];
  refinementStats: RefinementStats | null;
  warnings: string[];
  error: string | null;
}

// ============================================================================
// Actions
// ============================================================================

type ImprovementAction =
  | { type: "START_IMPROVING"; resumeId: string; jobDescription: string }
  | { type: "IMPROVE_SUCCESS"; response: ResumeImproveResponse }
  | { type: "IMPROVE_ERROR"; error: string }
  | { type: "START_APPLYING" }
  | { type: "APPLY_SUCCESS" }
  | { type: "APPLY_ERROR"; error: string }
  | { type: "RESET" };

// ============================================================================
// Initial state
// ============================================================================

const initialState: ImprovementState = {
  step: "idle",
  originalResume: null,
  improvedResume: null,
  diffSummary: null,
  detailedChanges: [],
  suggestions: [],
  refinementStats: null,
  warnings: [],
  error: null,
};

// ============================================================================
// Reducer
// ============================================================================

function improvementReducer(
  state: ImprovementState,
  action: ImprovementAction
): ImprovementState {
  switch (action.type) {
    case "START_IMPROVING":
      return {
        ...initialState,
        step: "improving",
      };

    case "IMPROVE_SUCCESS":
      return {
        ...state,
        step: "preview",
        improvedResume: action.response.improved_resume ?? null,
        diffSummary: action.response.diff_summary ?? null,
        detailedChanges: action.response.detailed_changes ?? [],
        suggestions: action.response.improvements ?? [],
        refinementStats: action.response.refinement_stats ?? null,
        warnings: action.response.warnings ?? [],
        error: null,
      };

    case "IMPROVE_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "START_APPLYING":
      return {
        ...state,
        step: "applying",
      };

    case "APPLY_SUCCESS":
      return {
        ...state,
        step: "complete",
        error: null,
      };

    case "APPLY_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Return type
// ============================================================================

export interface UseImprovementWizardReturn {
  state: ImprovementState;
  startImproving: (resumeId: string, jobDescription: string) => void;
  reset: () => void;
  isImproving: boolean;
  isApplying: boolean;
  hasPreview: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Wizard hook for the improvement flow.
 * State machine: idle -> improving -> preview -> applying -> complete (or error at any step)
 *
 * Note: "applying" (saving improved resume to DB) is handled by the parent
 * component via a dedicated save API call. This hook manages UI state only.
 */
export function useImprovementWizard(): UseImprovementWizardReturn {
  const [state, dispatch] = useReducer(improvementReducer, initialState);
  const improveResumeMutation = useImproveResume();

  const startImproving = useCallback(
    async (resumeId: string, jobDescription: string) => {
      dispatch({ type: "START_IMPROVING", resumeId, jobDescription });

      try {
        const response = await improveResumeMutation.mutateAsync({
          resumeId,
          jobDescription,
        });
        dispatch({ type: "IMPROVE_SUCCESS", response });
      } catch (error: unknown) {
        let errorMessage = "Improvement failed";
        if (
          error &&
          typeof error === "object" &&
          "data" in error &&
          (error as { data?: { detail?: unknown } }).data?.detail
        ) {
          const detail = (error as { data: { detail: unknown } }).data.detail;
          errorMessage = Array.isArray(detail)
            ? detail.map((e: { msg?: string }) => e.msg ?? String(e)).join(", ")
            : typeof detail === "string"
              ? detail
              : JSON.stringify(detail);
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch({ type: "IMPROVE_ERROR", error: errorMessage });
      }
    },
    [improveResumeMutation]
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    startImproving,
    reset,
    isImproving: state.step === "improving",
    isApplying: state.step === "applying",
    hasPreview: state.step === "preview" && state.improvedResume !== null,
  };
}
