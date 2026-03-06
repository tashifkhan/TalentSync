"use client";

import { useState } from "react";
import { FileText, ChevronDown, User, Calendar, Check } from "lucide-react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

export interface ResumeOption {
	id: string;
	customName: string;
	uploadDate: string;
	candidateName?: string;
	predictedField?: string;
}

interface ResumeComboboxProps {
	resumes: ResumeOption[];
	selectedResumeId: string;
	onSelect: (resumeId: string) => void;
	isLoading?: boolean;
	placeholder?: string;
	emptyMessage?: string;
	emptyDescription?: string;
	className?: string;
}

export function ResumeCombobox({
	resumes,
	selectedResumeId,
	onSelect,
	isLoading = false,
	placeholder = "Choose a resume",
	emptyMessage = "No resumes found",
	emptyDescription,
	className,
}: ResumeComboboxProps) {
	const [open, setOpen] = useState(false);
	const selectedResume = resumes.find((r) => r.id === selectedResumeId);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					role="combobox"
					aria-expanded={open}
					aria-label="Select a resume"
					className={cn(
						"relative flex items-center justify-between w-full h-12 px-4",
						"border border-white/20 rounded-xl",
						"bg-gradient-to-br from-white/5 to-white/10",
						"hover:from-brand-primary/10 hover:to-brand-primary/5",
						"transition-all duration-300 cursor-pointer group",
						className
					)}
				>
					<div className="flex items-center space-x-3 min-w-0">
						<FileText className="h-4 w-4 text-brand-primary flex-shrink-0" />
						<div className="text-left min-w-0">
							{selectedResume ? (
								<div className="min-w-0">
									<p className="text-brand-light text-sm font-medium truncate">
										{selectedResume.customName}
									</p>
									<p className="text-brand-light/60 text-xs truncate">
										{selectedResume.predictedField || "Resume Selected"}
									</p>
								</div>
							) : (
								<p className="text-brand-light/50 text-sm">
									{isLoading ? "Loading resumes..." : placeholder}
								</p>
							)}
						</div>
					</div>
					<ChevronDown
						className={cn(
							"h-4 w-4 text-brand-light/60 transition-transform duration-200 flex-shrink-0 ml-2",
							open && "rotate-180"
						)}
					/>
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] p-0 border-white/20 bg-surface shadow-2xl rounded-xl overflow-hidden"
				align="start"
				sideOffset={8}
			>
				<Command className="bg-transparent">
					<CommandInput
						placeholder="Search resumes..."
						className="text-brand-light placeholder:text-brand-light/40"
					/>
					<CommandList className="max-h-64">
						{isLoading ? (
							<div className="p-4 text-center">
								<Loader
									variant="spinner"
									size="sm"
									className="text-brand-primary"
								/>
							</div>
						) : (
							<>
								<CommandEmpty>
									<div className="flex flex-col items-center py-2">
										<FileText className="h-8 w-8 text-brand-light/30 mb-2" />
										<p className="text-brand-light/60 text-sm">
											{emptyMessage}
										</p>
										{emptyDescription && (
											<p className="text-brand-light/40 text-xs mt-1">
												{emptyDescription}
											</p>
										)}
									</div>
								</CommandEmpty>
								<CommandGroup>
									{resumes.map((resume) => (
										<CommandItem
											key={resume.id}
											value={`${resume.customName} ${resume.candidateName ?? ""} ${resume.predictedField ?? ""}`}
											onSelect={() => {
												haptic("selection");
												onSelect(resume.id);
												setOpen(false);
											}}
											className="p-3 cursor-pointer rounded-lg data-[selected=true]:bg-white/10"
										>
											<div className="flex items-center space-x-3 w-full">
												<div className="relative flex-shrink-0">
													{selectedResumeId === resume.id ? (
														<Check className="h-4 w-4 text-brand-primary" />
													) : (
														<FileText className="h-4 w-4 text-brand-primary" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-brand-light text-sm font-medium truncate">
														{resume.customName}
													</p>
													<div className="flex items-center space-x-2 mt-1">
														{resume.candidateName && (
															<div className="flex items-center space-x-1">
																<User className="h-3 w-3 text-brand-light/40" />
																<span className="text-brand-light/60 text-xs">
																	{resume.candidateName}
																</span>
															</div>
														)}
														{resume.predictedField && (
															<span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs rounded-full">
																{resume.predictedField}
															</span>
														)}
													</div>
													<div className="flex items-center space-x-1 mt-1">
														<Calendar className="h-3 w-3 text-brand-light/40" />
														<span className="text-brand-light/40 text-xs">
															{new Date(
																resume.uploadDate
															).toLocaleDateString()}
														</span>
													</div>
												</div>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
