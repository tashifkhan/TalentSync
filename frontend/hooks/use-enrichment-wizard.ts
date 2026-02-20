"use client";

import { useReducer, useCallback } from "react";
import type {
  EnrichmentWizardState,
  EnrichmentWizardAction,
  AnalysisResponse,
  EnhancementPreview,
  EnhancedDescription,
  AnswerInput,
} from "@/types/enrichment";
import {
  useAnalyzeResume,
  useEnhanceResume,
  useApplyEnhancements,
} from "@/hooks/queries/use-enrichment";

const initialState: EnrichmentWizardState = {
  step: "idle",
  resumeId: null,
  analysisResult: null,
  answers: {},
  enhancementPreview: null,
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

    case "ENHANCE_SUCCESS":
      return {
        ...state,
        step: "preview",
        enhancementPreview: action.preview,
        error: null,
      };

    case "ENHANCE_ERROR":
      return {
        ...state,
        step: "error",
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
  applyEnhancements: () => void;
  reset: () => void;
  isAnalyzing: boolean;
  isGenerating: boolean;
  isApplying: boolean;
  canSubmitAnswers: boolean;
  canApplyEnhancements: boolean;
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

    dispatch({ type: "START_APPLY" });

    try {
      await applyEnhancementsMutation.mutateAsync({
        resumeId: state.resumeId,
        enhancements: state.enhancementPreview.enhancements,
      });
      dispatch({
        type: "APPLY_SUCCESS",
        enhancements: state.enhancementPreview.enhancements,
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
  }, [state.resumeId, state.enhancementPreview, applyEnhancementsMutation]);

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

  // Check if there are enhancements to apply
  const canApplyEnhancements =
    state.step === "preview" &&
    Boolean(state.enhancementPreview?.enhancements) &&
    state.enhancementPreview!.enhancements.length > 0;

  return {
    state,
    startAnalysis,
    setAnswer,
    submitAnswers,
    applyEnhancements,
    reset,
    isAnalyzing: state.step === "analyzing",
    isGenerating: state.step === "generating",
    isApplying: state.step === "applying",
    canSubmitAnswers,
    canApplyEnhancements,
  };
}
