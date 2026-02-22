"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRegenerateWizard } from "@/hooks/use-regenerate-wizard";
import type { SelectableItem } from "@/types/enrichment";
import { RegenerateSelectionStep } from "./selection-step";
import { RegenerateInstructionStep } from "./instruction-step";
import { RegeneratePreviewStep } from "./regenerate-preview-step";
import { EnrichmentLoadingStep } from "@/components/enrichment/loading-step";

interface RegenerateDialogProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  availableItems: SelectableItem[];
}

export function RegenerateDialog({
  resumeId,
  isOpen,
  onClose,
  onComplete,
  availableItems,
}: RegenerateDialogProps) {
  const wizard = useRegenerateWizard();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      wizard.reset();
      onClose();
    } else if (wizard.state.step === "idle") {
      wizard.openWizard(resumeId, availableItems);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    wizard.reset();
    onClose();
  };

  // Open wizard when dialog opens
  if (isOpen && wizard.state.step === "idle") {
    wizard.openWizard(resumeId, availableItems);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-y-auto p-0">
        {/* Accent header strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-brand-primary via-brand-primary/60 to-transparent" />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/20 ring-1 ring-brand-primary/40">
                <RefreshCw className="h-4 w-4 text-brand-primary" />
              </div>
              Regenerate Resume Content
            </DialogTitle>
          </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Selection Step */}
          {wizard.state.step === "selecting" && (
            <RegenerateSelectionStep
              key="selecting"
              items={wizard.state.availableItems}
              onToggle={wizard.toggleItemSelection}
              onSelectAll={wizard.selectAllItems}
              onDeselectAll={wizard.deselectAllItems}
              onProceed={wizard.proceedToInstruction}
              onCancel={() => handleOpenChange(false)}
              canProceed={wizard.canProceedToInstruction}
              selectedCount={wizard.selectedCount}
            />
          )}

          {/* Instruction Step */}
          {wizard.state.step === "instructing" && (
            <RegenerateInstructionStep
              key="instructing"
              selectedItems={wizard.state.selectedItems}
              instruction={wizard.state.instruction}
              onInstructionChange={wizard.setInstruction}
              onSubmit={wizard.submitRegeneration}
              onBack={wizard.goBack}
              canSubmit={wizard.canSubmitRegeneration}
            />
          )}

          {/* Generating Step */}
          {wizard.state.step === "generating" && (
            <EnrichmentLoadingStep
              key="generating"
              title="Regenerating Content"
              description="AI is rewriting your selected items with your custom instructions..."
            />
          )}

          {/* Preview Step */}
          {wizard.state.step === "previewing" && (
            <RegeneratePreviewStep
              key="previewing"
              regeneratedItems={wizard.state.regeneratedItems}
              errors={wizard.state.errors}
              onApply={wizard.applyRegenerated}
              onBack={wizard.goBack}
              canApply={wizard.canApplyRegenerated}
            />
          )}

          {/* Applying Step */}
          {wizard.state.step === "applying" && (
            <EnrichmentLoadingStep
              key="applying"
              title="Applying Changes"
              description="Updating your resume with the regenerated content..."
            />
          )}

          {/* Complete State */}
          {wizard.state.step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="py-10 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Content Regenerated
              </h3>
              <p className="text-white/50 mb-8 text-sm">
                Your resume has been updated with the regenerated content.
              </p>
              <Button
                onClick={handleComplete}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8"
              >
                Done
              </Button>
            </motion.div>
          )}

          {/* Error State */}
          {wizard.state.step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Regeneration Failed
              </h3>
              <p className="mx-auto mb-8 max-w-sm text-sm text-red-300 leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {wizard.state.error || "An unexpected error occurred. Please try again."}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={wizard.goBack}
                  className="border-white/15 text-white hover:bg-white/8 hover:border-white/25"
                >
                  Go Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="text-white/40 hover:text-white"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
