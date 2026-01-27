"use client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, PieChart } from "lucide-react";

export default function MarketGrowth() {
	return (
		<section id="market" className="scroll-mt-28 py-24 px-6">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center max-w-3xl mx-auto mb-16"
				>
					<div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium uppercase tracking-wider">
						<TrendingUp className="h-3.5 w-3.5" />
						Market Opportunity
					</div>
					<h2 className="text-3xl md:text-5xl font-bold text-[#EEEEEE] tracking-tight mb-6">
						Sizing The Opportunity
					</h2>
					<p className="text-lg text-[#EEEEEE]/60 leading-relaxed max-w-2xl mx-auto">
						Acceleration of AI adoption in HR + parsing automation forms a
						compounding wedge for talent intelligence. Dual-sided leverage
						expands TAM.
					</p>
				</motion.div>

				<div className="grid lg:grid-cols-2 gap-8">
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Card className="h-full p-8 bg-[#1a2026]/40 border-0 ring-1 ring-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-[#1a2026]/60 transition-colors">
							<div className="absolute top-0 right-0 p-32 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />

							<div className="flex items-center justify-between mb-8">
								<h3 className="text-2xl font-bold text-[#EEEEEE]">
									AI in HR
									<span className="block text-sm font-normal text-[#EEEEEE]/40 mt-1">
										2024 → 2029
									</span>
								</h3>
								<Badge
									variant="outline"
									className="bg-rose-500/10 text-rose-300 border-rose-500/20 px-3 py-1 text-sm"
								>
									CAGR 19.1%
								</Badge>
							</div>

							<div className="flex items-end justify-between gap-4 mb-4">
								{[
									{ year: "2024", value: "6.05", suffix: "B" },
									{ year: "2027", value: "10.08", suffix: "B" },
									{ year: "2029", value: "14.08", suffix: "B" },
								].map((p, i) => (
									<div key={p.year} className="flex-1">
										<div className="flex items-baseline gap-0.5 text-rose-300/90 hover:text-rose-300 transition-colors">
											<span className="text-lg font-bold">$</span>
											<span className="text-3xl md:text-4xl font-bold tracking-tight">
												{p.value}
											</span>
											<span className="text-sm font-medium text-rose-300/60">
												{p.suffix}
											</span>
										</div>
										<div className="h-1 w-full bg-white/5 rounded-full mt-3 mb-2 overflow-hidden">
											<motion.div
												initial={{ width: 0 }}
												whileInView={{ width: "100%" }}
												transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
												className="h-full bg-gradient-to-r from-rose-500/40 to-rose-500"
											/>
										</div>
										<div className="text-xs font-medium uppercase tracking-wider text-[#EEEEEE]/30">
											{p.year}
										</div>
									</div>
								))}
							</div>

							<p className="mt-8 text-sm text-[#EEEEEE]/50 leading-relaxed border-t border-white/5 pt-6">
								High CAGR outpaces broader HR SaaS as intelligent orchestration
								replaces static workflows.
							</p>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 30 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Card className="h-full p-8 bg-[#1a2026]/40 border-0 ring-1 ring-white/5 backdrop-blur-md relative overflow-hidden group hover:bg-[#1a2026]/60 transition-colors">
							<div className="absolute top-0 right-0 p-32 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />

							<div className="flex items-center justify-between mb-8">
								<h3 className="text-2xl font-bold text-[#EEEEEE]">
									Resume Parsing
									<span className="block text-sm font-normal text-[#EEEEEE]/40 mt-1">
										Market Segment
									</span>
								</h3>
								<Badge
									variant="outline"
									className="bg-sky-500/10 text-sky-300 border-sky-500/20 px-3 py-1 text-sm"
								>
									114% Growth
								</Badge>
							</div>

							<div className="grid grid-cols-2 gap-12 mb-8">
								<div className="relative">
									<div className="text-sm text-[#EEEEEE]/40 mb-2 uppercase tracking-wide">
										2024 Market
									</div>
									<div className="text-4xl md:text-5xl font-bold text-sky-300/80">
										$20.2B
									</div>
								</div>
								<div className="relative">
									<div className="text-sm text-[#EEEEEE]/40 mb-2 uppercase tracking-wide">
										2029 Projection
									</div>
									<div className="text-4xl md:text-5xl font-bold text-sky-300">
										$43.2B
									</div>
									<div className="absolute -left-6 top-1/2 -translate-y-1/2">
										<TrendingUp className="h-5 w-5 text-sky-500/50" />
									</div>
								</div>
							</div>

							<p className="mt-auto text-sm text-[#EEEEEE]/50 leading-relaxed border-t border-white/5 pt-6">
								Automation of early-funnel qualification more than doubles
								extractive/value layers by 2029.
							</p>
						</Card>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
