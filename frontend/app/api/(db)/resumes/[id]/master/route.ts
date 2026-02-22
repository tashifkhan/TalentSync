import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

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
		});

		if (!resume) {
			return NextResponse.json(
				{ success: false, message: "Resume not found or access denied" },
				{ status: 404 }
			);
		}

		// Set this resume as master; unset all others for this user
		await prisma.$transaction(async (tx) => {
			// Unset any existing master for this user
			await tx.resume.updateMany({
				where: { userId: user.id, isMaster: true },
				data: { isMaster: false },
			});

			// Set the target resume as master
			await tx.resume.update({
				where: { id: resumeId },
				data: { isMaster: true },
			});
		});

		return NextResponse.json({
			success: true,
			message: "Resume set as master successfully",
		});
	} catch (error) {
		console.error("Set master resume error:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Internal server error while setting master resume",
			},
			{ status: 500 }
		);
	}
}
