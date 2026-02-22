import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getLlmHeaders } from "@/lib/llm-headers";
import type { JDEditResponse } from "@/types/jd-editor";

export const maxDuration = 1800;

interface JDEditRequestBody {
  resumeId: string;
  jobDescription: string;
  jdUrl?: string;
  companyName?: string;
}

/** Recursively replace null values with empty strings to avoid Pydantic validation errors. */
function sanitizeNulls(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sanitizeNulls);
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = v === null ? "" : sanitizeNulls(v);
    }
    return result;
  }
  return obj;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const llmHeaders = await getLlmHeaders(userId);

    // Parse body
    const body: JDEditRequestBody = await request.json();
    const { resumeId, jobDescription, jdUrl, companyName } = body;

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

    // Fetch resume + analysis from DB
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { analysis: true },
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: "Resume not found" },
        { status: 404 }
      );
    }

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

    // Transform Prisma analysis to backend ComprehensiveAnalysisData shape
    const analysisData = {
      skills_analysis: resume.analysis.skillsAnalysis as unknown[] || [],
      recommended_roles: resume.analysis.recommendedRoles as string[] || [],
      languages: resume.analysis.languages as unknown[] || [],
      education: resume.analysis.education as unknown[] || [],
      work_experience: resume.analysis.workExperience as unknown[] || [],
      projects: resume.analysis.projects as unknown[] || [],
      publications: resume.analysis.publications as unknown[] || [],
      positions_of_responsibility: resume.analysis.positionsOfResponsibility as unknown[] || [],
      certifications: resume.analysis.certifications as unknown[] || [],
      achievements: resume.analysis.achievements as unknown[] || [],
      name: resume.analysis.name || "",
      email: resume.analysis.email || "",
      contact: resume.analysis.contact || "",
      linkedin: resume.analysis.linkedin || undefined,
      github: resume.analysis.github || undefined,
      blog: resume.analysis.blog || null,
      portfolio: resume.analysis.portfolio || undefined,
      predicted_field: resume.analysis.predictedField || "",
    };

    const backendPayload = {
      resume_text: resume.rawText,
      resume_data: sanitizeNulls(analysisData),
      job_description: jobDescription,
      jd_url: jdUrl || null,
      company_name: companyName || null,
      language: "en",
    };

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

    const backendResponse = await fetch(
      `${backendUrl}/api/v2/resume/edit-by-jd`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...llmHeaders,
        },
        body: JSON.stringify(backendPayload),
        signal: AbortSignal.timeout(1_800_000), // 30 minute timeout
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "Failed to edit resume for this job description";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage =
          errorData.detail?.message ||
          errorData.message ||
          errorData.detail ||
          errorMessage;
      } catch {
        // keep default
      }
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const responseData: JDEditResponse = await backendResponse.json();
    return NextResponse.json(responseData);
  } catch (error) {
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
