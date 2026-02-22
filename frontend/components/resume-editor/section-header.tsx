"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionMeta } from "@/types/resume";

interface SectionHeaderProps {
  section: SectionMeta;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  itemCount?: number;
}

export function SectionHeader({
  section,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  itemCount,
}: SectionHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-3 py-2 select-none transition-all duration-150",
        isDragging
          ? "bg-brand-primary/10 shadow-lg shadow-brand-primary/5 z-50 scale-[1.02] border border-brand-primary/20"
          : "hover:bg-muted/40",
        !section.isVisible && "opacity-40",
        isExpanded && !isDragging && "bg-muted/30"
      )}
    >
      {/* Left accent bar when expanded */}
      {isExpanded && !isDragging && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-primary/50" />
      )}

      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          "cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors",
          "text-muted-foreground/30 hover:text-muted-foreground/70 hover:bg-muted/50"
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Expand/collapse + name */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex flex-1 items-center gap-2 text-left min-w-0"
      >
        <div
          className={cn(
            "flex items-center justify-center h-5 w-5 rounded transition-colors",
            isExpanded
              ? "text-brand-primary"
              : "text-muted-foreground/60"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
        <span
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            isExpanded ? "text-foreground" : "text-foreground/80"
          )}
        >
          {section.displayName}
        </span>
        {itemCount !== undefined && itemCount > 0 && (
          <span
            className={cn(
              "inline-flex items-center justify-center text-[10px] font-medium rounded-md px-1.5 py-px tabular-nums min-w-[20px]",
              isExpanded
                ? "bg-brand-primary/15 text-brand-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {itemCount}
          </span>
        )}
      </button>

      {/* Visibility toggle */}
      <button
        type="button"
        onClick={onToggleVisibility}
        className={cn(
          "p-1 rounded transition-all",
          section.isVisible
            ? "text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
            : "text-amber-400/70 hover:text-amber-400 opacity-100"
        )}
        title={section.isVisible ? "Hide from preview" : "Show in preview"}
      >
        {section.isVisible ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
