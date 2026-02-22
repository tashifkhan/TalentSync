"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2 } from "lucide-react";
import type { ResumeData, Skill } from "@/types/resume";

interface SkillsFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const skills = data.skills_analysis ?? [];

  const updateSkill = (index: number, updated: Skill) => {
    const newSkills = [...skills];
    newSkills[index] = updated;
    onChange({ ...data, skills_analysis: newSkills });
  };

  const addSkill = () => {
    onChange({
      ...data,
      skills_analysis: [...skills, { skill_name: "", percentage: 80 }],
    });
  };

  const removeSkill = (index: number) => {
    onChange({
      ...data,
      skills_analysis: skills.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-2.5">
      {skills.length > 0 && (
        <div className="space-y-2">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/30 hover:border-border px-3 py-2.5 transition-colors"
            >
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="React, Python, AWS..."
                    value={skill.skill_name}
                    onChange={(e) =>
                      updateSkill(index, {
                        ...skill,
                        skill_name: e.target.value,
                      })
                    }
                    className="bg-muted/30 border-border/60 focus:border-brand-primary/40 h-8 text-sm"
                  />
                  <span className="text-[10px] font-medium text-brand-primary/70 tabular-nums w-10 text-right shrink-0">
                    {skill.percentage}%
                  </span>
                </div>
                <Slider
                  value={[skill.percentage]}
                  onValueChange={([v]) =>
                    updateSkill(index, { ...skill, percentage: v })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/30 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeSkill(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed border-border/60 text-muted-foreground hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors"
        onClick={addSkill}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Skill
      </Button>
    </div>
  );
}
