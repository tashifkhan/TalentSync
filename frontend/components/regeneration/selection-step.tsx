"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Briefcase,
  FolderOpen,
  Star,
  CheckSquare,
  Square,
  BookOpen,
  Shield,
  Award,
  Trophy,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectableItem } from "@/types/enrichment";

interface RegenerateSelectionStepProps {
  items: SelectableItem[];
  onToggle: (itemId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onProceed: () => void;
  onCancel: () => void;
  canProceed: boolean;
  selectedCount: number;
}

const itemTypeConfig: Record<
  string,
  { icon: typeof Briefcase; label: string; color: string }
> = {
  experience: {
    icon: Briefcase,
    label: "Experience",
    color: "text-blue-400",
  },
  project: {
    icon: FolderOpen,
    label: "Project",
    color: "text-green-400",
  },
  skills: {
    icon: Star,
    label: "Skills",
    color: "text-amber-400",
  },
  publication: {
    icon: BookOpen,
    label: "Publication",
    color: "text-purple-400",
  },
  position: {
    icon: Shield,
    label: "Position",
    color: "text-cyan-400",
  },
  certification: {
    icon: Award,
    label: "Certification",
    color: "text-orange-400",
  },
  achievement: {
    icon: Trophy,
    label: "Achievement",
    color: "text-yellow-400",
  },
  education: {
    icon: GraduationCap,
    label: "Education",
    color: "text-indigo-400",
  },
};

export function RegenerateSelectionStep({
  items,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onProceed,
  onCancel,
  canProceed,
  selectedCount,
}: RegenerateSelectionStepProps) {
  const allSelected = items.length > 0 && items.every((item) => item.selected);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-brand-light mb-1">
          Select Items to Regenerate
        </h3>
        <p className="text-sm text-brand-light/60">
          Choose which parts of your resume you want to rewrite with AI
          assistance.
        </p>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-brand-light/60 hover:text-brand-light h-8 px-2"
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4 mr-1.5" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-1.5" />
              Select All
            </>
          )}
        </Button>
        {selectedCount > 0 && (
          <Badge className="bg-brand-primary/20 text-brand-primary border-brand-primary/30">
            {selectedCount} selected
          </Badge>
        )}
      </div>

      {/* Item List */}
      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 -mr-1">
        {items.map((item, index) => {
          const config = itemTypeConfig[item.type] ?? itemTypeConfig.experience;
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onToggle(item.id)}
              className={cn(
                "group px-3 py-3 rounded-lg border cursor-pointer transition-all duration-150",
                item.selected
                  ? "bg-brand-primary/10 border-brand-primary/30"
                  : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => onToggle(item.id)}
                  className="mt-0.5 shrink-0 border-white/30 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                  {/* Title row */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={cn("h-3.5 w-3.5 shrink-0", config.color)}
                    />
                    <span className="text-sm font-medium text-brand-light truncate">
                      {item.title}
                    </span>
                  </div>
                  {/* Subtitle */}
                  {item.subtitle && (
                    <p className="text-xs text-brand-light/50 truncate mt-0.5 pl-[22px]">
                      {item.subtitle}
                    </p>
                  )}
                  {/* Content preview */}
                  {item.content.length > 0 && (
                    <p className="text-[11px] text-brand-light/35 truncate mt-1 pl-[22px]">
                      {item.content[0]}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-brand-light/60 hover:text-brand-light"
        >
          Cancel
        </Button>
        <Button
          onClick={onProceed}
          disabled={!canProceed}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
