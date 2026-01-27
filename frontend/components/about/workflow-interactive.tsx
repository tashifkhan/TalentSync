"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
	ArrowRight,
	Layers,
	ShieldCheck,
	Search,
	FileText,
	Database,
	GitBranch,
	Cpu,
	Award,
} from "lucide-react";

const pipeline = [
	{
		step: "DOCUMENT PARSING",
		stage: "Input Layer",
		details: "PyPDF2, docx, OCR",
		desc: "Multi-format extraction",
		color: "blue",
		process: "Format detect → Extract → Structure map",
		icon: FileText,
	},
	{
		step: "CONTENT VALIDATION",
		stage: "Validation",
		details: "Structure + heuristic",
		desc: "Resume shape check",
		color: "orange",
		process: "Layout inspect → Density → Compliance",
		icon: ShieldCheck,
	},
	{
		step: "ENTITY EXTRACTION",
		stage: "NLP Layer",
		details: "spaCy + custom",
		desc: "Contact & profile entities",
		color: "green",
		process: "NER pass → Normalize → Aggregate",
		icon: Search,
	},
	{
		step: "TEXT PREPROCESS",
		stage: "Preprocess",
		details: "Normalize & clean",
		desc: "Canonical token stream",
		color: "teal",
		process: "Tokenize → Lower → Filter stop",
		icon: Layers,
	},
	{
		step: "SKILL CLASSIFY",
		stage: "ML Mapping",
		details: "Taxonomy index",
		desc: "Skill categorization",
		color: "purple",
		process: "Extract → Cluster → Map",
		icon: Database,
	},
	{
		step: "EXPERIENCE ANALYSIS",
		stage: "Career Intelligence",
		details: "Role timeline",
		desc: "Progression signals",
		color: "indigo",
		process: "Span calc → Seniority → Growth",
		icon: GitBranch,
	},
	{
		step: "FIELD PREDICTION",
		stage: "AI Prediction",
		details: "Ensemble",
		desc: "Job domain scoring",
		color: "pink",
		process: "Features → Inference → Confidence",
		icon: Cpu,
	},
	{
		step: "QUALITY SCORING",
		stage: "Assessment",
		details: "Composite score",
		desc: "Effectiveness rating",
		color: "yellow",
		process: "Completeness → ATS fit → Style",
		icon: Award,
	},
];

const colorMap: Record<string, string> = {
	blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-300 hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]",
	orange:
		"from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-300 hover:border-orange-500/50 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.5)]",
	green:
		"from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]",
	teal: "from-teal-500/10 to-teal-600/5 border-teal-500/20 text-teal-300 hover:border-teal-500/50 hover:shadow-[0_0_30px_-10px_rgba(20,184,166,0.5)]",
	purple:
		"from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)]",
	indigo:
		"from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]",
	pink: "from-pink-500/10 to-pink-600/5 border-pink-500/20 text-pink-300 hover:border-pink-500/50 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.5)]",
	yellow:
		"from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)]",
};

const iconColorMap: Record<string, string> = {
	blue: "text-blue-400 bg-blue-500/10",
	orange: "text-orange-400 bg-orange-500/10",
	green: "text-emerald-400 bg-emerald-500/10",
	teal: "text-teal-400 bg-teal-500/10",
	purple: "text-purple-400 bg-purple-500/10",
	indigo: "text-indigo-400 bg-indigo-500/10",
	pink: "text-pink-400 bg-pink-500/10",
	yellow: "text-amber-400 bg-amber-500/10",
};

export default function WorkflowInteractive() {
	return (
		<section id="pipeline" className="py-24 px-6 scroll-mt-28">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center max-w-4xl mx-auto mb-16"
				>
					<h2 className="text-3xl md:text-5xl font-bold text-[#EEEEEE] tracking-tight mb-6">
						Intelligent{" "}
						<span className="text-[#76ABAE]">Parsing & Scoring</span> Pipeline
					</h2>
					<p className="text-lg text-[#EEEEEE]/60 leading-relaxed max-w-2xl mx-auto">
						Raw documents evolve into structured, ranked, and contextualized
						talent intelligence via an 8-stage ML + NLP workflow.
					</p>
				</motion.div>

				<div className="relative">
					{/* Connection Line */}
					<div className="hidden md:block absolute top-[45%] left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#76ABAE]/20 to-transparent z-0" />

					<div className="grid md:grid-cols-4 gap-6 relative z-10">
						{pipeline.map((p, i) => {
							const Icon = p.icon;
							return (
								<motion.div
									key={p.step}
									initial={{ opacity: 0, y: 30 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.5, delay: i * 0.08 }}
									className="group perspective"
								>
									<div
										className={`relative h-full border backdrop-blur-md rounded-2xl p-6 transition-all duration-300 bg-gradient-to-br ${colorMap[p.color]} group-hover:-translate-y-2`}
									>
										{/* Icon */}
										<div
											className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${iconColorMap[p.color]} ring-1 ring-white/5`}
										>
											<Icon className="h-5 w-5" />
										</div>

										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="text-[10px] uppercase tracking-wider font-bold opacity-70">
													{p.stage}
												</div>
												<div className="text-[10px] font-mono opacity-50">
													0{i + 1}
												</div>
											</div>

											<h3 className="font-bold text-sm tracking-wide text-[#EEEEEE]">
												{p.step}
											</h3>

											<p className="text-xs text-[#EEEEEE]/60 leading-relaxed min-h-[40px]">
												{p.desc}
											</p>

											{/* Detail Tag */}
											<div className="pt-4 mt-2 border-t border-white/5">
												<div className="text-[10px] font-medium opacity-60 flex items-center gap-1.5">
													<span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
													{p.details}
												</div>

												{/* Hover Process Reveal */}
												<div className="overflow-hidden max-h-0 group-hover:max-h-20 transition-all duration-300">
													<div className="pt-3 mt-3 text-[10px] text-[#EEEEEE] font-mono bg-black/20 rounded p-2 border border-white/5">
														{p.process}
													</div>
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>

				{/* Mobile Backup */}
				<div className="md:hidden mt-12 p-4 bg-white/5 rounded-xl border border-white/10">
					<div className="text-center text-sm text-[#EEEEEE]/60 mb-4">
						Pipeline Visualization
					</div>
					<Image
						src="/flowchat.svg"
						width={900}
						height={800}
						alt="Workflow"
						className="w-full h-auto opacity-80"
					/>
				</div>
			</div>
		</section>
	);
}
