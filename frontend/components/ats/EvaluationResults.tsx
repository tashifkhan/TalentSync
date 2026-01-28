"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CheckCircle, Lightbulb } from "lucide-react";

interface EvaluationResultsProps {
	evaluationResult: {
		score: number;
		reasons_for_the_score: string[];
		suggestions: string[];
	} | null;
}

export default function EvaluationResults({
	evaluationResult,
}: EvaluationResultsProps) {
	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-success";
		if (score >= 60) return "text-warning";
		return "text-destructive";
	};

	const getScoreGradient = (score: number) => {
		if (score >= 80) return "from-success to-success";
		if (score >= 60) return "from-warning to-warning";
		return "from-destructive to-destructive";
	};

	const getScoreLabel = (score: number) => {
		if (score >= 80) return "Excellent Match";
		if (score >= 60) return "Good Match";
		if (score >= 40) return "Fair Match";
		return "Needs Improvement";
	};

	return (
		<Card className="relative backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl overflow-hidden h-full">
			<CardHeader className="pb-4">
				<CardTitle className="text-brand-light text-xl sm:text-2xl font-semibold">
					Evaluation Results
				</CardTitle>
			</CardHeader>
			<CardContent>
				{!evaluationResult ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
							<Target className="h-12 w-12 text-brand-primary/40" />
						</div>
						<h3 className="text-brand-light text-lg font-medium mb-2">
							No Evaluation Yet
						</h3>
						<p className="text-brand-light/60 max-w-md">
							Fill in the form and click "Evaluate Resume" to see how well your
							resume matches the job description.
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Score Display */}
						<div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10">
							<div className="text-center">
								<p className="text-brand-light/70 text-sm mb-2">
									ATS Match Score
								</p>
								<div
									className={`text-6xl font-bold ${getScoreColor(
										evaluationResult.score
									)}`}
								>
									{evaluationResult.score}
								</div>
								<p className="text-brand-light/50 text-sm mt-2">out of 100</p>
								<p
									className={`text-sm font-semibold mt-2 ${getScoreColor(
										evaluationResult.score
									)}`}
								>
									{getScoreLabel(evaluationResult.score)}
								</p>

								{/* Progress Bar */}
								<div className="mt-4 w-full bg-white/10 rounded-full h-3 overflow-hidden">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${evaluationResult.score}%` }}
										transition={{ duration: 1, delay: 0.3 }}
										className={`h-full bg-gradient-to-r ${getScoreGradient(
											evaluationResult.score
										)} rounded-full`}
									/>
								</div>
							</div>
						</div>

						{/* Reasons */}
						<div className="space-y-3">
							<h4 className="text-brand-light font-semibold flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-brand-primary" />
								Why This Score?
							</h4>
							<div className="space-y-2">
								{evaluationResult.reasons_for_the_score.map((reason, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.5, delay: index * 0.1 }}
										className="bg-white/5 rounded-lg p-3 border border-white/10"
									>
										<p className="text-brand-light/80 text-sm leading-relaxed">
											{reason}
										</p>
									</motion.div>
								))}
							</div>
						</div>

						{/* Suggestions */}
						{evaluationResult.suggestions.length > 0 && (
							<div className="space-y-3">
								<h4 className="text-brand-light font-semibold flex items-center gap-2">
									<Lightbulb className="h-5 w-5 text-warning" />
									Improvement Suggestions
								</h4>
								<div className="space-y-2">
									{evaluationResult.suggestions.map((suggestion, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: index * 0.1 }}
											className="bg-warning/10 rounded-lg p-3 border border-warning/20"
										>
											<p className="text-brand-light/80 text-sm leading-relaxed">
												{suggestion}
											</p>
										</motion.div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
