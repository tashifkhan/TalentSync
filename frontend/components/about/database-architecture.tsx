"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Database, Server, HardDrive } from "lucide-react";

export default function DatabaseArchitecture() {
	return (
		<section id="data" className="py-24 px-6 scroll-mt-28">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center max-w-3xl mx-auto mb-16"
				>
					<div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-[#EEEEEE]/60 text-xs font-medium uppercase tracking-wider">
						<HardDrive className="h-3.5 w-3.5" />
						Systems Design
					</div>
					<h2 className="text-3xl md:text-5xl font-bold text-[#EEEEEE] tracking-tight mb-6">
						Data Model & Persistence
					</h2>
					<p className="text-lg text-[#EEEEEE]/60 leading-relaxed">
						Normalized relational schema supports scalable parsing throughput,
						multi-tenant access control, and historical analytics.
					</p>
				</motion.div>

				<div className="grid lg:grid-cols-2 gap-8">
					<motion.div
						initial={{ opacity: 0, x: -24 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Card className="h-full p-6 md:p-8 bg-[#1a2026]/40 border-0 ring-1 ring-white/5 backdrop-blur-md group hover:bg-[#1a2026]/60 transition-colors">
							<div className="flex items-center gap-4 mb-6">
								<div className="h-10 w-10 rounded-lg bg-[#76ABAE]/10 flex items-center justify-center shrink-0">
									<Database className="h-5 w-5 text-[#76ABAE]" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#EEEEEE]">
										Logical Architecture
									</h3>
									<p className="text-xs text-[#EEEEEE]/40">Schema Design</p>
								</div>
							</div>

							<div className="relative group/image overflow-hidden rounded-xl border border-white/10 bg-[#11161b] mb-6 shadow-xl">
								<div className="absolute top-0 left-0 right-0 h-8 bg-white/5 flex items-center px-3 border-b border-white/5">
									<div className="flex gap-1.5">
										<div className="w-2 h-2 rounded-full bg-red-500/50" />
										<div className="w-2 h-2 rounded-full bg-yellow-500/50" />
										<div className="w-2 h-2 rounded-full bg-green-500/50" />
									</div>
								</div>
								<div className="pt-8">
									<Image
										src="/database-archetecture.png"
										width={600}
										height={420}
										alt="Database Architecture"
										className="w-full h-auto opacity-90 group-hover/image:scale-[1.02] group-hover/image:opacity-100 transition-all duration-500"
									/>
								</div>
								{/* Gradient Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-[#1a2026]/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none" />
							</div>

							<p className="text-sm text-[#EEEEEE]/50 leading-relaxed">
								Supports resume entity extraction, scoring artifacts, user
								account roles, and pipeline stage logging for observability.
							</p>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 24 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<Card className="h-full p-6 md:p-8 bg-[#1a2026]/40 border-0 ring-1 ring-white/5 backdrop-blur-md group hover:bg-[#1a2026]/60 transition-colors">
							<div className="flex items-center gap-4 mb-6">
								<div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
									<Server className="h-5 w-5 text-indigo-400" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-[#EEEEEE]">
										Entity Relationships
									</h3>
									<p className="text-xs text-[#EEEEEE]/40">ER Diagram</p>
								</div>
							</div>

							<div className="relative group/image overflow-hidden rounded-xl border border-white/10 bg-[#11161b] mb-6 shadow-xl">
								<div className="absolute top-0 left-0 right-0 h-8 bg-white/5 flex items-center px-3 border-b border-white/5">
									<div className="flex gap-1.5">
										<div className="w-2 h-2 rounded-full bg-red-500/50" />
										<div className="w-2 h-2 rounded-full bg-yellow-500/50" />
										<div className="w-2 h-2 rounded-full bg-green-500/50" />
									</div>
								</div>
								<div className="pt-8">
									<Image
										src="/database-relationships.png"
										width={600}
										height={420}
										alt="Database Relationships"
										className="w-full h-auto opacity-90 group-hover/image:scale-[1.02] group-hover/image:opacity-100 transition-all duration-500"
									/>
								</div>
								{/* Gradient Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-[#1a2026]/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none" />
							</div>

							<p className="text-sm text-[#EEEEEE]/50 leading-relaxed">
								Relational mapping across users, resumes, analyses, predictions,
								and hiring flows preserves referential integrity.
							</p>
						</Card>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
