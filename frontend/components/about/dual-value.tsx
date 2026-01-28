"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Check, Repeat, Sparkles } from "lucide-react";

const seeker = [
  {
    title: "Detailed Resume Analysis",
    desc: "Actionable ATS-aligned recommendations.",
  },
  { title: "AI Job Field Prediction", desc: "Mapped trajectory + domain fit." },
  { title: "Unlimited Free Access", desc: "Remove friction early in journey." },
];
const employer = [
  {
    title: "Curated Candidate Dashboard",
    desc: "Structured profiles & rankings.",
  },
  { title: "Bulk ZIP Processing", desc: "Parallel ingest + extraction." },
  { title: "Reduced Time-To-Hire", desc: "Prioritized signal + automation." },
];

export default function DualValue() {
  return (
    <section id="value" className="py-24 px-6 scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur text-xs text-brand-light/70 mb-6">
            <Repeat className="h-3.5 w-3.5 text-brand-primary" />
            <span>The Generator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-light tracking-tight mb-6">
            Dual-Sided <span className="text-brand-primary">Compounding</span>{" "}
            Flywheel
          </h2>
          <p className="text-lg text-brand-light/60 leading-relaxed">
            Value to seekers increases structured supply; value to teams
            increases qualified demand—tightening the signal loop.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 relative">
          {/* Connecting Icon Desktop */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-brand-dark border border-brand-primary/30 rounded-full z-20 items-center justify-center shadow-xl shadow-brand-primary/10">
            <Repeat className="h-6 w-6 text-brand-primary animate-spin-slow" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full p-8 md:p-10 bg-brand-dark/40 border-0 ring-1 ring-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-brand-dark/60 transition-colors">
              <div className="absolute top-0 right-0 p-32 bg-brand-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-brand-light mb-2 flex items-center gap-3">
                  Seekers
                  <Sparkles className="h-5 w-5 text-brand-primary" />
                </h3>
                <p className="text-brand-light/40 text-sm mb-10">
                  Optimizing for placement & growth
                </p>

                <ul className="space-y-6">
                  {seeker.map((f) => (
                    <li key={f.title} className="flex gap-4 group/item">
                      <div className="h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-brand-primary/20 transition-colors">
                        <Check className="h-3.5 w-3.5 text-brand-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-brand-light mb-1 group-hover/item:text-white transition-colors">
                          {f.title}
                        </div>
                        <p className="text-brand-light/50 text-sm leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="h-full p-8 md:p-10 bg-brand-dark/40 border-0 ring-1 ring-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-brand-dark/60 transition-colors">
              <div className="absolute top-0 left-0 p-32 bg-brand-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-brand-light mb-2 flex items-center gap-3">
                  Employers
                  <Repeat className="h-5 w-5 text-brand-primary" />
                </h3>
                <p className="text-brand-light/40 text-sm mb-10">
                  Structuring chaotic intake pipes
                </p>

                <ul className="space-y-6">
                  {employer.map((f) => (
                    <li key={f.title} className="flex gap-4 group/item">
                      <div className="h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-brand-primary/20 transition-colors">
                        <Check className="h-3.5 w-3.5 text-brand-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-brand-light mb-1 group-hover/item:text-white transition-colors">
                          {f.title}
                        </div>
                        <p className="text-brand-light/50 text-sm leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
