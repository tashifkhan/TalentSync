"use client";

import { LandingHero } from "@/components/landing-hero";
import {
  ValueProps,
  HowItWorks,
  Testimonials,
  FinalCTA,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden pb-24">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.15] [background:radial-gradient(circle_at_20%_25%,hsl(var(--brand-primary)/0.13),transparent_60%),radial-gradient(circle_at_80%_70%,hsl(var(--brand-primary)/0.13),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px] mix-blend-overlay opacity-20" />
      </div>
      <LandingHero />
      <ValueProps />
      <HowItWorks />
      <Testimonials />
      <FinalCTA />
    </main>
  );
}
