"use client";

import { useReducer, useCallback } from "react";
import type {
  EnrichmentWizardState,
  EnrichmentWizardAction,
  AnalysisResponse,
  EnhancementPreview,
  EnhancedDescription,
  AnswerInput,
  RefinementInput,
  PatchStatus,
  PatchReviewState,
} from "@/types/enrichment";
import {
  useAnalyzeResume,
  useEnhanceResume,
  useApplyEnhancements,
  useRefineEnhancements,
} from "@/hooks/queries/use-enrichment";

const initialState: EnrichmentWizardState = {
  step: "idle",
  resumeId: null,
  analysisResult: null,
  answers: {},
  enhancementPreview: null,
  patchReviews: {},
  appliedEnhancements: [],
  error: null,
};

function enrichmentReducer(
  state: EnrichmentWizardState,
  action: EnrichmentWizardAction
): EnrichmentWizardState {
  switch (action.type) {
    case "START_ANALYSIS":
      return {
        ...initialState,
        step: "analyzing",
        resumeId: action.resumeId,
      };

    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        step: "questions",
        analysisResult: action.result,
        error: null,
      };

    case "ANALYSIS_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.answer,
        },
      };

    case "SUBMIT_ANSWERS":
      return {
        ...state,
        step: "generating",
      };

    case "ENHANCE_SUCCESS": {
      // Initialize all patches as approved by default
      const reviews: Record<string, PatchReviewState> = {};
      for (const enhancement of action.preview.enhancements) {
        reviews[enhancement.item_id] = { status: "approved", comment: "" };
      }
      return {
        ...state,
        step: "preview",
        enhancementPreview: action.preview,
        patchReviews: reviews,
        error: null,
      };
    }

    case "ENHANCE_ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "SET_PATCH_STATUS":
      return {
        ...state,
        patchReviews: {
          ...state.patchReviews,
          [action.itemId]: {
            ...state.patchReviews[action.itemId],
            status: action.status,
            // Clear comment when approving
            comment: action.status === "approved" ? "" : (state.patchReviews[action.itemId]?.comment ?? ""),
          },
        },
      };

    case "SET_PATCH_COMMENT":
      return {
        ...state,
        patchReviews: {
          ...state.patchReviews,
          [action.itemId]: {
            ...state.patchReviews[action.itemId],
            comment: action.comment,
          },
        },
      };

    case "APPROVE_ALL": {
      const allApproved: Record<string, PatchReviewState> = {};
      for (const [itemId] of Object.entries(state.patchReviews)) {
        allApproved[itemId] = { status: "approved", comment: "" };
      }
      return {
        ...state,
        patchReviews: allApproved,
      };
    }

    case "START_REFINE":
      return {
        ...state,
        step: "refining",
      };

    case "REFINE_SUCCESS": {
      if (!state.enhancementPreview) return state;

      // Replace rejected patches with the new refined versions, keep approved ones
      const updatedEnhancements = state.enhancementPreview.enhancements.map(
        (existing) => {
          const refined = action.preview.enhancements.find(
            (r) => r.item_id === existing.item_id
          );
          if (refined) {
            return refined;
          }
          return existing;
        }
      );

      // Reset patch reviews: refined items become approved, others stay as-is
      const updatedReviews: Record<string, PatchReviewState> = {
        ...state.patchReviews,
      };
      for (const refined of action.preview.enhancements) {
        updatedReviews[refined.item_id] = { status: "approved", comment: "" };
      }

      return {
        ...state,
        step: "preview",
        enhancementPreview: {
          enhancements: updatedEnhancements,
        },
        patchReviews: updatedReviews,
        error: null,
      };
    }

    case "REFINE_ERROR":
      return {
        ...state,
        step: "preview",
        error: action.error,
      };

    case "START_APPLY":
      return {
        ...state,
        step: "applying",
      };

    case "APPLY_SUCCESS":
      return {
        ...state,
        step: "complete",
        appliedEnhancements: action.enhancements,
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

export interface UseEnrichmentWizardReturn {
  state: EnrichmentWizardState;
  startAnalysis: (resumeId: string) => void;
  setAnswer: (questionId: string, answer: string) => void;
  submitAnswers: () => void;
  setPatchStatus: (itemId: string, status: PatchStatus) => void;
  setPatchComment: (itemId: string, comment: string) => void;
  approveAll: () => void;
  refineRejected: () => void;
  applyEnhancements: () => void;
  reset: () => void;
  isAnalyzing: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  isApplying: boolean;
  canSubmitAnswers: boolean;
  canApplyEnhancements: boolean;
  canRefineRejected: boolean;
  approvedCount: number;
  rejectedWithCommentsCount: number;
}

/**
 * Wizard hook for the enrichment flow.
 * Manages state machine: idle -> analyzing -> questions -> generating -> preview -> applying -> complete
 */
export function useEnrichmentWizard(): UseEnrichmentWizardReturn {
  const [state, dispatch] = useReducer(enrichmentReducer, initialState);

  const analyzeResumeMutation = useAnalyzeResume();
  const enhanceResumeMutation = useEnhanceResume();
  const applyEnhancementsMutation = useApplyEnhancements();
  const refineEnhancementsMutation = useRefineEnhancements();

  const startAnalysis = useCallback(
    async (resumeId: string) => {
      dispatch({ type: "START_ANALYSIS", resumeId });

      try {
        const result = await analyzeResumeMutation.mutateAsync({ resumeId });
        dispatch({ type: "ANALYSIS_SUCCESS", result });
      } catch (error: any) {
        let errorMessage = "Analysis failed";
        if (error?.data?.detail) {
          errorMessage = Array.isArray(error.data.detail)
            ? error.data.detail.map((err: any) => err.msg).join(", ")
            : typeof error.data.detail === "string"
              ? error.data.detail
              : JSON.stringify(error.data.detail);
        } else if (error?.message) {
          errorMessage = typeof error.message === "string" 
            ? error.message 
            : JSON.stringify(error.message);
        }
        dispatch({
          type: "ANALYSIS_ERROR",
          error: errorMessage,
        });
      }
    },
    [analyzeResumeMutation]
  );

  const setAnswer = useCallback((questionId: string, answer: string) => {
    dispatch({ type: "SET_ANSWER", questionId, answer });
  }, []);

  const setPatchStatus = useCallback((itemId: string, status: PatchStatus) => {
    dispatch({ type: "SET_PATCH_STATUS", itemId, status });
  }, []);

  const setPatchComment = useCallback((itemId: string, comment: string) => {
    dispatch({ type: "SET_PATCH_COMMENT", itemId, comment });
  }, []);

  const approveAll = useCallback(() => {
    dispatch({ type: "APPROVE_ALL" });
  }, []);

  const refineRejected = useCallback(async () => {
    if (!state.resumeId || !state.enhancementPreview) return;

    // Build refinement inputs from rejected patches with comments
    const refinements: RefinementInput[] = [];
    for (const enhancement of state.enhancementPreview.enhancements) {
      const review = state.patchReviews[enhancement.item_id];
      if (
        review &&
        review.status === "rejected" &&
        review.comment.trim().length > 0
      ) {
        refinements.push({
          item_id: enhancement.item_id,
          item_type: enhancement.item_type,
          title: enhancement.title,
          subtitle: null,
          original_description: enhancement.original_description,
          rejected_enhancement: enhancement.enhanced_description,
          user_feedback: review.comment.trim(),
        });
      }
    }

    if (refinements.length === 0) return;

    dispatch({ type: "START_REFINE" });

    try {
      const preview = await refineEnhancementsMutation.mutateAsync({
        resumeId: state.resumeId,
        refinements,
      });
      dispatch({ type: "REFINE_SUCCESS", preview });
    } catch (error: any) {
      let errorMessage = "Refinement failed";
      if (error?.data?.detail) {
        errorMessage = Array.isArray(error.data.detail)
          ? error.data.detail.map((err: any) => err.msg).join(", ")
          : typeof error.data.detail === "string"
            ? error.data.detail
            : JSON.stringify(error.data.detail);
      } else if (error?.message) {
        errorMessage =
          typeof error.message === "string"
            ? error.message
            : JSON.stringify(error.message);
      }
      dispatch({
        type: "REFINE_ERROR",
        error: errorMessage,
      });
    }
  }, [
    state.resumeId,
    state.enhancementPreview,
    state.patchReviews,
    refineEnhancementsMutation,
  ]);

  const submitAnswers = useCallback(async () => {
    if (!state.resumeId || !state.analysisResult) return;

    dispatch({ type: "SUBMIT_ANSWERS" });

    // Convert answers record to array format
    const answersArray: AnswerInput[] = Object.entries(state.answers)
      .filter(([_, answer]) => answer.trim().length > 0)
      .map(([questionId, answer]) => ({
        question_id: questionId,
        answer,
      }));

    try {
      const preview = await enhanceResumeMutation.mutateAsync({
        resumeId: state.resumeId,
        answers: answersArray,
      });
      dispatch({ type: "ENHANCE_SUCCESS", preview });
    } catch (error: any) {
      let errorMessage = "Enhancement failed";
      if (error?.data?.detail) {
        errorMessage = Array.isArray(error.data.detail)
          ? error.data.detail.map((err: any) => err.msg).join(", ")
          : typeof error.data.detail === "string"
            ? error.data.detail
            : JSON.stringify(error.data.detail);
      } else if (error?.message) {
        errorMessage = typeof error.message === "string" 
          ? error.message 
          : JSON.stringify(error.message);
      }
      dispatch({
        type: "ENHANCE_ERROR",
        error: errorMessage,
      });
    }
  }, [state.resumeId, state.analysisResult, state.answers, enhanceResumeMutation]);

  const applyEnhancements = useCallback(async () => {
    if (!state.resumeId || !state.enhancementPreview) return;

    // Only apply approved patches
    const approvedEnhancements = state.enhancementPreview.enhancements.filter(
      (e) => state.patchReviews[e.item_id]?.status === "approved"
    );

    if (approvedEnhancements.length === 0) return;

    dispatch({ type: "START_APPLY" });

    try {
      await applyEnhancementsMutation.mutateAsync({
        resumeId: state.resumeId,
        enhancements: approvedEnhancements,
      });
      dispatch({
        type: "APPLY_SUCCESS",
        enhancements: approvedEnhancements,
      });
    } catch (error: any) {
      let errorMessage = "Apply failed";
      if (error?.data?.detail) {
        errorMessage = Array.isArray(error.data.detail)
          ? error.data.detail.map((err: any) => err.msg).join(", ")
          : typeof error.data.detail === "string"
            ? error.data.detail
            : JSON.stringify(error.data.detail);
      } else if (error?.message) {
        errorMessage = typeof error.message === "string" 
          ? error.message 
          : JSON.stringify(error.message);
      }
      dispatch({
        type: "APPLY_ERROR",
        error: errorMessage,
      });
    }
  }, [state.resumeId, state.enhancementPreview, state.patchReviews, applyEnhancementsMutation]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Check if all questions have been answered
  const canSubmitAnswers =
    state.step === "questions" &&
    Boolean(state.analysisResult?.questions) &&
    state.analysisResult!.questions.length > 0 &&
    state.analysisResult!.questions.every(
      (q) => state.answers[q.question_id]?.trim().length > 0
    );

  // Check if there are enhancements to apply (at least one approved)
  const approvedCount =
    state.step === "preview" && state.enhancementPreview
      ? state.enhancementPreview.enhancements.filter(
          (e) => state.patchReviews[e.item_id]?.status === "approved"
        ).length
      : 0;

  const rejectedWithCommentsCount =
    state.step === "preview"
      ? Object.values(state.patchReviews).filter(
          (r) => r.status === "rejected" && r.comment.trim().length > 0
        ).length
      : 0;

  const canApplyEnhancements =
    state.step === "preview" && approvedCount > 0;

  const canRefineRejected =
    state.step === "preview" && rejectedWithCommentsCount > 0;

  return {
    state,
    startAnalysis,
    setAnswer,
    submitAnswers,
    setPatchStatus,
    setPatchComment,
    approveAll,
    refineRejected,
    applyEnhancements,
    reset,
    isAnalyzing: state.step === "analyzing",
    isGenerating: state.step === "generating",
    isRefining: state.step === "refining",
    isApplying: state.step === "applying",
    canSubmitAnswers,
    canApplyEnhancements,
    canRefineRejected,
    approvedCount,
    rejectedWithCommentsCount,
  };
}
