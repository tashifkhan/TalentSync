"use client";

import React from "react";
import { useMarkdown } from "@/hooks/use-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: unknown;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  const { renderedParts } = useMarkdown(content);

  if (!renderedParts) return null;

  return (
    <div
      className={cn(
        "max-w-none text-base font-sans antialiased",

        // --- DETAILS / SUMMARY accordions ---
        "[&_details]:my-6 [&_details]:overflow-hidden [&_details]:rounded-xl",
        "[&_details]:border [&_details]:border-white/10 [&_details]:bg-white/[0.03]",
        "[&_summary]:cursor-pointer [&_summary]:select-none",
        "[&_summary]:px-5 [&_summary]:py-3.5 [&_summary]:font-medium",
        "[&_summary]:text-brand-light/90 [&_summary]:hover:bg-white/5",
        "[&_summary]:transition-colors [&_summary]:outline-none",
        "[&_summary]:list-none [&_summary::-webkit-details-marker]:hidden",
        "[&_details[open]_summary]:border-b [&_details[open]_summary]:border-white/10",
        "[&_details_>*:not(summary)]:px-5",
        "[&_details_>p:first-of-type]:mt-4",
        "[&_details_>*:last-child]:mb-5",

        // --- GFM Callouts: shared base ---
        "[&_.gfm-alert]:my-6 [&_.gfm-alert]:border-l-4",
        "[&_.gfm-alert]:px-5 [&_.gfm-alert]:py-4 [&_.gfm-alert]:rounded-r-xl",
        "[&_.gfm-alert_p]:mb-0 [&_.gfm-alert_p]:text-brand-light/80",

        // NOTE — teal/blue
        "[&_.gfm-alert-note]:border-blue-400/50 [&_.gfm-alert-note]:bg-blue-400/[0.07]",
        "[&_.gfm-alert-note_.alert-title]:text-blue-400",

        // TIP — green
        "[&_.gfm-alert-tip]:border-green-400/50 [&_.gfm-alert-tip]:bg-green-400/[0.07]",
        "[&_.gfm-alert-tip_.alert-title]:text-green-400",

        // IMPORTANT — brand teal
        "[&_.gfm-alert-important]:border-brand-primary/60 [&_.gfm-alert-important]:bg-brand-primary/[0.07]",
        "[&_.gfm-alert-important_.alert-title]:text-brand-primary",

        // WARNING — amber
        "[&_.gfm-alert-warning]:border-amber-400/50 [&_.gfm-alert-warning]:bg-amber-400/[0.07]",
        "[&_.gfm-alert-warning_.alert-title]:text-amber-400",

        // DANGER + CAUTION — red
        "[&_.gfm-alert-danger]:border-red-400/50 [&_.gfm-alert-danger]:bg-red-400/[0.07]",
        "[&_.gfm-alert-danger_.alert-title]:text-red-400",
        "[&_.gfm-alert-caution]:border-red-400/50 [&_.gfm-alert-caution]:bg-red-400/[0.07]",
        "[&_.gfm-alert-caution_.alert-title]:text-red-400",

        // --- Task list checkboxes ---
        "[&_input[type=checkbox]]:accent-brand-primary [&_input[type=checkbox]]:mr-2 [&_input[type=checkbox]]:cursor-pointer",

        className
      )}
    >
      {renderedParts}
    </div>
  );
};

export default MarkdownRenderer;
