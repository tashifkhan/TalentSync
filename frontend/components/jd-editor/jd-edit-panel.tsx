"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import {
  Briefcase,
  Globe,
  Building2,
  Wand2,
  CheckCircle,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { JDEditDiffView } from "./jd-edit-diff-view";
import { useJDEditWizard } from "@/hooks/use-jd-edit-wizard";
import type { JDEditResponse } from "@/types/jd-editor";

interface JDEditPanelProps {
  resumeId: string;
  /** Pre-fill from ATS page query params */
  initialJobDescription?: string;
  initialJdUrl?: string;
  initialCompanyName?: string;
  /** Called when user clicks "Apply Changes" — parent handles DB save */
  onApply?: (response: JDEditResponse) => Promise<void>;
}

export function JDEditPanel({
  resumeId,
  initialJobDescription = "",
  initialJdUrl = "",
  initialCompanyName = "",
  onApply,
}: JDEditPanelProps) {
  const wizard = useJDEditWizard();
  const { state, setField, startEditing, reset, isEditing, hasPreview } = wizard;

  // Seed fields once from URL query params
  useEffect(() => {
    if (initialJobDescription) {
      wizard.prefill(initialJobDescription, initialJdUrl, initialCompanyName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = async () => {
    if (!state.response || !onApply) return;
    wizard.markApplying();
    try {
      await onApply(state.response);
      wizard.markApplySuccess();
    } catch (err) {
      wizard.markApplyError(
        err instanceof Error ? err.message : "Failed to apply changes"
      );
    }
  };

  if (state.step === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <div className="rounded-full bg-green-500/20 p-4">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <h3 className="text-brand-light font-semibold text-lg">
          Resume Updated
        </h3>
        <p className="text-brand-light/60 text-sm text-center max-w-xs">
          The JD-optimized version has been applied to your resume.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="border-white/20 text-brand-light hover:bg-white/5 mt-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Edit Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input form — always visible unless in loading/complete state */}
      <AnimatePresence>
        {(state.step === "idle" || state.step === "error") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label className="text-brand-light text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-primary" />
                Job Description *
              </Label>
              <Textarea
                value={state.jobDescription}
                onChange={(e) => setField("jobDescription", e.target.value)}
                placeholder="Paste the full job description here…"
                rows={8}
                className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/30 resize-none focus:border-brand-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-light text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-brand-primary/70" />
                  Job Posting URL
                  <span className="text-brand-light/40 text-xs">(optional)</span>
                </Label>
                <Input
                  value={state.jdUrl}
                  onChange={(e) => setField("jdUrl", e.target.value)}
                  placeholder="https://company.com/jobs/..."
                  className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/30 focus:border-brand-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-brand-light text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-primary/70" />
                  Company Name
                  <span className="text-brand-light/40 text-xs">(optional)</span>
                </Label>
                <Input
                  value={state.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  placeholder="Acme Corp"
                  className="bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/30 focus:border-brand-primary/50"
                />
              </div>
            </div>

            {state.step === "error" && state.error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{state.error}</p>
              </div>
            )}

            <Button
              onClick={() => startEditing(resumeId)}
              disabled={!wizard.canEdit}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Optimize Resume for this JD
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <Loader variant="spinner" size="lg" className="text-brand-primary" />
          <p className="text-brand-light/70 text-sm">
            Analyzing JD and optimizing your resume…
          </p>
          <p className="text-brand-light/40 text-xs">
            This usually takes 30–60 seconds
          </p>
        </motion.div>
      )}

      {/* Preview + apply */}
      {hasPreview && state.response && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <JDEditDiffView response={state.response} />

          <div className="flex items-center gap-3 pt-2">
            {onApply && (
              <Button
                onClick={handleApply}
                disabled={state.step === "applying"}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-medium flex-1"
              >
                {state.step === "applying" ? (
                  <>
                    <Loader variant="spinner" size="sm" className="mr-2" />
                    Applying…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply Changes
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={reset}
              disabled={state.step === "applying"}
              className="border-white/20 text-brand-light hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
