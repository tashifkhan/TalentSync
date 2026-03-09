"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Crosshair } from "lucide-react";

const industries = [
  {
    name: "IT & Telecom",
    pct: 25,
    color: "#2DD4BF",
    desc: "Tech sector leads adoption",
  },
  {
    name: "Banking & Financial",
    pct: 20,
    color: "#5EEAD4",
    desc: "High compliance automation",
  },
  {
    name: "Healthcare",
    pct: 15,
    color: "#99F6E4",
    desc: "Digitization & workforce scale",
  },
  { name: "Retail", pct: 12, color: "#CCFBF1", desc: "E-commerce velocity" },
  {
    name: "Manufacturing",
    pct: 10,
    color: "#F0FDFA",
    desc: "Industrial modernization",
  },
  { name: "Other", pct: 18, color: "#6b7280", desc: "Emerging sectors" },
];

export default function TargetIndustries() {
  return (
    <section id="industries" className="py-24 px-6 scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-brand-light/60 text-xs font-medium uppercase tracking-wider">
            <Crosshair className="h-3.5 w-3.5" />
            Focused Impact
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-light tracking-tight mb-6">
            Target Adoption Vectors
          </h2>
          <p className="text-lg text-brand-light/60 leading-relaxed">
            High-volume recruiting + structured compliance needs accelerate ROI
            realization across initial sectors.
          </p>
        </motion.div>

        <Card className="p-8 md:p-12 bg-brand-dark/40 border-0 ring-1 ring-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row gap-16 items-center justify-center relative z-10">
            {/* Donut Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -20 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 blur-[60px] bg-brand-primary/20 rounded-full" />
              <div
                className="w-72 h-72 md:w-80 md:h-80 rounded-full relative overflow-hidden shadow-2xl shadow-black/50 border-4 border-[#1a2026]"
                style={{
                  background: `conic-gradient(${industries
                    .map(
                      (i, idx) =>
                        `${i.color} ${
                          industries
                            .slice(0, idx)
                            .reduce((a, c) => a + c.pct, 0) * 3.6
                        }deg ${
                          industries
                            .slice(0, idx + 1)
                            .reduce((a, c) => a + c.pct, 0) * 3.6
                        }deg`,
                    )
                    .join(",")})`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-[#1a2026] flex flex-col items-center justify-center border-4 border-[#1a2026] shadow-inner">
                    <span className="text-3xl font-bold text-brand-light">
                      100%
                    </span>
                    <span className="text-[10px] text-brand-light/40 uppercase tracking-widest font-medium">
                      Market
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Legend */}
            <div className="flex-1 w-full max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {industries.map((ind, i) => (
                  <motion.div
                    key={ind.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07] transition-all cursor-default"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="h-3 w-3 rounded-full shadow-[0_0_10px]"
                        style={{
                          backgroundColor: ind.color,
                          boxShadow: `0 0 10px ${ind.color}66`,
                        }}
                      />
                      <div className="flex-1 font-medium text-brand-light">
                        {ind.name}
                      </div>
                      <div
                        className="font-bold text-brand-light"
                        style={{ color: ind.color }}
                      >
                        {ind.pct}%
                      </div>
                    </div>
                    <p className="text-xs text-brand-light/50 pl-6 leading-relaxed">
                      {ind.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
