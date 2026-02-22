"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ResumeData } from "@/types/resume";

interface RecommendedRolesFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function RecommendedRolesForm({ data, onChange }: RecommendedRolesFormProps) {
  const roles = data.recommended_roles ?? [];

  const updateRole = (index: number, value: string) => {
    const newRoles = [...roles];
    newRoles[index] = value;
    onChange({ ...data, recommended_roles: newRoles });
  };

  const addRole = () => {
    onChange({ ...data, recommended_roles: [...roles, ""] });
  };

  const removeRole = (index: number) => {
    onChange({ ...data, recommended_roles: roles.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      {roles.map((role, index) => (
        <div key={index} className="group flex items-center gap-2">
          <Input
            placeholder="Software Engineer, Product Manager..."
            value={role}
            onChange={(e) => updateRole(index, e.target.value)}
            className="bg-muted/30 border-border/60 focus:border-brand-primary/40 h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0 transition-opacity"
            onClick={() => removeRole(index)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed border-border/60 text-muted-foreground hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors"
        onClick={addRole}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Role
      </Button>
    </div>
  );
}
