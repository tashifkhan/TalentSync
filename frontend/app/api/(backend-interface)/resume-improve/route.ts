import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getLlmHeaders } from "@/lib/llm-headers";
import type { ResumeImproveResponse } from "@/types/improvement";

interface ImproveRequestBody {
  resumeId: string;
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
    const body: ImproveRequestBody = await request.json();
    const { resumeId, jobDescription, jobKeywords, refinementConfig } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: "Resume ID is required" },
        { status: 400 }
      );
    }

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { success: false, message: "Job description is required" },
        { status: 400 }
      );
    }

    // Get resume from database
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

    // Transform TalentSync analysis to backend format
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

    // Sanitize to prevent Pydantic validation errors when a string is expected but null is given inside nested lists
    const sanitizeNulls = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(sanitizeNulls);
      if (obj !== null && typeof obj === "object") {
        const newObj: any = {};
        for (const [k, v] of Object.entries(obj)) {
          newObj[k] = v === null ? "" : sanitizeNulls(v);
        }
        return newObj;
      }
      return obj;
    };


    // Build request payload for backend
    const backendPayload = {
      resume_text: resume.rawText,
      resume_data: sanitizeNulls(analysisData),
      job_description: jobDescription,
      job_keywords: jobKeywords || null,
      language: "en",
      refinement_config: refinementConfig || null,
    };

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

    const backendResponse = await fetch(
      `${backendUrl}/api/v1/resume/improve`,
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
      console.error("Resume improve API - Backend error:", {
        status: backendResponse.status,
        error: errorText.substring(0, 500),
      });

      let errorMessage = "Failed to improve resume";
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

    const responseData: ResumeImproveResponse = await backendResponse.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Resume improve API - Error:", error);

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
