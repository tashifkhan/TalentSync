"use client";

import { motion } from "framer-motion";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Zap, Target, Calendar, MessageSquare } from "lucide-react";

interface QuickTip {
	icon: any;
	title: string;
	description: string;
	bgColor: string;
	borderColor: string;
	iconColor: string;
}

export default function QuickTips() {
	const tips: QuickTip[] = [
		{
			icon: Target,
			title: "Optimize Keywords",
			description:
				"Add industry-specific keywords to improve ATS compatibility",
			bgColor: "from-brand-primary/20 to-brand-primary/10",
			borderColor: "border-brand-primary/30",
			iconColor: "text-brand-primary",
		},
		{
			icon: Calendar,
			title: "Update Profile",
			description: "Keep your profile fresh with recent achievements",
			bgColor: "from-slate-500/20 to-slate-500/10",
			borderColor: "border-text-muted-dark/30",
			iconColor: "text-text-muted-light",
		},
		{
			icon: MessageSquare,
			title: "Network Smart",
			description: "Use AI-generated cold emails to expand your network",
			bgColor: "from-brand-primary/20 to-brand-primary/10",
			borderColor: "border-brand-primary/30",
			iconColor: "text-brand-primary",
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.7 }}
			className="mb-12"
		>
			<Card className="backdrop-blur-sm bg-brand-dark/95 border-border-subtle/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-white flex items-center gap-2">
						<Zap className="h-5 w-5 text-brand-primary" />
						Quick Tips for Today
					</CardTitle>
					<CardDescription className="text-text-muted-light">
						Personalized recommendations to boost your career
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{tips.map((tip, index) => (
							<div
								key={index}
								className={`p-4 rounded-lg bg-gradient-to-br ${tip.bgColor} border ${tip.borderColor}`}
							>
								<div className="flex items-center mb-2">
									<tip.icon className={`h-4 w-4 ${tip.iconColor} mr-2`} />
									<span className="text-sm font-medium text-white">
										{tip.title}
									</span>
								</div>
								<p className="text-xs text-text-muted-light">{tip.description}</p>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
