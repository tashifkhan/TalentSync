"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { useEnrichmentWizard } from "@/hooks/use-enrichment-wizard";
import { EnrichmentQuestionStep } from "./question-step";
import { EnrichmentPreviewStep } from "./preview-step";
import { EnrichmentLoadingStep } from "./loading-step";

interface EnrichmentModalProps {
  resumeId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function EnrichmentModal({
  resumeId,
  isOpen,
  onClose,
  onComplete,
}: EnrichmentModalProps) {
  const wizard = useEnrichmentWizard();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      wizard.reset();
      onClose();
    }
  };

  const handleStart = () => {
    wizard.startAnalysis(resumeId);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    wizard.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden p-0">
        {/* Accent header strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-brand-primary via-brand-primary/60 to-transparent" />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/20 ring-1 ring-brand-primary/40">
                <Sparkles className="h-4 w-4 text-brand-primary" />
              </div>
              Enrich Your Resume
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Idle State */}
            {wizard.state.step === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
                className="py-6 text-center"
              >
                <div className="relative mx-auto mb-6 h-20 w-20">
                  <div className="absolute inset-0 rounded-full bg-brand-primary/10 ring-1 ring-brand-primary/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-9 w-9 text-brand-primary" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  AI-Powered Resume Enhancement
                </h3>
                <p className="text-white/50 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  Our AI analyzes your resume to find weak spots, then asks you
                  targeted questions to craft stronger, more impactful descriptions.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-8 text-xs text-white/35">
                  {["Analyze gaps", "Answer questions", "Apply improvements"].map(
                    (step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        {i > 0 && <span className="text-white/20 hidden sm:inline">—</span>}
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-primary/60" />
                          {step}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <Button
                  onClick={handleStart}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 gap-2 shadow-lg shadow-brand-primary/20"
                >
                  <Zap className="h-4 w-4" />
                  Start Analysis
                </Button>
              </motion.div>
            )}

            {/* Analyzing State */}
            {wizard.state.step === "analyzing" && (
              <EnrichmentLoadingStep
                key="analyzing"
                title="Analyzing Your Resume"
                description="Reviewing your experience and identifying opportunities for enhancement..."
              />
            )}

            {/* Questions State */}
            {wizard.state.step === "questions" && wizard.state.analysisResult && (
              <EnrichmentQuestionStep
                key="questions"
                questions={wizard.state.analysisResult.questions}
                items={wizard.state.analysisResult.items_to_enrich}
                answers={wizard.state.answers}
                onAnswerChange={wizard.setAnswer}
                onSubmit={wizard.submitAnswers}
                onBack={wizard.reset}
                isSubmitting={false}
                analysisSummary={wizard.state.analysisResult.analysis_summary}
              />
            )}

            {/* Generating State */}
            {wizard.state.step === "generating" && (
              <EnrichmentLoadingStep
                key="generating"
                title="Generating Enhancements"
                description="Crafting improved descriptions based on your answers..."
              />
            )}

            {/* Preview State */}
            {wizard.state.step === "preview" && wizard.state.enhancementPreview && (
              <EnrichmentPreviewStep
                key="preview"
                enhancements={wizard.state.enhancementPreview.enhancements}
                onApply={wizard.applyEnhancements}
                onBack={wizard.reset}
                isApplying={false}
              />
            )}

            {/* Applying State */}
            {wizard.state.step === "applying" && (
              <EnrichmentLoadingStep
                key="applying"
                title="Applying Enhancements"
                description="Updating your resume with the improved descriptions..."
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
                  Enhancements Applied
                </h3>
                <p className="text-white/50 mb-8 text-sm">
                  {wizard.state.appliedEnhancements.length} section
                  {wizard.state.appliedEnhancements.length !== 1 ? "s" : ""} enriched
                  with stronger descriptions.
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
                  Analysis Failed
                </h3>
                <p className="mx-auto mb-8 max-w-sm text-sm text-red-300 leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {wizard.state.error || "An unexpected error occurred. Please try again."}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={wizard.reset}
                    className="border-white/15 text-white hover:bg-white/8 hover:border-white/25"
                  >
                    Try Again
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
