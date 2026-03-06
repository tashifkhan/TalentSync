import {
	Upload,
	CheckCircle,
	FileText,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptics";
import { ResumeCombobox } from "@/components/shared/resume-combobox";

interface UserResume {
	id: string;
	customName: string;
	uploadDate: string;
	candidateName?: string;
	predictedField?: string;
}

interface ResumeSourceSelectorProps {
	inputMode: "file" | "resumeId";
	setInputMode: (mode: "file" | "resumeId") => void;
	resumeFile: File | null;
	handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	userResumes: UserResume[];
	selectedResumeId: string;
	handleResumeSelection: (resumeId: string) => void;
	isLoadingResumes: boolean;
}

export default function ResumeSourceSelector({
	inputMode,
	setInputMode,
	resumeFile,
	handleFileUpload,
	userResumes,
	selectedResumeId,
	handleResumeSelection,
	isLoadingResumes,
}: ResumeSourceSelectorProps) {
	return (
		<div className="space-y-3">
			{/* Resume Selection Mode Toggle */}
			<div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
			<button
				onClick={() => { haptic("selection"); setInputMode("resumeId"); }}
				className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
					inputMode === "resumeId"
						? "bg-brand-primary text-white shadow-lg"
						: "text-brand-light/70 hover:text-brand-light hover:bg-white/10"
				}`}
			>
				Use Existing Resume
			</button>
			<button
				onClick={() => { haptic("selection"); setInputMode("file"); }}
				className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ${
					inputMode === "file"
						? "bg-brand-primary text-white shadow-lg"
						: "text-brand-light/70 hover:text-brand-light hover:bg-white/10"
				}`}
			>
				Upload New Resume
			</button>
			</div>

			{/* Resume Selection */}
			{inputMode === "resumeId" ? (
				<div>
					<Label className="text-brand-light text-sm font-medium flex items-center">
						<FileText className="h-4 w-4 mr-2 text-brand-primary" />
						Select Resume *
					</Label>
					<div className="relative mt-2">
						<ResumeCombobox
							resumes={userResumes}
							selectedResumeId={selectedResumeId}
							onSelect={handleResumeSelection}
							isLoading={isLoadingResumes}
							emptyDescription="Upload one to get started!"
						/>
					</div>
				</div>
			) : (
				<div>
					<Label
						htmlFor="file-upload"
						className="text-brand-light text-sm font-medium flex items-center"
					>
						<FileText className="h-4 w-4 mr-2 text-brand-primary" />
						Resume File *
					</Label>
					<div className="relative mt-2">
						<Input
							id="file-upload"
							type="file"
							accept=".pdf,.doc,.docx,.txt,.md"
							onChange={handleFileUpload}
							className="hidden"
						/>
					<motion.label
						htmlFor="file-upload"
						whileHover={{ scale: 1.01 }}
						whileTap={{ scale: 0.99 }}
						onClick={() => haptic("selection")}
						className="relative flex items-center justify-center w-full h-28 border-2 border-dashed border-white/20 rounded-xl bg-gradient-to-br from-white/5 to-white/10 hover:from-brand-primary/10 hover:to-brand-primary/5 transition-all duration-500 cursor-pointer group overflow-hidden"
					>
							{/* Animated background gradient */}
							<div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

							<div className="relative z-10 text-center">
								{resumeFile ? (
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="flex flex-col items-center"
									>
										<div className="relative mb-2">
											<div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-lg"></div>
											<CheckCircle className="relative h-6 w-6 text-brand-primary" />
										</div>
										<p className="text-brand-light text-sm font-medium mb-1 max-w-44 truncate">
											{resumeFile?.name}
										</p>
										<p className="text-brand-primary text-xs font-medium flex items-center gap-1">
											<CheckCircle className="h-3 w-3" />
											Ready for processing
										</p>
									</motion.div>
								) : (
									<motion.div
										className="flex flex-col items-center"
										whileHover={{ y: -1 }}
										transition={{ duration: 0.2 }}
									>
										<div className="relative mb-2">
											<div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-lg group-hover:bg-brand-primary/20 transition-colors duration-500"></div>
											<Upload className="relative h-6 w-6 text-brand-light/60 group-hover:text-brand-primary transition-colors duration-300" />
										</div>
										<p className="text-brand-light text-sm font-medium mb-1">
											Upload Resume
										</p>
										<div className="flex items-center space-x-2 text-xs text-brand-light/50 mt-2">
											<span className="px-2 py-1 bg-white/10 rounded-full">
												PDF
											</span>
											<span className="px-2 py-1 bg-white/10 rounded-full">
												DOC
											</span>
											<span className="px-2 py-1 bg-white/10 rounded-full">
												TXT
											</span>
											<span className="px-2 py-1 bg-white/10 rounded-full">
												MD
											</span>
										</div>
									</motion.div>
								)}
							</div>
						</motion.label>
					</div>
				</div>
			)}
		</div>
	);
}
