"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Check,
  AlertTriangle,
  Briefcase,
  FolderOpen,
  Star,
  ArrowRight,
  Minus,
  Plus,
} from "lucide-react";
import type { RegeneratedItem, RegenerateItemError } from "@/types/enrichment";

interface RegeneratePreviewStepProps {
  regeneratedItems: RegeneratedItem[];
  errors: RegenerateItemError[];
  onApply: () => void;
  onBack: () => void;
  canApply: boolean;
}

const itemTypeConfig = {
  experience: {
    icon: Briefcase,
    label: "Experience",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  project: {
    icon: FolderOpen,
    label: "Project",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  skills: {
    icon: Star,
    label: "Skills",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
};

export function RegeneratePreviewStep({
  regeneratedItems,
  errors,
  onApply,
  onBack,
  canApply,
}: RegeneratePreviewStepProps) {
  const successCount = regeneratedItems.length;
  const errorCount = errors.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-brand-light mb-1">
          Preview Changes
        </h3>
        <p className="text-sm text-brand-light/60">
          Review the regenerated content before applying to your resume.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {successCount > 0 && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Check className="h-3 w-3 mr-1" />
            {successCount} regenerated
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {errorCount} failed
          </Badge>
        )}
      </div>

      {/* Content Preview */}
      <ScrollArea className="h-[50vh] pr-4">
        <div className="space-y-4">
          {/* Regenerated Items */}
          {regeneratedItems.map((item, index) => {
            const config = itemTypeConfig[item.item_type];
            const Icon = config.icon;

            return (
              <motion.div
                key={item.item_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-white/10 overflow-hidden"
              >
                {/* Item Header */}
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="font-medium text-brand-light">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-sm text-brand-light/60">
                        - {item.subtitle}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 border-green-500/30 text-green-400"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>

                {/* Diff Summary */}
                {item.diff_summary && (
                  <div className="px-4 py-2 bg-brand-primary/5 border-b border-white/10">
                    <p className="text-xs text-brand-primary/80">
                      {item.diff_summary}
                    </p>
                  </div>
                )}

                {/* Content Comparison */}
                <div className="grid grid-cols-2 divide-x divide-white/10">
                  {/* Original */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Minus className="h-4 w-4 text-red-400" />
                      <span className="text-xs font-medium text-red-400 uppercase tracking-wide">
                        Original
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {item.original_content.map((line, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-brand-light/50 pl-3 border-l-2 border-red-500/30"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* New */}
                  <div className="p-4 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-medium text-green-400 uppercase tracking-wide">
                        New
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {item.new_content.map((line, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-brand-light pl-3 border-l-2 border-green-500/50"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Errors */}
          {errors.map((error, index) => {
            const config = itemTypeConfig[error.item_type];
            const Icon = config.icon;

            return (
              <motion.div
                key={error.item_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (regeneratedItems.length + index) * 0.05 }}
                className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className="font-medium text-brand-light">
                        {error.title}
                      </span>
                      {error.subtitle && (
                        <span className="text-sm text-brand-light/60">
                          - {error.subtitle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-amber-400/80">{error.message}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-brand-light/60 hover:text-brand-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onApply}
          disabled={!canApply}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          Apply Changes
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
