"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  Briefcase,
  FolderOpen,
  Star,
  AlertCircle,
} from "lucide-react";
import type { RegenerateItemInput } from "@/types/enrichment";

interface RegenerateInstructionStepProps {
  selectedItems: RegenerateItemInput[];
  instruction: string;
  onInstructionChange: (instruction: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  canSubmit: boolean;
}

const MAX_INSTRUCTION_LENGTH = 2000;

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

const suggestionPrompts = [
  "Make it more results-focused with metrics and achievements",
  "Use stronger action verbs and professional language",
  "Highlight leadership and collaboration aspects",
  "Focus on technical depth and problem-solving",
  "Make it more concise while keeping key details",
];

export function RegenerateInstructionStep({
  selectedItems,
  instruction,
  onInstructionChange,
  onSubmit,
  onBack,
  canSubmit,
}: RegenerateInstructionStepProps) {
  const remainingChars = MAX_INSTRUCTION_LENGTH - instruction.length;
  const isOverLimit = remainingChars < 0;

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
          Provide Instructions
        </h3>
        <p className="text-sm text-brand-light/60">
          Tell the AI how you want to rewrite the selected content.
        </p>
      </div>

      {/* Selected Items Summary */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm text-brand-light/60 mb-3">
          Items to regenerate:
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => {
            const config = itemTypeConfig[item.item_type];
            const Icon = config.icon;
            return (
              <Badge
                key={item.item_id}
                variant="outline"
                className={`${config.bgColor} border-white/10 text-brand-light`}
              >
                <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                {item.title}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Instruction Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-brand-light">
          Your Instructions
        </label>
        <Textarea
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="Example: Make the descriptions more impactful by adding specific metrics and achievements. Use strong action verbs and highlight leadership experience..."
          className="min-h-[120px] bg-white/5 border-white/10 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary/50 resize-none"
        />
        <div className="flex justify-between items-center">
          <p
            className={`text-xs ${
              isOverLimit ? "text-red-400" : "text-brand-light/40"
            }`}
          >
            {remainingChars} characters remaining
          </p>
          {isOverLimit && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="h-3 w-3" />
              Instruction too long
            </div>
          )}
        </div>
      </div>

      {/* Suggestion Prompts */}
      <div className="space-y-2">
        <p className="text-xs text-brand-light/40 uppercase tracking-wide">
          Quick suggestions
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestionPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onInstructionChange(prompt)}
              className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-brand-light/70 hover:bg-white/10 hover:text-brand-light transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

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
          onClick={onSubmit}
          disabled={!canSubmit}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Regenerate Content
        </Button>
      </div>
    </motion.div>
  );
}
