"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Download,
	Star,
	Briefcase,
	GraduationCap,
	Code,
	Languages,
	FolderOpen,
	Loader2,
	BookOpen,
	Users,
	Award,
	Trophy,
	LinkedinIcon,
	GithubIcon,
	PenBox,
	ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { renderMarkdown } from "@/lib/markdown-renderer";
import { useResume } from "@/hooks/queries";

export default function AnalysisPage() {
	const params = useParams();
	const id = params?.id as string;
	const router = useRouter();
	const { data: session, status } = useSession();

	const { data: analysisData, isLoading, error } = useResume(id);

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/auth/signin");
		}
	}, [status, router]);

	if (status === "loading" || isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin text-[#76ABAE] mx-auto mb-4" />
					<p className="text-[#EEEEEE]">Loading analysis...</p>
				</div>
			</div>
		);
	}

	if (error || !analysisData) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-400 mb-4">
						{error ? (error as Error).message : "No analysis data found"}
					</p>
					<Button
						onClick={() => router.back()}
						className="bg-[#76ABAE] hover:bg-[#76ABAE]/90"
					>
						Go Back
					</Button>
				</div>
			</div>
		);
	}

	const { resume, analysis } = analysisData;
	return (
		<div className="min-h-screen">
			<div className="container mx-auto px-4 py-8 max-w-7xl">
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5 }}
					className="sticky top-4 z-10 mb-8"
				>
					<div className="backdrop-blur-sm bg-[#181C20]/80 rounded-lg p-4 flex justify-between items-center">
						<Button
							onClick={() => router.back()}
							variant="ghost"
							className="text-[#EEEEEE] hover:text-[#76ABAE]"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
						<Button
							onClick={() => {
								window.open(`/api/resumes/${id}/download`, "_blank");
							}}
							className="bg-[#76ABAE] hover:bg-[#76ABAE]/90"
						>
							<Download className="mr-2 h-4 w-4" />
							Download Resume
						</Button>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className="space-y-8"
				>
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-[#EEEEEE] mb-2">
							Resume Analysis
						</h1>
						<p className="text-[#EEEEEE]/60">
							{analysis.name || "Candidate"} - {resume.customName}
						</p>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
						{/* Main Content */}
						<div className="xl:col-span-2 space-y-8">
							{/* Skills Analysis */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<Star className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Skills Analysis
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{analysis.skillsAnalysis &&
									analysis.skillsAnalysis.length > 0 ? (
										analysis.skillsAnalysis.map((skill: any, index: number) => (
											<div key={index}>
												<div className="flex justify-between mb-1">
													<span className="text-[#EEEEEE]">
														{skill.skill_name}
													</span>
													<span className="text-[#76ABAE]">
														{skill.percentage}%
													</span>
												</div>
												<Progress value={skill.percentage} className="h-2" />
											</div>
										))
									) : (
										<p className="text-[#EEEEEE]/60">
											No skills analysis available
										</p>
									)}
								</CardContent>
							</Card>

							{/* Work Experience */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<Briefcase className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Work Experience
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{analysis.workExperience &&
									analysis.workExperience.length > 0 ? (
										analysis.workExperience.map((work: any, index: number) => (
											<div
												key={index}
												className="border-l-2 border-[#76ABAE] pl-4"
											>
												<h3 className="text-[#EEEEEE] font-semibold">
													{work.role}
												</h3>
												<p className="text-[#76ABAE] text-sm">
													{work.company_and_duration}
												</p>
												{work.bullet_points &&
													work.bullet_points.length > 0 && (
														<ul className="mt-2 space-y-2 list-disc ml-4">
															{work.bullet_points.map(
																(point: string, i: number) => (
																	<li
																		key={i}
																		className="text-[#EEEEEE]/80 text-sm"
																	>
																		<span className="inline">
																			{renderMarkdown(point)}
																		</span>
																	</li>
																),
															)}
														</ul>
													)}
											</div>
										))
									) : (
										<p className="text-[#EEEEEE]/60">
											No work experience data available
										</p>
									)}
								</CardContent>
							</Card>

							{/* Projects Section */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<FolderOpen className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Projects
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{analysis.projects && analysis.projects.length > 0 ? (
										analysis.projects.map((project: any, index: number) => (
											<div
												key={index}
												className="border-l-2 border-[#76ABAE] pl-4"
											>
												<div className="flex justify-between">
													<h3 className="text-[#EEEEEE] font-semibold mb-2">
														{project.title}
													</h3>
													<div>
														{(project.live_link || project.repo_link) && (
															<div className="mb-3 flex gap-3 flex-wrap">
																{project.live_link && (
																	<Link
																		href={project.live_link}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="inline-flex items-center py-1 text-md font-medium text-[#76ABAE] hover:text-white hover:scale-120"
																	>
																		<ExternalLink className="mr-1 h-4 w-4" />
																	</Link>
																)}
																{project.repo_link && (
																	<Link
																		href={project.repo_link}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="inline-flex items-center py-1 text-md font-medium text-[#76ABAE] hover:text-white hover:scale-120"
																	>
																		<GithubIcon className="h-4 w-4" />
																	</Link>
																)}
															</div>
														)}
													</div>
												</div>
												{project.technologies_used &&
													project.technologies_used.length > 0 && (
														<div className="mb-3">
															<div className="flex flex-wrap gap-1">
																{project.technologies_used.map(
																	(tech: string, i: number) => (
																		<Badge
																			key={i}
																			className="bg-[#76ABAE]/10 text-[#76ABAE] border border-[#76ABAE]/30 text-xs"
																		>
																			{tech}
																		</Badge>
																	),
																)}
															</div>
														</div>
													)}
												<div className="text-[#EEEEEE]/80 text-sm leading-relaxed space-y-2">
													{renderMarkdown(project.description)}
												</div>
											</div>
										))
									) : (
										<p className="text-[#EEEEEE]/60">
											No projects data available
										</p>
									)}
								</CardContent>
							</Card>

							{/* Publications Section */}
							{analysis.publications && analysis.publications.length > 0 && (
								<Card className="backdrop-blur-lg bg-white/5 border-white/10">
									<CardHeader>
										<CardTitle className="text-[#EEEEEE] flex items-center">
											<BookOpen className="mr-2 h-5 w-5 text-[#76ABAE]" />
											Publications
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-6">
										{analysis.publications.map(
											(publication: any, index: number) => (
												<div
													key={index}
													className="border-l-2 border-[#76ABAE] pl-4"
												>
													<h3 className="text-[#EEEEEE] font-semibold mb-2">
														{publication.title}
													</h3>
													<div className="space-y-1 text-sm">
														{publication.authors && (
															<p className="text-[#76ABAE]">
																Authors: {publication.authors}
															</p>
														)}
														{publication.journal_conference && (
															<p className="text-[#EEEEEE]/80">
																{publication.journal_conference}
															</p>
														)}
														{publication.year && (
															<p className="text-[#EEEEEE]/60">
																Year: {publication.year}
															</p>
														)}
														{publication.doi && (
															<p className="text-[#EEEEEE]/60">
																DOI: {publication.doi}
															</p>
														)}
														{publication.url && (
															<a
																href={publication.url}
																target="_blank"
																rel="noopener noreferrer"
																className="text-[#76ABAE] hover:underline"
															>
																View Publication
															</a>
														)}
													</div>
												</div>
											),
										)}
									</CardContent>
								</Card>
							)}

							{/* Positions of Responsibility Section */}
							{analysis.positionsOfResponsibility &&
								analysis.positionsOfResponsibility.length > 0 && (
									<Card className="backdrop-blur-lg bg-white/5 border-white/10">
										<CardHeader>
											<CardTitle className="text-[#EEEEEE] flex items-center">
												<Users className="mr-2 h-5 w-5 text-[#76ABAE]" />
												Positions of Responsibility
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-6">
											{analysis.positionsOfResponsibility.map(
												(position: any, index: number) => (
													<div
														key={index}
														className="border-l-2 border-[#76ABAE] pl-4"
													>
														<h3 className="text-[#EEEEEE] font-semibold mb-2">
															{position.title}
														</h3>
														<div className="space-y-1 text-sm">
															<p className="text-[#76ABAE]">
																{position.organization}
															</p>
															{position.duration && (
																<p className="text-[#EEEEEE]/80">
																	{position.duration}
																</p>
															)}
															{position.description && (
																<div className="text-[#EEEEEE]/80 text-sm leading-relaxed space-y-2 mt-2">
																	{renderMarkdown(position.description)}
																</div>
															)}
														</div>
													</div>
												),
											)}
										</CardContent>
									</Card>
								)}

							{/* Certifications Section */}
							{analysis.certifications &&
								analysis.certifications.length > 0 && (
									<Card className="backdrop-blur-lg bg-white/5 border-white/10">
										<CardHeader>
											<CardTitle className="text-[#EEEEEE] flex items-center">
												<Award className="mr-2 h-5 w-5 text-[#76ABAE]" />
												Certifications
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-6">
											{analysis.certifications.map(
												(certification: any, index: number) => (
													<div
														key={index}
														className="border-l-2 border-[#76ABAE] pl-4"
													>
														<h3 className="text-[#EEEEEE] font-semibold mb-2">
															{certification.name}
														</h3>
														<div className="space-y-1 text-sm">
															<p className="text-[#76ABAE]">
																{certification.issuing_organization}
															</p>
															{certification.issue_date && (
																<p className="text-[#EEEEEE]/80">
																	Issued: {certification.issue_date}
																</p>
															)}
															{certification.expiry_date && (
																<p className="text-[#EEEEEE]/80">
																	Expires: {certification.expiry_date}
																</p>
															)}
															{certification.credential_id && (
																<p className="text-[#EEEEEE]/60">
																	ID: {certification.credential_id}
																</p>
															)}
															{certification.url && (
																<a
																	href={certification.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-[#76ABAE] hover:underline"
																>
																	View Certificate
																</a>
															)}
														</div>
													</div>
												),
											)}
										</CardContent>
									</Card>
								)}

							{/* Achievements Section */}
							{analysis.achievements && analysis.achievements.length > 0 && (
								<Card className="backdrop-blur-lg bg-white/5 border-white/10">
									<CardHeader>
										<CardTitle className="text-[#EEEEEE] flex items-center">
											<Trophy className="mr-2 h-5 w-5 text-[#76ABAE]" />
											Achievements
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-6">
										{analysis.achievements.map(
											(achievement: any, index: number) => (
												<div
													key={index}
													className="border-l-2 border-[#76ABAE] pl-4"
												>
													<h3 className="text-[#EEEEEE] font-semibold mb-2">
														{achievement.title}
													</h3>
													<div className="space-y-1 text-sm">
														{achievement.category && (
															<Badge className="bg-[#76ABAE]/10 text-[#76ABAE] border border-[#76ABAE]/30 text-xs mb-2">
																{achievement.category}
															</Badge>
														)}
														{achievement.year && (
															<p className="text-[#76ABAE]">
																{achievement.year}
															</p>
														)}
														{achievement.description && (
															<div className="text-[#EEEEEE]/80 text-sm leading-relaxed space-y-2 mt-2">
																{renderMarkdown(achievement.description)}
															</div>
														)}
													</div>
												</div>
											),
										)}
									</CardContent>
								</Card>
							)}
						</div>

						{/* Sidebar */}
						<div className="space-y-8">
							{/* Candidate Info */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<Code className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Candidate Information
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									{analysis.name && (
										<div>
											<span className="text-[#76ABAE] text-sm">Name:</span>
											<p className="text-[#EEEEEE]">{analysis.name}</p>
										</div>
									)}
									{analysis.email && (
										<div>
											<span className="text-[#76ABAE] text-sm">Email:</span>
											<p className="text-[#EEEEEE]">{analysis.email}</p>
										</div>
									)}
									{analysis.contact && (
										<div>
											<span className="text-[#76ABAE] text-sm">Contact:</span>
											<p className="text-[#EEEEEE]">{analysis.contact}</p>
										</div>
									)}
									{analysis.predictedField && (
										<div>
											<span className="text-[#76ABAE] text-sm">
												Predicted Field:
											</span>
											<p className="text-[#EEEEEE]">
												{analysis.predictedField}
											</p>
										</div>
									)}
									{(analysis.linkedin ||
										analysis.github ||
										analysis.blog ||
										analysis.portfolio) && (
										<div className="pt-2 space-y-2">
											<span className="text-[#76ABAE] text-sm">Links:</span>
											<div className="flex flex-col gap-1">
												{analysis.linkedin && (
													<Link
														href={analysis.linkedin}
														target="_blank"
														rel="noopener noreferrer"
														className="text-[#76ABAE] hover:underline break-all"
													>
														<LinkedinIcon className="inline-block mr-1 h-4 w-4" />
														<span>
															{(() => {
																const link = analysis.linkedin!;
																try {
																	const url = new URL(link);
																	// show everything after hostname (strip leading '/')
																	return (
																		url.pathname.replace(/^\/+/, "") ||
																		url.search.replace(/^\?/, "") ||
																		url.hash.replace(/^#/, "")
																	);
																} catch {
																	const idx = link.indexOf("linkedin.com/");
																	return idx !== -1
																		? link.slice(idx + "linkedin.com/".length)
																		: link;
																}
															})()}
														</span>
													</Link>
												)}
												{analysis.github && (
													<Link
														href={analysis.github}
														target="_blank"
														rel="noopener noreferrer"
														className="text-[#76ABAE] hover:underline break-all"
													>
														<GithubIcon className="inline-block mr-1 h-4 w-4" />
														<span>
															{(() => {
																const link = analysis.github!;
																try {
																	const url = new URL(link);
																	// show everything after hostname (strip leading '/')
																	return (
																		url.pathname.replace(/^\/+/, "") ||
																		url.search.replace(/^\?/, "") ||
																		url.hash.replace(/^#/, "")
																	);
																} catch {
																	const idx = link.indexOf("github.com/");
																	return idx !== -1
																		? link.slice(idx + "github.com/".length)
																		: link;
																}
															})()}
														</span>
													</Link>
												)}
												{analysis.blog && (
													<Link
														href={analysis.blog}
														target="_blank"
														rel="noopener noreferrer"
														className="text-[#76ABAE] hover:underline break-all"
													>
														<PenBox className="inline-block mr-1 h-4 w-4" />
														{(() => {
															const link = analysis.blog!;
															try {
																const url = new URL(link);
																const display =
																	`${url.host}${url.pathname}${url.search}${url.hash}`.replace(
																		/\/$/,
																		"",
																	);
																return display;
															} catch {
																return link
																	.replace(/^https?:\/\//, "")
																	.replace(/\/$/, "");
															}
														})()}
													</Link>
												)}
												{analysis.portfolio && (
													<Link
														href={analysis.portfolio}
														target="_blank"
														rel="noopener noreferrer"
														className="text-[#76ABAE] hover:underline break-all"
													>
														<FolderOpen className="inline-block mr-1 h-4 w-4" />
														{(() => {
															const link = analysis.portfolio!;
															try {
																const url = new URL(link);
																const display =
																	`${url.host}${url.pathname}${url.search}${url.hash}`.replace(
																		/\/$/,
																		"",
																	);
																return display;
															} catch {
																return link
																	.replace(/^https?:\/\//, "")
																	.replace(/\/$/, "");
															}
														})()}
													</Link>
												)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Recommended Roles */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<Code className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Recommended Roles
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{analysis.recommendedRoles &&
										analysis.recommendedRoles.length > 0 ? (
											analysis.recommendedRoles.map(
												(role: string, index: number) => (
													<Badge
														key={index}
														className="mr-2 mb-2 bg-[#76ABAE]/20 text-[#76ABAE] hover:bg-[#76ABAE]/30 block w-fit"
													>
														{role}
													</Badge>
												),
											)
										) : (
											<p className="text-[#EEEEEE]/60">
												No role recommendations available
											</p>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Languages */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<Languages className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Languages
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{analysis.languages && analysis.languages.length > 0 ? (
											analysis.languages.map((lang: any, index: number) => (
												<div key={index} className="text-[#EEEEEE]/80">
													{lang.language}
												</div>
											))
										) : (
											<p className="text-[#EEEEEE]/60">
												No language information available
											</p>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Education */}
							<Card className="backdrop-blur-lg bg-white/5 border-white/10">
								<CardHeader>
									<CardTitle className="text-[#EEEEEE] flex items-center">
										<GraduationCap className="mr-2 h-5 w-5 text-[#76ABAE]" />
										Education
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{analysis.education && analysis.education.length > 0 ? (
											analysis.education.map((edu: any, index: number) => (
												<p key={index} className="text-[#EEEEEE]/80">
													{edu.education_detail}
												</p>
											))
										) : (
											<p className="text-[#EEEEEE]/60">
												No education information available
											</p>
										)}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
