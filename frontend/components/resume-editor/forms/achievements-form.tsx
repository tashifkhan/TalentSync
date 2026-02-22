"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeData, Achievement } from "@/types/resume";

interface AchievementsFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function createEmpty(): Achievement {
  return { title: "", description: "", year: "", category: "" };
}

export function AchievementsForm({ data, onChange }: AchievementsFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    data.achievements.length > 0 ? 0 : null
  );

  const items = data.achievements ?? [];

  const updateItem = (index: number, updated: Achievement) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange({ ...data, achievements: newItems });
  };

  const addItem = () => {
    const newItems = [...items, createEmpty()];
    onChange({ ...data, achievements: newItems });
    setExpandedIndex(newItems.length - 1);
  };

  const removeItem = (index: number) => {
    onChange({ ...data, achievements: items.filter((_, i) => i !== index) });
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  return (
    <div className="space-y-2.5">
      {items.map((ach, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <div
            key={index}
            className={cn(
              "rounded-lg border transition-all duration-150",
              isExpanded
                ? "border-brand-primary/20 bg-brand-primary/[0.02] shadow-sm"
                : "border-border/60 bg-card/30 hover:border-border"
            )}
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
            >
              <div
                className={cn(
                  "flex items-center justify-center h-5 w-5 rounded transition-colors",
                  isExpanded ? "text-brand-primary" : "text-muted-foreground/50"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isExpanded ? "text-foreground" : "text-foreground/80"
                  )}
                >
                  {ach.title || "Untitled Achievement"}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {[ach.category, ach.year].filter(Boolean).join(" - ") || "No details"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(index);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </button>

            {isExpanded && (
              <div className="border-t border-border/40 px-3 pb-3 pt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      placeholder="Dean's List, Hackathon Winner..."
                      value={ach.title}
                      onChange={(e) => updateItem(index, { ...ach, title: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <Input
                      placeholder="Academic, Professional, Competition..."
                      value={ach.category ?? ""}
                      onChange={(e) => updateItem(index, { ...ach, category: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      placeholder="Brief description"
                      value={ach.description ?? ""}
                      onChange={(e) => updateItem(index, { ...ach, description: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Year</Label>
                    <Input
                      placeholder="2024"
                      value={ach.year ?? ""}
                      onChange={(e) => updateItem(index, { ...ach, year: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed border-border/60 text-muted-foreground hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors"
        onClick={addItem}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Achievement
      </Button>
    </div>
  );
}
