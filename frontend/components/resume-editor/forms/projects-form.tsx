"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeData, Project } from "@/types/resume";

interface ProjectsFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function createEmptyProject(): Project {
  return {
    title: "",
    technologies_used: [],
    description: "",
    live_link: "",
    repo_link: "",
  };
}

export function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    data.projects.length > 0 ? 0 : null
  );

  const projects = data.projects ?? [];

  const updateProject = (index: number, updated: Project) => {
    const newProjects = [...projects];
    newProjects[index] = updated;
    onChange({ ...data, projects: newProjects });
  };

  const addProject = () => {
    const newProjects = [...projects, createEmptyProject()];
    onChange({ ...data, projects: newProjects });
    setExpandedIndex(newProjects.length - 1);
  };

  const removeProject = (index: number) => {
    onChange({ ...data, projects: projects.filter((_, i) => i !== index) });
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  return (
    <div className="space-y-2.5">
      {projects.map((proj, index) => {
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
                  {proj.title || "Untitled Project"}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {proj.technologies_used?.join(", ") ||
                    "No technologies listed"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeProject(index);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </button>

            {isExpanded && (
              <div className="border-t border-border/40 px-3 pb-3 pt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    placeholder="E-commerce Platform"
                    value={proj.title}
                    onChange={(e) =>
                      updateProject(index, { ...proj, title: e.target.value })
                    }
                    className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Technologies (comma-separated)
                  </Label>
                  <Input
                    placeholder="React, Node.js, PostgreSQL"
                    value={proj.technologies_used?.join(", ") ?? ""}
                    onChange={(e) =>
                      updateProject(index, {
                        ...proj,
                        technologies_used: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    placeholder="Describe the project, your role, and key accomplishments..."
                    value={proj.description}
                    onChange={(e) =>
                      updateProject(index, {
                        ...proj,
                        description: e.target.value,
                      })
                    }
                    className="bg-muted/30 border-border/60 focus:border-brand-primary/40 min-h-[80px] resize-y"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Live Link
                    </Label>
                    <Input
                      placeholder="https://myproject.com"
                      value={proj.live_link ?? ""}
                      onChange={(e) =>
                        updateProject(index, {
                          ...proj,
                          live_link: e.target.value,
                        })
                      }
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Repo Link
                    </Label>
                    <Input
                      placeholder="https://github.com/user/repo"
                      value={proj.repo_link ?? ""}
                      onChange={(e) =>
                        updateProject(index, {
                          ...proj,
                          repo_link: e.target.value,
                        })
                      }
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
        onClick={addProject}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Project
      </Button>
    </div>
  );
}
