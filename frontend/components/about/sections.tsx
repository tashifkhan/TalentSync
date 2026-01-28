"use client";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Users,
  Zap,
  Brain,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

export function AboutHero() {
  return (
    <section
      id="top"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden scroll-mt-28"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-brand-primary/10 blur-[160px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--brand-primary)/0.05),transparent_60%)]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium text-brand-light/90 mb-8 shadow-lg shadow-brand-primary/5 hover:bg-white/10 transition-colors cursor-default"
          >
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span className="tracking-wide">About TalentSync</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-[#F5F7F7] via-[#E5EFEF] to-brand-primary/80 leading-[1.1] mb-8 pb-2">
            Building Signal <br className="hidden md:block" />
            <span className="text-brand-primary inline-block filter drop-shadow-sm">
              For Hiring
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-brand-light/60 leading-relaxed max-w-2xl mx-auto font-light">
            We transform unstructured career data into{" "}
            <span className="text-brand-light font-medium">
              structured, contextual intelligence
            </span>{" "}
            for seekers & teams.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <div className="h-px w-12 sm:w-24 bg-gradient-to-r from-transparent to-brand-primary/50" />
            <span className="text-sm uppercase tracking-[0.2em] text-brand-primary/80 font-semibold">
              The Future of Recruiting
            </span>
            <div className="h-px w-12 sm:w-24 bg-gradient-to-l from-transparent to-brand-primary/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const pillars = [
  {
    title: "Context > Keywords",
    desc: "We care about trajectory, scope, domain & impact—not buzzwords.",
    icon: Brain,
    color: "from-brand-primary/20 to-brand-primary/5",
  },
  {
    title: "Actionable Output",
    desc: "Feedback becomes resumes, outreach, interview prep & prioritization.",
    icon: Zap,
    color: "from-brand-primary/15 to-brand-primary/5",
  },
  {
    title: "Dual-Sided",
    desc: "Seamless workflows for both seekers and hiring teams create compounding value.",
    icon: Users,
    color: "from-brand-primary/20 to-brand-primary/5",
  },
  {
    title: "Signal Preservation",
    desc: "Reduce loss across parsing, matching & evaluation pipelines.",
    icon: Target,
    color: "from-brand-primary/15 to-brand-primary/5",
  },
];

export function Pillars() {
  return (
    <section id="pillars" className="relative py-32 scroll-mt-28">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-light mb-4">
            Core Principles
          </h2>
          <div className="h-1 w-20 bg-brand-primary mx-auto rounded-full opacity-60" />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative md:min-h-[280px] p-8 rounded-3xl border border-white/5 bg-brand-dark/40 backdrop-blur-sm hover:bg-brand-dark/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-primary/10"
            >
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white/5 ring-1 ring-white/10 group-hover:bg-brand-primary/20 group-hover:ring-brand-primary/40 transition-all duration-300 mb-6 text-brand-primary">
                  <p.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-brand-light mb-3 group-hover:text-white transition-colors">
                  {p.title}
                </h3>
                <p className="text-brand-light/60 text-sm leading-relaxed group-hover:text-brand-light/80 transition-colors">
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const timeline = [
  {
    phase: "Capture",
    points: ["Upload or bulk ZIP", "Multi-format parsing", "Auto validation"],
  },
  {
    phase: "Structure",
    points: ["Entity extraction", "Timeline building", "Skill normalization"],
  },
  {
    phase: "Intelligence",
    points: [
      "Gap & strength detection",
      "Role alignment scoring",
      "Career trajectory modeling",
    ],
  },
  {
    phase: "Generate",
    points: ["Resume variants", "Cold outreach drafts", "Interview prep Q&A"],
  },
  {
    phase: "Decide",
    points: ["Signal ranking", "Prioritized actions", "Share / export"],
  },
];

export function WorkflowStrip() {
  return (
    <section id="flow" className="relative py-32 scroll-mt-28 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[500px] bg-brand-primary/5 -rotate-6 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-brand-light">
            From Raw Text To{" "}
            <span className="text-brand-primary">Decisions</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[2.25rem] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />

          <div className="grid md:grid-cols-5 gap-12 md:gap-4 relative">
            {timeline.map((t, i) => (
              <motion.div
                key={t.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center group"
              >
                {/* Number Circle */}
                <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-brand-darker border-2 border-brand-primary/30 flex items-center justify-center z-10 shadow-[0_0_20px_-5px_hsl(var(--brand-primary))] group-hover:scale-110 group-hover:border-brand-primary transition-all duration-300 mb-6 md:mb-8">
                  <span className="text-brand-primary font-bold text-lg md:text-xl">
                    {i + 1}
                  </span>
                </div>

                {/* Content Card */}
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group-hover:-translate-y-2 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <h3 className="text-xl font-bold text-brand-light mb-4 text-center relative z-10">
                    {t.phase}
                  </h3>

                  <ul className="space-y-3 relative z-10">
                    {t.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-3 text-sm text-brand-light/70"
                      >
                        <CheckCircle2 className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0" />
                        <span className="group-hover:text-brand-light transition-colors">
                          {p}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TeamFooter() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--brand-primary)/0.08),transparent_50%)]" />

      <div className="container mx-auto px-6 max-w-5xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-surface to-brand-darker border border-white/10 rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-brand-light mb-8">
            Ready to <span className="text-brand-primary">Sync?</span>
          </h2>
          <p className="text-lg md:text-xl text-brand-light/60 max-w-2xl mx-auto mb-12">
            Join us in redefining career intelligence. Simple, powerful, and
            built for the future of work.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <a
              href="/dashboard/seeker"
              className="group relative px-8 py-4 rounded-xl bg-brand-primary text-white font-semibold text-lg overflow-hidden transition-transform active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Get Started Now <ArrowRight className="h-5 w-5" />
              </span>
            </a>
            <a
              href="/"
              className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-brand-light font-medium text-lg transition-colors"
            >
              Back to Home
            </a>
          </div>
        </motion.div>

        <p className="mt-16 text-xs uppercase tracking-[0.2em] text-brand-light/30">
          © {new Date().getFullYear()} TalentSync AI • Redefining Recruitment
        </p>
      </div>
    </section>
  );
}
