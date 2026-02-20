import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getLlmHeaders } from "@/lib/llm-headers";
import type { ResumeRefineResponse } from "@/types/improvement";

interface RefineRequestBody {
  resumeId: string;
  tailoredResume: Record<string, unknown>;
  jobDescription: string;
  jobKeywords?: Record<string, unknown>;
  refinementConfig?: {
    enable_keyword_injection?: boolean;
    enable_ai_phrase_removal?: boolean;
    enable_master_alignment_check?: boolean;
    max_refinement_passes?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const llmHeaders = await getLlmHeaders(userId);

    // Parse request body
    const body: RefineRequestBody = await request.json();
    const { resumeId, tailoredResume, jobDescription, jobKeywords, refinementConfig } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: "Resume ID is required" },
        { status: 400 }
      );
    }

    if (!tailoredResume) {
      return NextResponse.json(
        { success: false, message: "Tailored resume data is required" },
        { status: 400 }
      );
    }

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { success: false, message: "Job description is required" },
        { status: 400 }
      );
    }

    // Get resume from database for master resume
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        analysis: true,
        user: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: "Resume not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (resume.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (!resume.analysis) {
      return NextResponse.json(
        { success: false, message: "Resume has no analysis data" },
        { status: 400 }
      );
    }

    // Build resume data for refinement
    const analysisData = {
      skills_analysis: resume.analysis.skillsAnalysis as any[] || [],
      recommended_roles: resume.analysis.recommendedRoles as string[] || [],
      languages: resume.analysis.languages as any[] || [],
      education: resume.analysis.education as any[] || [],
      work_experience: resume.analysis.workExperience as any[] || [],
      projects: resume.analysis.projects as any[] || [],
      publications: resume.analysis.publications as any[] || [],
      positions_of_responsibility: resume.analysis.positionsOfResponsibility as any[] || [],
      certifications: resume.analysis.certifications as any[] || [],
      achievements: resume.analysis.achievements as any[] || [],
      name: resume.analysis.name || "",
      email: resume.analysis.email || "",
      contact: resume.analysis.contact || "",
      linkedin: resume.analysis.linkedin || undefined,
      github: resume.analysis.github || undefined,
      blog: resume.analysis.blog || null,
      portfolio: resume.analysis.portfolio || undefined,
      predicted_field: resume.analysis.predictedField || "",
    };

    // Build request payload for backend
    const backendPayload = {
      tailored_resume: tailoredResume,
      resume_data: analysisData,
      job_description: jobDescription,
      job_keywords: jobKeywords || null,
      refinement_config: refinementConfig || null,
    };

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

    const backendResponse = await fetch(
      `${backendUrl}/api/v1/resume/refine`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...llmHeaders,
        },
        body: JSON.stringify(backendPayload),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Resume refine API - Backend error:", {
        status: backendResponse.status,
        error: errorText.substring(0, 500),
      });

      let errorMessage = "Failed to refine resume";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail?.message || errorData.message || errorData.detail || errorMessage;
      } catch {
        // Use default error message
      }

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const responseData: ResumeRefineResponse = await backendResponse.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Resume refine API - Error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, message: "Request timed out" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
