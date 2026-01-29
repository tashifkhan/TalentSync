"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Check, X, AlertCircle } from "lucide-react";

const rows = [
  { feature: "Detailed Seeker Analysis", us: true, b2b: false, b2c: true },
  { feature: "Employer Hiring Dashboard", us: true, b2b: true, b2c: false },
  { feature: "Bulk ZIP Uploads", us: true, b2b: "limited", b2c: false },
  {
    feature: "Unlimited Free Seeker Access",
    us: true,
    b2b: false,
    b2c: "limited",
  },
];

function Cell({ val }: { val: boolean | string }) {
  if (val === true)
    return (
      <div className="flex justify-center">
        <Check className="h-5 w-5 text-emerald-400" />
      </div>
    );
  if (val === false)
    return (
      <div className="flex justify-center">
        <X className="h-5 w-5 text-rose-400/60" />
      </div>
    );
  return (
    <div className="flex justify-center">
      <AlertCircle className="h-5 w-5 text-amber-400" />
    </div>
  );
}

export default function CompetitiveEdgeTable() {
  return (
    <section id="edge" className="py-24 px-6 scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-brand-light tracking-tight mb-6">
            Differentiated Surface Area
          </h2>
          <p className="text-lg text-brand-light/60 leading-relaxed">
            Integrated seeker + employer workflow reduces system handoffs and
            amplifies structured feedback loops.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="overflow-hidden border-0 bg-brand-dark/40 backdrop-blur-md ring-1 ring-white/5 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-6 font-medium text-base text-brand-light/40 uppercase tracking-widest">
                      Feature Capability
                    </th>
                    <th className="p-6 font-bold text-base text-center text-brand-primary bg-brand-primary/5 min-w-[160px]">
                      TalentSync
                    </th>
                    <th className="p-6 font-medium text-base text-center text-brand-light/40 min-w-[140px]">
                      B2B Parsers
                    </th>
                    <th className="p-6 font-medium text-base text-center text-brand-light/40 min-w-[140px]">
                      B2C Builders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r, i) => (
                    <tr
                      key={r.feature}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-6 font-medium text-brand-light text-base">
                        {r.feature}
                      </td>
                      <td className="p-6 bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors">
                        <Cell val={r.us} />
                      </td>
                      <td className="p-6 opacity-60">
                        <Cell val={r.b2b} />
                      </td>
                      <td className="p-6 opacity-60">
                        <Cell val={r.b2c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white/5 flex items-center justify-center gap-6 text-xs font-medium uppercase tracking-wider border-t border-white/5">
              <span className="flex items-center gap-2 text-brand-light/80">
                <Check className="h-4 w-4 text-emerald-400" /> Full Support
              </span>
              <span className="flex items-center gap-2 text-brand-light/80">
                <AlertCircle className="h-4 w-4 text-amber-400" /> Limited
              </span>
              <span className="flex items-center gap-2 text-brand-light/80">
                <X className="h-4 w-4 text-rose-400" /> Not Supported
              </span>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
