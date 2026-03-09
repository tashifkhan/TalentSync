"use client";

import { useReducer, useCallback } from "react";
import type {
  RegenerateWizardState,
  RegenerateWizardStep,
  SelectableItem,
  RegenerateItemInput,
} from "@/types/enrichment";
import {
  useRegenerateItems,
  useApplyRegeneratedItems,
} from "@/hooks/queries/use-enrichment";
import { extractErrorMessage } from "@/lib/error-utils";

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

type RegenerateAction =
  | { type: "OPEN"; resumeId: string; items: SelectableItem[] }
  | { type: "TOGGLE_ITEM"; itemId: string }
  | { type: "SELECT_ALL" }
  | { type: "DESELECT_ALL" }
  | { type: "PROCEED_TO_INSTRUCTION"; selectedItems: RegenerateItemInput[] }
  | { type: "SET_INSTRUCTION"; instruction: string }
  | { type: "START_GENERATING" }
  | { type: "GENERATING_SUCCESS"; regeneratedItems: RegenerateWizardState["regeneratedItems"]; errors: RegenerateWizardState["errors"] }
  | { type: "START_APPLYING" }
  | { type: "APPLYING_SUCCESS" }
  | { type: "SET_ERROR"; error: string }
  | { type: "GO_BACK" }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: RegenerateWizardState = {
  step: "idle",
  resumeId: null,
  availableItems: [],
  selectedItems: [],
  instruction: "",
  regeneratedItems: [],
  errors: [],
  error: null,
};

// ---------------------------------------------------------------------------
// Step ordering (used by GO_BACK)
// ---------------------------------------------------------------------------

const STEP_ORDER: RegenerateWizardStep[] = [
  "idle",
  "selecting",
  "instructing",
  "generating",
  "previewing",
  "applying",
  "complete",
];

/** Map error state to the step the user was on before the error occurred */
function prevStepForError(state: RegenerateWizardState): RegenerateWizardStep {
  // Determine prior step based on what data is present
  if (state.regeneratedItems.length > 0) return "previewing";
  if (state.selectedItems.length > 0) return "instructing";
  return "selecting";
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function regenerateReducer(
  state: RegenerateWizardState,
  action: RegenerateAction
): RegenerateWizardState {
  switch (action.type) {
    case "OPEN":
      return {
        ...initialState,
        step: "selecting",
        resumeId: action.resumeId,
        availableItems: action.items.map((item) => ({ ...item, selected: false })),
      };

    case "TOGGLE_ITEM":
      return {
        ...state,
        availableItems: state.availableItems.map((item) =>
          item.id === action.itemId ? { ...item, selected: !item.selected } : item
        ),
      };

    case "SELECT_ALL":
      return {
        ...state,
        availableItems: state.availableItems.map((item) => ({ ...item, selected: true })),
      };

    case "DESELECT_ALL":
      return {
        ...state,
        availableItems: state.availableItems.map((item) => ({ ...item, selected: false })),
      };

    case "PROCEED_TO_INSTRUCTION":
      return { ...state, step: "instructing", selectedItems: action.selectedItems };

    case "SET_INSTRUCTION":
      return { ...state, instruction: action.instruction };

    case "START_GENERATING":
      return { ...state, step: "generating", error: null };

    case "GENERATING_SUCCESS":
      return {
        ...state,
        step: "previewing",
        regeneratedItems: action.regeneratedItems,
        errors: action.errors,
      };

    case "START_APPLYING":
      return { ...state, step: "applying", error: null };

    case "APPLYING_SUCCESS":
      return { ...state, step: "complete" };

    case "SET_ERROR":
      return { ...state, step: "error", error: action.error };

    case "GO_BACK": {
      if (state.step === "error") {
        // Return to whichever step preceded the error
        return { ...state, step: prevStepForError(state), error: null };
      }
      const currentIndex = STEP_ORDER.indexOf(state.step);
      if (currentIndex <= 1) {
        return { ...state, step: "idle" };
      }
      return { ...state, step: STEP_ORDER[currentIndex - 1], error: null };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface UseRegenerateWizardReturn {
  state: RegenerateWizardState;
  openWizard: (resumeId: string, items: SelectableItem[]) => void;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  proceedToInstruction: () => void;
  setInstruction: (instruction: string) => void;
  submitRegeneration: () => void;
  applyRegenerated: () => void;
  goBack: () => void;
  reset: () => void;
  isGenerating: boolean;
  isApplying: boolean;
  canProceedToInstruction: boolean;
  canSubmitRegeneration: boolean;
  canApplyRegenerated: boolean;
  selectedCount: number;
}

/**
 * Wizard hook for the regeneration flow.
 * Manages state: idle -> selecting -> instructing -> generating -> previewing -> applying -> complete
 * Uses useReducer for predictable, testable state transitions.
 */
export function useRegenerateWizard(): UseRegenerateWizardReturn {
  const [state, dispatch] = useReducer(regenerateReducer, initialState);

  const regenerateItemsMutation = useRegenerateItems();
  const applyRegeneratedMutation = useApplyRegeneratedItems();

  const openWizard = useCallback((resumeId: string, items: SelectableItem[]) => {
    dispatch({ type: "OPEN", resumeId, items });
  }, []);

  const toggleItemSelection = useCallback((itemId: string) => {
    dispatch({ type: "TOGGLE_ITEM", itemId });
  }, []);

  const selectAllItems = useCallback(() => {
    dispatch({ type: "SELECT_ALL" });
  }, []);

  const deselectAllItems = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
  }, []);

  const proceedToInstruction = useCallback(() => {
    const selectedItems: RegenerateItemInput[] = state.availableItems
      .filter((item) => item.selected)
      .map((item) => ({
        item_id: item.id,
        item_type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        current_content: item.content,
      }));
    dispatch({ type: "PROCEED_TO_INSTRUCTION", selectedItems });
  }, [state.availableItems]);

  const setInstruction = useCallback((instruction: string) => {
    dispatch({ type: "SET_INSTRUCTION", instruction });
  }, []);

  const submitRegeneration = useCallback(async () => {
    if (!state.resumeId || state.selectedItems.length === 0) return;

    dispatch({ type: "START_GENERATING" });

    try {
      const result = await regenerateItemsMutation.mutateAsync({
        resumeId: state.resumeId,
        items: state.selectedItems,
        instruction: state.instruction,
      });

      dispatch({
        type: "GENERATING_SUCCESS",
        regeneratedItems: result.regenerated_items,
        errors: result.errors,
      });
    } catch (error) {
      dispatch({ type: "SET_ERROR", error: extractErrorMessage(error) });
    }
  }, [state.resumeId, state.selectedItems, state.instruction, regenerateItemsMutation]);

  const applyRegenerated = useCallback(async () => {
    if (!state.resumeId || state.regeneratedItems.length === 0) return;

    dispatch({ type: "START_APPLYING" });

    try {
      await applyRegeneratedMutation.mutateAsync({
        resumeId: state.resumeId,
        items: state.regeneratedItems,
      });

      dispatch({ type: "APPLYING_SUCCESS" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", error: extractErrorMessage(error) });
    }
  }, [state.resumeId, state.regeneratedItems, applyRegeneratedMutation]);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const selectedCount = state.availableItems.filter((item) => item.selected).length;

  const canProceedToInstruction =
    state.step === "selecting" && selectedCount > 0;

  const canSubmitRegeneration =
    state.step === "instructing" &&
    state.instruction.trim().length > 0 &&
    state.instruction.length <= 2000;

  const canApplyRegenerated =
    state.step === "previewing" && state.regeneratedItems.length > 0;

  return {
    state,
    openWizard,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    proceedToInstruction,
    setInstruction,
    submitRegeneration,
    applyRegenerated,
    goBack,
    reset,
    isGenerating: state.step === "generating",
    isApplying: state.step === "applying",
    canProceedToInstruction,
    canSubmitRegeneration,
    canApplyRegenerated,
    selectedCount,
  };
}
