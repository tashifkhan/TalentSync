"use client";

import { useReducer, useCallback } from "react";
import { useJDEditResume } from "@/hooks/queries/use-jd-editor";
import type { JDEditStep, JDEditState, JDEditResponse } from "@/types/jd-editor";

// ============================================================================
// Actions
// ============================================================================

type JDEditAction =
  | {
      type: "START_EDITING";
      resumeId: string;
      jobDescription: string;
      jdUrl: string;
      companyName: string;
    }
  | { type: "EDIT_SUCCESS"; response: JDEditResponse }
  | { type: "EDIT_ERROR"; error: string }
  | { type: "START_APPLYING" }
  | { type: "APPLY_SUCCESS" }
  | { type: "APPLY_ERROR"; error: string }
  | { type: "RESET" }
  | {
      type: "SET_FIELD";
      field: "jobDescription" | "jdUrl" | "companyName";
      value: string;
    };

// ============================================================================
// Initial state
// ============================================================================

const initialState: JDEditState = {
  step: "idle",
  resumeId: null,
  jobDescription: "",
  jdUrl: "",
  companyName: "",
  response: null,
  error: null,
};

// ============================================================================
// Reducer
// ============================================================================

function jdEditReducer(state: JDEditState, action: JDEditAction): JDEditState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "START_EDITING":
      return {
        ...state,
        step: "editing",
        resumeId: action.resumeId,
        jobDescription: action.jobDescription,
        jdUrl: action.jdUrl,
        companyName: action.companyName,
        response: null,
        error: null,
      };

    case "EDIT_SUCCESS":
      return {
        ...state,
        step: "preview",
        response: action.response,
        error: null,
      };

    case "EDIT_ERROR":
      return { ...state, step: "error", error: action.error };

    case "START_APPLYING":
      return { ...state, step: "applying" };

    case "APPLY_SUCCESS":
      return { ...state, step: "complete", error: null };

    case "APPLY_ERROR":
      return { ...state, step: "error", error: action.error };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Return type
// ============================================================================

export interface UseJDEditWizardReturn {
  state: JDEditState;
  setField: (
    field: "jobDescription" | "jdUrl" | "companyName",
    value: string
  ) => void;
  startEditing: (resumeId: string) => void;
  markApplying: () => void;
  markApplySuccess: () => void;
  markApplyError: (error: string) => void;
  reset: () => void;
  prefill: (jobDescription: string, jdUrl?: string, companyName?: string) => void;
  isEditing: boolean;
  isApplying: boolean;
  hasPreview: boolean;
  canEdit: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Wizard hook for the JD-based resume edit flow.
 * State machine: idle -> editing -> preview -> applying -> complete (or error)
 *
 * The parent component calls markApplying/markApplySuccess/markApplyError
 * to control the "applying" transition since saving is done via a separate DB call.
 */
export function useJDEditWizard(): UseJDEditWizardReturn {
  const [state, dispatch] = useReducer(jdEditReducer, initialState);
  const jdEditMutation = useJDEditResume();

  const setField = useCallback(
    (field: "jobDescription" | "jdUrl" | "companyName", value: string) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    []
  );

  /** Pre-fill from URL query params (e.g. from ATS page) */
  const prefill = useCallback(
    (jobDescription: string, jdUrl = "", companyName = "") => {
      dispatch({ type: "SET_FIELD", field: "jobDescription", value: jobDescription });
      if (jdUrl) dispatch({ type: "SET_FIELD", field: "jdUrl", value: jdUrl });
      if (companyName)
        dispatch({ type: "SET_FIELD", field: "companyName", value: companyName });
    },
    []
  );

  const startEditing = useCallback(
    async (resumeId: string) => {
      dispatch({
        type: "START_EDITING",
        resumeId,
        jobDescription: state.jobDescription,
        jdUrl: state.jdUrl,
        companyName: state.companyName,
      });

      try {
        const response = await jdEditMutation.mutateAsync({
          resumeId,
          jobDescription: state.jobDescription,
          jdUrl: state.jdUrl || undefined,
          companyName: state.companyName || undefined,
        });
        dispatch({ type: "EDIT_SUCCESS", response });
      } catch (error: unknown) {
        let errorMessage = "JD edit failed";
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
        dispatch({ type: "EDIT_ERROR", error: errorMessage });
      }
    },
    [state.jobDescription, state.jdUrl, state.companyName, jdEditMutation]
  );

  const markApplying = useCallback(() => dispatch({ type: "START_APPLYING" }), []);
  const markApplySuccess = useCallback(() => dispatch({ type: "APPLY_SUCCESS" }), []);
  const markApplyError = useCallback(
    (error: string) => dispatch({ type: "APPLY_ERROR", error }),
    []
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    setField,
    startEditing,
    markApplying,
    markApplySuccess,
    markApplyError,
    reset,
    prefill,
    isEditing: state.step === "editing",
    isApplying: state.step === "applying",
    hasPreview: state.step === "preview" && state.response !== null,
    canEdit:
      (state.step === "idle" || state.step === "error") &&
      state.jobDescription.trim().length > 0,
  };
}
