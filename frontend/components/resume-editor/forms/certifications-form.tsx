"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeData, Certification } from "@/types/resume";

interface CertificationsFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function createEmpty(): Certification {
  return { name: "", issuing_organization: "", issue_date: "", expiry_date: "", credential_id: "", url: "" };
}

export function CertificationsForm({ data, onChange }: CertificationsFormProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    data.certifications.length > 0 ? 0 : null
  );

  const items = data.certifications ?? [];

  const updateItem = (index: number, updated: Certification) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange({ ...data, certifications: newItems });
  };

  const addItem = () => {
    const newItems = [...items, createEmpty()];
    onChange({ ...data, certifications: newItems });
    setExpandedIndex(newItems.length - 1);
  };

  const removeItem = (index: number) => {
    onChange({ ...data, certifications: items.filter((_, i) => i !== index) });
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index)
      setExpandedIndex(expandedIndex - 1);
  };

  return (
    <div className="space-y-2.5">
      {items.map((cert, index) => {
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
                  {cert.name || "Untitled Certification"}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {cert.issuing_organization || "Organization"}
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
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      placeholder="AWS Solutions Architect"
                      value={cert.name}
                      onChange={(e) => updateItem(index, { ...cert, name: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Issuing Organization</Label>
                    <Input
                      placeholder="Amazon Web Services"
                      value={cert.issuing_organization}
                      onChange={(e) => updateItem(index, { ...cert, issuing_organization: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Issue Date</Label>
                    <Input
                      placeholder="Jan 2024"
                      value={cert.issue_date ?? ""}
                      onChange={(e) => updateItem(index, { ...cert, issue_date: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                    <Input
                      placeholder="Jan 2027"
                      value={cert.expiry_date ?? ""}
                      onChange={(e) => updateItem(index, { ...cert, expiry_date: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Credential ID</Label>
                    <Input
                      placeholder="ABC123"
                      value={cert.credential_id ?? ""}
                      onChange={(e) => updateItem(index, { ...cert, credential_id: e.target.value })}
                      className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">URL</Label>
                  <Input
                    placeholder="https://verify.cert.com/..."
                    value={cert.url ?? ""}
                    onChange={(e) => updateItem(index, { ...cert, url: e.target.value })}
                    className="bg-muted/30 border-border/60 focus:border-brand-primary/40"
                  />
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
        Add Certification
      </Button>
    </div>
  );
}
