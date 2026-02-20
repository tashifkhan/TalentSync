"use client";

import { useState, useCallback } from "react";
import type {
  RegenerateWizardState,
  RegenerateWizardStep,
  SelectableItem,
  RegenerateItemInput,
  RegeneratedItem,
  RegenerateItemError,
} from "@/types/enrichment";
import {
  useRegenerateItems,
  useApplyRegeneratedItems,
} from "@/hooks/queries/use-enrichment";

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
 */
export function useRegenerateWizard(): UseRegenerateWizardReturn {
  const [state, setState] = useState<RegenerateWizardState>(initialState);

  const regenerateItemsMutation = useRegenerateItems();
  const applyRegeneratedMutation = useApplyRegeneratedItems();

  const openWizard = useCallback((resumeId: string, items: SelectableItem[]) => {
    setState({
      ...initialState,
      step: "selecting",
      resumeId,
      availableItems: items.map((item) => ({ ...item, selected: false })),
    });
  }, []);

  const toggleItemSelection = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      availableItems: prev.availableItems.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      ),
    }));
  }, []);

  const selectAllItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      availableItems: prev.availableItems.map((item) => ({
        ...item,
        selected: true,
      })),
    }));
  }, []);

  const deselectAllItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      availableItems: prev.availableItems.map((item) => ({
        ...item,
        selected: false,
      })),
    }));
  }, []);

  const proceedToInstruction = useCallback(() => {
    setState((prev) => {
      const selected = prev.availableItems.filter((item) => item.selected);
      const selectedItems: RegenerateItemInput[] = selected.map((item) => ({
        item_id: item.id,
        item_type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        current_content: item.content,
      }));

      return {
        ...prev,
        step: "instructing",
        selectedItems,
      };
    });
  }, []);

  const setInstruction = useCallback((instruction: string) => {
    setState((prev) => ({ ...prev, instruction }));
  }, []);

  const submitRegeneration = useCallback(async () => {
    if (!state.resumeId || state.selectedItems.length === 0) return;

    setState((prev) => ({ ...prev, step: "generating", error: null }));

    try {
      const result = await regenerateItemsMutation.mutateAsync({
        resumeId: state.resumeId,
        items: state.selectedItems,
        instruction: state.instruction,
      });

      setState((prev) => ({
        ...prev,
        step: "previewing",
        regeneratedItems: result.regenerated_items,
        errors: result.errors,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "error",
        error: error instanceof Error ? error.message : "Regeneration failed",
      }));
    }
  }, [state.resumeId, state.selectedItems, state.instruction, regenerateItemsMutation]);

  const applyRegenerated = useCallback(async () => {
    if (!state.resumeId || state.regeneratedItems.length === 0) return;

    setState((prev) => ({ ...prev, step: "applying", error: null }));

    try {
      await applyRegeneratedMutation.mutateAsync({
        resumeId: state.resumeId,
        items: state.regeneratedItems,
      });

      setState((prev) => ({
        ...prev,
        step: "complete",
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "error",
        error: error instanceof Error ? error.message : "Apply failed",
      }));
    }
  }, [state.resumeId, state.regeneratedItems, applyRegeneratedMutation]);

  const goBack = useCallback(() => {
    setState((prev) => {
      const stepOrder: RegenerateWizardStep[] = [
        "idle",
        "selecting",
        "instructing",
        "generating",
        "previewing",
        "applying",
        "complete",
      ];
      const currentIndex = stepOrder.indexOf(prev.step);

      if (currentIndex <= 1) {
        return { ...prev, step: "idle" };
      }

      // Go back one step
      const prevStep = stepOrder[currentIndex - 1];
      return { ...prev, step: prevStep, error: null };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
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
