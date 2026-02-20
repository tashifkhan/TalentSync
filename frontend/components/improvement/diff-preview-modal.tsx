"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitCompare,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Check,
  X,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ResumeFieldDiff,
  ResumeDiffSummary,
  RefinementStats,
  ImprovementSuggestion,
} from "@/types/improvement";

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReject: () => void;
  diffSummary: ResumeDiffSummary | null;
  detailedChanges: ResumeFieldDiff[];
  suggestions: ImprovementSuggestion[];
  refinementStats: RefinementStats | null;
  warnings: string[];
  isApplying?: boolean;
}

const changeTypeConfig = {
  added: {
    icon: Plus,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  removed: {
    icon: Minus,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  modified: {
    icon: RefreshCw,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
};

const confidenceConfig = {
  high: { ringColor: "ring-emerald-500/60", dotColor: "bg-emerald-400", label: "High confidence" },
  medium: { ringColor: "ring-yellow-500/60", dotColor: "bg-yellow-400", label: "Medium confidence" },
  low: { ringColor: "ring-red-500/60", dotColor: "bg-red-400", label: "Low confidence" },
};

export function DiffPreviewModal({
  isOpen,
  onClose,
  onApply,
  onReject,
  diffSummary,
  detailedChanges,
  suggestions,
  refinementStats,
  warnings,
  isApplying = false,
}: DiffPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Teal gradient accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-600 rounded-t-xl flex-shrink-0" />

        <div className="flex flex-col flex-1 overflow-hidden px-6 pt-5 pb-6 gap-5">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 ring-1 ring-teal-500/30 flex-shrink-0">
                <GitCompare className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-white leading-tight">Resume Improvement Preview</p>
                <p className="text-xs text-white/40 font-normal mt-0.5">Review all proposed changes before applying</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
            {/* Summary Stats */}
            {diffSummary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3"
              >
                <StatCard
                  label="Total Changes"
                  value={diffSummary.total_changes}
                  icon={Layers}
                />
                <StatCard
                  label="Skills Added"
                  value={diffSummary.skills_added}
                  icon={Plus}
                  positive
                />
                <StatCard
                  label="Descriptions Modified"
                  value={diffSummary.descriptions_modified}
                  icon={RefreshCw}
                />
              </motion.div>
            )}

            {/* Refinement Stats */}
            {refinementStats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-teal-500/8 border border-teal-500/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/15 ring-1 ring-teal-500/30">
                    <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">Refinement Results</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Passes completed</span>
                    <span className="text-white font-medium">{refinementStats.passes_completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Keywords injected</span>
                    <span className="text-white font-medium">{refinementStats.keywords_injected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Match before</span>
                    <span className="text-white font-medium">{refinementStats.initial_match_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Match after</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {refinementStats.final_match_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 ring-1 ring-amber-500/30">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-amber-200">Warnings</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-200/70 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400/50 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Detailed Changes */}
            {detailedChanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Detailed Changes</h4>
                <div className="space-y-2">
                  {detailedChanges.map((change, index) => {
                    const config = changeTypeConfig[change.change_type];
                    const Icon = config.icon;
                    const confidence = confidenceConfig[change.confidence];

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + index * 0.04 }}
                        className={cn(
                          "p-3 rounded-xl border",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0 mt-0.5", config.bgColor, "ring-1", config.borderColor)}>
                              <Icon className={cn("h-3.5 w-3.5", config.color)} />
                            </div>
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs border px-1.5 py-0", config.badgeColor)}
                                >
                                  {change.field_type}
                                </Badge>
                                <span className="text-xs text-white/30 truncate">
                                  {change.field_path}
                                </span>
                              </div>
                              {change.original_value && (
                                <p className="text-sm text-red-400/60 line-through leading-snug">
                                  {change.original_value}
                                </p>
                              )}
                              {change.new_value && (
                                <p className="text-sm text-emerald-400 leading-snug">
                                  {change.new_value}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex-shrink-0 mt-0.5 h-4 w-4 rounded-full ring-1 flex items-center justify-center",
                              confidence.ringColor
                            )}
                            title={confidence.label}
                          >
                            <span className={cn("h-2 w-2 rounded-full", confidence.dotColor)} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Suggestions Applied</h4>
                <ul className="space-y-1.5">
                  {suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="text-sm text-white/60 pl-4 border-l-2 border-teal-500/40 py-0.5 leading-snug"
                    >
                      {suggestion.suggestion}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-white/10 flex-shrink-0">
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isApplying}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Reject Changes
            </Button>
            <Button
              onClick={onApply}
              disabled={isApplying}
              className="bg-teal-600 hover:bg-teal-500 text-white border-0"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  positive?: boolean;
}

function StatCard({ label, value, icon: Icon, positive }: StatCardProps) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-3.5 w-3.5", positive ? "text-emerald-400" : "text-teal-400")} />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <span className={cn("text-2xl font-semibold", positive ? "text-emerald-400" : "text-white")}>
        {value}
      </span>
    </div>
  );
}
