"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

function LandingHero() {
  const [mode, setMode] = useState<"seeker" | "recruiter">("seeker");
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [typingSpeed, setTypingSpeed] = useState(150);

  const words = mode === "seeker" 
    ? ["Decisions", "Interviews", "Opportunities", "Hired"]
    : ["Signals", "Placements", "Insights", "Growth"];

  useEffect(() => {
    const handleTyping = () => {
      const fullText = words[textIndex];
      
      if (!isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setTypingSpeed(150);
        
        if (currentText === fullText) {
          setIsDeleting(true);
          setTypingSpeed(2000); // Pause at end
        }
      } else {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setTypingSpeed(100);
        
        if (currentText === "") {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % words.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, textIndex, typingSpeed, words]);

  const highlight =
    mode === "seeker"
      ? ["Gap analysis", "Tailored resume variants", "Interview prep questions"]
      : ["Bulk parsing", "Candidate signal ranking", "Cold outreach drafts"];

  return (
    <div className="relative min-h-[100vh] w-full bg-brand-dark overflow-hidden">
      {/* MOBILE VIEW (Magazine Style) - md:hidden */}
      <div className="md:hidden relative min-h-[100vh] flex flex-col px-6 pb-32 pt-24 text-left justify-center">
        {/* Mobile Ambient Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Right Blob */}
          <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-brand-primary/20 blur-[100px] rounded-full mix-blend-screen" />
          {/* Bottom Left Blob */}
          <div className="absolute bottom-0 -left-10 w-[250px] h-[250px] bg-brand-primary/10 blur-[80px] rounded-full mix-blend-screen" />
        </div>

        {/* Top Status Pill - In Flow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mb-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-brand-primary" />
            <span className="text-[10px] font-medium tracking-wide text-brand-light/60 uppercase">
              AI Talent Intelligence
            </span>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 mb-8"
        >
          <h1 className="text-5xl font-bold tracking-tight text-white leading-[1.05] mb-4">
            Turn Resumes <br />
            <span className="text-brand-primary relative">
              {currentText}
              <span className="absolute -right-1 top-0 h-full w-[3px] bg-brand-primary animate-pulse" />
            </span>
          </h1>
          <p className="text-lg text-brand-light/60 leading-relaxed max-w-[90%]">
            Parse, analyze & generate outputs faster than opening a doc.
          </p>

          {/* Metrics Strip (Minimal) */}
          <Link
            href={mode === "seeker" ? "/dashboard/seeker" : "/dashboard/recruiter"}
            className="flex items-center gap-8 mt-8 hover:opacity-80 transition-opacity"
          >
            <div>
              <p className="text-2xl font-bold text-white leading-none">12K+</p>
              <p className="text-[10px] text-brand-light/40 uppercase tracking-wider mt-1 font-medium">
                Resumes Parsed
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white leading-none">6h</p>
              <p className="text-[10px] text-brand-light/40 uppercase tracking-wider mt-1 font-medium">
                Saved Weekly
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Bottom Actions - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 flex flex-col gap-3"
        >
          <Link href="/dashboard/seeker" className="w-full">
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-brand-primary/40 border border-brand-primary/50"
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard/seeker" className="w-full">
            <Button
              variant="ghost"
              className="w-full h-12 text-brand-light/70 hover:text-white hover:bg-white/5"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> Watch 30s Demo
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* DESKTOP VIEW (Original Layout) - hidden md:flex */}
      <div className="hidden md:flex relative min-h-[100vh] items-center pt-40 pb-32 overflow-hidden px-4">
        {/* Ambient shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-40 w-[38rem] h-[38rem] bg-brand-primary/20 blur-[140px] rounded-full" />
          <div className="absolute -bottom-32 -left-40 w-[32rem] h-[32rem] bg-brand-primary/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--brand-primary)/0.15),transparent_70%)]" />
        </div>
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left / Center copy */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur text-xs text-brand-light/70 mb-5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-primary" />{" "}
                  <span>AI talent intelligence</span>
                </div>
                <h1 className="font-extrabold tracking-tight text-5xl sm:text-6xl md:text-7xl xl:text-8xl leading-[1.05] text-white">
                  Turn Resumes Into <br className="sm:hidden" />
                  <span className="relative inline-block text-brand-primary min-w-[200px] text-left">
                    <span className="pr-1">{currentText}</span>
                    <span className="absolute right-0 top-[10%] h-[80%] w-[4px] bg-brand-primary animate-pulse" />
                    {/* decorative underline */}
                    <span className="absolute inset-x-0 bottom-1 sm:bottom-2 h-2 sm:h-3 bg-brand-primary/20 blur-sm rounded pointer-events-none" />
                  </span>
                </h1>
                <p className="mt-8 text-lg sm:text-xl text-brand-light/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  TalentSync parses, analyzes & generates actionable outputs for
                  seekers and recruiters—faster than opening a doc.
                </p>
                {/* Mode switch */}
                <div className="mt-8 flex w-full sm:w-auto sm:inline-flex p-1 rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                  {(["seeker", "recruiter"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 sm:flex-none relative px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        mode === m
                          ? "bg-brand-primary text-white shadow-[0_0_0_1px_hsl(var(--brand-primary)/0.25)]"
                          : "text-brand-light/60 hover:text-brand-light"
                      }`}
                    >
                      {m === "seeker" ? "For Job Seekers" : "For Recruiters"}
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
                  <Link
                    href={
                      mode === "seeker"
                        ? "/dashboard/seeker"
                        : "/dashboard/recruiter"
                    }
                    className="w-full sm:w-auto"
                  >
                    <Button
                      size="lg"
                      className="bg-brand-primary hover:bg-brand-primary/90 text-white w-full sm:min-w-[190px] h-12 sm:h-11 shadow-[0_0_20px_rgba(118,171,174,0.3)] hover:shadow-[0_0_30px_rgba(118,171,174,0.5)] transition-all duration-300 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      {mode === "seeker" ? (
                        <FileText className="mr-2 h-5 w-5" />
                      ) : (
                        <Users className="mr-2 h-5 w-5" />
                      )}
                      {mode === "seeker" ? "Get Started" : "Recruiter Console"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                   <Link href="/dashboard/seeker" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-white hover:bg-brand-light text-brand-dark w-full sm:min-w-[190px] h-12 sm:h-11 shadow-xl"
                    >
                      <PlayCircle className="mr-2 h-5 w-5 text-brand-primary" /> Live Demo
                    </Button>
                  </Link>
                </div>
                {/* Metrics */}
                <div className="mt-12 flex flex-row items-start justify-center divide-x divide-white/10 sm:divide-none sm:grid sm:grid-cols-3 gap-6 sm:gap-4 max-w-2xl mx-auto lg:mx-0 text-center sm:text-left">
                  {[
                    { label: "Resumes Parsed", value: "12K+" },
                    { label: "Avg. Time Saved", value: "6h/wk" },
                    { label: "Generated Assets", value: "30K+" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={mode === "seeker" ? "/dashboard/seeker" : "/dashboard/recruiter"}
                      className="flex-1 sm:flex-auto sm:rounded-2xl sm:bg-white/[0.03] sm:ring-1 sm:ring-white/10 sm:px-6 sm:py-5 backdrop-blur-sm hover:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <p className="text-3xl sm:text-2xl font-bold text-white mb-1 group-hover:text-brand-primary transition-colors">
                        {item.value}
                      </p>
                      <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-light/40 font-semibold group-hover:text-brand-light/60 transition-colors">
                        {item.label}
                      </p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
            {/* Right preview - Hidden on Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="hidden lg:block lg:col-span-5 w-full"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-primary/40 via-transparent to-transparent rounded-2xl blur opacity-60" />
                <div className="relative rounded-2xl bg-brand-darker/90 ring-1 ring-white/10 backdrop-blur-xl p-6 flex flex-col gap-5 min-h-[340px]">
                  <p className="text-xs font-mono tracking-wide text-brand-primary uppercase">
                    {mode === "seeker"
                      ? "AI Resume Insights"
                      : "Candidate Signal Snapshot"}
                  </p>
                  <div className="space-y-3">
                    {highlight.map((h) => (
                      <div key={h} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-brand-light/80 leading-snug">
                          {h}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <div className="rounded-xl bg-gradient-to-br from-white/5 to-white/[0.03] ring-1 ring-white/10 p-4">
                      <p className="text-[11px] font-mono text-brand-light/50 mb-2">
                        sample_output.json
                      </p>
                      <pre className="text-[11px] leading-relaxed text-brand-light/70 whitespace-pre-wrap font-mono">
                        {`{
	"candidate_strengths": ["Leadership", "Product sense", "Cross-functional comms"],
	"role_alignment_score": 87,
	"suggested_actions": ["Tighten impact numbers", "Add AI tooling examples"],
	"next_step": "Generate tailored PM resume"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          {/* Bottom mini bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-brand-light/60 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p>Context-aware AI</p>
            </div>
            <div className="hidden sm:block">|</div>
            <p>Secure & private</p>
            <div className="hidden sm:block">|</div>
            <p>No ML training on your data</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { LandingHero };
