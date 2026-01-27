import {
	AboutHero,
	Pillars,
	WorkflowStrip,
	TeamFooter,
} from "@/components/about/sections";
import ProblemStats from "@/components/about/problem-stats";
import MarketGrowth from "@/components/about/market-growth";
import WorkflowInteractive from "@/components/about/workflow-interactive";
import TechStackGrid from "@/components/about/tech-stack-grid";
import DualValue from "@/components/about/dual-value";
import CompetitiveEdgeTable from "@/components/about/competitive-edge-table";
import TargetIndustries from "@/components/about/target-industries";
import DatabaseArchitecture from "@/components/about/database-architecture";
import SectionNav from "@/components/about/section-nav";
import ScrollProgress from "@/components/about/scroll-progress";
import AmbientBackground from "../../components/about/ambient-bg";
import BackToTop from "../../components/about/back-to-top";
import SectionDivider from "../../components/about/section-divider";

export const metadata = {
	title: "About TalentSync | AI-Powered Hiring Intelligence",
	description:
		"Comprehensive overview of TalentSync: market problem, workflow, architecture, features for seekers & employers, competitive edge, and data design.",
};

export default function AboutPage() {
	return (
		<main className="min-h-screen flex flex-col bg-[#11161b] relative overflow-hidden selection:bg-[#76ABAE]/30 text-[#EEEEEE]">
			{/* Global Ambient Background */}
			<div className="fixed inset-0 pointer-events-none z-0">
				<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#76ABAE]/20 to-transparent opacity-50" />
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col gap-12 md:gap-24">
				<ScrollProgress />
				{/* <AmbientBackground /> - Removed as we have per-section backgrounds now or global minimalist one */}
				<AboutHero />
				<SectionNav />
				<ProblemStats />
				{/* <SectionDivider /> - Relying more on spacing and subtle borders */}
				<MarketGrowth />
				{/* <SectionDivider subtle /> */}
				<WorkflowInteractive />
				{/* <SectionDivider /> */}
				<Pillars />
				{/* <SectionDivider subtle /> */}
				<TechStackGrid />
				{/* <SectionDivider /> */}
				<DualValue />
				{/* <SectionDivider subtle /> */}
				<CompetitiveEdgeTable />
				{/* <SectionDivider /> */}
				<TargetIndustries />
				{/* <SectionDivider subtle /> */}
				<DatabaseArchitecture />
				{/* <SectionDivider /> */}
				<WorkflowStrip />
				<TeamFooter />
				<BackToTop />
			</div>
		</main>
	);
}
