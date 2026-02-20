import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    const coverLetters = await prisma.coverLetterRequest.findMany({
      where: { userId: user.id },
      include: {
        responses: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const coverLetterSessions = coverLetters.map((request) => ({
      id: request.id,
      recipientName: request.recipientName,
      companyName: request.companyName,
      createdAt: request.createdAt,
      letters: request.responses.map((response) => ({
        id: response.id,
        body: response.body,
        createdAt: response.createdAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: coverLetterSessions,
    });
  } catch (error) {
    console.error("Failed to fetch cover letters:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch cover letters" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const coverLetterId = searchParams.get("id");

    if (!coverLetterId) {
      return NextResponse.json(
        { success: false, message: "Cover letter ID is required" },
        { status: 400 }
      );
    }

    const coverLetter = await prisma.coverLetterRequest.findFirst({
      where: {
        id: coverLetterId,
        userId: user.id,
      },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, message: "Cover letter not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.coverLetterResponse.deleteMany({
        where: { requestId: coverLetterId },
      }),
      prisma.coverLetterRequest.delete({
        where: { id: coverLetterId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Cover letter session deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete cover letter:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete cover letter" },
      { status: 500 }
    );
  }
}
