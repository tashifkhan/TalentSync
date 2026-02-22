"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import type { ResumeData } from "@/types/resume";

interface SummaryFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function SummaryForm({ data, onChange }: SummaryFormProps) {
  const charCount = (data.predicted_field ?? "").length;

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor="predicted_field"
        className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
      >
        <FileText className="h-3 w-3 text-brand-primary/60" />
        Professional Summary / Field
      </Label>
      <Textarea
        id="predicted_field"
        placeholder="Experienced software engineer with 5+ years in full-stack development..."
        value={data.predicted_field ?? ""}
        onChange={(e) =>
          onChange({ ...data, predicted_field: e.target.value })
        }
        className="bg-muted/30 border-border/60 focus:border-brand-primary/40 focus:ring-brand-primary/20 min-h-[100px] resize-y transition-colors"
        rows={4}
      />
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/60">
          Describe your professional background and career focus.
        </p>
        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
          {charCount} chars
        </span>
      </div>
    </div>
  );
}
