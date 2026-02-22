"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Plus,
  Minus,
  X,
  MessageSquare,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EnhancedDescription,
  PatchStatus,
  PatchReviewState,
} from "@/types/enrichment";

interface EnrichmentPreviewStepProps {
  enhancements: EnhancedDescription[];
  patchReviews: Record<string, PatchReviewState>;
  onPatchStatusChange: (itemId: string, status: PatchStatus) => void;
  onPatchCommentChange: (itemId: string, comment: string) => void;
  onApproveAll: () => void;
  onRefineRejected: () => void;
  onApply: () => void;
  onBack: () => void;
  isApplying: boolean;
  isRefining: boolean;
  approvedCount: number;
  rejectedWithCommentsCount: number;
}

export function EnrichmentPreviewStep({
  enhancements,
  patchReviews,
  onPatchStatusChange,
  onPatchCommentChange,
  onApproveAll,
  onRefineRejected,
  onApply,
  onBack,
  isApplying,
  isRefining,
  approvedCount,
  rejectedWithCommentsCount,
}: EnrichmentPreviewStepProps) {
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});

  const toggleComment = (itemId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const allApproved = enhancements.every(
    (e) => patchReviews[e.item_id]?.status === "approved"
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/10">
        <h3 className="text-lg font-medium text-brand-light">
          Preview Enhancements
        </h3>
        <p className="text-sm text-brand-light/60 mt-1">
          Review each enhancement. Approve the ones you want, reject any that
          need changes, and leave comments for the AI.
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs text-brand-light/50">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
              approvedCount > 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-white/5 text-brand-light/40"
            )}
          >
            <Check className="h-3 w-3" />
            {approvedCount} approved
          </span>
          {enhancements.length - approvedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/80">
              <X className="h-3 w-3" />
              {enhancements.length - approvedCount} rejected
            </span>
          )}
        </div>
        {!allApproved && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onApproveAll}
            className="text-xs text-brand-light/50 hover:text-brand-light h-7 px-2"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Approve All
          </Button>
        )}
      </div>

      {/* Enhancement List */}
      <div className="space-y-4">
        {enhancements.map((enhancement, index) => {
          const review = patchReviews[enhancement.item_id] ?? {
            status: "approved" as PatchStatus,
            comment: "",
          };
          const isApproved = review.status === "approved";
          const isRejected = review.status === "rejected";
          const showComment =
            expandedComments[enhancement.item_id] || isRejected;

          return (
            <motion.div
              key={enhancement.item_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={cn(
                "rounded-lg border overflow-hidden transition-colors duration-200",
                isApproved
                  ? "border-emerald-500/25 bg-emerald-500/[0.02]"
                  : isRejected
                    ? "border-red-500/25 bg-red-500/[0.02]"
                    : "border-white/10"
              )}
            >
              {/* Item Header with approve/reject controls */}
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-brand-light text-sm truncate">
                    {enhancement.title}
                  </h4>
                  <span className="text-[10px] text-brand-light/40 uppercase tracking-wider">
                    {enhancement.item_type}
                  </span>
                </div>

                {/* Approve / Reject toggle group */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onPatchStatusChange(enhancement.item_id, "approved")
                    }
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-l-md text-xs font-medium transition-all duration-150",
                      isApproved
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-white/5 text-brand-light/40 hover:bg-white/10 hover:text-brand-light/60"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPatchStatusChange(enhancement.item_id, "rejected");
                      // Auto-expand comment when rejecting
                      if (!expandedComments[enhancement.item_id]) {
                        setExpandedComments((prev) => ({
                          ...prev,
                          [enhancement.item_id]: true,
                        }));
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-r-md text-xs font-medium transition-all duration-150",
                      isRejected
                        ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                        : "bg-white/5 text-brand-light/40 hover:bg-white/10 hover:text-brand-light/60"
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>

              {/* Diff View */}
              <div
                className={cn(
                  "p-4 space-y-4 transition-opacity duration-200",
                  isRejected && "opacity-50"
                )}
              >
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

              {/* Comment Section */}
              <div className="border-t border-white/5">
                {/* Toggle comment button (visible when approved or when comment not yet shown) */}
                {isApproved && !showComment && (
                  <button
                    type="button"
                    onClick={() => toggleComment(enhancement.item_id)}
                    className="flex items-center gap-1.5 px-4 py-2 w-full text-xs text-brand-light/30 hover:text-brand-light/50 transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Add a comment
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </button>
                )}

                <AnimatePresence>
                  {showComment && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-brand-light/50">
                          <MessageSquare className="h-3 w-3" />
                          {isRejected
                            ? "Tell the AI what to change"
                            : "Optional note"}
                        </label>
                        <Textarea
                          value={review.comment}
                          onChange={(e) =>
                            onPatchCommentChange(
                              enhancement.item_id,
                              e.target.value
                            )
                          }
                          placeholder={
                            isRejected
                              ? "e.g., Focus more on the metrics, mention the specific tools used, make it more concise..."
                              : "Optional feedback for this enhancement..."
                          }
                          className="bg-white/5 border-white/10 text-brand-light text-sm placeholder:text-brand-light/30 focus:border-brand-primary resize-none min-h-[60px]"
                          rows={2}
                        />
                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => {
                              toggleComment(enhancement.item_id);
                              onPatchCommentChange(enhancement.item_id, "");
                            }}
                            className="text-[10px] text-brand-light/30 hover:text-brand-light/50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isApplying || isRefining}
          className="text-brand-light/60 hover:text-brand-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Start Over
        </Button>

        <div className="flex items-center gap-2">
          {rejectedWithCommentsCount > 0 && (
            <Button
              variant="outline"
              onClick={onRefineRejected}
              disabled={isApplying || isRefining}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-300"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 mr-2",
                  isRefining && "animate-spin"
                )}
              />
              Refine {rejectedWithCommentsCount} Rejected
            </Button>
          )}
          <Button
            onClick={onApply}
            disabled={isApplying || isRefining || approvedCount === 0}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply {approvedCount} Enhancement
            {approvedCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
