import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { resumeDataToText } from "@/lib/resume-to-text";
import { Prisma } from "@prisma/client";
import type { ResumeData } from "@/types/resume";

export async function POST(request: NextRequest) {
	try {
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

		const body = await request.json();
		const { customName, data } = body as {
			customName: string;
			data: ResumeData;
		};

		if (!customName || customName.trim().length === 0) {
			return NextResponse.json(
				{ success: false, message: "Resume name is required" },
				{ status: 400 }
			);
		}

		// Generate rawText from structured data for ATS compatibility
		const rawText = resumeDataToText(data);

		// Create resume and analysis in a single transaction
		const result = await prisma.$transaction(async (tx) => {
			const resume = await tx.resume.create({
				data: {
					userId: user.id,
					customName: customName.trim(),
					rawText,
				},
			});

			await tx.$executeRaw(
				Prisma.sql`UPDATE "Resume" SET "source" = 'MANUAL' WHERE "id" = ${resume.id}`
			);

			const analysis = await tx.analysis.create({
				data: {
					resumeId: resume.id,
					name: data.name || null,
					email: data.email || null,
					contact: data.contact || null,
					linkedin: data.linkedin || null,
					github: data.github || null,
					blog: data.blog || null,
					portfolio: data.portfolio || null,
					predictedField: data.predicted_field || null,
					skillsAnalysis: (data.skills_analysis ?? []) as unknown as Prisma.InputJsonValue,
					recommendedRoles: data.recommended_roles ?? [],
					languages: (data.languages ?? []) as unknown as Prisma.InputJsonValue,
					education: (data.education ?? []) as unknown as Prisma.InputJsonValue,
					workExperience: (data.work_experience ?? []) as unknown as Prisma.InputJsonValue,
					projects: (data.projects ?? []) as unknown as Prisma.InputJsonValue,
					publications: (data.publications ?? []) as unknown as Prisma.InputJsonValue,
					positionsOfResponsibility:
						(data.positions_of_responsibility ?? []) as unknown as Prisma.InputJsonValue,
					certifications: (data.certifications ?? []) as unknown as Prisma.InputJsonValue,
					achievements: (data.achievements ?? []) as unknown as Prisma.InputJsonValue,
				},
			});

			return { resume, analysis };
		});

		return NextResponse.json({
			success: true,
			message: "Resume created successfully",
			data: {
				id: result.resume.id,
				customName: result.resume.customName,
			},
		});
	} catch (error) {
		console.error("Manual resume creation error:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Internal server error while creating resume",
			},
			{ status: 500 }
		);
	}
}
