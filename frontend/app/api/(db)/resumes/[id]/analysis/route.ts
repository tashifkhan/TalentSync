import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { resumeDataToText } from "@/lib/resume-to-text";
import type { ResumeData } from "@/types/resume";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: resumeId } = await params;

		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json(
				{ success: false, message: "Authentication required" },
				{ status: 401 }
			);
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json(
				{ success: false, message: "User not found" },
				{ status: 404 }
			);
		}

		// Verify ownership
		const resume = await prisma.resume.findFirst({
			where: { id: resumeId, userId: user.id },
			include: { analysis: true },
		});

		if (!resume) {
			return NextResponse.json(
				{ success: false, message: "Resume not found or access denied" },
				{ status: 404 }
			);
		}

		if (!resume.analysis) {
			return NextResponse.json(
				{ success: false, message: "No analysis found for this resume" },
				{ status: 404 }
			);
		}

		const body = await request.json();
		const data = body as Partial<ResumeData>;

		// Build the update object only for provided fields
		const analysisUpdate: Record<string, unknown> = {};

		if (data.name !== undefined) analysisUpdate.name = data.name || null;
		if (data.email !== undefined) analysisUpdate.email = data.email || null;
		if (data.contact !== undefined)
			analysisUpdate.contact = data.contact || null;
		if (data.linkedin !== undefined)
			analysisUpdate.linkedin = data.linkedin || null;
		if (data.github !== undefined)
			analysisUpdate.github = data.github || null;
		if (data.blog !== undefined) analysisUpdate.blog = data.blog || null;
		if (data.portfolio !== undefined)
			analysisUpdate.portfolio = data.portfolio || null;
		if (data.predicted_field !== undefined)
			analysisUpdate.predictedField = data.predicted_field || null;
		if (data.skills_analysis !== undefined)
			analysisUpdate.skillsAnalysis = data.skills_analysis;
		if (data.recommended_roles !== undefined)
			analysisUpdate.recommendedRoles = data.recommended_roles;
		if (data.languages !== undefined)
			analysisUpdate.languages = data.languages;
		if (data.education !== undefined)
			analysisUpdate.education = data.education;
		if (data.work_experience !== undefined)
			analysisUpdate.workExperience = data.work_experience;
		if (data.projects !== undefined) analysisUpdate.projects = data.projects;
		if (data.publications !== undefined)
			analysisUpdate.publications = data.publications;
		if (data.positions_of_responsibility !== undefined)
			analysisUpdate.positionsOfResponsibility =
				data.positions_of_responsibility;
		if (data.certifications !== undefined)
			analysisUpdate.certifications = data.certifications;
		if (data.achievements !== undefined)
			analysisUpdate.achievements = data.achievements;

		// Update analysis and regenerate rawText in a transaction
		const result = await prisma.$transaction(async (tx) => {
			const updatedAnalysis = await tx.analysis.update({
				where: { resumeId },
				data: analysisUpdate,
			});

			// Reconstruct full ResumeData to regenerate rawText
			const fullData: ResumeData = {
				name: updatedAnalysis.name ?? "",
				email: updatedAnalysis.email ?? "",
				contact: updatedAnalysis.contact ?? "",
				linkedin: updatedAnalysis.linkedin ?? "",
				github: updatedAnalysis.github ?? "",
				blog: updatedAnalysis.blog ?? "",
				portfolio: updatedAnalysis.portfolio ?? "",
				predicted_field: updatedAnalysis.predictedField ?? "",
				skills_analysis:
					(updatedAnalysis.skillsAnalysis as unknown as ResumeData["skills_analysis"]) ??
					[],
				recommended_roles: updatedAnalysis.recommendedRoles ?? [],
				languages:
					(updatedAnalysis.languages as unknown as ResumeData["languages"]) ?? [],
				education:
					(updatedAnalysis.education as unknown as ResumeData["education"]) ?? [],
				work_experience:
					(updatedAnalysis.workExperience as unknown as ResumeData["work_experience"]) ??
					[],
				projects:
					(updatedAnalysis.projects as unknown as ResumeData["projects"]) ?? [],
				publications:
					(updatedAnalysis.publications as unknown as ResumeData["publications"]) ?? [],
				positions_of_responsibility:
					(updatedAnalysis.positionsOfResponsibility as unknown as ResumeData["positions_of_responsibility"]) ??
					[],
				certifications:
					(updatedAnalysis.certifications as unknown as ResumeData["certifications"]) ??
					[],
				achievements:
					(updatedAnalysis.achievements as unknown as ResumeData["achievements"]) ?? [],
			};

			const rawText = resumeDataToText(fullData);
			await tx.resume.update({
				where: { id: resumeId },
				data: { rawText },
			});

			return updatedAnalysis;
		});

		return NextResponse.json({
			success: true,
			message: "Resume analysis updated successfully",
			data: result,
		});
	} catch (error) {
		console.error("Resume analysis update error:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Internal server error while updating analysis",
			},
			{ status: 500 }
		);
	}
}
