"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, Building2, AlertCircle } from "lucide-react";

const stats = [
  {
    value: "286%",
    label: "YoY Application Surge",
    description:
      "Avg 48.7 applications per posting, overwhelming manual review pipelines.",
    color: "from-brand-primary/20 to-brand-primary/10",
    textColor: "text-brand-primary",
    icon: TrendingUp,
  },
  {
    value: "93%",
    label: "Employers Use ATS",
    description:
      "Formatting errors & keyword bias silently filter strong candidates.",
    color: "from-brand-primary/15 to-brand-primary/5",
    textColor: "text-brand-primary",
    icon: Building2,
  },
];

export default function ProblemStats() {
  return (
    <section id="problem" className="relative scroll-mt-28 py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-medium uppercase tracking-wider">
            <AlertCircle className="h-3.5 w-3.5" />
            Current Landscape
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-light tracking-tight mb-6">
            The Challenge Of Modern Hiring
          </h2>
          <p className="text-brand-light/60 text-lg leading-relaxed">
            Application volume & noisy signals create drag for recruiters while
            seekers face opaque filters. We surface structure & context—fast.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="relative overflow-hidden border-0 bg-brand-dark/40 backdrop-blur-md p-10 h-full group hover:bg-brand-dark/60 transition-colors duration-300">
                  {/* Background Glow */}
                  <div
                    className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${s.color} blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500`}
                  />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-8 shadow-xl">
                      <Icon className={`h-8 w-8 ${s.textColor}`} />
                    </div>

                    <div
                      className={`text-7xl font-bold tracking-tighter ${s.textColor} opacity-90 mb-4`}
                    >
                      {s.value}
                    </div>

                    <div className="text-xl font-semibold text-brand-light mb-4">
                      {s.label}
                    </div>

                    <p className="text-base text-brand-light/50 leading-relaxed max-w-sm mx-auto group-hover:text-brand-light/70 transition-colors">
                      {s.description}
                    </p>
                  </div>

                  {/* Bottom Border Line */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color} opacity-50`}
                  />
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
