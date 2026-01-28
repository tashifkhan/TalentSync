"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Code, Server, Cpu, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const stack = [
  {
    category: "Frontend Experience",
    icon: Code,
    gradient: "from-brand-primary/20 to-brand-primary/5",
    border: "hover:border-brand-primary/50",
    items: [
      { name: "Next.js 14", desc: "App Router, Server Components & Streaming" },
      { name: "Tailwind CSS", desc: "Atomic utility-first design system" },
      { name: "Framer Motion", desc: "Fluid, physics-based animations" },
    ],
  },
  {
    category: "Backend & Data",
    icon: Server,
    gradient: "from-brand-primary/15 to-brand-primary/5",
    border: "hover:border-brand-primary/50",
    items: [
      { name: "FastAPI", desc: "High-performance async Python runtime" },
      { name: "PostgreSQL", desc: "Advanced relationship modeling & indexing" },
      { name: "Redis", desc: "In-memory caching & session management" },
    ],
  },
  {
    category: "Intelligence Layer",
    icon: Cpu,
    gradient: "from-brand-primary/20 to-brand-primary/5",
    border: "hover:border-brand-primary/50",
    items: [
      { name: "NLP Pipeline", desc: "SpaCy & custom named entity recognition" },
      { name: "Vector Search", desc: "Semantic similarity & embeddings" },
      { name: "LLM Orchestration", desc: "LangChain context-aware inference" },
    ],
  },
];

export default function TechStackGrid() {
  return (
    <section id="stack" className="py-24 px-6 scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-brand-light/60 text-xs font-medium uppercase tracking-wider">
            <Database className="h-3.5 w-3.5" />
            Under The Hood
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-light tracking-tight mb-6">
            Architecture & Tooling
          </h2>
          <p className="text-lg text-brand-light/60 leading-relaxed">
            Composable layers optimize ingest, transformation, and feedback
            surfaces while preserving extensibility.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {stack.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.category}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
              >
                <Card
                  className={cn(
                    "h-full p-8 bg-brand-dark/40 border-white/10 backdrop-blur-md relative overflow-hidden group transition-all duration-500 border-t-0 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50",
                    c.border
                  )}
                >
                  {/* Gradient Background */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                      c.gradient
                    )}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Icon className="h-6 w-6 text-brand-light" />
                      </div>
                      <h3 className="text-xl font-bold text-brand-light">
                        {c.category}
                      </h3>
                    </div>

                    <ul className="space-y-6">
                      {c.items.map((it) => (
                        <li
                          key={it.name}
                          className="relative pl-4 border-l-2 border-white/10 group-hover:border-white/20 transition-colors"
                        >
                          <div className="font-semibold text-brand-light text-sm mb-1">
                            {it.name}
                          </div>
                          <div className="text-xs text-brand-light/50 leading-snug">
                            {it.desc}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

