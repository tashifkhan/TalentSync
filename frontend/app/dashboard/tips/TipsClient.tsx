"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderOverlay } from "@/components/ui/loader";
import { ArrowLeft, FileText, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTips } from "@/hooks/queries";
import { Tip } from "@/services/tips.service";

export default function TipsClient() {
	const searchParams = useSearchParams();
	const category = searchParams.get("category") || "";
	const skills = searchParams.get("skills") || "";

	const {
		data: tipsData,
		isLoading: loading,
		error,
	} = useTips(category, skills);

	return (
		<>
			<AnimatePresence>
				{loading && (
					<LoaderOverlay
						text="Generating personalized career tips..."
						variant="dots"
						size="xl"
					/>
				)}
			</AnimatePresence>

			{!loading && (
				<div className="min-h-screen">
					<div className="container mx-auto px-4 py-8">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
						>
							<Link href="/dashboard/seeker">
								<Button
									variant="ghost"
									className="text-brand-light hover:text-brand-primary"
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Dashboard
								</Button>
							</Link>
						</motion.div>

						{error ? (
							<div className="min-h-[60vh] flex items-center justify-center">
								<div className="text-center">
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.5 }}
									>
										<AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
										<div className="text-brand-light text-xl mb-4">
											Error loading tips
										</div>
										<div className="text-brand-light/60 mb-4">
											{(error as Error).message}
										</div>
										<Link href="/dashboard/seeker">
											<Button className="bg-brand-primary hover:bg-brand-primary/90">
												Go Back
											</Button>
										</Link>
									</motion.div>
								</div>
							</div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="mt-12"
							>
								<div className="text-center mb-12">
									<h1 className="text-4xl font-bold text-brand-light mb-4">
										Career Tips & Advice
									</h1>
									<p className="text-brand-light/60 text-lg max-w-2xl mx-auto">
										Personalized tips to help you improve your resume and ace
										your interviews
									</p>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
									{/* Resume Tips */}
									<div className="space-y-6">
										<div className="flex items-center space-x-3 mb-6">
											<FileText className="h-8 w-8 text-brand-primary" />
											<h2 className="text-2xl text-brand-light font-semibold">
												Resume Tips
											</h2>
										</div>

										{tipsData?.resume_tips &&
										tipsData.resume_tips.length > 0 ? (
											<div className="space-y-4">
												{tipsData.resume_tips.map((tip: Tip, index: number) => (
													<motion.div
														key={index}
														initial={{ opacity: 0, y: 20 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ duration: 0.5, delay: index * 0.1 }}
													>
														<Card className="backdrop-blur-lg bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
															<CardContent className="p-6">
																<div className="flex items-start space-x-3">
																	<div className="flex-shrink-0 w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center mt-1">
																		<FileText className="h-4 w-4 text-brand-primary" />
																	</div>
																	<div className="flex-1">
																		<h3 className="text-brand-primary font-semibold mb-2">
																			{tip.category}
																		</h3>
																		<p className="text-brand-light leading-relaxed">
																			{tip.advice}
																		</p>
																	</div>
																</div>
															</CardContent>
														</Card>
													</motion.div>
												))}
											</div>
										) : (
											<div className="text-center py-8">
												<FileText className="h-12 w-12 text-brand-light/30 mx-auto mb-4" />
												<p className="text-brand-light/60">
													No resume tips available
												</p>
											</div>
										)}
									</div>

									{/* Interview Tips */}
									<div className="space-y-6">
										<div className="flex items-center space-x-3 mb-6">
											<Users className="h-8 w-8 text-brand-primary" />
											<h2 className="text-2xl text-brand-light font-semibold">
												Interview Tips
											</h2>
										</div>

										{tipsData?.interview_tips &&
										tipsData.interview_tips.length > 0 ? (
											<div className="space-y-4">
												{tipsData.interview_tips.map(
													(tip: Tip, index: number) => (
														<motion.div
															key={index}
															initial={{ opacity: 0, y: 20 }}
															animate={{ opacity: 1, y: 0 }}
															transition={{ duration: 0.5, delay: index * 0.1 }}
														>
															<Card className="backdrop-blur-lg bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
																<CardContent className="p-6">
																	<div className="flex items-start space-x-3">
																		<div className="flex-shrink-0 w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center mt-1">
																			<Users className="h-4 w-4 text-brand-primary" />
																		</div>
																		<div className="flex-1">
																			<h3 className="text-brand-primary font-semibold mb-2">
																				{tip.category}
																			</h3>
																			<p className="text-brand-light leading-relaxed">
																				{tip.advice}
																			</p>
																		</div>
																	</div>
																</CardContent>
															</Card>
														</motion.div>
													),
												)}
											</div>
										) : (
											<div className="text-center py-8">
												<Users className="h-12 w-12 text-brand-light/30 mx-auto mb-4" />
												<p className="text-brand-light/60">
													No interview tips available
												</p>
											</div>
										)}
									</div>
								</div>

								{/* Additional Actions */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8, delay: 0.8 }}
									className="mt-12 text-center"
								>
									<Card className="backdrop-blur-lg bg-white/5 border-white/10 max-w-2xl mx-auto">
										<CardContent className="p-6">
											<h3 className="text-lg font-semibold text-brand-light mb-4">
												Want more personalized advice?
											</h3>
											<div className="flex flex-col sm:flex-row gap-4 justify-center">
												<Link href="/dashboard/seeker">
													<Button className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white">
														<FileText className="mr-2 h-4 w-4" />
														Analyze Resume
													</Button>
												</Link>
												<Link href="/dashboard/hiring-assistant">
													<Button
														variant="outline"
														className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
													>
														<Users className="mr-2 h-4 w-4" />
														Practice Interviews
													</Button>
												</Link>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							</motion.div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
