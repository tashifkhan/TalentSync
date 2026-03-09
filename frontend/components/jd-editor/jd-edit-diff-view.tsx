"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JDEditResponse, JDEditChange } from "@/types/jd-editor";

interface JDEditDiffViewProps {
  response: JDEditResponse;
  className?: string;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : score >= 60
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          "text-2xl font-bold tabular-nums px-3 py-1 rounded-lg border",
          color
        )}
      >
        {score}
      </span>
      <span className="text-xs text-brand-light/50">{label}</span>
    </div>
  );
}

function ChangeCard({ change }: { change: JDEditChange }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/3 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-primary/15 text-brand-primary border border-brand-primary/20">
          {change.field}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-brand-light/40 uppercase tracking-wider">Before</p>
          <p className="text-brand-light/70 leading-relaxed line-through decoration-red-400/60">
            {change.original || <span className="italic text-brand-light/30">empty</span>}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-green-400/70 uppercase tracking-wider">After</p>
          <p className="text-green-300/90 leading-relaxed">
            {change.edited}
          </p>
        </div>
      </div>
      {change.reason && (
        <p className="text-xs text-brand-light/50 border-t border-white/5 pt-2">
          {change.reason}
        </p>
      )}
    </div>
  );
}

export function JDEditDiffView({ response, className }: JDEditDiffViewProps) {
  const scoreDelta = response.ats_score_after - response.ats_score_before;
  const improved = scoreDelta > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* ATS Score Panel */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-brand-light flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-brand-primary" />
            ATS Score Change
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6">
            <ScoreBadge score={response.ats_score_before} label="Before" />
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-6 w-6 text-brand-light/30" />
              {scoreDelta !== 0 && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    improved ? "text-green-400" : "text-red-400"
                  )}
                >
                  {improved ? "+" : ""}
                  {scoreDelta}
                </span>
              )}
            </div>
            <ScoreBadge score={response.ats_score_after} label="After" />
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {response.keywords_addressed.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-brand-light flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Keywords Addressed ({response.keywords_addressed.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {response.keywords_addressed.map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-green-500/15 text-green-300 border border-green-500/25 text-xs"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {response.keywords_missing.length > 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-brand-light flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-400" />
                Still Missing ({response.keywords_missing.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {response.keywords_missing.map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-red-500/15 text-red-300 border border-red-500/25 text-xs"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Warnings */}
      {response.warnings.length > 0 && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-300 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {response.warnings.map((w, i) => (
                <li key={i} className="text-yellow-200/70 text-xs">
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Field-level changes */}
      {response.changes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-brand-light font-medium text-sm">
            Field Changes ({response.changes.length})
          </h3>
          <div className="space-y-3">
            {response.changes.map((change, i) => (
              <ChangeCard key={i} change={change} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
