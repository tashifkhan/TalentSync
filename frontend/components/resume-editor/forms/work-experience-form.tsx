"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeData, WorkExperience } from "@/types/resume";

interface WorkExperienceFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function createEmptyExperience(): WorkExperience {
  return {
    role: "",
    company_and_duration: "",
    bullet_points: [""],
  };
}

export function WorkExperienceForm({ data, onChange }: WorkExperienceFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    data.work_experience.length > 0 ? 0 : null
  );

  const experiences = data.work_experience ?? [];

  const updateExperience = (index: number, updated: WorkExperience) => {
    const newExperiences = [...experiences];
    newExperiences[index] = updated;
    onChange({ ...data, work_experience: newExperiences });
  };

  const addExperience = () => {
    const newExperiences = [...experiences, createEmptyExperience()];
    onChange({ ...data, work_experience: newExperiences });
    setExpandedIndex(newExperiences.length - 1);
  };

  const removeExperience = (index: number) => {
    const newExperiences = experiences.filter((_, i) => i !== index);
    onChange({ ...data, work_experience: newExperiences });
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateBulletPoint = (
    expIndex: number,
    bulletIndex: number,
    value: string
  ) => {
    const exp = experiences[expIndex];
    const newBullets = [...exp.bullet_points];
    newBullets[bulletIndex] = value;
    updateExperience(expIndex, { ...exp, bullet_points: newBullets });
  };

  const addBulletPoint = (expIndex: number) => {
    const exp = experiences[expIndex];
    updateExperience(expIndex, {
      ...exp,
      bullet_points: [...exp.bullet_points, ""],
    });
  };

  const removeBulletPoint = (expIndex: number, bulletIndex: number) => {
    const exp = experiences[expIndex];
    const newBullets = exp.bullet_points.filter((_, i) => i !== bulletIndex);
    updateExperience(expIndex, {
      ...exp,
      bullet_points: newBullets.length > 0 ? newBullets : [""],
    });
  };

  return (
    <div className="space-y-2.5">
      {experiences.map((exp, index) => {
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
            {/* Header */}
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
                  {exp.role || "Untitled Role"}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {exp.company_and_duration || "Company"}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums mr-1">
                {exp.bullet_points.filter(Boolean).length} pts
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeExperience(index);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </button>

            {/* Expanded form */}
            {isExpanded && (
              <div className="border-t border-border/40 px-3 pb-3 pt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Role / Title
                    </Label>
                    <Input
                      placeholder="Senior Software Engineer"
                      value={exp.role}
                      onChange={(e) =>
                        updateExperience(index, {
                          ...exp,
                          role: e.target.value,
                        })
                      }
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Company & Duration
                    </Label>
                    <Input
                      placeholder="Google | Jan 2022 - Present"
                      value={exp.company_and_duration}
                      onChange={(e) =>
                        updateExperience(index, {
                          ...exp,
                          company_and_duration: e.target.value,
                        })
                      }
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                </div>

                {/* Bullet points */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Bullet Points
                  </Label>
                  <div className="space-y-1.5">
                    {exp.bullet_points.map((bp, bpIndex) => (
                      <div key={bpIndex} className="flex items-start gap-1.5">
                        <span className="text-[10px] text-muted-foreground/40 mt-2.5 w-4 text-right shrink-0 tabular-nums">
                          {bpIndex + 1}.
                        </span>
                        <Textarea
                          placeholder="Describe your achievement or responsibility..."
                          value={bp}
                          onChange={(e) =>
                            updateBulletPoint(index, bpIndex, e.target.value)
                          }
                          className="bg-muted/30 border-border/60 focus:border-brand-primary/40 min-h-[60px] resize-y text-sm"
                          rows={2}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 mt-0.5 text-muted-foreground/30 hover:text-destructive shrink-0"
                          onClick={() => removeBulletPoint(index, bpIndex)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 h-7 px-2"
                    onClick={() => addBulletPoint(index)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add bullet point
                  </Button>
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
        onClick={addExperience}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Experience
      </Button>
    </div>
  );
}
