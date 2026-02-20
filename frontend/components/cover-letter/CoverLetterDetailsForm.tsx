"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, FileText } from "lucide-react";

interface CoverLetterDetailsFormProps {
	formData: {
		recipient_name: string;
		company_name: string;
		sender_name: string;
		sender_role_or_goal: string;
		job_description: string;
		jd_url: string;
		key_points_to_include: string;
		additional_info_for_llm: string;
		company_url: string;
	};
	handleInputChange: (field: string, value: string) => void;
}

type JdMode = "url" | "text";

export default function CoverLetterDetailsForm({
	formData,
	handleInputChange,
}: CoverLetterDetailsFormProps) {
	const [jdMode, setJdMode] = useState<JdMode>(
		formData.jd_url ? "url" : "text",
	);

	const switchMode = (mode: JdMode) => {
		setJdMode(mode);
		// Clear the other field when switching so only one is sent
		if (mode === "url") {
			handleInputChange("job_description", "");
		} else {
			handleInputChange("jd_url", "");
		}
	};

	return (
		<div className="space-y-6">
			{/* Personal Details Section */}
			<div className="space-y-4">
				<h3 className="text-brand-light font-medium text-base border-b border-white/10 pb-2">
					Personal Details
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label className="text-brand-light text-sm font-medium">
							Your Name *
						</Label>
						<Input
							placeholder="Tashif"
							value={formData.sender_name}
							onChange={(e) =>
								handleInputChange("sender_name", e.target.value.toLowerCase())
							}
							className="h-11 bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-brand-light text-sm font-medium">
							Your Goal/Desired Role
						</Label>
						<Input
							placeholder="Software Engineer Internship"
							value={formData.sender_role_or_goal}
							onChange={(e) =>
								handleInputChange("sender_role_or_goal", e.target.value)
							}
							className="h-11 bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label className="text-brand-light text-sm font-medium">
						Company Website (Optional)
					</Label>
					<Input
						placeholder="https://talentsync.ai"
						value={formData.company_url}
						onChange={(e) => handleInputChange("company_url", e.target.value)}
						className="h-11 bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
					/>
				</div>
			</div>

			{/* Cover Letter Content Section */}
			<div className="space-y-4">
				<h3 className="text-brand-light font-medium text-base border-b border-white/10 pb-2">
					Cover Letter Content
				</h3>

				{/* Job Description with URL / Text toggle */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label className="text-brand-light text-sm font-medium">
							Job Description
						</Label>
						{/* Mode toggle pills */}
						<div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
							<button
								type="button"
								onClick={() => switchMode("url")}
								className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
									jdMode === "url"
										? "bg-brand-primary/20 border border-brand-primary/40 text-brand-primary"
										: "text-brand-light/50 hover:text-brand-light/80"
								}`}
							>
								<Link2 className="h-3 w-3" />
								URL
							</button>
							<button
								type="button"
								onClick={() => switchMode("text")}
								className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
									jdMode === "text"
										? "bg-brand-primary/20 border border-brand-primary/40 text-brand-primary"
										: "text-brand-light/50 hover:text-brand-light/80"
								}`}
							>
								<FileText className="h-3 w-3" />
								Text
							</button>
						</div>
					</div>

					<AnimatePresence mode="wait">
						{jdMode === "url" ? (
							<motion.div
								key="url"
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.15 }}
								className="space-y-1.5"
							>
								<div className="relative">
									<Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-light/40 pointer-events-none" />
									<Input
										placeholder="https://jobs.company.com/role/senior-engineer"
										value={formData.jd_url}
										onChange={(e) =>
											handleInputChange("jd_url", e.target.value)
										}
										className="h-11 pl-9 bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/40 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
									/>
								</div>
								<p className="text-brand-light/40 text-xs pl-1">
									The job description will be fetched from this URL when generating.
								</p>
							</motion.div>
						) : (
							<motion.div
								key="text"
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.15 }}
							>
								<textarea
									placeholder="Paste the job description here to tailor the cover letter..."
									value={formData.job_description}
									onChange={(e) =>
										handleInputChange("job_description", e.target.value)
									}
									className="w-full h-32 px-3 py-3 bg-white/5 border border-white/20 rounded-lg text-brand-light placeholder:text-brand-light/50 resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<div className="space-y-2">
					<Label className="text-brand-light text-sm font-medium">
						Key Points to Highlight
					</Label>
					<textarea
						placeholder="Previous internship experience, relevant projects, specific skills..."
						value={formData.key_points_to_include}
						onChange={(e) =>
							handleInputChange("key_points_to_include", e.target.value)
						}
						className="w-full h-24 px-3 py-3 bg-white/5 border border-white/20 rounded-lg text-brand-light placeholder:text-brand-light/50 resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-brand-light text-sm font-medium">
						Additional Context
					</Label>
					<textarea
						placeholder="Any specific requirements or context for the cover letter..."
						value={formData.additional_info_for_llm}
						onChange={(e) =>
							handleInputChange("additional_info_for_llm", e.target.value)
						}
						className="w-full h-24 px-3 py-3 bg-white/5 border border-white/20 rounded-lg text-brand-light placeholder:text-brand-light/50 resize-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
					/>
				</div>
			</div>

			{/* Recipient Information (Optional) */}
			<div className="space-y-4">
				<h3 className="text-brand-light font-medium text-base border-b border-white/10 pb-2">
					Recipient Information (Optional)
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label className="text-brand-light text-sm font-medium">
							Recipient Name
						</Label>
						<Input
							placeholder="Harleen Kaur"
							value={formData.recipient_name}
							onChange={(e) =>
								handleInputChange("recipient_name", e.target.value)
							}
							className="h-11 bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-brand-light text-sm font-medium">
							Company Name
						</Label>
						<Input
							placeholder="Tech Corp Inc."
							value={formData.company_name}
							onChange={(e) =>
								handleInputChange("company_name", e.target.value)
							}
							className="h-11 bg-white/5 border-white/20 text-brand-light placeholder:text-brand-light/50 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
