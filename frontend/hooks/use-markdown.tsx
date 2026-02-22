"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import MarkdownIt from "markdown-it";
// @ts-ignore - bundled without explicit default export types
import taskLists from "markdown-it-task-lists";
import parse, { Element } from "html-react-parser";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Internal: CodeBlock
// ============================================================

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const displayLang = language || "text";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showLineNumbers = code.split("\n").filter(Boolean).length > 4;

  return (
    <div className="relative group my-6 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <Terminal className="w-3.5 h-3.5 text-brand-light/30" />
          <span className="text-xs font-mono font-medium text-brand-light/40 uppercase tracking-widest">
            {displayLang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200",
            copied
              ? "text-green-400 bg-green-400/10"
              : "text-brand-light/40 hover:text-brand-light/80 hover:bg-white/10"
          )}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={displayLang.toLowerCase()}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: showLineNumbers ? "1.25rem 1.5rem" : "1.25rem 1.5rem",
          background: "transparent",
          fontSize: "0.8125rem",
          lineHeight: "1.75",
        }}
        showLineNumbers={showLineNumbers}
        lineNumberStyle={{
          minWidth: "2.5em",
          paddingRight: "1.25em",
          color: "rgba(238, 238, 238, 0.15)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          marginRight: "1.25em",
          userSelect: "none",
          fontSize: "0.75rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// ============================================================
// Internal: MermaidBlock
// ============================================================

const MermaidBlock = ({ code }: { code: string }) => {
  const id = useMemo(
    () => `mermaid-${Math.random().toString(36).substring(2, 9)}`,
    []
  );
  const ref = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#76ABAE",
            primaryTextColor: "#EEEEEE",
            primaryBorderColor: "#5A8B8F",
            lineColor: "#76ABAE",
            secondaryColor: "#1e2330",
            tertiaryColor: "#181C20",
            background: "#181C20",
            mainBkg: "#1e2330",
            nodeBorder: "#76ABAE",
            clusterBkg: "#181C20",
            titleColor: "#EEEEEE",
            edgeLabelBackground: "#181C20",
            activeTaskBkgColor: "#76ABAE",
            doneTaskBkgColor: "#5A8B8F",
            critBkgColor: "#ef4444",
          },
        });
        if (ref.current && !cancelled) {
          const { svg } = await mermaid.render(id, code);
          if (ref.current && !cancelled) {
            ref.current.innerHTML = svg;
          }
        }
      } catch {
        if (!cancelled) setRenderError(true);
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (renderError) {
    return (
      <div className="my-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
        <p className="text-xs font-mono text-red-400/60 mb-2 uppercase tracking-wide">
          Diagram render failed
        </p>
        <pre className="text-xs text-brand-light/40 whitespace-pre-wrap font-mono">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-6 overflow-hidden rounded-xl border border-white/10 bg-brand-darker p-6">
      <div ref={ref} className="w-full [&_svg]:max-w-full [&_svg]:h-auto" />
    </div>
  );
};

// ============================================================
// Hook: useMarkdown
// ============================================================

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const CALLOUT_ICONS: Record<string, string> = {
  note: `<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  tip: `<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>`,
  warning: `<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
  important: `<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
  danger: `<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  caution: `<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
};

const CALLOUT_TITLES: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  danger: "Danger",
  caution: "Caution",
};

export function useMarkdown(rawContent: unknown) {
  // Safe coercion — matches the fix in the legacy renderMarkdown
  const content: string =
    rawContent === null || rawContent === undefined
      ? ""
      : typeof rawContent === "string"
        ? rawContent
        : String(rawContent);

  const md = useMemo(() => {
    const instance = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    }).use(taskLists, { label: true });

    // ----------------------------------------------------------------
    // Fence: code blocks + mermaid diagrams → data-* placeholders
    // html-react-parser will swap these for React components later.
    // ----------------------------------------------------------------
    instance.renderer.rules.fence = (tokens, idx) => {
      const lang = tokens[idx].info.trim();
      const escaped = instance.utils.escapeHtml(tokens[idx].content);
      if (lang === "mermaid") {
        return `<div data-mermaid-block="true">${escaped}</div>`;
      }
      return `<div data-code-block="true" data-language="${lang}">${escaped}</div>`;
    };

    // ----------------------------------------------------------------
    // GFM callouts: > [!NOTE], > [!WARNING], etc.
    // ----------------------------------------------------------------
    instance.core.ruler.after("block", "gfm_alerts", (state) => {
      const tokens = state.tokens;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== "blockquote_open") continue;
        const pOpen = tokens[i + 1];
        const inline = tokens[i + 2];
        if (pOpen?.type !== "paragraph_open" || inline?.type !== "inline") continue;

        const match = inline.content.match(
          /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|DANGER)\]/i
        );
        if (!match) continue;

        const type = match[1].toLowerCase();
        tokens[i].attrJoin("class", `gfm-alert gfm-alert-${type}`);

        // Strip the indicator prefix from the text
        inline.content = inline.content.replace(/^\[!.*?\]\s*/, "");
        if (inline.children?.[0]) {
          inline.children[0].content = inline.children[0].content.replace(
            /^\[!.*?\]\s*/,
            ""
          );
        }

        // Inject the title + icon as an html_inline token
        const titleToken = new state.Token("html_inline", "", 0);
        const icon = CALLOUT_ICONS[type] ?? CALLOUT_ICONS.note;
        const title = CALLOUT_TITLES[type] ?? type;
        titleToken.content = `<div class="alert-title flex items-center gap-2 font-semibold mb-2 text-sm uppercase tracking-wide">${icon}${title}</div>`;
        if (inline.children) {
          inline.children.unshift(titleToken);
        }
      }
    });

    // ----------------------------------------------------------------
    // Headings: add id anchors + group hover links
    // ----------------------------------------------------------------
    instance.renderer.rules.heading_open = (tokens, idx) => {
      const tag = tokens[idx].tag;
      const title = tokens[idx + 1]?.content ?? "";
      const id = slugify(title);
      const hoverAnchor = `<a href="#${id}" class="absolute -left-5 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary/50 hover:text-brand-primary font-mono text-base no-underline leading-none" aria-label="Link to section">#</a>`;

      if (tag === "h1") {
        return `<div class="group relative mt-10 mb-5 first:mt-0"><h1 id="${id}" class="scroll-mt-24 text-2xl font-bold tracking-tight text-brand-light border-b border-white/10 pb-3">`;
      }
      if (tag === "h2") {
        return `<div class="group relative mt-8 mb-4">${hoverAnchor}<h2 id="${id}" class="scroll-mt-24 text-xl font-semibold tracking-tight text-brand-light">`;
      }
      if (tag === "h3") {
        return `<div class="group relative mt-6 mb-3">${hoverAnchor}<h3 id="${id}" class="scroll-mt-24 text-lg font-semibold text-brand-light/90">`;
      }
      const sizeMap: Record<string, string> = {
        h4: "text-base font-semibold text-brand-light/80",
        h5: "text-sm font-semibold text-brand-light/70",
        h6: "text-xs font-semibold uppercase tracking-widest text-brand-light/50",
      };
      return `<div class="group relative mt-5 mb-2">${hoverAnchor}<${tag} id="${id}" class="scroll-mt-24 ${sizeMap[tag] ?? "text-base font-medium text-brand-light"}">`;
    };

    instance.renderer.rules.heading_close = (tokens, idx) => {
      const tag = tokens[idx].tag;
      const title = tokens[idx - 1]?.content ?? "";
      const id = slugify(title);
      const inlineLink = `<a href="#${id}" class="opacity-0 group-hover:opacity-100 text-brand-primary/30 hover:text-brand-primary transition-all ml-2 text-sm font-mono no-underline" aria-label="Link to section">#</a>`;
      return `${inlineLink}</${tag}></div>`;
    };

    // ----------------------------------------------------------------
    // Block elements
    // ----------------------------------------------------------------
    instance.renderer.rules.paragraph_open = () =>
      `<p class="leading-7 text-brand-light/80 mb-4 last:mb-0">`;

    instance.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
      if (tokens[idx].attrGet("class")?.includes("gfm-alert")) {
        return self.renderToken(tokens, idx, options);
      }
      // Standard blockquote: teal left-border + subtle bg
      return `<blockquote class="relative my-6 pl-5 pr-4 py-3 border-l-4 border-brand-primary/50 bg-brand-primary/5 rounded-r-lg text-brand-light/70 italic">`;
    };

    // Table
    instance.renderer.rules.table_open = () =>
      `<div class="my-6 overflow-hidden rounded-xl border border-white/10 shadow-sm"><div class="overflow-x-auto"><table class="min-w-full border-collapse">`;
    instance.renderer.rules.table_close = () => `</table></div></div>`;
    instance.renderer.rules.thead_open = () =>
      `<thead class="bg-white/5">`;
    instance.renderer.rules.th_open = () =>
      `<th class="px-5 py-3 text-left text-xs font-semibold text-brand-light/40 uppercase tracking-wider border-b border-white/10">`;
    instance.renderer.rules.td_open = () =>
      `<td class="px-5 py-3 text-sm text-brand-light/80 border-b border-white/5">`;
    instance.renderer.rules.tr_open = (tokens, idx) => {
      const prevRows = tokens.slice(0, idx).filter((t) => t.type === "tr_open").length;
      return `<tr class="${prevRows % 2 === 1 ? "bg-white/[0.02]" : ""}">`;
    };

    // Lists
    instance.renderer.rules.bullet_list_open = () =>
      `<ul class="my-4 pl-5 space-y-1.5 list-disc marker:text-brand-primary/60">`;
    instance.renderer.rules.ordered_list_open = () =>
      `<ol class="my-4 pl-5 space-y-1.5 list-decimal marker:text-brand-primary/60">`;
    instance.renderer.rules.list_item_open = () =>
      `<li class="text-brand-light/80 pl-0.5">`;

    // Horizontal rule
    instance.renderer.rules.hr = () =>
      `<hr class="my-8 border-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />`;

    // ----------------------------------------------------------------
    // Inline elements
    // ----------------------------------------------------------------
    instance.renderer.rules.code_inline = (tokens, idx) =>
      `<code class="px-1.5 py-0.5 rounded bg-white/10 text-[0.8em] font-mono text-brand-primary font-medium border border-white/10">${instance.utils.escapeHtml(tokens[idx].content)}</code>`;

    instance.renderer.rules.strong_open = () =>
      `<strong class="font-semibold text-brand-light">`;
    instance.renderer.rules.em_open = () =>
      `<em class="italic text-brand-light/70">`;

    instance.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener noreferrer");
      tokens[idx].attrJoin(
        "class",
        "text-brand-primary hover:text-brand-primary/70 underline underline-offset-2 decoration-brand-primary/40 hover:decoration-brand-primary/70 transition-colors"
      );
      return self.renderToken(tokens, idx, options);
    };

    return instance;
  }, []);

  const renderedParts = useMemo(() => {
    if (!content) return null;
    const html = md.render(content);
    return parse(html, {
      replace: (domNode) => {
        if (!(domNode instanceof Element) || !domNode.attribs) return;

        if (domNode.attribs["data-code-block"]) {
          const rawCode = (domNode.children[0] as { data?: string })?.data ?? "";
          return (
            <CodeBlock
              language={domNode.attribs["data-language"] ?? ""}
              code={rawCode}
            />
          );
        }

        if (domNode.attribs["data-mermaid-block"]) {
          const rawCode = (domNode.children[0] as { data?: string })?.data ?? "";
          return <MermaidBlock code={rawCode} />;
        }
      },
    });
  }, [content, md]);

  return { renderedParts };
}
