"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Plus, Minus } from "lucide-react";
import type { EnhancedDescription } from "@/types/enrichment";

interface EnrichmentPreviewStepProps {
  enhancements: EnhancedDescription[];
  onApply: () => void;
  onBack: () => void;
  isApplying: boolean;
}

export function EnrichmentPreviewStep({
  enhancements,
  onApply,
  onBack,
  isApplying,
}: EnrichmentPreviewStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/10">
        <h3 className="text-lg font-medium text-brand-light">
          Preview Enhancements
        </h3>
        <p className="text-sm text-brand-light/60 mt-1">
          Review the AI-generated improvements before applying them to your resume.
        </p>
      </div>

      {/* Enhancement List */}
      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
        {enhancements.map((enhancement, index) => (
          <motion.div
            key={enhancement.item_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border border-white/10 overflow-hidden"
          >
            {/* Item Header */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <h4 className="font-medium text-brand-light">{enhancement.title}</h4>
              <span className="text-xs text-brand-light/40 uppercase tracking-wider">
                {enhancement.item_type}
              </span>
            </div>

            {/* Diff View */}
            <div className="p-4 space-y-4">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-red-400/80">
                  <Minus className="h-3 w-3" />
                  Original
                </div>
                <ul className="space-y-1 pl-4">
                  {enhancement.original_description.map((line, i) => (
                    <li
                      key={i}
                      className="text-sm text-brand-light/50 line-through decoration-red-400/30"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Enhanced */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-green-400/80">
                  <Plus className="h-3 w-3" />
                  Enhanced
                </div>
                <ul className="space-y-1 pl-4">
                  {enhancement.enhanced_description.map((line, i) => (
                    <li
                      key={i}
                      className="text-sm text-brand-light bg-green-500/10 rounded px-2 py-1 border-l-2 border-green-400"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isApplying}
          className="text-brand-light/60 hover:text-brand-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Start Over
        </Button>
        <Button
          onClick={onApply}
          disabled={isApplying || enhancements.length === 0}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply {enhancements.length} Enhancement{enhancements.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </motion.div>
  );
}
