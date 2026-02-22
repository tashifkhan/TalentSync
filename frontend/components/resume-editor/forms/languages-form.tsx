"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ResumeData } from "@/types/resume";

interface LanguagesFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function LanguagesForm({ data, onChange }: LanguagesFormProps) {
  const languages = data.languages ?? [];

  const updateLanguage = (index: number, value: string) => {
    const newLangs = [...languages];
    newLangs[index] = { language: value };
    onChange({ ...data, languages: newLangs });
  };

  const addLanguage = () => {
    onChange({ ...data, languages: [...languages, { language: "" }] });
  };

  const removeLanguage = (index: number) => {
    onChange({ ...data, languages: languages.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      {languages.map((lang, index) => (
        <div key={index} className="group flex items-center gap-2">
          <Input
            placeholder="English, Spanish, Mandarin..."
            value={lang.language}
            onChange={(e) => updateLanguage(index, e.target.value)}
            className="bg-muted/30 border-border/60 focus:border-brand-primary/40 h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0 transition-opacity"
            onClick={() => removeLanguage(index)}
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
        onClick={addLanguage}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Language
      </Button>
    </div>
  );
}
