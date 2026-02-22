"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ArrowLeft,
	FileText,
	Send,
} from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import CoverLetterDetailsForm from "@/components/cover-letter/CoverLetterDetailsForm";
import GeneratedLetterPanel from "@/components/cover-letter/GeneratedLetterPanel";
import LoadingOverlay from "@/components/cold-mail/LoadingOverlay";
import PageLoader from "@/components/cold-mail/PageLoader";
import { ResumeSelector } from "@/components/shared/resume-selector";
import {
	useGenerateCoverLetter,
	useEditCoverLetter,
} from "@/hooks/queries";
import { CoverLetterResponseData } from "@/types";

export default function CoverLetterGenerator() {
	const [isPageLoading, setIsPageLoading] = useState(true);
	const [generatedLetter, setGeneratedLetter] =
		useState<CoverLetterResponseData | null>(null);
	const [resumeFile, setResumeFile] = useState<File | null>(null);
	const [isPreloaded, setIsPreloaded] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [editInstructions, setEditInstructions] = useState("");

	// Resume selection states
	const [selectedResumeId, setSelectedResumeId] = useState<string>("");
	const [resumeSelectionMode, setResumeSelectionMode] = useState<
		"resumeId" | "file"
	>("resumeId");

	const { toast } = useToast();

	const [formData, setFormData] = useState({
		recipient_name: "",
		company_name: "",
		sender_name: "",
		sender_role_or_goal: "",
		job_description: "",
		jd_url: "",
		key_points_to_include: "",
		additional_info_for_llm: "",
		company_url: "",
	});

	// Queries
	const generateCoverLetterMutation = useGenerateCoverLetter();
	const editCoverLetterMutation = useEditCoverLetter();

	const isGenerating = generateCoverLetterMutation.isPending;
	const isEditing = editCoverLetterMutation.isPending;

	// Simulate page load and check for pre-populated data
	useEffect(() => {
		const timer = setTimeout(() => setIsPageLoading(false), 100);

		// Check for pre-populated resume file and analysis data (from file-upload quick action)
		const storedResumeFile = localStorage.getItem("resumeFile");
		const storedAnalysisData = localStorage.getItem("analysisData");

		if (storedResumeFile && storedAnalysisData) {
			try {
				const analysisData = JSON.parse(storedAnalysisData);

				// Mark as pre-loaded (file was uploaded in a prior session)
				setIsPreloaded(true);
				setResumeSelectionMode("file"); // Switch to upload mode if preloaded

				// Pre-populate form fields from analysis data
				setFormData((prev) => ({
					...prev,
					sender_name: analysisData.name || "",
					key_points_to_include: analysisData.skills?.join(", ") || "",
					sender_role_or_goal: analysisData.predicted_field || analysisData.predictedField || "",
				}));

				// Clear the stored data after using it
				setTimeout(() => {
					localStorage.removeItem("resumeFile");
					localStorage.removeItem("analysisData");
				}, 100);

				toast({
					title: "Resume Pre-loaded!",
					description:
						"Your resume details have been automatically filled from your recent analysis.",
				});
			} catch (error) {
				console.error("Error loading pre-populated data:", error);
			}
		}

		return () => clearTimeout(timer);
	}, [toast]);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const generateCoverLetter = () => {
		if (resumeSelectionMode === "resumeId") {
			if (!selectedResumeId) {
				toast({
					title: "Resume Required",
					description: "Please select a resume from your saved resumes.",
					variant: "destructive",
				});
				return;
			}
		} else if (resumeSelectionMode === "file") {
			if (!resumeFile && !isPreloaded) {
				toast({
					title: "Resume Required",
					description: "Please upload your resume first.",
					variant: "destructive",
				});
				return;
			}

			if (isPreloaded && !resumeFile) {
				toast({
					title: "Resume File Needed",
					description:
						"Please re-upload your resume file to generate the cover letter.",
					variant: "destructive",
				});
				return;
			}
		}

		if (!formData.sender_name) {
			toast({
				title: "Required Field Missing",
				description: "Please fill in your name to generate the cover letter.",
				variant: "destructive",
			});
			return;
		}

		const formDataToSend = new FormData();

		if (resumeSelectionMode === "resumeId") {
			formDataToSend.append("resumeId", selectedResumeId);
		} else if (resumeSelectionMode === "file") {
			formDataToSend.append("file", resumeFile!);
		}

		formDataToSend.append("recipient_name", formData.recipient_name);
		formDataToSend.append("company_name", formData.company_name);
		formDataToSend.append("sender_name", formData.sender_name);
		formDataToSend.append("sender_role_or_goal", formData.sender_role_or_goal);
		formDataToSend.append("job_description", formData.job_description);
		formDataToSend.append(
			"key_points_to_include",
			formData.key_points_to_include,
		);
		formDataToSend.append(
			"additional_info_for_llm",
			formData.additional_info_for_llm,
		);
		if (formData.company_url) {
			formDataToSend.append("company_url", formData.company_url);
		}
		if (formData.jd_url) {
			formDataToSend.append("jd_url", formData.jd_url);
		}

		generateCoverLetterMutation.mutate(formDataToSend, {
			onSuccess: (data) => {
				setGeneratedLetter({
					body: data.body,
					requestId: data.requestId,
					responseId: data.responseId,
				});
				toast({
					title: "Cover Letter Generated Successfully!",
					description:
						"Your cover letter has been generated and is ready to use.",
				});
			},
			onError: (error) => {
				toast({
					title: "Generation Failed",
					description: error.message || "An error occurred.",
					variant: "destructive",
				});
			},
		});
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast({
				title: "Copied!",
				description: "Cover letter copied to clipboard.",
			});
		} catch {
			toast({
				title: "Copy Failed",
				description: "Could not copy to clipboard.",
				variant: "destructive",
			});
		}
	};

	const downloadAsText = () => {
		if (!generatedLetter) return;

		const content = generatedLetter.body;
		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "cover-letter.txt";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const editCoverLetter = () => {
		if (!generatedLetter) {
			toast({
				title: "No Cover Letter to Edit",
				description: "Please generate a cover letter first before editing.",
				variant: "destructive",
			});
			return;
		}

		if (!editInstructions.trim()) {
			toast({
				title: "Edit Instructions Required",
				description:
					"Please provide instructions on how to edit the cover letter.",
				variant: "destructive",
			});
			return;
		}

		const formDataToSend = new FormData();

		// Add resume data
		if (resumeSelectionMode === "resumeId" && selectedResumeId) {
			formDataToSend.append("resumeId", selectedResumeId);
		} else if (resumeFile) {
			formDataToSend.append("file", resumeFile);
		} else if (isPreloaded && !resumeFile) {
			toast({
				title: "Resume File Needed",
				description:
					"Please re-upload your resume file to edit the cover letter.",
				variant: "destructive",
			});
			return;
		}

		formDataToSend.append("recipient_name", formData.recipient_name);
		formDataToSend.append("company_name", formData.company_name);
		formDataToSend.append("sender_name", formData.sender_name);
		formDataToSend.append("sender_role_or_goal", formData.sender_role_or_goal);
		formDataToSend.append("job_description", formData.job_description);
		formDataToSend.append(
			"key_points_to_include",
			formData.key_points_to_include,
		);
		formDataToSend.append(
			"additional_info_for_llm",
			formData.additional_info_for_llm,
		);
		if (formData.company_url) {
			formDataToSend.append("company_url", formData.company_url);
		}
		if (formData.jd_url) {
			formDataToSend.append("jd_url", formData.jd_url);
		}

		// Append cover letter to be edited and instructions
		formDataToSend.append("generated_cover_letter", generatedLetter.body);
		formDataToSend.append("edit_instructions", editInstructions);

		// Append request ID if it exists
		if (generatedLetter.requestId) {
			formDataToSend.append(
				"cover_letter_request_id",
				generatedLetter.requestId,
			);
		}

		editCoverLetterMutation.mutate(formDataToSend, {
			onSuccess: (data) => {
				const responseData = data.data || data;
				setGeneratedLetter({
					body: responseData.body,
					requestId: responseData.requestId,
					responseId: responseData.responseId,
				});
				setEditInstructions("");
				setEditMode(false);
				toast({
					title: "Cover Letter Edited Successfully!",
					description:
						"Your cover letter has been updated based on your instructions.",
				});
			},
			onError: (error) => {
				toast({
					title: "Edit Failed",
					description: error.message || "An error occurred.",
					variant: "destructive",
				});
			},
		});
	};

	return (
		<>
			<PageLoader isPageLoading={isPageLoading} />
			{!isPageLoading && (
				<div className="min-h-screen">
					<LoadingOverlay
						isGenerating={isGenerating}
						isEditing={isEditing}
						generateTitle="Crafting Your Cover Letter"
						generateDescription="AI is analyzing your resume and generating a personalized cover letter..."
						editTitle="Editing Your Cover Letter"
						editDescription="AI is applying your edits and improving the cover letter..."
					/>
					<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
						{/* Back button */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
							className="mb-6 sm:mb-8"
						>
							<Link href="/dashboard/seeker">
								<Button
									variant="ghost"
									size="sm"
									className="text-brand-light hover:text-brand-primary hover:bg-white/5 transition-all duration-300 p-2 sm:p-3"
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									<span className="hidden sm:inline">Back to Dashboard</span>
									<span className="sm:hidden">Back</span>
								</Button>
							</Link>
						</motion.div>

						<div className="max-w-7xl mx-auto">
							{/* Header */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="text-center mb-8 sm:mb-12"
							>
								<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-brand-primary/10 rounded-2xl mb-4 sm:mb-6">
									<FileText className="h-8 w-8 sm:h-10 sm:w-10 text-brand-primary" />
								</div>
								<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-light mb-3 sm:mb-4 leading-tight">
									Cover Letter Generator
								</h1>
								<p className="text-brand-light/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4">
									Generate personalized cover letters using AI tailored to
									specific job descriptions and companies.
								</p>
							</motion.div>

							{/* Responsive grid */}
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
								{/* Input Form */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8, delay: 0.4 }}
									className="order-1"
								>
									<Card className="relative backdrop-blur-lg bg-white/5 border-white/10 shadow-2xl overflow-hidden">
										<CardHeader className="pb-4">
											<CardTitle className="text-brand-light text-xl sm:text-2xl font-semibold">
												Cover Letter Details
											</CardTitle>
											<p className="text-brand-light/60 text-sm">
												Fill in the details to generate your personalized cover
												letter
											</p>
										</CardHeader>
										<CardContent className="space-y-6">
											{/* Resume Selection */}
											<ResumeSelector
												resumeFile={resumeFile}
												onSelect={(id) => {
													setSelectedResumeId(id);
													// The cover-letter page needs candidate name + predicted field
													// but ResumeSelector doesn't expose the full resume object.
													// We rely on the form fields already being pre-populated from
													// the localStorage preload path, or the user fills them in.
												}}
												onFileUpload={(file) => {
													setResumeFile(file);
													setIsPreloaded(false);
												}}
												onModeChange={setResumeSelectionMode}
											/>

											<CoverLetterDetailsForm
												formData={formData}
												handleInputChange={handleInputChange}
											/>

											{/* Generate button */}
											<motion.div
												whileHover={{ scale: 1.01 }}
												whileTap={{ scale: 0.99 }}
											>
												<Button
													onClick={generateCoverLetter}
													disabled={
														isGenerating ||
														(resumeSelectionMode === "resumeId"
															? !selectedResumeId
															: !resumeFile && !isPreloaded) ||
														!formData.sender_name
													}
													className="relative w-full h-14 bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:from-brand-primary/90 hover:to-brand-primary/70 text-white font-semibold rounded-xl transition-all duration-300 overflow-hidden group disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
												>
													{isGenerating && (
														<div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-primary/40 to-brand-primary/20 animate-pulse"></div>
													)}

													<div className="relative z-10 flex items-center justify-center">
														{isGenerating ? (
															<div className="flex items-center space-x-3">
																<div className="relative">
																	<Loader
																		variant="spinner"
																		size="sm"
																		className="text-white"
																	/>
																	<div className="absolute inset-0 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
																</div>
																<div className="flex flex-col items-start">
																	<span className="text-sm font-medium">
																		Generating your cover letter...
																	</span>
																	<span className="text-xs text-white/80">
																		This may take a few moments
																	</span>
																</div>
															</div>
														) : (
															<>
																<Send className="mr-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
																<span className="text-base">
																	Generate Cover Letter
																</span>
															</>
														)}
													</div>

													<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>

													{isGenerating && (
														<div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse w-full">
															<div className="h-full bg-white/60 animate-pulse"></div>
														</div>
													)}
												</Button>
											</motion.div>
										</CardContent>
									</Card>
								</motion.div>

								{/* Generated Letter Panel */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8, delay: 0.6 }}
									className="order-2"
								>
									<GeneratedLetterPanel
										generatedLetter={generatedLetter}
										editMode={editMode}
										setEditMode={setEditMode}
										editInstructions={editInstructions}
										setEditInstructions={setEditInstructions}
										isEditing={isEditing}
										editCoverLetter={editCoverLetter}
										copyToClipboard={copyToClipboard}
										downloadAsText={downloadAsText}
									/>
								</motion.div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
