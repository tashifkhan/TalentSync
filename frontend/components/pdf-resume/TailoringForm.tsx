import { Briefcase } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TailoringFormProps {
	useTailoring: boolean;
	setUseTailoring: (value: boolean) => void;
	jobRole: string;
	setJobRole: (value: string) => void;
	companyName: string;
	setCompanyName: (value: string) => void;
	companyWebsite: string;
	setCompanyWebsite: (value: string) => void;
	jobDescription: string;
	setJobDescription: (value: string) => void;
}

export default function TailoringForm({
	useTailoring,
	setUseTailoring,
	jobRole,
	setJobRole,
	companyName,
	setCompanyName,
	companyWebsite,
	setCompanyWebsite,
	jobDescription,
	setJobDescription,
}: TailoringFormProps) {
	return (
		<div className="space-y-4">
			{/* Section Header with inline Switch */}
			<div className="flex items-center justify-between pb-3 border-b border-white/10">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-lg">
						<Briefcase className="h-4 w-4 text-brand-primary" />
					</div>
					<div>
						<h3 className="text-brand-light text-base font-semibold">
							Tailor Resume
						</h3>
						<p className="text-brand-light/60 text-xs">
							Customize for a specific job
						</p>
					</div>
				</div>
				<Switch
					id="use-tailoring"
					checked={useTailoring}
					onCheckedChange={setUseTailoring}
					className="data-[state=checked]:bg-brand-primary"
				/>
			</div>

			{useTailoring && (
				<div className="space-y-4 pt-2">
					<div>
						<Label
							htmlFor="job-role"
							className="text-brand-light text-sm font-medium"
						>
							Job Role <span className="text-red-400">*</span>
						</Label>
						<input
							id="job-role"
							type="text"
							value={jobRole}
							onChange={(e) => setJobRole(e.target.value)}
							placeholder="e.g., Senior Software Engineer"
							className="mt-1.5 w-full px-4 py-2.5 text-sm bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-light placeholder-brand-light/40"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<Label
								htmlFor="company-name"
								className="text-brand-light text-sm font-medium"
							>
								Company Name
							</Label>
							<input
								id="company-name"
								type="text"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder="e.g., Tech Corp"
								className="mt-1.5 w-full px-4 py-2.5 text-sm bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-light placeholder-brand-light/40"
							/>
						</div>

						<div>
							<Label
								htmlFor="company-website"
								className="text-brand-light text-sm font-medium"
							>
								Company Website
							</Label>
							<input
								id="company-website"
								type="text"
								value={companyWebsite}
								onChange={(e) => setCompanyWebsite(e.target.value)}
								placeholder="e.g., techcorp.com"
								className="mt-1.5 w-full px-4 py-2.5 text-sm bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-light placeholder-brand-light/40"
							/>
						</div>
					</div>

					<div>
						<Label
							htmlFor="job-description"
							className="text-brand-light text-sm font-medium"
						>
							Job Description
						</Label>
						<textarea
							id="job-description"
							value={jobDescription}
							onChange={(e) => setJobDescription(e.target.value)}
							placeholder="Paste the job description here for better tailoring..."
							className="mt-1.5 w-full h-24 px-4 py-2.5 text-sm bg-white/5 border border-white/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-brand-light placeholder-brand-light/40"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
